const mongoose = require("mongoose");
const validator = require("validator");

const agentSchema = new mongoose.Schema({
    // numero: {
    //   type: Number,
    //   unique: true, // Assurez-vous que le numéro est unique
    //   min: 1,
    //   max: 9999, // Limitez la plage de numéros de 1 à 9999
    // },
    nom: {
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
    genre: {
        type: String,
        // required: [true, "Renseignez le genre"],
      },  
    province: {
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
        unique: [true, "Ce numéro de téléphone existe déjà"],
        // required: [true, "An account has to have a phone number"],
        validate: [validator.isMobilePhone, "please provide a good phone number"],
      },
      emailPerso: {
        type: String,
        // required: [true, "please provide a mail "],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "please provide a valid mail"],
      },
      emailPro: {
        type: String,
        // required: [true, "please provide a mail "],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "please provide a valid mail"],
      },
      matricule: {
        type: Number,
        // required: [true, "Renseignez le numéro matricule"],
        unique: [true, "deux agents ne peuvent pas avoir le même matricule"],
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
      photo: {
        type: String,
      },
      service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      direction: { type: mongoose.Schema.Types.ObjectId, ref: "Direction" },
})

const Agents = mongoose.model("Agents", agentSchema);
module.exports = Agents;