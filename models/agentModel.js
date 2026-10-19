const mongoose = require("mongoose");
const validator = require("validator");

const agentSchema = new mongoose.Schema({

    lieuNaissance: String,
    nombreConjoints: Number,
    nombrePersonnesCharge: Number,
    personnesPrisesEnChargeFonds: {
      type: Number,
      min: 0,
      default: null,
      validate: { validator: value => value == null || Number.isSafeInteger(value), message: 'Le nombre d’enfants pris en charge doit être un entier positif ou nul.' },
    },
    responsableDirect: String,
    lieuRecrutement: String,
    lieuPrestation: String,
    regionAffectation: String,
    mutation: Boolean,
    dateFinContrat: Date,
    datePrevisionnelleRetraite: { type: Date, default: null },
    salaireNetAcquis: { type: Number, min: 0, select: false },
    finsContrat: [{
      modalite: { type: String, enum: ['Retraité', 'Licencié', 'Décédé', 'Démissionnaire'], required: true },
      dateEffet: { type: Date, required: true },
      reference: String,
      observations: String,
      annexe: { type: new mongoose.Schema({ url: { type: String, required: true }, fileName: { type: String, required: true }, mimeType: String }, { _id: false }), default: undefined },
      ancienStatut: String,
      enregistreLe: { type: Date, default: Date.now },
      enregistrePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    }],
    hrmsFinance: {
      type: new mongoose.Schema({ numeroCNSS: String, numeroCompte: String, banque: String }, { _id: false }),
      select: false,
    },
    hrmsArchived: { type: Boolean, default: false, index: true },
    hrmsArchivedAt: Date,
    hrmsImport: { batch: { type: mongoose.Schema.Types.ObjectId, ref: 'HrmsImport' }, row: Number, importedAt: Date },

    noms: {
      type: String,
      // required: [true, "Renseignez le nom"],
    },
    postnom: {
        type: String,
        // required: [true, "Renseignez le postnom"],
      },
    prenom: {
        type: String,
        // required: [true, "Renseignez le prenom"],
      },
    sexe: {
        type: String,
        // required: [true, "Renseignez le genre"],
      },  

      nationalite: {
        type: String,
      },
      adresse: {
        type: String,
      },
      provinceOrigin: {
        type: String,
      },
    etatcivile: {
        type: String,
        // required: [true, "renseignez votre état civile"],
      },
      dateNaissance : {
        type: Date,
      },
      phone: {
        type: String,

      },
      emailPerso: {
        type: String,

      },
      emailPro: {
        type: String,

      },
      matricule: {
        type: String,

      },
      grade: {
        type: String,
    },
    fonction: {
      type: String,
    },
    nombrenfants: {
        type: Number,
      }, 
      dateNotif: {
        type: Date,
      },
      dateEntree: {
        type: Date,
      },
      statut: {
        type: String,
        enum: ["Actif", "Inactif", "Retraité", "Licencié", "Décédé", "Démissionnaire"],
        default: "Actif",
      },
      typeContrat: {
        type: String,
      },
      photo: {
        type: String,
      },
      service: {
        type: String,
      },
      serviceRef:{ type: mongoose.Schema.Types.ObjectId, ref:  "Service" },
      // direction: {
      //   type: String,
      // },
      // service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      documents:[{ type: mongoose.Schema.Types.ObjectId, ref:  "Document" }],
      careerEvents:[{ type: mongoose.Schema.Types.ObjectId, ref:  "CareerEvent" }],
      disciplinaryEvents:[{ type: mongoose.Schema.Types.ObjectId, ref:  "DisciplinaryEvent" }],
      province:{ type: mongoose.Schema.Types.ObjectId, ref:  "Province" },
      direction:{ type: mongoose.Schema.Types.ObjectId, ref:  "Direction" },
      division:{ type: mongoose.Schema.Types.ObjectId, ref:  "Division" },
      noteDebit: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notedebit" }],
      account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
      personnesAcharges : [{ type: mongoose.Schema.Types.ObjectId, ref: "PersonneAcharge" }],
})

const Agents = mongoose.model("Agents", agentSchema);
module.exports = Agents;
