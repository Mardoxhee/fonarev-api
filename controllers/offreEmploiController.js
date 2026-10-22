const OffreEmploi = require("../models/offreEmploiModel");
const { applyCommonQuery, findByIdOrSlug, pickUpdateMeta, withAuthor } = require("../utils/queryBuilder");

const workflow = require("../utils/recruitmentWorkflow");

const publicFilter = { statut: "publie", isActive: true };

exports.createOffreEmploi = async (req, res) => {
  try {
    const offre = await OffreEmploi.create(withAuthor(req, { ...workflow.content(req.body), statut: "brouillon", historique: [workflow.event(req, null, "brouillon")] }));
    res.status(201).json({
      status: "success",
      message: "Offre creee avec succes",
      offre,
    });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", code: err.code, message: err.message });
  }
};

exports.getPublicOffresEmploi = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(OffreEmploi, { query: { q: req.query.q, page: req.query.page, limit: req.query.limit, etat: "ouverts" } }, publicFilter);
    const [offres, total] = await Promise.all([mongoQuery.populate("formulaire"), countQuery]);
    res.status(200).json({
      status: "success",
      results: offres.length,
      total,
      page,
      limit,
      offres,
    });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};

exports.getAllOffresEmploi = async (req, res) => {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit) || 20)));
    const query = {};
    if (req.query.statut) {
      if (!Object.hasOwn(workflow.transitions, req.query.statut)) throw workflow.failure('Statut invalide.');
      query.statut = req.query.statut;
    }
    if (req.query.q) {
      const text = String(req.query.q).slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = ['titre', 'reference', 'direction'].map(key => ({ [key]: { $regex: text, $options: 'i' } }));
    }
    const [offres, total] = await Promise.all([
      OffreEmploi.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      OffreEmploi.countDocuments(query),
    ]);
    res.status(200).json({
      status: "success",
      results: offres.length,
      total,
      page,
      limit,
      offres,
    });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};

exports.getLastOffresEmploi = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const offres = await OffreEmploi.find(publicFilter).sort("-datePublication").limit(limit).populate("formulaire");
    res.status(200).json({ status: "success", results: offres.length, offres });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};

exports.getOneOffreEmploi = async (req, res) => {
  try {
    const offre = await findByIdOrSlug(OffreEmploi, req.params.idOrSlug).populate("formulaire");
    if (!offre) {
      return res.status(404).json({ status: "not found", message: "Offre introuvable" });
    }
    res.status(200).json({ status: "success", offre });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};

exports.updateOffreEmploi = async (req, res) => {
  try {
    const current = await OffreEmploi.findById(req.params.id).lean();
    if (!current) return res.status(404).json({ status: 'failed', message: 'Offre introuvable.' });
    if (!req.body.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== new Date(current.updatedAt).getTime()) {
      throw workflow.failure('Cette offre a été modifiée. Actualisez-la avant de réessayer.', 409);
    }
    const target = req.body.statut;
    const changes = workflow.content(req.body);
    let update;
    if (target !== undefined) {
      if (Object.keys(changes).length) throw workflow.failure('Enregistrez le contenu avant de changer le statut.');
      workflow.checkTransition(current, target);
      update = { $set: pickUpdateMeta(req, { statut: target, ...(target === 'publie' ? { datePublication: new Date(), isActive: true } : {}) }),
        $push: { historique: workflow.event(req, current.statut, target) } };
    } else {
      if (current.statut !== 'brouillon') throw workflow.failure('Remettez cette offre en brouillon avant de la modifier.', 409);
      if (!Object.keys(changes).length) throw workflow.failure('Aucune modification à enregistrer.');
      update = { $set: pickUpdateMeta(req, changes) };
    }
    const offre = await OffreEmploi.findOneAndUpdate({ _id: current._id, updatedAt: current.updatedAt }, update, { new: true, runValidators: true });
    if (!offre) throw workflow.failure('Cette offre vient d’être modifiée. Actualisez-la.', 409);
    res.status(200).json({ status: "success", offre });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};

exports.deleteOffreEmploi = async (req, res) => {
  try {
    const offre = await OffreEmploi.findOneAndDelete({ _id: req.params.id, statut: 'brouillon' });
    if (!offre) {
      return res.status(404).json({ status: "not found", message: "Offre introuvable" });
    }
    res.status(200).json({ status: "success", message: "Offre supprimee avec succes", data: null });
  } catch (err) {
    res.status(err.status || 400).json({ status: "failed", message: err.message });
  }
};
