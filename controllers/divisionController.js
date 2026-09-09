const Division = require("./../models/divisionModel");
const Direction = require("./../models/directionModel");
const Service = require("./../models/serviceModel");
const Agent = require("./../models/agentModel");
const APIfeatures = require("./../utils/apiFeatures");

const agentSelect = "noms postnom prenom matricule fonction grade photo sexe direction service province";

const normalizeDivisionBody = (body) => {
  const payload = { ...body };
  if (!payload.description && payload.descrption) payload.description = payload.descrption;
  if (!payload.descrption && payload.description) payload.descrption = payload.description;
  return payload;
};

const syncDirectionDivision = async (division, previousDirection) => {
  if (previousDirection && String(previousDirection) !== String(division.direction)) {
    await Direction.findByIdAndUpdate(previousDirection, { $pull: { divisions: division._id } });
  }
  if (division.direction) {
    await Direction.findByIdAndUpdate(division.direction, { $addToSet: { divisions: division._id } });
  }
};

const syncDivisionServicesDirection = async (division, previousDirection) => {
  if (!division || !previousDirection || String(previousDirection) === String(division.direction)) return;

  const serviceIds = await Service.find({ division: division._id }).distinct("_id");
  if (!serviceIds.length) return;

  await Promise.all([
    Service.updateMany({ _id: { $in: serviceIds } }, { direction: division.direction }),
    Direction.findByIdAndUpdate(previousDirection, { $pull: { services: { $in: serviceIds } } }),
    Direction.findByIdAndUpdate(division.direction, { $addToSet: { services: { $each: serviceIds } } }),
  ]);
};

const withDivisionStats = async (divisions) => {
  const items = Array.isArray(divisions) ? divisions : [divisions].filter(Boolean);
  return Promise.all(items.map(async (division) => {
    const serviceIds = await Service.find({ division: division._id }).distinct("_id");
    const [nombreServices, nombreAgents] = await Promise.all([
      Promise.resolve(serviceIds.length),
      Agent.countDocuments({ $or: [{ division: division._id }, { serviceRef: { $in: serviceIds } }] }),
    ]);

    const plainDivision = division.toObject ? division.toObject() : division;
    return {
      ...plainDivision,
      nombreServices,
      numberOfServices: nombreServices,
      nombreAgents,
      numberOfAgents: nombreAgents,
    };
  }));
};

exports.createDivision = async (req, res) => {
  try {
    const body = normalizeDivisionBody(req.body);
    body.account = req.decoded && req.decoded.id;

    const newDivision = await Division.create(body);
    await syncDirectionDivision(newDivision);
    const populatedDivision = await Division.findById(newDivision._id)
      .populate("direction")
      .populate("responsable", agentSelect)
      .populate("services");

    res.status(201).json({
      status: "division created successfully",
      division: populatedDivision,
      newDivision: populatedDivision,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllDivisions = async (req, res) => {
  try {
    const features = new APIfeatures(Division.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const divisions = await features.query
      .populate("direction")
      .populate("responsable", agentSelect)
      .populate("services");
    const divisionsWithStats = await withDivisionStats(divisions);

    res.status(200).json({
      status: "Success",
      numberOfDivisions: divisionsWithStats.length,
      divisions: divisionsWithStats,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneDivision = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id)
      .populate("direction")
      .populate("responsable", agentSelect)
      .populate("services");
    const [divisionWithStats] = await withDivisionStats(division);

    res.status(200).json({
      status: "success",
      division: divisionWithStats,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const previousDivision = await Division.findById(req.params.id);
    const division = await Division.findByIdAndUpdate(req.params.id, normalizeDivisionBody(req.body), {
      new: true,
      runValidators: true,
    })
      .populate("direction")
      .populate("responsable", agentSelect)
      .populate("services");

    if (division) {
      await syncDirectionDivision(division, previousDivision && previousDivision.direction);
      await syncDivisionServicesDirection(division, previousDivision && previousDivision.direction);
    }

    res.status(200).json({
      status: "success",
      division,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const [linkedServices, linkedAgents] = await Promise.all([
      Service.countDocuments({ division: req.params.id }),
      Agent.countDocuments({ division: req.params.id }),
    ]);
    if (linkedServices > 0 || linkedAgents > 0) {
      return res.status(400).json({
        status: "failed",
        message: "Impossible de supprimer cette division: des services ou agents y sont encore rattachés.",
      });
    }

    const division = await Division.findByIdAndDelete(req.params.id);
    if (division && division.direction) {
      await Direction.findByIdAndUpdate(division.direction, { $pull: { divisions: division._id } });
    }

    res.status(200).json({
      status: "Division deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};
