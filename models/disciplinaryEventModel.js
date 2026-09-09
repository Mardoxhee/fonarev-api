const mongoose = require("mongoose");

const disciplinaryDocumentSchema = new mongoose.Schema(
  {
    type: String,
    url: String,
    fileName: String,
    mimeType: String,
    description: String,
  },
  { _id: false }
);

const disciplinaryEventSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agents",
      required: [true, "Un événement disciplinaire doit être rattaché à un agent"],
      index: true,
    },
    type: {
      type: String,
      enum: ["demande_explication", "avertissement", "blame", "mise_a_pied", "decision", "autre"],
      required: [true, "Le type disciplinaire est obligatoire"],
      default: "demande_explication",
    },
    title: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    eventDate: Date,
    decisionDate: Date,
    status: {
      type: String,
      enum: ["ouvert", "en_instruction", "cloture", "annule"],
      default: "ouvert",
    },
    severity: {
      type: String,
      enum: ["faible", "moyen", "eleve"],
      default: "moyen",
    },
    facts: String,
    decision: String,
    reference: String,
    documents: [disciplinaryDocumentSchema],
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

const DisciplinaryEvent = mongoose.model("DisciplinaryEvent", disciplinaryEventSchema);
module.exports = DisciplinaryEvent;
