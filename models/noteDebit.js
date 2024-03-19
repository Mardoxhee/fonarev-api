const mongoose = require("mongoose");
// const validator = require("validator");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

const noteDebitSchema = new mongoose.Schema({
  
  date: {
        type: Date,
        required: [true, "Indiquez la date de declaration de la note de débit"],
      },
  dateEncodage: {
        type: Date,
        required: [true, "Indiquez la date de declaration de la note de débit"],
      },
  province: {
    type: String,
    required: [true, "Indiquez la province"],
  },
  entite: {
    type: String,
    required: [true, "Indiquez l entite"],
  },
  numeroND: {
    type: String,
    required: [true, "Renseignez le numéro de la ND"],
  },
  numeroLot: {
    type: String,
    required: [true, "Renseignez le numéro du lot"],
  },
  poids: {
    type: Number,
    required: [true, "Renseignez le poids "],
  },
  nature: {
    type: String,
    required: [true, "Renseignez la nature du produit "],
  },
  montantBrut: {
    type: Number,
    required: [true, "Renseignez le montant brut "],
  },
  montantTotal3: {
    type: Number,
    required: [true, "Renseignez le montant total de la note de débit "],
  },
  montantFonarev: {
    type: Number,
    required: [true, "Renseignez le montant du au fonarev"],
  },
  montantTresor: {
    type: Number,
    // required: [true, "Renseignez le montant du au fonarev"],
  },
  montantProvince: {
    type: Number,
    // required: [true, "Renseignez le montant du au fonarev"],
  },
  montantTerritoire: {
    type: Number,
    // required: [true, "Renseignez le montant du au fonarev"],
  },
  fondsMiniers: {
    type: Number,
    // required: [true, "Renseignez le montant du au fonarev"],
  },
  // numeroNP: {
  //   type: String,
  //   required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // dateEmissionNp: {
  //   type: Date,
  //   // required: [true, "Renseignez la date d emission de la note de perception"],
  // },
  // dateAr: {
  //   type: Date,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // datePaiement: {
  //   type: Date,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // numeroPreuvePaiement: {
  //   type: String,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // montantPaye: {
  //   type: Number,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // solde: {
  //   type: Number,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  // deadlinePaiement: {
  //   type: Date,
  //   // required: [true, "Renseignez le numéro de la note de perception"],
  // },
  status: {
    type: Number,
    default: 2, 
  },
  Observation: {
    type: String,
    // required: [true, "Renseignez le numéro de la note de perception"],
  },
  entrepriseMine: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepriseMine', // Assurez-vous que c'est le même que le modèle entrepriseMine
  },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', // Assurez-vous que c'est le même que le modèle entrepriseMine
},
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

// declaration du model
const Notedebit = mongoose.model("Notedebit", noteDebitSchema);
module.exports = Notedebit;