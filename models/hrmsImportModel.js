const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  fileName: String,
  fileHash: String,
  sheetName: String,
  status: { type: String, enum: ['preview', 'applied'], default: 'preview' },
  fingerprint: String,
  plan: { type: mongoose.Schema.Types.Mixed, required: true },
  source: mongoose.Schema.Types.Mixed,
  backup: { type: mongoose.Schema.Types.Mixed, select: false },
  appliedAt: Date,
  expiresAt: { type: Date, default: () => new Date(Date.now() + 86400000) },
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const HrmsImport = mongoose.model('HrmsImport', schema);
const lockSchema = new mongoose.Schema({ _id: String, revision: { type: Number, default: 0 } });
const HrmsImportLock = mongoose.model('HrmsImportLock', lockSchema);
module.exports = { HrmsImport, HrmsImportLock };
