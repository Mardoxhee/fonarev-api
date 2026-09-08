const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    documentType: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentType" },
    category: String,
    description: String,
    url: String,
    fileName: String,
    mimeType: String,
    status: {
      type: String,
      enum: ["depose", "valide", "rejete", "expire"],
      default: "depose",
    },
    expiresAt: Date,
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agents" },
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);
module.exports = Document;
