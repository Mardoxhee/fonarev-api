const Province = require("../models/provinceModel");
const APIfeatures = require("../utils/apiFeatures");

exports.createProvince = async (req, res) => {
  try {

    const province = await Province.create(req.body);
    res.status(201).json({
      status: "Province created successfully",
      province,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllProvinces = async (req, res) => {
  try {
    const features = new APIfeatures(Province.find(), req.query)
      .filter()
      .sort()
      .limitFields()
    const province = await features.query;
    res.status(200).json({
      status: "Success",
      numberOfProvinces: province.length,
      province,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneProvince = async (req, res) => {
  try {
    const province = await Province.findById(req.params.id)
    res.status(200).json({
        status: "success",
        province,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateProvince = async (req, res) => {
  try {
    const province = await Province.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      province,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteProvince = async (req, res) => {
  try {
    await Province.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Province deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};