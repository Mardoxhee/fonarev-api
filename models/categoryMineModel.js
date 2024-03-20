const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "Renseignez le nom de la categorie"],
  },
  tauxDeRedevance: {
    type: Number,
    required: [true, "Rajoutez son taux de redévance"],
  },
  description: {
    type: String,
  },
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agent" }],
});

// declaration du model
const CategoryMine = mongoose.model("CategoryMine", categorySchema);
module.exports = CategoryMine;