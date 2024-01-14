const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const serviceSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Un service doit avoir un nom"],
  },
  descrption: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  responsable : { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  direction: { type: mongoose.Schema.Types.ObjectId, ref: "Direction" },
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agent" }],
});

// declaration du model
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;