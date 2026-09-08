const mongoose = require("mongoose");
const validator = require("validator");

const agentSchema = new mongoose.Schema({

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
        enum: ["Actif", "Inactif", "Retraité"],
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
      // direction: {
      //   type: String,
      // },
      // service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      documents:[{ type: mongoose.Schema.Types.ObjectId, ref:  "Document" }],
      province:{ type: mongoose.Schema.Types.ObjectId, ref:  "Province" },
      direction:{ type: mongoose.Schema.Types.ObjectId, ref:  "Direction" },
      division:{ type: mongoose.Schema.Types.ObjectId, ref:  "Division" },
      noteDebit: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notedebit" }],
      account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
      personnesAcharges : [{ type: mongoose.Schema.Types.ObjectId, ref: "PersonneAcharge" }],
})

const Agents = mongoose.model("Agents", agentSchema);
module.exports = Agents;
