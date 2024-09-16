const mongoose = require("mongoose");

const personneEnchargeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
  },
  prenom: {
    type: String,
    required: true,
  },
  postnom: {
    type: String,
    required: false,
  },
  dateNaissance: {
    type: Date,
  },
  lien: {
    type: String,
  },
  niveauEtude: {
    type: String,
  },
  acteNaissance: {
    type: String,
  },
  autreDocument: {
    type: String,
  },
  createdAt: {
    type: Date,
  },

  updatedAt: {
    type: Date,
  },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
});

const PersonneAcharge = mongoose.model("PersonneAcharge", personneEnchargeSchema);
module.exports = PersonneAcharge;
