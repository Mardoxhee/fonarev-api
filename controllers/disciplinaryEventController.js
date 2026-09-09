const DisciplinaryEvent = require("../models/disciplinaryEventModel");
const Agent = require("../models/agentModel");

const populateDisciplinaryEvent = (query) =>
  query.populate("agent", "noms postnom prenom matricule grade fonction");

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeDocuments = (documents = []) => {
  if (!Array.isArray(documents)) return [];
  return documents
    .filter((document) => document && document.url)
    .map((document) => ({
      type: document.type || "piece_disciplinaire",
      url: document.url,
      fileName: document.fileName || "",
      mimeType: document.mimeType || "",
      description: document.description || "",
    }));
};

const normalizeBody = (body, agentId, accountId) => {
  const payload = {
    ...body,
    eventDate: parseDate(body.eventDate),
    decisionDate: parseDate(body.decisionDate),
    documents: normalizeDocuments(body.documents),
  };
  if (body.agent || agentId) payload.agent = body.agent || agentId;
  if (accountId) payload.account = accountId;
  return payload;
};

exports.getAgentDisciplinaryEvents = async (req, res) => {
  try {
    const agentExists = await Agent.exists({ _id: req.params.agentId });
    if (!agentExists) {
      return res.status(404).json({
        status: "failed",
        message: "Agent introuvable.",
      });
    }

    const disciplinaryEvents = await populateDisciplinaryEvent(
      DisciplinaryEvent.find({ agent: req.params.agentId }).sort("-eventDate -createdAt")
    );

    res.status(200).json({
      status: "Success",
      numberOfDisciplinaryEvents: disciplinaryEvents.length,
      disciplinaryEvents,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.createAgentDisciplinaryEvent = async (req, res) => {
  try {
    const payload = normalizeBody(req.body, req.params.agentId, req.decoded && req.decoded.id);
    const disciplinaryEvent = await DisciplinaryEvent.create(payload);
    await Agent.findByIdAndUpdate(payload.agent, { $addToSet: { disciplinaryEvents: disciplinaryEvent._id } });
    const populatedEvent = await populateDisciplinaryEvent(DisciplinaryEvent.findById(disciplinaryEvent._id));

    res.status(201).json({
      status: "Disciplinary event created successfully",
      disciplinaryEvent: populatedEvent,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.updateDisciplinaryEvent = async (req, res) => {
  try {
    const payload = normalizeBody(req.body, undefined, req.decoded && req.decoded.id);
    const disciplinaryEvent = await populateDisciplinaryEvent(DisciplinaryEvent.findByIdAndUpdate(req.params.eventId, payload, {
      new: true,
      runValidators: true,
    }));

    res.status(200).json({
      status: "success",
      disciplinaryEvent,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteDisciplinaryEvent = async (req, res) => {
  try {
    const disciplinaryEvent = await DisciplinaryEvent.findByIdAndDelete(req.params.eventId);
    if (disciplinaryEvent && disciplinaryEvent.agent) {
      await Agent.findByIdAndUpdate(disciplinaryEvent.agent, { $pull: { disciplinaryEvents: disciplinaryEvent._id } });
    }
    res.status(200).json({
      status: "Disciplinary event deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};
