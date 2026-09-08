const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      enum: ["always", "etatcivile", "nombrenfants", "fonction", "grade", "direction", "service", "sexe"],
      default: "always",
    },
    operator: {
      type: String,
      enum: ["exists", "equals", "contains", "greaterThan", "greaterThanOrEqual"],
      default: "exists",
    },
    value: String,
  },
  { _id: false }
);

const documentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom du document est requis"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      trim: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ["identite", "contrat", "carriere", "famille", "medical", "paie", "formation", "autre"],
      default: "autre",
    },
    description: String,
    required: {
      type: Boolean,
      default: true,
    },
    condition: {
      type: conditionSchema,
      default: () => ({ field: "always", operator: "exists" }),
    },
    acceptedFormats: {
      type: [String],
      default: ["pdf", "image"],
    },
    visibility: {
      type: String,
      enum: ["rh", "admin", "paie", "medical", "manager", "agent"],
      default: "rh",
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

documentTypeSchema.pre("save", function (next) {
  if (!this.code && this.name) {
    this.code = this.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();
  }
  next();
});

const DocumentType = mongoose.model("DocumentType", documentTypeSchema);
module.exports = DocumentType;
