const mongoose = require("mongoose");

const careerDocumentSchema = new mongoose.Schema(
  {
    type: String,
    url: String,
    fileName: String,
    mimeType: String,
    description: String,
  },
  { _id: false }
);

const optionalReference = value => typeof value === 'string' && !value.trim() ? null : value;

const careerEventSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agents",
      required: [true, "Un événement de carrière doit être rattaché à un agent"],
      index: true,
    },
    type: {
      type: String,
      enum: ["entree_service", "promotion", "changement_fonction", "changement_affectation", "notification", "autre"],
      required: [true, "Le type d'événement est obligatoire"],
      default: "autre",
    },
    title: {
      type: String,
      required: [true, "Le titre de l'événement est obligatoire"],
      trim: true,
    },
    effectiveDate: Date,
    notificationDate: Date,
    previousGrade: String,
    newGrade: String,
    previousFunction: String,
    newFunction: String,
    previousDirection: { type: mongoose.Schema.Types.ObjectId, ref: "Direction", set: optionalReference },
    newDirection: { type: mongoose.Schema.Types.ObjectId, ref: "Direction", set: optionalReference },
    previousDivision: { type: mongoose.Schema.Types.ObjectId, ref: "Division", set: optionalReference },
    newDivision: { type: mongoose.Schema.Types.ObjectId, ref: "Division", set: optionalReference },
    previousService: { type: mongoose.Schema.Types.ObjectId, ref: "Service", set: optionalReference },
    newService: { type: mongoose.Schema.Types.ObjectId, ref: "Service", set: optionalReference },
    description: String,
    reference: String,
    documents: [careerDocumentSchema],
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

const CareerEvent = mongoose.model("CareerEvent", careerEventSchema);
module.exports = CareerEvent;
