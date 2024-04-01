const Participant = require("./../models/participants");
const APIfeatures = require("./../utils/apiFeatures");
const sendMail = require('./../utils/email');

exports.createParticipant = async (req, res) => {
  try {
    const newParticipant = await Participant.create(req.body);
    
    // Envoyer l'e-mail
    await sendMail({
      to: newParticipant.email, // Utiliser newParticipant au lieu de newAccount
      subject: "Participation au colloque",
      html: "<p>Vous êtes préenregistré pour le colloque</p>",
    });

    res.status(201).json({
      status: "Participant created successfully",
      newParticipant,
    });

    console.log("Email sent"); // Déplacer la console.log ici si nécessaire
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    }); 
  }
};


exports.getAllparticipants = async (req, res) => {
  try {
    const features = new APIfeatures(Participant.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const participants = await features.query;
    res.status(200).json({
      status: "Success",
      participantsEffectif: Participant.length,
      participants,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
    res.status(200).json({
        status: "success",
        participant,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.updateParticipant = async (req, res) => {
  try {
    const participant = await Participant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      statusstatus: "success",
      participant,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    await Participant.findByIdAndDelete(req.params.id);
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