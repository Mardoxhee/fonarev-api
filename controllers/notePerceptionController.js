const NotePerception = require("./../models/notePerceptionModel");
const APIfeatures = require("./../utils/apiFeatures");

exports.createNp = async (req, res) => {
  try {
    const bodies = req.body;
    bodies.account = req.decoded.id;
    const notePerception = await NotePerception.create(bodies);
    res.status(201).json({
      status: "Note de perception created successfully",
      notePerception,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllNp = async (req, res) => {
  try {
    const features = new APIfeatures(NotePerception.find(), req.query)
      .filter()
      .sort()
      .limitFields()
    const notePerception = await features.query.populate('account').populate({
      path: 'noteDebit', // Peupler 'produit'
      populate: {
        path: 'entrepriseMine', // Ensuite, peupler 'catégorie' dans 'produit'
      },
    });
    res.status(200).json({
      status: "Success",
      numberOfNotes: notePerception.length,
      notePerception,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneNp = async (req, res) => {
  try {
    const notePerception = await NotePerception.findById(req.params.id).populate('account').populate("noteDebits")
   
    res.status(200).json({
        status: "success",
        notePerception,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  } 
};

exports.updateNotePerception = async (req, res) => {
  try {
    const notePerception = await NotePerception.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      notePerception,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteNotePerception = async (req, res) => {
  try {
    await NotePerception.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Note perception deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};