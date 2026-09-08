const mongoose = require("mongoose");
const Document = require("./../models/documentModel");
const DocumentType = require("./../models/documentTypeModel");
const Agent = require("../models/agentModel");
const APIfeatures = require("./../utils/apiFeatures");

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const makeCode = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const getAgentFieldValue = (agent, field) => {
  if (!agent || field === "always") return "";
  const value = agent[field];
  if (!value) return "";
  if (typeof value === "object") return value.denomination || value.nom || value.Province || value.province || value._id || "";
  return value;
};

const matchesCondition = (documentType, agent) => {
  if (!documentType.required) return true;

  const condition = documentType.condition || { field: "always", operator: "exists" };
  if (!condition.field || condition.field === "always") return true;

  const fieldValue = getAgentFieldValue(agent, condition.field);
  const expected = condition.value;

  if (condition.operator === "exists") return Boolean(fieldValue);
  if (condition.operator === "equals") return normalizeText(fieldValue) === normalizeText(expected);
  if (condition.operator === "contains") return normalizeText(fieldValue).includes(normalizeText(expected));
  if (condition.operator === "greaterThan") return Number(fieldValue || 0) > Number(expected || 0);
  if (condition.operator === "greaterThanOrEqual") return Number(fieldValue || 0) >= Number(expected || 0);

  return true;
};

const documentMatchesType = (document, documentType) => {
  if (!document || !documentType) return false;
  if (document.documentType && String(document.documentType._id || document.documentType) === String(documentType._id)) return true;

  const documentTypeName = normalizeText(document.type);
  return documentTypeName === normalizeText(documentType.code) || documentTypeName === normalizeText(documentType.name);
};

const buildDossierChecklist = (agent, documentTypes, documents) => {
  const activeTypes = documentTypes
    .filter((type) => type.active !== false)
    .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));

  const checklist = activeTypes
    .filter((type) => matchesCondition(type, agent))
    .map((type) => {
      const relatedDocuments = documents.filter((document) => documentMatchesType(document, type));
      const submitted = relatedDocuments.length > 0;
      const required = type.required !== false;

      return {
        documentType: type,
        required,
        submitted,
        status: submitted ? "Complet" : required ? "À compléter" : "Optionnel",
        documents: relatedDocuments,
      };
    });

  const requiredItems = checklist.filter((item) => item.required);
  const completedItems = requiredItems.filter((item) => item.submitted);

  return {
    checklist,
    summary: {
      total: checklist.length,
      required: requiredItems.length,
      submitted: checklist.filter((item) => item.submitted).length,
      missing: requiredItems.length - completedItems.length,
      completionRate: requiredItems.length ? Math.round((completedItems.length / requiredItems.length) * 100) : 100,
    },
  };
};

exports.createDocument = async (req, res) => {
  try {
    const body = { ...req.body };
    body.account = req.decoded && req.decoded.id;

    if (body.documentType && !body.type) {
      const documentType = await DocumentType.findById(body.documentType);
      if (documentType) {
        body.type = documentType.name;
        body.category = documentType.category;
      }
    }

    const newDocument = await Document.create(body);
    res.status(201).json({
      status: "document created successfully",
      document: newDocument,
      newDocument,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const features = new APIfeatures(Document.find(), req.query)
      .filter()
      .sort()
      .limitFields();
    const document = await features.query.populate("account").populate("agent").populate("documentType");

    res.status(200).json({
      status: "Success",
      numberOfDocuments: document.length,
      document,
      documents: document,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("account")
      .populate("agent")
      .populate("documentType");
    res.status(200).json({
      status: "success",
      document,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("documentType");
    res.status(200).json({
      status: "success",
      document,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Document deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};

exports.getDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.find(req.query.active === "false" ? {} : { active: { $ne: false } }).sort("sortOrder name");

    res.status(200).json({
      status: "Success",
      numberOfDocumentTypes: documentTypes.length,
      documentTypes,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.createDocumentType = async (req, res) => {
  try {
    const body = { ...req.body };
    body.code = body.code ? makeCode(body.code) : makeCode(body.name);
    body.account = req.decoded && req.decoded.id;

    const documentType = await DocumentType.create(body);
    res.status(201).json({
      status: "Document type created successfully",
      documentType,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.updateDocumentType = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.code) body.code = makeCode(body.code);
    if (!body.code && body.name) body.code = makeCode(body.name);

    const documentType = await DocumentType.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      documentType,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteDocumentType = async (req, res) => {
  try {
    await DocumentType.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    res.status(200).json({
      status: "Document type archived successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};

exports.getAgentDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ agent: req.params.agentId })
      .populate("account")
      .populate("documentType")
      .sort("-createdAt");

    res.status(200).json({
      status: "Success",
      numberOfDocuments: documents.length,
      documents,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getAgentDossier = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.agentId)) {
      return res.status(400).json({
        status: "failed",
        message: "Identifiant agent invalide.",
      });
    }

    const agent = await Agent.findById(req.params.agentId)
      .populate("direction")
      .populate("province")
      .populate("documents")
      .populate("personnesAcharges");

    if (!agent) {
      return res.status(404).json({
        status: "failed",
        message: "Agent introuvable.",
      });
    }

    const [documentTypes, documents] = await Promise.all([
      DocumentType.find({ active: { $ne: false } }).sort("sortOrder name"),
      Document.find({ agent: req.params.agentId }).populate("account").populate("documentType").sort("-createdAt"),
    ]);
    const dossier = buildDossierChecklist(agent, documentTypes, documents);

    res.status(200).json({
      status: "Success",
      agent,
      documents,
      ...dossier,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
