const mongoose = require("mongoose");
// const validator = require("validator");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

const produitsMineSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Donnez un nom  à votre produit"],
    unique: true,
  },
  categorie: {
    type: String,
    required: [true, "Chaque produit doit être lié à une catégorie"],
  },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie'}
});

// declaration du model
const ProduitsMine = mongoose.model("ProduitsMine", produitsMineSchema);
module.exports = ProduitsMine;