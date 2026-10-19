const test = require('node:test');
const assert = require('node:assert/strict');
const Agent = require('../models/agentModel');
const { getAgents } = require('../controllers/agentController');
const records = Array.from({ length: 316 }, (_, i) => ({ _id: i, noms: 'AGENT', sexe: i % 2 ? 'M' : 'F', ...(i < 19 ? { statut: 'Actif' } : i === 19 ? { statut: null } : i === 20 ? { statut: '' } : {}) }));
records.push({ _id: 316, statut: 'Inactif' }, { _id: 317, statut: 'Retraité' }, { _id: 318, statut: 'Actif', hrmsArchived: true });
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('$ne' in value) return row[key] !== value.$ne;
      if ('$in' in value) return value.$in.some(option => option === null ? row[key] == null : row[key] === option);
    }
    return row[key] === value;
  });
}
function setup(t) {
  const calls = [];
  t.mock.method(Agent, 'find', query => {
    let skip = 0, limit = Infinity;
    return { select() { return this; }, sort(sort) { calls.push(sort); return this; }, skip(n) { skip = n; return this; }, limit(n) { limit = n; return this; }, populate() { return this; }, then(resolve, reject) { return Promise.resolve(records.filter(row => matches(row, query)).slice(skip, skip + limit)).then(resolve, reject); } };
  });
  t.mock.method(Agent, 'countDocuments', async query => records.filter(row => matches(row, query)).length);
  return calls;
}
async function request(query) {
  const res = { code: 200, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } };
  await getAgents({ query }, res); return res;
}
test('316 active or legacy dossiers paginate 20/20/16, with a stable total and no overlap', async t => {
  const sorts = setup(t);
  const first = await request({ statut: 'Actif', page: '1', limit: '20', sort: 'nom' });
  const second = await request({ statut: 'Actif', page: '2', limit: '20', sort: 'nom' });
  const last = await request({ statut: 'Actif', page: '16', limit: '20' });
  for (const response of [first, second, last]) {
    assert.equal(response.code, 200); assert.equal(response.body.totalAgents, 316); assert.equal(response.body.statusTotals.actifs, 316);
    assert.equal(response.body.statusTotals.inactifs, 1); assert.equal(response.body.statusTotals.retraites, 1);
  }
  assert.equal(first.body.agents.length, 20); assert.equal(second.body.agents.length, 20); assert.equal(last.body.agents.length, 16);
  assert.equal(new Set([...first.body.agents, ...second.body.agents].map(a => a._id)).size, 40);
  assert.ok(sorts.every(sort => sort.endsWith('_id')));
  const inactive = await request({ statut: 'Tous les inactifs' }); assert.equal(inactive.body.totalAgents, 2);
  const empty = await request({ statut: 'Décédé' }); assert.equal(empty.body.totalAgents, 0);
});
test('pagination defaults to 20 and rejects invalid parameters', async t => {
  setup(t);
  const defaults = await request({ statut: 'Actif' }); assert.equal(defaults.body.page, 1); assert.equal(defaults.body.limit, 20);
  for (const query of [{ page: '-1' }, { page: '1.5' }, { limit: '0' }, { limit: 'abc' }, { limit: '501' }]) assert.equal((await request(query)).code, 400);
});
