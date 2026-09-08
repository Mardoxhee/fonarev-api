const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Un service doit avoir un nom"],
  },
  descrption: {
    type: String,
    required: [true, "Rajoutez une brève desription pour ce service"],
  },
  responsable : { type: mongoose.Schema.Types.ObjectId, ref: "Agents" },
  direction: { type: mongoose.Schema.Types.ObjectId, ref: "Direction" },
  division: { type: mongoose.Schema.Types.ObjectId, ref: "Division" },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

// declaration du model
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
