const Newsletter = require("../models/newsletterModel");
const { applyCommonQuery, findByIdOrSlug, pickUpdateMeta, withAuthor } = require("../utils/queryBuilder");

const publicFilter = { statut: "publie", isActive: true };

exports.createNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.create(withAuthor(req, req.body));
    res.status(201).json({
      status: "success",
      message: "Newsletter creee avec succes",
      newsletter,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", code: err.code, message: err.message });
  }
};

exports.getPublicNewsletters = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(Newsletter, req, publicFilter);
    const [newsletters, total] = await Promise.all([mongoQuery.sort("-publishedAt"), countQuery]);
    res.status(200).json({
      status: "success",
      results: newsletters.length,
      total,
      page,
      limit,
      newsletters,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getAllNewsletters = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(Newsletter, req);
    const [newsletters, total] = await Promise.all([mongoQuery, countQuery]);
    res.status(200).json({
      status: "success",
      results: newsletters.length,
      total,
      page,
      limit,
      newsletters,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getLastNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findOne(publicFilter).sort("-publishedAt");
    res.status(200).json({ status: "success", newsletter });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getOneNewsletter = async (req, res) => {
  try {
    const newsletter = await findByIdOrSlug(Newsletter, req.params.idOrSlug);
    if (!newsletter) {
      return res.status(404).json({ status: "not found", message: "Newsletter introuvable" });
    }
    res.status(200).json({ status: "success", newsletter });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.updateNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndUpdate(req.params.id, pickUpdateMeta(req, req.body), {
      new: true,
      runValidators: true,
    });
    if (!newsletter) {
      return res.status(404).json({ status: "not found", message: "Newsletter introuvable" });
    }
    res.status(200).json({ status: "success", newsletter });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndDelete(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ status: "not found", message: "Newsletter introuvable" });
    }
    res.status(200).json({ status: "success", message: "Newsletter supprimee avec succes", data: null });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};
