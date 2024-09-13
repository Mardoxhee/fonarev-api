const Grade = require("./../models/gradeModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createGrade = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    bodies.createdAt = new Date;
    const newGrade = await Grade.create(bodies);
    res.status(201).json({
      status: "Grade created successfully",
      newGrade,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllGrades = async (req, res) => {
  try {
    const features = new APIfeatures(Grade.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      // .paginate();
    const grade = await features.query.populate('account');

    res.status(200).json({
      status: "Success",
      numberOfGrades: grade.length,
      grade,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
    .populate("account");
    res.status(200).json({
        status: "success",
        grade,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, {

      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      grade,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Grade deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};