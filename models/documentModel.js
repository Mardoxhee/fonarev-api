const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  description: String,
  file: String, 
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agents" },
});

const Document = mongoose.model("Document", documentSchema);
module.exports = Document;
