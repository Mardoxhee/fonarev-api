const mongoose = require('mongoose');
// Separate directory: no local password, no fabricated phone, no automatic email linking.
const schema = new mongoose.Schema({
  provider: { type: String, default: 'fonarev360' },
  externalId: { type: String, required: true },
  firstName: String, lastName: String, email: String, phone: String,
  role: String, active: Boolean, guestModules: [String],
  ssoModules: [String], ssoWriteModules: [String], syncedAt: Date,
}, { collection: 'users360', timestamps: true });
schema.index({ provider: 1, externalId: 1 }, { unique: true });
module.exports = mongoose.model('Sso360Account', schema);
