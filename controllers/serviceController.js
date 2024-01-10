const Service = require("./../models/serviceModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createService = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newService = await Service.create(bodies);
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
    const service = await features.query.populate('direction');

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
    .populate("agents");
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
    const service = await Direction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
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
    await Direction.findByIdAndDelete(req.params.id);
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