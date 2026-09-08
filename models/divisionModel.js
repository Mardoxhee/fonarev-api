const mongoose = require("mongoose");

const divisionSchema = new mongoose.Schema(
  {
    denomination: {
      type: String,
      required: [true, "Une division doit avoir un nom"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    descrption: {
      type: String,
      trim: true,
    },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: "Agents" },
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Direction",
      required: [true, "Une division doit être rattachée à une direction"],
    },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

const Division = mongoose.model("Division", divisionSchema);
module.exports = Division;
