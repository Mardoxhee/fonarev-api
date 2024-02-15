const Notedebit = require("./../models/noteDebit");
const APIfeatures = require("./../utils/apiFeatures");

exports.createNd = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const newNotedebit = await Notedebit.create(bodies);
    res.status(201).json({
      status: "note created successfully",
      newNotedebit,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllNd = async (req, res) => {
  try {
    const features = new APIfeatures(Notedebit.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const notedebit = await features.query.populate('agent').populate('entrepriseMine');
    res.status(200).json({
      status: "Success",
      numberOfNote: notedebit.length,
      notedebit,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneNd = async (req, res) => {
  try {
    const notedebit = await Notedebit.findById(req.params.id)
    .populate("agents");
    res.status(200).json({
        status: "success",
        notedebit,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateNd = async (req, res) => {
  try {
    const notedebit = await Notedebit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      notedebit,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteNd = async (req, res) => {
  try {
    await Notedebit.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Note deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};