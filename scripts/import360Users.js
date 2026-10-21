// Run from the API directory: node scripts/import360Users.js [--apply]
// Credentials remain server-side; dry-run by default.
require('dotenv').config();
const mongoose = require('mongoose');
async function main() {
  const endpoint = process.env.FONAREV360_USERS_URL || 'https://360.fonasite.app:5521/user';
  const token = process.env.FONAREV360_API_TOKEN;
  if (!token) throw new Error('Renseignez FONAREV360_API_TOKEN dans le .env du backend.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('HTTPS est obligatoire pour 360.');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Lecture 360 refusée (HTTP ${response.status}).`);
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error('Format 360 inattendu : data doit être une liste.');
  const total = payload.total ?? payload.totalUsers ?? payload.meta?.total;
  if (total != null && Number(total) !== payload.data.length) throw new Error('Réponse paginée : configurez un export complet avant l’import.');
  const seen = new Set();
  const rows = payload.data.map(user => {
    if (!Number.isSafeInteger(user.id) || user.id <= 0 || seen.has(user.id)) throw new Error('Identifiant 360 absent, invalide ou dupliqué.');
    seen.add(user.id);
    const text = value => typeof value === 'string' ? value.trim() : null;
    return {
      externalId: String(user.id), provider: 'fonarev360',
      nom: text(user.nom), postnom: text(user.postnom), prenom: text(user.prenom),
      email: text(user.email)?.toLowerCase() || null, username: text(user.username),
      telephone: text(user.telephone), photo: text(user.photo),
      enabled: user.status === true && user.isblocked === false,
      applications: Array.isArray(user.userApplication) ? user.userApplication.filter(x => typeof x === 'string') : [],
      directionId: user.directionId ?? null, divisionId: user.divisionId ?? null,
      fonctionId: user.fonctionId ?? null, gradeId: user.gradeId ?? null,
      syncedAt: new Date(),
    };
  });
  console.log(JSON.stringify({ fetched: rows.length, enabled: rows.filter(x => x.enabled).length, mode: process.argv.includes('--apply') ? 'apply' : 'dry-run' }));
  if (!process.argv.includes('--apply')) return;
  if (!process.env.BDURL) throw new Error('BDURL absent.');
  await mongoose.connect(process.env.BDURL, { serverSelectionTimeoutMS: 15000 });
  // Directory identities are intentionally separate from local credentials and permissions.
  const collection = mongoose.connection.collection('users360');
  await collection.createIndex({ provider: 1, externalId: 1 }, { unique: true });
  if (rows.length) {
    const result = await collection.bulkWrite(rows.map(row => ({ updateOne: {
      filter: { provider: row.provider, externalId: row.externalId },
      update: { $set: row, $setOnInsert: { createdAt: new Date(), accountId: null } }, upsert: true,
    } })), { ordered: true });
    console.log(JSON.stringify({ created: result.upsertedCount, updated: result.modifiedCount, matched: result.matchedCount }));
  }
}
main().catch(error => { console.error(error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[connexion masquée]')); process.exitCode = 1; }).finally(() => mongoose.disconnect());
