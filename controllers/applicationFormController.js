const ApplicationForm = require("../models/applicationFormModel");
const { applyCommonQuery, findByIdOrSlug, pickUpdateMeta, withAuthor } = require("../utils/queryBuilder");

const publicFilter = { statut: "publie", isActive: true };

exports.createApplicationForm = async (req, res) => {
  try {
    const formulaire = await ApplicationForm.create(withAuthor(req, req.body));
    res.status(201).json({
      status: "success",
      message: "Formulaire cree avec succes",
      formulaire,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", code: err.code, message: err.message });
  }
};

exports.getPublicApplicationForms = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(ApplicationForm, req, publicFilter);
    const [formulaires, total] = await Promise.all([mongoQuery, countQuery]);
    res.status(200).json({
      status: "success",
      results: formulaires.length,
      total,
      page,
      limit,
      formulaires,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getAllApplicationForms = async (req, res) => {
  try {
    const { mongoQuery, countQuery, page, limit } = applyCommonQuery(ApplicationForm, req);
    const [formulaires, total] = await Promise.all([mongoQuery, countQuery]);
    res.status(200).json({
      status: "success",
      results: formulaires.length,
      total,
      page,
      limit,
      formulaires,
    });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.getOneApplicationForm = async (req, res) => {
  try {
    const formulaire = await findByIdOrSlug(ApplicationForm, req.params.idOrSlug);
    if (!formulaire) {
      return res.status(404).json({ status: "not found", message: "Formulaire introuvable" });
    }
    res.status(200).json({ status: "success", formulaire });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.updateApplicationForm = async (req, res) => {
  try {
    const formulaire = await ApplicationForm.findByIdAndUpdate(req.params.id, pickUpdateMeta(req, req.body), {
      new: true,
      runValidators: true,
    });
    if (!formulaire) {
      return res.status(404).json({ status: "not found", message: "Formulaire introuvable" });
    }
    res.status(200).json({ status: "success", formulaire });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};

exports.deleteApplicationForm = async (req, res) => {
  try {
    const formulaire = await ApplicationForm.findByIdAndDelete(req.params.id);
    if (!formulaire) {
      return res.status(404).json({ status: "not found", message: "Formulaire introuvable" });
    }
    res.status(200).json({ status: "success", message: "Formulaire supprime avec succes", data: null });
  } catch (err) {
    res.status(400).json({ status: "failed", message: err.message });
  }
};
