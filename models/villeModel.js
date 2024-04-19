const mongoose = require("mongoose");


const villeSchema = new mongoose.Schema({
  

  nom : {
      type : String
  },
  superficie: {
    type: Number,
  },

  description: {
    type: String,
  },

 province: { type: mongoose.Schema.Types.ObjectId, ref: "Province" },
});


const Ville = mongoose.model("Ville", villeSchema);
module.exports = Ville;