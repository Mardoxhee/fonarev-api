const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const gallerySchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, "Un service doit avoir un nom"],
  },
  descrption: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  date: {
    type: Date,
  },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

// declaration du model
const Gallery = mongoose.model("Gallery", gallerySchema);
module.exports = Gallery;