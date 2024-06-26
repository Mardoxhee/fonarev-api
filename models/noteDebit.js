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
    
      },

      updatedAt: {
    type: Date,
  },

  createdAt: {
    type: Date,
  },
  entite: {
    type: String,

  },
  numeroND: {
    type: String,
    required: [true, "Renseignez le numéro de la ND"],
    unique: true,
  },
  numeroLot: {
    type: String,

  },
  poids: {
    type: Number,

  },
  nature: {
    type: String,

  },
  montantBrut: {
    type: Number,
    required: [true, "Renseignez le montant brut "],
  },
  montantTotal3: {
    type: Number,
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
  declarationOrigine: {
    type: String,
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
  url: {
    type: String,
  },
  status: {
    type: Number,
    default: 2, 
  },
  tauxRed : {
    type: Number,
  },
  Observation: {
    type: String,
  },
  produit: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduitsMine'},
  entrepriseMine: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepriseMine'},
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', // Assurez-vous que c'est le même que le modèle entrepriseMine
},
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

// declaration du model
const Notedebit = mongoose.model("Notedebit", noteDebitSchema);
module.exports = Notedebit;