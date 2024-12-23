const Document = require("./../models/documentModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createDocument = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    bodies.createdAt = new Date;
    const newDocument = await Document.create(bodies);
    res.status(201).json({
      status: "document created successfully",
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
      .limitFields()
      // .paginate();
    const document = await features.query.populate('account');

    res.status(200).json({
      status: "Success",
      numberOfDocuments: document.length,
      document,
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
    .populate("account");
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
      statusstatus: "success",
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