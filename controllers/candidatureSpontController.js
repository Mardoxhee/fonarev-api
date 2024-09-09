const CandidatureSpont = require("./../models/candidatureSpont");
const APIfeatures = require("./../utils/apiFeatures");
const sendMail = require('./../utils/email');

exports.createCandidature = async (req, res) => {
  try {
    const newCandidature = await CandidatureSpont.create(req.body);
    await sendMail({
      to: newCandidature.email, // Utiliser newParticipant au lieu de newAccount
      subject: "Candidature spontanée",
      html: "<p>Merci de nous avoir soumis votre candidature. Nous allons l'examiner et vous serez notifié à l'issue du traitement.<br>Cordialement,</p>",
    });
    await sendMail({
      to: ["tech_support@fonarev.cd", "dieudonne.wedi@fonarev.cd",  "rh@fonarev.cd"],
      subject: "Nouvelle candidature spontanée",
      html: `<p>Bonjour,</p>
          <p>Nous avons reçu une nouvelle candidature via le site web :</p>
          <p><strong>Nom :</strong> ${newCandidature.nom}</p>
          <p><strong>Prénom :</strong> ${newCandidature.prenom}</p>
          <p><strong>Ville :</strong> ${newCandidature.ville}</p>
          <p><strong>Téléphone :</strong> ${newCandidature.phone}</p>
          <p><strong>E-mail :</strong> ${newCandidature.email}</p>
          <p>Vous trouverez les autres détails de la candidature sur la plateforme de gestion des ressources humaines.</p>
          <p>Cordialement,</p>`,
    });
    res.status(201).json({
      status: "candidature created successfully",
      newCandidature,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      code: err.code,
      message: err.message,
    });
  }
};

exports.getAllCandidatures = async (req, res) => {
  try {
    const features = new APIfeatures(CandidatureSpont.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const candidatures = await features.query;

    res.status(200).json({
      status: "Success",
      numberofCandidatures: candidatures.length,
      candidatures,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.getOneCandidature = async (req, res) => {
  try {
    const candidature = await CandidatureSpont.findById(req.params.id)
    res.status(200).json({
        status: "success",
        candidature,
      });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
  
};
exports.updateCandidature = async (req, res) => {
  try {
    const candidature = await CandidatureSpont.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      candidature,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

exports.deleteCandidature = async (req, res) => {
  try {
    await CandidatureSpont.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "candidature deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "not found",
      message: err.message,
    });
  }
};