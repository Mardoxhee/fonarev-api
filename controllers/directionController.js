const Direction = require("./../models/directionModel");
const APIfeatures = require("./../utils/apiFeatures");

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
    const directions = await features.query;
    res.status(200).json({
      status: "Success",
      numberOfDirections: directions.length,
      directions,
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
    const direction = await Direction.findById(req.params.id).populate("directeur")
    .populate({
      path: "services",
      populate: {
        path: "agents",
      },
    });
    res.status(200).json({
      status: "success",
      direction,
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
    });
    res.status(200).json({
      status: "Direction modifié avec succès",
      direction,
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