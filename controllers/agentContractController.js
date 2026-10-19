const Agent = require('../models/agentModel');
const modalities = ['Retraité', 'Licencié', 'Décédé', 'Démissionnaire'];
function validateEnd(body, agent) {
  if (!modalities.includes(body.modalite)) throw new Error('Modalité de fin de contrat invalide.');
  if (typeof body.dateEffet !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateEffet)) throw new Error('Date de fin obligatoire.');
  const date = new Date(body.dateEffet);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== body.dateEffet) throw new Error('Date invalide.');
  if (body.dateEffet > new Date().toISOString().slice(0, 10)) throw new Error('La date de fin ne peut pas être future.');
  if (agent.dateEntree && date < new Date(agent.dateEntree)) throw new Error('La fin ne peut pas précéder l’entrée en service.');
  for (const key of ['reference', 'observations']) if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > (key === 'reference' ? 200 : 4000))) throw new Error('Référence ou observations invalides.');
  if (body.annexe != null) {
    const file = body.annexe;
    if (typeof file !== 'object' || Array.isArray(file) || typeof file.url !== 'string' || !file.url.trim() || file.url.length > 4096 || !/^https?:\/\//i.test(file.url) && /[:\\]/.test(file.url) || typeof file.fileName !== 'string' || !file.fileName.trim() || file.fileName.length > 255 || typeof file.mimeType !== 'string' || file.mimeType.length > 200) throw new Error('Document annexe invalide.');
  }
  return date;
}
exports.validateEnd = validateEnd;
exports.endContract = async (req, res) => {
  try {
    const current = await Agent.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Agent introuvable.' });
    if (modalities.includes(current.statut) && (current.finsContrat?.length || req.body.modalite !== current.statut)) return res.status(409).json({ message: 'Cet agent est déjà sorti des effectifs.' });
    const date = validateEnd(req.body, current);
    const event = { modalite: req.body.modalite, dateEffet: date, reference: (req.body.reference || '').trim(), observations: (req.body.observations || '').trim(), ancienStatut: current.statut, enregistreLe: new Date(), enregistrePar: req.account?._id };
    if (req.body.annexe) event.annexe = { url: req.body.annexe.url.trim(), fileName: req.body.annexe.fileName.trim(), mimeType: req.body.annexe.mimeType };
    const agent = await Agent.findOneAndUpdate({ _id: current._id, statut: current.statut, 'finsContrat.0': { $exists: false } }, { $set: { statut: event.modalite, dateFinContrat: date }, $push: { finsContrat: event } }, { new: true, runValidators: true }).populate('direction division serviceRef province');
    if (!agent) return res.status(409).json({ message: 'Le dossier a changé. Rechargez la fiche.' });
    res.locals.auditAction = 'fin_contrat';
    res.locals.auditResourceId = agent._id;
    res.json({ agent });
  } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.getSalary = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select('+salaireNetAcquis');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable.' });
    res.set('Cache-Control', 'no-store');
    res.json({ salaireNetAcquis: agent.salaireNetAcquis ?? null });
  } catch { res.status(400).json({ message: 'Salaire indisponible.' }); }
};
exports.updateSalary = async (req, res) => {
  try {
    const value = req.body.salaireNetAcquis;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER / 100 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001)) return res.status(400).json({ message: 'Saisissez un montant positif avec deux décimales maximum, ou videz le champ.' });
    const agent = await Agent.findByIdAndUpdate(req.params.id, { $set: { salaireNetAcquis: value } }, { new: true, runValidators: true }).select('+salaireNetAcquis');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable.' });
    res.locals.auditAction = 'update_salaire_net_acquis';
    res.locals.auditResourceId = agent._id;
    res.set('Cache-Control', 'no-store');
    res.json({ salaireNetAcquis: agent.salaireNetAcquis ?? null });
  } catch { res.status(400).json({ message: 'Impossible d’enregistrer le salaire.' }); }
};
