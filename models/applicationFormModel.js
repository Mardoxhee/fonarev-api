const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom technique du champ est requis"],
      trim: true,
    },
    label: {
      type: String,
      required: [true, "Le libelle du champ est requis"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "email",
        "phone",
        "number",
        "date",
        "select",
        "multiselect",
        "checkbox",
        "file",
        "url",
      ],
      default: "text",
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: String,
    helpText: String,
    options: [String],
    min: Number,
    max: Number,
    acceptedFileTypes: [String],
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const formSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre de section est requis"],
    },
    description: String,
    order: {
      type: Number,
      default: 0,
    },
    fields: [formFieldSchema],
  },
  { _id: false }
);

const applicationFormSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Rentrez le titre du formulaire"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    description: String,
    targetType: {
      type: String,
      enum: ["offre_emploi", "stage", "candidature_spontanee", "consultance", "general"],
      default: "general",
    },
    targetId: mongoose.Schema.Types.ObjectId,
    sections: [formSectionSchema],
    requireCv: {
      type: Boolean,
      default: true,
    },
    requireLettreMotivation: {
      type: Boolean,
      default: false,
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

applicationFormSchema.index({ targetType: 1, targetId: 1, statut: 1, isActive: 1 });
applicationFormSchema.index({ titre: "text", description: "text" });

applicationFormSchema.pre("validate", function (next) {
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

const ApplicationForm = mongoose.model("ApplicationForm", applicationFormSchema);
module.exports = ApplicationForm;
