const Ville = require("../models/villeModel");
const APIfeatures = require("../utils/apiFeatures");

exports.createVille = async (req, res) => {
  try {

    const ville = await Ville.create(req.body);
    res.status(201).json({
      status: "Ville created successfully",
      ville,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllVilles = async (req, res) => {
  try {
    const features = new APIfeatures(Ville.find(), req.query)
      .filter()
      .sort()
      .limitFields()
    const ville = await features.query;
    res.status(200).json({
      status: "Success",
      numberOfVilles: ville.length,
      ville,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneVille = async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.id)
    res.status(200).json({
        status: "success",
        ville,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateVille = async (req, res) => {
  try {
    const ville = await Ville.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      ville,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteVille = async (req, res) => {
  try {
    await Ville.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Ville deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};