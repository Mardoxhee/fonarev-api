const mongoose = require("mongoose");


const articleSchema = new mongoose.Schema({
  

  date : {
      type : Date
  },
  titre: {
    type: String,
    required: [true, "Rentrez un titre"],
  },
  sous_titre: {
    type: String,
    // required: [true, "Rentrez un sous titre"],

  },
  thumbanails: {
    type: String,
    required: [true, "Une image de mise en avant et requise"],
  },

  contenu: {
    type: String,
    required: [true, "Rentrez le contenu de l'article"],
  },
  type: {
    type: Number,
    default: 2, 
  },
  photos: {
    type: [String], 
    // required: [true, "Au moins une photo est requise"],
  },
 
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});


const Article = mongoose.model("Article", articleSchema);
module.exports = Article;