const Document = require("../models/documentModel");
const APIfeatures = require("../utils/apiFeatures");

exports.createDocument = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newDocument = await Document.create(bodies);
    res.status(201).json({
      status: "Document created successfully",
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

exports.getAllnewDocuments = async (req, res) => {
  try {
    const features = new APIfeatures(Document.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const documents = await features.query;
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

exports.getOneDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
    // .populate({
    //   path: "services",
    //   populate: {
    //     path: "agents",
    //   },
    // });
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
    });
    res.status(200).json({
      status: "Document modifié avec succès",
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