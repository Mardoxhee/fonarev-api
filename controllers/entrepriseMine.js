const EntrepriseMine = require("./../models/entrepriseMinieres");
const APIfeatures = require("./../utils/apiFeatures");

exports.createEntrepriseMine = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newEntrepriseMine = await EntrepriseMine.create(bodies);
    res.status(201).json({
      status: "Entreprise created successfully",
      newEntrepriseMine,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllEntrepriseMine = async (req, res) => {
  try {
    const features = new APIfeatures(EntrepriseMine.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const entrepriseMine = await features.query;

    res.status(200).json({
      status: "Success",
      numberOfEntreprise: entrepriseMine.length,
      entrepriseMine,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneEntreprise = async (req, res) => {
  try {
    const entrepriseMine = await EntrepriseMine.findById(req.params.id)
    // .populate("agents");
    res.status(200).json({
        status: "success",
        entrepriseMine,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateEntrepriseMine = async (req, res) => {
  try {
    const entrepriseMine = await EntrepriseMine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      entrepriseMine,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteEntrepriseMine = async (req, res) => {
  try {
    await EntrepriseMine.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Entreprise delected sucessfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};