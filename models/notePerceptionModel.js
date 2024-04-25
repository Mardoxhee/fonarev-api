const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const perceptionSchema = new mongoose.Schema({
  numeroNp: {
    type: String,
    required: [true, "Une note de perception doit avoir un nom"],
  },
  raisonSociale: {
    type: String,
  },
  montantNp : {
    type: Number,
  },
  dateTaxation:{
    type : Date,
  },
  deadLine : {
    type : Date,
  },
  avis : {
    type : String,
  },
  observation : {
    type : String,
  },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  noteDebits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notedebit" }],
});

// declaration du model
const NotePerception = mongoose.model("NotePerception", perceptionSchema);
module.exports = NotePerception;