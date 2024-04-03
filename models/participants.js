const mongoose = require("mongoose");


const participantSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Un service doit avoir un nom"],
  },
  prenom: {
    type: String,
    required: [true, "Renseignez votre prenom"],
  },
  genre: {
    type: String,
    required: [true, "Précisez votre prenom"],
  },
  nationalite: {
    type: String,
    required: [true, "Renseignez votre nationalité "],
  },
  email: {
    type: String,
    required: [true, "RVotre adresse email svp"],
  },
  telephone: {
    type: Number,
    required: [true, "Renseignez votre numéro de téléphone"],
  },
  pays: {
    type: String,
    required: [true, "Renseignez votre pays"],
  },
  ville: {
    type: String,
    required: [true, "Renseignez la ville où vous êtes"],
  },
  profession: {
    type: String,
    required: [true, "Renseignez votre secteur d'activité ou votre profession"],
  },
  institution: {
    type: String,
    required: [true, "Renseignez votre secteur d'activité ou votre profession"],
  },
  description: {
    type: String,
  },
});

// declaration du model
const Participant = mongoose.model("Participant", participantSchema);
module.exports = Participant;