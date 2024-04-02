const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const candidatureSpontSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Rensegnez votre nom"],
  },
  prenom: {
    type: String,
    required: [true, "Rensegnez votre prénom"],
  },
  email: {
    type: String,
    required: [true, "Rensegnez votre adresse mail"],
  },
  phone: {
    type: Number,
    required: [true, "Rensegnez votre numéro de téléphone"],
  },
  ville: {
    type: String,
    required: [true, "Renseignez votre ville"],
  },
  province: {
    type: String,
    required: [true, "Renseignez votre province"],
  },
  lm: {
    type: String,
    required: [true, "Uploadez une lettre de motivation"],
  },
  cv: {
    type: String,
    required: [true, "uploadez un CV"],
  },
  date: {
    type: Date,
  },

});

// declaration du model
const candidatureSpont = mongoose.model("candidatureSpont", candidatureSpontSchema);
module.exports = candidatureSpont;