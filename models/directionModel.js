const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Une direction doit avoir un nom"],
  },
  description: {
    type: String,
    required: [true, "Renseignez une brève description"],
  },
  directeur : { type: mongoose.Schema.Types.ObjectId, ref: "Agents" },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  divisions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Division" }],
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },

});

// declaration du model
const Direction = mongoose.model("Direction", accountSchema);
module.exports = Direction;
