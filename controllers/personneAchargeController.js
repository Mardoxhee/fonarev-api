const Personne = require("./../models/personnesEnCharge");
const APIfeatures = require("./../utils/apiFeatures");

exports.createPerson = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    bodies.createdAt = new Date;
    const newPerson = await Personne.create(bodies);
    res.status(201).json({
      status: "personne created successfully",
      newPerson,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllPersons = async (req, res) => {
  try {
    const features = new APIfeatures(Personne.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      // .paginate();
    const personne = await features.query.populate('account');

    res.status(200).json({
      status: "Success",
      numberOfPersonnes: personne.length,
      personne,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOnePerson = async (req, res) => {
  try {
    const personne = await Personne.findById(req.params.id)
    .populate("account");
    res.status(200).json({
        status: "success",
        personne,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updatePerson = async (req, res) => {
  try {
    const personne = await Personne.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      personne,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deletePerson = async (req, res) => {
  try {
    await Personne.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Personne deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};