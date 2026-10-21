const mongoose = require('mongoose');
const Direction = require('../models/directionModel');
const Division = require('../models/divisionModel');
const Service = require('../models/serviceModel');
const Agent = require('../models/agentModel');
async function dependencies(id, session = null) {
  const divisions = await Division.find({ direction: id }).select('_id denomination').session(session).lean();
  const services = await Service.find({ $or: [{ direction: id }, { division: { $in: divisions.map(d => d._id) } }] }).select('_id denomination division').session(session).lean();
  const agents = await Agent.find({ $or: [{ direction: id }, { division: { $in: divisions.map(d => d._id) } }, { serviceRef: { $in: services.map(s => s._id) } }] }).select('_id noms postnom prenom matricule hrmsArchived division serviceRef').session(session).lean();
  return { divisions, services, agents };
}
exports.dependencies = async (req, res) => {
  try {
    if (!await Direction.exists({ _id: req.params.id })) return res.status(404).json({ message: 'Direction introuvable.' });
    res.json(await dependencies(req.params.id));
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.transferAndDelete = async (req, res) => {
  const { targetDirectionId } = req.body;
  if (!mongoose.isValidObjectId(targetDirectionId) || targetDirectionId === req.params.id) return res.status(400).json({ message: 'Choisissez une autre direction valide.' });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const source = await Direction.findById(req.params.id).session(session);
      const target = await Direction.findById(targetDirectionId).session(session);
      if (!source || !target) throw new Error('Direction source ou destination introuvable.');
      const { divisions, services, agents } = await dependencies(source._id, session);
      const divisionIds = divisions.map(d => d._id), serviceIds = services.map(s => s._id);
      // A service must retain a division in its new direction.
      const targetDivisions = await Division.find({ direction: target._id }).select('_id').session(session).lean();
      const allowed = new Set([...divisionIds, ...targetDivisions.map(d => d._id)].map(String));
      if (services.some(s => !allowed.has(String(s.division)))) throw new Error('Un service est lié à une division extérieure. Corrigez son rattachement dans les réglages avant le transfert.');
      await Division.updateMany({ _id: { $in: divisionIds } }, { $set: { direction: target._id } }, { session });
      await Service.updateMany({ _id: { $in: serviceIds } }, { $set: { direction: target._id } }, { session });
      for (const agent of agents) {
        const unset = {};
        if (agent.division && !allowed.has(String(agent.division))) unset.division = 1;
        if (agent.serviceRef && !serviceIds.some(id => String(id) === String(agent.serviceRef))) {
          const service = await Service.findById(agent.serviceRef).session(session);
          if (!service || String(service.direction) !== String(target._id)) unset.serviceRef = 1;
        }
        await Agent.updateOne({ _id: agent._id }, { $set: { direction: target._id }, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { session });
      }
      await Direction.updateOne({ _id: target._id }, { $addToSet: { divisions: { $each: divisionIds }, services: { $each: serviceIds } } }, { session });
      await Direction.deleteOne({ _id: source._id }, { session });
    });
    res.json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ message: /Transaction numbers|replica set/i.test(error.message) ? 'Ce transfert nécessite MongoDB en replica set. Aucune modification n’a été enregistrée.' : error.message });
  } finally { await session.endSession(); }
};
