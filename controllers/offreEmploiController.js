const OffreEmploi = require("../models/offreEmploiModel");
const { applyCommonQuery, findByIdOrSlug, pickUpdateMeta, withAuthor } = require("../utils/queryBuilder");

const publicFilter = { statut: "publie", isActive: true };

exports.createOffreEmploi = async (req, res) => {
  try {
    const offre = await OffreEmploi.create(withAuthor(req, req.body));
    res.status(201).json({
      status: "success",
      message: "Offre creee avec succes",
      offre,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", code: err.code, message: err.message });
  }
};

exports.getPublicOffresEmploi = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(OffreEmploi, req, publicFilter);
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
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getAllOffresEmploi = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(OffreEmploi, req);
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
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getLastOffresEmploi = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const offres = await OffreEmploi.find(publicFilter).sort("-datePublication").limit(limit).populate("formulaire");
    res.status(200).json({ status: "success", results: offres.length, offres });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
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
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.updateOffreEmploi = async (req, res) => {
  try {
    const offre = await OffreEmploi.findByIdAndUpdate(req.params.id, pickUpdateMeta(req, req.body), {
      new: true,
      runValidators: true,
    }).populate("formulaire");
    if (!offre) {
      return res.status(404).json({ status: "not found", message: "Offre introuvable" });
    }
    res.status(200).json({ status: "success", offre });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.deleteOffreEmploi = async (req, res) => {
  try {
    const offre = await OffreEmploi.findByIdAndDelete(req.params.id);
    if (!offre) {
      return res.status(404).json({ status: "not found", message: "Offre introuvable" });
    }
    res.status(200).json({ status: "success", message: "Offre supprimee avec succes", data: null });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};
