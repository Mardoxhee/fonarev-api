const mongoose = require("mongoose");

const marcheDocumentSchema = new mongoose.Schema(
  {
    label: String,
    url: {
      type: String,
      required: [true, "Ajoutez le lien du document"],
    },
    type: {
      type: String,
      enum: ["pdf", "docx", "xlsx", "image", "autre"],
      default: "pdf",
    },
  },
  { _id: false }
);

const marcheSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Rentrez le titre du marche"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    bigTitle: {
      type: String,
      trim: true,
    },
    resume: String,
    description: String,
    reference: {
      type: String,
      required: [true, "Rentrez la reference du marche"],
      trim: true,
    },
    typeMarche: {
      type: String,
      required: [true, "Precisez le type de marche"],
      enum: [
        "travaux",
        "fournitures",
        "services",
        "services_non_intellectuels",
        "prestations_intellectuelles",
        "autre",
      ],
    },
    categorie: {
      type: String,
      enum: [
        "appel_offres",
        "avis_manifestation_interet",
        "plan_passation",
        "avis_report",
        "appel_candidatures",
        "autre",
      ],
      default: "appel_offres",
    },
    procedure: {
      type: String,
      enum: ["AAOI", "AAON", "AON", "AMI", "PPM", "AAC", "AUTRE"],
      default: "AUTRE",
    },
    anneeExercice: Number,
    datePublication: {
      type: Date,
      default: Date.now,
    },
    dateCloture: Date,
    periode: String,
    documentUrl: {
      type: String,
      required: [true, "Ajoutez le lien du PDF"],
    },
    documentFileName: String,
    documents: [marcheDocumentSchema],
    tags: [String],
    statut: {
      type: String,
      enum: ["brouillon", "publie", "archive", "annule"],
      default: "brouillon",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

marcheSchema.index({ titre: "text", reference: "text", description: "text" });
marcheSchema.index({ statut: 1, isActive: 1, datePublication: -1 });
marcheSchema.index({ typeMarche: 1, categorie: 1 });

marcheSchema.virtual("isExpired").get(function () {
  if (!this.dateCloture) return false;
  return this.dateCloture < new Date();
});

marcheSchema.pre("validate", function (next) {
  if (!this.slug && this.titre) {
    this.slug = this.titre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

const Marche = mongoose.model("Marche", marcheSchema);
module.exports = Marche;
