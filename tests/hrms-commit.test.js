const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Agent = require('../models/agentModel');
const Direction = require('../models/directionModel');
const Grade = require('../models/gradeModel');
const Province = require('../models/provinceModel');
const { HrmsImport, HrmsImportLock } = require('../models/hrmsImportModel');
const { fingerprint } = require('../services/hrmsPlan');
const { commit } = require('../controllers/hrmsImportController');
const actor = '600000000000000000000001', existingId = '600000000000000000000002', oldId = '600000000000000000000003', batch = '600000000000000000000004', dir = '600000000000000000000005';
const current = { agents: [{ _id: existingId, matricule: 'M1', noms: 'TEST', photo: 'keep.jpg', statut: 'Inactif', direction: dir, documents: [], hrmsFinance: { numeroCompte: '001234' } }, { _id: oldId, matricule: 'OLD' }], directions: [{ _id: dir, denomination: 'RH' }], grades: [], provinces: [] };
const chain = (data) => ({ select() { return this; }, sort() { return this; }, session() { return this; }, async lean() { return structuredClone(data); } });
function createJob() {
  return { _id: batch, actor, status: 'preview', expiresAt: new Date(Date.now() + 60000), fingerprint: fingerprint(current), plan: { ready: true, references: [{ kind: 'directions', source: 'RH', label: 'RH', id: dir, action: 'reuse' }], rows: [{ row: 3, agentId: existingId, direction: 'RH', grade: '', province: null, unusableFields: ['numeroCompte'], data: { noms: 'TEST', prenom: 'Marie', matricule: 'M1', sexe: 'F', emailPro: 'marie@fonarev.cd', directionLabel: 'RH', grade: '', numeroCompte: '', numeroCNSS: 'CNSS', banque: 'Bank' } }], archiveIds: [oldId], summary: { imported: 1, archived: 1 } } };
}
async function exercise(t, alter = () => {}, bulkFailure = false) {
  const job = createJob(); alter(job); const calls = []; const transaction = { committed: false, aborted: false, ended: false };
  t.mock.method(mongoose, 'startSession', async () => ({ async withTransaction(fn) { try { await fn(); transaction.committed = true; } catch (e) { transaction.aborted = true; throw e; } }, async endSession() { transaction.ended = true; } }));
  for (const [model, docs] of [[Agent, current.agents], [Direction, current.directions], [Grade, []], [Province, []]]) t.mock.method(model, 'find', () => chain(docs));
  t.mock.method(HrmsImportLock, 'updateOne', async () => { calls.push('lock'); });
  t.mock.method(HrmsImport, 'findById', () => ({ session: async () => job }));
  t.mock.method(Agent, 'bulkWrite', async (ops, options) => { calls.push({ ops, options }); if (bulkFailure) throw new Error('write failed'); });
  t.mock.method(Agent, 'updateMany', async (filter, update, options) => { calls.push({ archive: filter, update, options }); });
  job.save = async (options) => { calls.push({ save: options }); };
  const response = { locals: {}, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await commit({ params: { importId: batch }, body: { confirm: 'REMPLACER' }, account: { _id: actor } }, response);
  return { job, calls, transaction, response };
}
test('commit updates matched rows without touching photos/status/history and stores the backup', async (t) => {
  const { job, calls, response, transaction } = await exercise(t);
  assert.equal(response.statusCode, 200); assert.equal(transaction.committed, true); assert.equal(transaction.ended, true);
  const write = calls.find((c) => c.ops); const update = write.ops[0].updateOne.update.$set;
  assert.equal(update.photo, undefined); assert.equal(update.documents, undefined); assert.equal(update.statut, undefined);
  assert.equal(update.hrmsFinance.numeroCompte, '001234'); assert.equal(update.noms, 'TEST');
  assert.ok(write.options.session); assert.equal(job.status, 'applied'); assert.deepEqual(job.backup, current);
  assert.equal(job.expiresAt, undefined); assert.ok(calls.find((c) => c.archive));
});
test('changed database blocks every business write', async (t) => {
  const { response, calls, transaction } = await exercise(t, (job) => { job.fingerprint = 'stale'; });
  assert.equal(response.statusCode, 409); assert.deepEqual(calls, ['lock']); assert.equal(transaction.aborted, true);
});
test('a failed bulk write never archives agents or marks the import applied', async (t) => {
  const { response, calls, job, transaction } = await exercise(t, () => {}, true);
  assert.equal(response.statusCode, 400); assert.equal(job.status, 'preview'); assert.equal(job.backup, undefined);
  assert.equal(calls.some((c) => c.archive || c.save), false); assert.equal(transaction.aborted, true);
});
test('retry after successful commit is idempotent', async (t) => {
  const { response, calls } = await exercise(t, (job) => { job.status = 'applied'; job.appliedAt = new Date(); });
  assert.equal(response.statusCode, 200); assert.deepEqual(calls, ['lock']);
});
test('another actor cannot commit the prepared import', async (t) => {
  const { response, calls } = await exercise(t, (job) => { job.actor = oldId; });
  assert.equal(response.statusCode, 404); assert.deepEqual(calls, ['lock']);
});
test('blocking source issues cannot be bypassed by calling commit directly', async (t) => {
  const { response, calls } = await exercise(t, (job) => { job.plan.ready = false; });
  assert.equal(response.statusCode, 400); assert.deepEqual(calls, ['lock']);
});
