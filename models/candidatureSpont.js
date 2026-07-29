const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    poste: String,
    employeur: String,
    secteur: String,
    lieu: String,
    dateDebut: Date,
    dateFin: Date,
    enCours: {
      type: Boolean,
      default: false,
    },
    description: String,
    realisations: [String],
  },
  { _id: false }
);

const parcoursAcademiqueSchema = new mongoose.Schema(
  {
    diplome: String,
    domaine: String,
    institution: String,
    pays: String,
    ville: String,
    dateDebut: Date,
    dateFin: Date,
    mention: String,
    description: String,
  },
  { _id: false }
);

const langueSchema = new mongoose.Schema(
  {
    langue: String,
    niveau: {
      type: String,
      enum: ["debutant", "intermediaire", "avance", "courant", "natif"],
      default: "intermediaire",
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["cv", "lettre_motivation", "diplome", "certificat", "piece_identite", "portfolio", "autre"],
      default: "autre",
    },
    label: String,
    url: {
      type: String,
      required: [true, "Le lien du document est requis"],
    },
  },
  { _id: false }
);

const formulaireAnswerSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
    },
    label: String,
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const candidatureSpontSchema = new mongoose.Schema({
  typeCandidature: {
    type: String,
    enum: ["spontanee", "offre_emploi", "stage", "consultance"],
    default: "spontanee",
  },
  offreEmploi: { type: mongoose.Schema.Types.ObjectId, ref: "OffreEmploi" },
  formulaire: { type: mongoose.Schema.Types.ObjectId, ref: "ApplicationForm" },
  nom: {
    type: String,
    required: [true, "Renseignez votre nom"],
    trim: true,
  },
  prenom: {
    type: String,
    required: [true, "Renseignez votre prenom"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Renseignez votre adresse mail"],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Renseignez votre numero de telephone"],
    trim: true,
  },
  ville: {
    type: String,
    trim: true,
  },
  province: {
    type: String,
    trim: true,
  },
  civilite: String,
  dateNaissance: Date,
  nationalite: String,
  adresse: String,
  paysResidence: String,
  professionActuelle: String,
  linkedin: String,
  portfolio: String,
  disponibilite: String,
  pretentionSalariale: String,
  experiencesPro: [experienceSchema],
  parcoursAcademique: [parcoursAcademiqueSchema],
  certifications: [String],
  competences: [String],
  langues: [langueSchema],
  referencesProfessionnelles: [
    {
      nom: String,
      fonction: String,
      organisation: String,
      email: String,
      phone: String,
      relation: String,
    },
  ],
  documents: [documentSchema],
  reponsesFormulaire: [formulaireAnswerSchema],
  consentementDonnees: {
    type: Boolean,
    default: false,
  },
  lm: {
    type: String,
  },
  cv: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  statut: {
    type: String,
    enum: ["nouvelle", "en_etude", "preselectionnee", "entretien", "retenue", "rejetee", "archivee"],
    default: "nouvelle",
  },
  score: Number,
  notesInternes: String,
  tags: [String],

}, { timestamps: true });

candidatureSpontSchema.index({ email: 1, offreEmploi: 1 });
candidatureSpontSchema.index({ statut: 1, typeCandidature: 1, createdAt: -1 });

// declaration du model
const candidatureSpont = mongoose.model("candidatureSpont", candidatureSpontSchema);
module.exports = candidatureSpont;
