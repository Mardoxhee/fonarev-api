const Service = require("./../models/serviceModel");
const Direction = require("./../models/directionModel");
const Division = require("./../models/divisionModel");
const Agent = require("./../models/agentModel");
const APIfeatures = require("./../utils/apiFeatures");

const normalizeServiceBody = async (body) => {
  const payload = { ...body };

  if (payload.division && !payload.direction) {
    const division = await Division.findById(payload.division);
    if (division) payload.direction = division.direction;
  }

  if (payload.division && payload.direction) {
    const division = await Division.findById(payload.division);
    if (division && String(division.direction) !== String(payload.direction)) {
      payload.direction = division.direction;
    }
  }

  return payload;
};

const syncServiceReferences = async (service, previous = {}) => {
  if (!service) return;
  if (previous.direction && String(previous.direction) !== String(service.direction)) {
    await Direction.findByIdAndUpdate(previous.direction, { $pull: { services: service._id } });
  }
  if (previous.division && String(previous.division) !== String(service.division)) {
    await Division.findByIdAndUpdate(previous.division, { $pull: { services: service._id } });
  }
  if (service.direction) {
    await Direction.findByIdAndUpdate(service.direction, { $addToSet: { services: service._id } });
  }
  if (service.division) {
    await Division.findByIdAndUpdate(service.division, { $addToSet: { services: service._id } });
  }
};

exports.createService = async (req, res) => {
  try {
    const bodies = await normalizeServiceBody(req.body);
    bodies.account = req.decoded.id;
    const newService = await Service.create(bodies);
    await syncServiceReferences(newService);
    res.status(201).json({
      status: "service created successfully",
      newService,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const features = new APIfeatures(Service.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const service = await features.query.populate('direction').populate('division').populate('responsable');

    res.status(200).json({
      status: "Success",
      numberOfServices: service.length,
      service,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    .populate("direction")
    .populate("division")
    .populate("responsable");
    res.status(200).json({
        status: "success",
        service,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateService = async (req, res) => {
  try {
    const previousService = await Service.findById(req.params.id);
    const body = await normalizeServiceBody(req.body);
    const service = await Service.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).populate("direction").populate("division").populate("responsable");
    await syncServiceReferences(service, previousService || {});
    res.status(200).json({
      status: "success",
      service,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const linkedAgents = await Agent.countDocuments({ serviceRef: req.params.id });
    if (linkedAgents > 0) {
      return res.status(400).json({
        status: "failed",
        message: "Impossible de supprimer ce service: des agents y sont encore rattachés.",
      });
    }

    const service = await Service.findByIdAndDelete(req.params.id);
    if (service && service.direction) {
      await Direction.findByIdAndUpdate(service.direction, { $pull: { services: service._id } });
    }
    if (service && service.division) {
      await Division.findByIdAndUpdate(service.division, { $pull: { services: service._id } });
    }
    res.status(200).json({
      status: "Service deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};
