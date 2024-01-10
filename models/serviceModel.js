const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const serviceSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "an account must have a lastName"],
  },

  direction: { type: mongoose.Schema.Types.ObjectId, ref: "Direction" },
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agent" }],
});

// declaration du model
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;