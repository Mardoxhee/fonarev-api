const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const storiesSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, "Une story doit avoir un titre"],
  },
  descrption: {
    type: String,
  },
  url: {
    type: String,
    required: [true, "le lien vers la video Youtube est obligatoire"],
  },
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agent" }],
});

// declaration du model
const Stories = mongoose.model("Stories", storiesSchema);
module.exports = Stories;