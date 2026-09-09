const CareerEvent = require("../models/careerEventModel");
const Agent = require("../models/agentModel");
const Service = require("../models/serviceModel");
const Division = require("../models/divisionModel");

const populateCareerEvent = (query) =>
  query
    .populate("agent", "noms postnom prenom matricule grade fonction dateEntree dateNotif")
    .populate("previousDirection", "denomination")
    .populate("newDirection", "denomination")
    .populate("previousDivision", "denomination")
    .populate("newDivision", "denomination")
    .populate("previousService", "denomination")
    .populate("newService", "denomination");

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
      type: document.type || "notification",
      url: document.url,
      fileName: document.fileName || "",
      mimeType: document.mimeType || "",
      description: document.description || "",
    }));
};

const normalizeBody = async (body, agentId, accountId) => {
  const payload = {
    ...body,
    effectiveDate: parseDate(body.effectiveDate),
    notificationDate: parseDate(body.notificationDate),
    documents: normalizeDocuments(body.documents),
  };
  if (body.agent || agentId) payload.agent = body.agent || agentId;
  if (accountId) payload.account = accountId;

  if (payload.newService && (!payload.newDivision || !payload.newDirection)) {
    const service = await Service.findById(payload.newService);
    if (service) {
      payload.newDivision = payload.newDivision || service.division;
      payload.newDirection = payload.newDirection || service.direction;
    }
  }

  if (payload.newDivision && !payload.newDirection) {
    const division = await Division.findById(payload.newDivision);
    if (division) payload.newDirection = division.direction;
  }

  return payload;
};

const buildEntryEvent = (agent) => {
  if (!agent || !agent.dateEntree) return null;
  return {
    _id: `entry-${agent._id}`,
    agent: agent._id,
    type: "entree_service",
    title: "Entrée en service",
    effectiveDate: agent.dateEntree,
    notificationDate: agent.dateNotif,
    newGrade: agent.grade,
    newFunction: agent.fonction,
    newDirection: agent.direction,
    newDivision: agent.division,
    newService: agent.serviceRef,
    description: "Événement généré depuis la fiche agent.",
    documents: [],
    generated: true,
  };
};

exports.getAgentCareerEvents = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.agentId)
      .populate("direction", "denomination")
      .populate("division", "denomination")
      .populate("serviceRef", "denomination");
    if (!agent) {
      return res.status(404).json({
        status: "failed",
        message: "Agent introuvable.",
      });
    }

    const events = await populateCareerEvent(CareerEvent.find({ agent: req.params.agentId }).sort("effectiveDate createdAt"));
    const hasEntryEvent = events.some((event) => event.type === "entree_service");
    const generatedEntry = hasEntryEvent ? null : buildEntryEvent(agent);
    const careerEvents = [generatedEntry, ...events].filter(Boolean);

    res.status(200).json({
      status: "Success",
      numberOfCareerEvents: careerEvents.length,
      careerEvents,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.createAgentCareerEvent = async (req, res) => {
  try {
    const payload = await normalizeBody(req.body, req.params.agentId, req.decoded && req.decoded.id);
    const careerEvent = await CareerEvent.create(payload);
    await Agent.findByIdAndUpdate(payload.agent, { $addToSet: { careerEvents: careerEvent._id } });
    const populatedEvent = await populateCareerEvent(CareerEvent.findById(careerEvent._id));

    res.status(201).json({
      status: "Career event created successfully",
      careerEvent: populatedEvent,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.updateCareerEvent = async (req, res) => {
  try {
    const payload = await normalizeBody(req.body, undefined, req.decoded && req.decoded.id);
    const careerEvent = await populateCareerEvent(CareerEvent.findByIdAndUpdate(req.params.eventId, payload, {
      new: true,
      runValidators: true,
    }));

    res.status(200).json({
      status: "success",
      careerEvent,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteCareerEvent = async (req, res) => {
  try {
    const careerEvent = await CareerEvent.findByIdAndDelete(req.params.eventId);
    if (careerEvent && careerEvent.agent) {
      await Agent.findByIdAndUpdate(careerEvent.agent, { $pull: { careerEvents: careerEvent._id } });
    }
    res.status(200).json({
      status: "Career event deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};
