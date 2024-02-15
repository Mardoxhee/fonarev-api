const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const entrepriseMineSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Une entreprise minière doit avoir un nom"],
  },
  province: {
    type: String,
    required: [true, "Province où se situe l'entreprise"],
  },
  adresse: {
    type: String,
    required: [true, "Adresse de l'entreprise"],
  },
  responsable: {
    type: String,
    required: [true, "Nom complet du responsable"],
  },
  telResponsable: {
    type: Number,
    required: [true, "Numéro detéléphone du responsable"],
  },
  EmailResponsable: {
    type: String,
    required: [true, "Email du responsable"],
  },
  notedebit: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notedebit" }],
});

// declaration du model
const EntrepriseMine = mongoose.model("EntrepriseMine", entrepriseMineSchema);
module.exports = EntrepriseMine;