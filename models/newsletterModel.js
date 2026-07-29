const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Rentrez le titre de la newsletter"],
      default: "Newsletter FONAREV",
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    editionLabel: {
      type: String,
      required: [true, "Precisez l'edition"],
      trim: true,
    },
    periode: {
      type: String,
      enum: ["mensuelle", "bimestrielle", "trimestrielle", "speciale"],
      default: "mensuelle",
    },
    mois: Number,
    annee: {
      type: Number,
      required: [true, "Precisez l'annee"],
    },
    description: String,
    pdfUrl: {
      type: String,
      required: [true, "Ajoutez le PDF de la newsletter"],
    },
    coverImageUrl: String,
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ["brouillon", "publie", "archive"],
      default: "brouillon",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

newsletterSchema.index({ titre: "text", editionLabel: "text", description: "text" });
newsletterSchema.index({ statut: 1, isActive: 1, publishedAt: -1 });
newsletterSchema.index({ annee: -1, mois: -1 });

newsletterSchema.pre("validate", function (next) {
  if (!this.slug && this.editionLabel) {
    this.slug = `${this.titre}-${this.editionLabel}-${this.annee || ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

const Newsletter = mongoose.model("Newsletter", newsletterSchema);
module.exports = Newsletter;
