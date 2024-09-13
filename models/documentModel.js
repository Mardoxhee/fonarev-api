const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  description: String,
  url: String, 
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

const Document = mongoose.model("Document", documentSchema);
module.exports = Document;
