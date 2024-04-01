const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const candidatureSpontSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, "Un service doit avoir un nom"],
  },
  prenom: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  email: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  phone: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  ville: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  province: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  lm: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  cv: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },

});

// declaration du model
const candidatureSpont = mongoose.model("candidatureSpont", candidatureSpontSchema);
module.exports = candidatureSpont;