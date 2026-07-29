const Marche = require("../models/marcheModel");
const { applyCommonQuery, findByIdOrSlug, pickUpdateMeta, withAuthor } = require("../utils/queryBuilder");

const publicFilter = { statut: "publie", isActive: true };

exports.createMarche = async (req, res) => {
  try {
    const marche = await Marche.create(withAuthor(req, req.body));
    res.status(201).json({
      status: "success",
      message: "Marche cree avec succes",
      marche,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", code: err.code, message: err.message });
  }
};

exports.getPublicMarches = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(Marche, req, publicFilter);
    const [marches, total] = await Promise.all([mongoQuery, countQuery]);
    res.status(200).json({
      status: "success",
      results: marches.length,
      total,
      page,
      limit,
      marches,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getAllMarches = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(Marche, req);
    const [marches, total] = await Promise.all([mongoQuery, countQuery]);
    res.status(200).json({
      status: "success",
      results: marches.length,
      total,
      page,
      limit,
      marches,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getLastMarches = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const marches = await Marche.find(publicFilter).sort("-datePublication").limit(limit);
    res.status(200).json({ status: "success", results: marches.length, marches });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getOneMarche = async (req, res) => {
  try {
    const marche = await findByIdOrSlug(Marche, req.params.idOrSlug);
    if (!marche) {
      return res.status(404).json({ status: "not found", message: "Marche introuvable" });
    }
    res.status(200).json({ status: "success", marche });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.updateMarche = async (req, res) => {
  try {
    const marche = await Marche.findByIdAndUpdate(req.params.id, pickUpdateMeta(req, req.body), {
      new: true,
      runValidators: true,
    });
    if (!marche) {
      return res.status(404).json({ status: "not found", message: "Marche introuvable" });
    }
    res.status(200).json({ status: "success", marche });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.deleteMarche = async (req, res) => {
  try {
    const marche = await Marche.findByIdAndDelete(req.params.id);
    if (!marche) {
      return res.status(404).json({ status: "not found", message: "Marche introuvable" });
    }
    res.status(200).json({ status: "success", message: "Marche supprime avec succes", data: null });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};
