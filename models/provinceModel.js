const mongoose = require("mongoose");


const provinceSchema = new mongoose.Schema({
  

  nom : {
      type : String
  },
  superficie: {
    type: Number,
  },

  description: {
    type: String,
  },


 
  ville: { type: mongoose.Schema.Types.ObjectId, ref: "Ville" },
});


const Province = mongoose.model("Province", provinceSchema);
module.exports = Province;