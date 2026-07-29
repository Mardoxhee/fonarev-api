const mongoose = require("mongoose");

const offreEmploiSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Rentrez le titre de l'offre"],
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
      default: "Avis d'appel a candidatures",
    },
    reference: {
      type: String,
      trim: true,
    },
    typeOffre: {
      type: String,
      enum: ["emploi", "stage", "consultance"],
      default: "emploi",
    },
    contractType: {
      type: String,
      enum: ["CDI", "CDD", "Stage", "Consultance", "Interim", "Autre"],
      default: "CDD",
    },
    departement: String,
    direction: String,
    lieuAffectation: {
      type: String,
      default: "Kinshasa",
    },
    resume: String,
    description: String,
    missions: [String],
    profilRecherche: [String],
    piecesRequises: [String],
    nombrePostes: {
      type: Number,
      default: 1,
      min: 1,
    },
    datePublication: {
      type: Date,
      default: Date.now,
    },
    dateCloture: Date,
    documentUrl: String,
    documentFileName: String,
    formulaire: { type: mongoose.Schema.Types.ObjectId, ref: "ApplicationForm" },
    statut: {
      type: String,
      enum: ["brouillon", "publie", "ferme", "archive", "annule"],
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

offreEmploiSchema.index({ titre: "text", description: "text", reference: "text" });
offreEmploiSchema.index({ statut: 1, isActive: 1, datePublication: -1 });
offreEmploiSchema.index({ typeOffre: 1, contractType: 1 });

offreEmploiSchema.virtual("isExpired").get(function () {
  if (!this.dateCloture) return false;
  return this.dateCloture < new Date();
});

offreEmploiSchema.pre("validate", function (next) {
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

const OffreEmploi = mongoose.model("OffreEmploi", offreEmploiSchema);
module.exports = OffreEmploi;
