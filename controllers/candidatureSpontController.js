const CandidatureSpont = require("./../models/candidatureSpont");
const APIfeatures = require("./../utils/apiFeatures");
const sendMail = require('./../utils/email');

const normalizeCandidaturePayload = (body) => {
  const payload = { ...body };

  if (!payload.nom && payload.personalInfo?.lastName) payload.nom = payload.personalInfo.lastName;
  if (!payload.prenom && payload.personalInfo?.firstName) payload.prenom = payload.personalInfo.firstName;
  if (!payload.email && payload.personalInfo?.email) payload.email = payload.personalInfo.email;
  if (!payload.phone && payload.personalInfo?.phone) payload.phone = payload.personalInfo.phone;
  if (!payload.cv && Array.isArray(payload.documents)) {
    const cv = payload.documents.find((doc) => doc.type === "cv");
    if (cv) payload.cv = cv.url;
  }
  if (!payload.lm && Array.isArray(payload.documents)) {
    const lm = payload.documents.find((doc) => doc.type === "lettre_motivation");
    if (lm) payload.lm = lm.url;
  }

  payload.date = payload.date || new Date();
  return payload;
};

const notifyCandidature = async (candidature) => {
  const warnings = [];

  try {
    await sendMail({
      to: candidature.email,
      subject: "Candidature FONAREV",
      html: "<p>Merci de nous avoir soumis votre candidature. Nous allons l'examiner et vous serez notifie a l'issue du traitement.<br>Cordialement,</p>",
    });
  } catch (err) {
    warnings.push("Email candidat non envoye");
  }

  try {
    await sendMail({
      to: ["tech_support@fonarev.cd", "rh@fonarev.cd"],
      subject: "Nouvelle candidature FONAREV",
      html: `<p>Bonjour,</p>
          <p>Nous avons recu une nouvelle candidature via le site web :</p>
          <p><strong>Nom :</strong> ${candidature.nom}</p>
          <p><strong>Prenom :</strong> ${candidature.prenom}</p>
          <p><strong>Ville :</strong> ${candidature.ville || "-"}</p>
          <p><strong>Telephone :</strong> ${candidature.phone}</p>
          <p><strong>E-mail :</strong> ${candidature.email}</p>
          <p><strong>Type :</strong> ${candidature.typeCandidature}</p>
          <p>Les autres details sont disponibles dans la plateforme RH.</p>
          <p>Cordialement,</p>`,
    });
  } catch (err) {
    warnings.push("Email RH non envoye");
  }

  return warnings;
};

exports.createCandidature = async (req, res) => {
  try {
    const payload = normalizeCandidaturePayload(req.body);
    const newCandidature = await CandidatureSpont.create(payload);
    const warnings = await notifyCandidature(newCandidature);

    res.status(201).json({
      status: "success",
      message: "Candidature soumise avec succes",
      newCandidature,
      warnings,
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
      .populate("offreEmploi")
      .populate("formulaire")
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
    }).populate("offreEmploi").populate("formulaire");
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
