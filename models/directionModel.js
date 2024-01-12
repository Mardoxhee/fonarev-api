const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const accountSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Une direction doit avoir un nom"],
  },
  description: {
    type: String,
    required: [true, "Renseignez une brève description"],
  },
  directeur : { type: mongoose.Schema.Types.ObjectId, ref: "agent" },

  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
});

// declaration du model
const Direction = mongoose.model("Direction", accountSchema);
module.exports = Direction;