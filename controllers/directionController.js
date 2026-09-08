const Direction = require("./../models/directionModel");
const Agent = require("./../models/agentModel");
const Service = require("./../models/serviceModel");
const Division = require("./../models/divisionModel");
const APIfeatures = require("./../utils/apiFeatures");

const agentSelect = "noms postnom prenom matricule fonction grade photo sexe direction service province";

const withDirectionStats = async (directions) => {
  const items = Array.isArray(directions) ? directions : [directions].filter(Boolean);

  return Promise.all(items.map(async (direction) => {
    const [nombreAgents, nombreServices, nombreDivisions] = await Promise.all([
      Agent.countDocuments({ direction: direction._id }),
      Service.countDocuments({ direction: direction._id }),
      Division.countDocuments({ direction: direction._id }),
    ]);
    const plainDirection = direction.toObject ? direction.toObject() : direction;

    return {
      ...plainDirection,
      nombreAgents,
      numberOfAgents: nombreAgents,
      nombreServices,
      numberOfServices: nombreServices,
      nombreDivisions,
      numberOfDivisions: nombreDivisions,
    };
  }));
};

exports.createDirection = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newDirection = await Direction.create(bodies);
    res.status(201).json({
      status: "direction created successfully",
      newDirection,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllDirections = async (req, res) => {
  try {
    const features = new APIfeatures(Direction.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const directions = await features.query.populate("directeur", agentSelect);
    const directionsWithStats = await withDirectionStats(directions);
    res.status(200).json({
      status: "Success",
      numberOfDirections: directionsWithStats.length,
      directions: directionsWithStats,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneDirection = async (req, res) => {
  try {
    const direction = await Direction.findById(req.params.id)
      .populate("directeur", agentSelect)
      .populate({
        path: "services",
        populate: [
          { path: "responsable", select: agentSelect },
          { path: "division" },
        ],
      })
      .populate({
        path: "divisions",
        populate: [
          { path: "responsable", select: agentSelect },
          { path: "services" },
        ],
      });
    if (!direction) {
      return res.status(404).json({
        status: "not found",
        message: "Direction introuvable.",
      });
    }
    const [directionWithStats] = await withDirectionStats(direction);
    res.status(200).json({
      status: "success",
      direction: directionWithStats,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
exports.updateDirection = async (req, res) => {
  try {
    const direction = await Direction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("directeur", agentSelect);
    if (!direction) {
      return res.status(404).json({
        status: "not found",
        message: "Direction introuvable.",
      });
    }
    const [directionWithStats] = await withDirectionStats(direction);
    res.status(200).json({
      status: "Direction modifié avec succès",
      direction: directionWithStats,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteDirection = async (req, res) => {
  try {
    await Direction.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Direction deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};
