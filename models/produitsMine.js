const mongoose = require("mongoose");
// const validator = require("validator");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

const produitsMineSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Donnez un nom  à votre produit"],
  },
  categorie: {
    type: String,
    required: [true, "Chaque produit doit être lié à une catégorie"],
  },
});

// declaration du model
const ProduitsMine = mongoose.model("ProduitsMine", produitsMineSchema);
module.exports = ProduitsMine;