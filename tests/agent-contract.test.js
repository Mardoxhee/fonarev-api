const test = require('node:test');
const assert = require('node:assert/strict');
const Agent = require('../models/agentModel');
const { validateEnd, endContract, getSalary, updateSalary } = require('../controllers/agentContractController');
const response = () => ({ locals: {}, code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, set() { return this; } });
const id = '600000000000000000000001';
const body = { modalite: 'Licencié', dateEffet: '2025-01-01', reference: 'DEC-1', observations: 'Préavis réglé' };
test('all four modalities accept a valid date; missing, invalid, future and pre-hire dates fail', () => {
  for (const modalite of ['Retraité', 'Licencié', 'Décédé', 'Démissionnaire']) assert.ok(validateEnd({ ...body, modalite }, {}));
  for (const dateEffet of ['', '2025-02-30', '2099-01-01', 'no']) assert.throws(() => validateEnd({ ...body, dateEffet }, {}));
  assert.throws(() => validateEnd(body, { dateEntree: new Date('2026-01-01') }));
  assert.throws(() => validateEnd({ ...body, modalite: 'Autre' }, {}));
});
test('termination atomically records status, date, history and author', async t => {
  t.mock.method(Agent, 'findById', async () => ({ _id: id, statut: 'Actif' }));
  let write;
  t.mock.method(Agent, 'findOneAndUpdate', (filter, update) => { write = { filter, update }; return { populate: async () => ({ _id: id, ...update.$set }) }; });
  const res = response();
  await endContract({ params: { id }, body, account: { _id: id } }, res);
  assert.equal(res.code, 200); assert.equal(write.update.$set.statut, 'Licencié');
  assert.equal(write.update.$push.finsContrat.enregistrePar, id);
  assert.equal(write.update.$push.finsContrat.reference, 'DEC-1');
  assert.equal(write.filter.statut, 'Actif');
  assert.deepEqual(write.filter['finsContrat.0'], { $exists: false });
});
test('repeated or concurrent termination cannot duplicate history', async t => {
  t.mock.method(Agent, 'findById', async () => ({ _id: id, statut: 'Licencié', finsContrat: [body] }));
  const write = t.mock.method(Agent, 'findOneAndUpdate', () => ({ populate: async () => null }));
  const res = response(); await endContract({ params: { id }, body }, res);
  assert.equal(res.code, 409); assert.equal(write.mock.calls.length, 0);
  Agent.findById.mock.restore();
  t.mock.method(Agent, 'findById', async () => ({ _id: id, statut: 'Actif' }));
  const concurrent = response(); await endContract({ params: { id }, body }, concurrent);
  assert.equal(concurrent.code, 409);
});
test('salary validates numbers and permits zero or clearing, excluded from normal queries', async t => {
  assert.equal(Agent.schema.path('salaireNetAcquis').options.select, false);
  const writes = t.mock.method(Agent, 'findByIdAndUpdate', (id, update) => ({ select: async () => ({ _id: id, salaireNetAcquis: update.$set.salaireNetAcquis }) }));
  for (const value of [-1, NaN, Infinity, '123', 1.001, undefined]) {
    const res = response(); await updateSalary({ params: { id }, body: { salaireNetAcquis: value } }, res); assert.equal(res.code, 400);
  }
  assert.equal(writes.mock.calls.length, 0);
  for (const value of [0, 1234.56, null]) {
    const res = response(); await updateSalary({ params: { id }, body: { salaireNetAcquis: value } }, res); assert.equal(res.code, 200); assert.equal(res.body.salaireNetAcquis, value);
  }
});

test('optional attachment is validated and retained in the contract history', async t => {
  assert.ok(validateEnd(body, {}));
  const annexe = { url: 'https://files.test/annexe.pdf', fileName: 'annexe.pdf', mimeType: 'application/pdf' };
  assert.ok(validateEnd({ ...body, annexe }, {}));
  for (const invalid of [{}, { ...annexe, url: 'javascript:alert(1)' }, { ...annexe, fileName: '' }]) assert.throws(() => validateEnd({ ...body, annexe: invalid }, {}));
  t.mock.method(Agent, 'findById', async () => ({ _id: id, statut: 'Actif' }));
  let stored;
  t.mock.method(Agent, 'findOneAndUpdate', (filter, update) => { stored = update.$push.finsContrat; return { populate: async () => ({ _id: id, finsContrat: [stored] }) }; });
  const res = response();
  await endContract({ params: { id }, body: { ...body, annexe }, account: { _id: id } }, res);
  assert.equal(res.code, 200); assert.deepEqual(stored.annexe, annexe);
});
