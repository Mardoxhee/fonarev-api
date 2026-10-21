const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'local-rbac-test-secret';
const jwt = require('jsonwebtoken');
const Account = require('../models/accountModel');
const AuditLog = require('../models/auditLogModel');
const app = require('../app');
test('real HTTP routes enforce verified roles, guest grants and block public signup', async t => {
  const accounts = {
    '600000000000000000000001': { role: 'rh_owner', guestModules: [], active: true },
    '600000000000000000000002': { role: 'rh_reader', guestModules: [], active: true },
    '600000000000000000000003': { role: 'invite', guestModules: ['formation'], active: true },
    '600000000000000000000004': { role: 'superadmin', guestModules: [], active: true },
  };
  t.mock.method(Account, 'findById', id => ({ select: async () => accounts[id] ? { _id: id, ...accounts[id] } : null }));
  t.mock.method(AuditLog, 'create', async () => ({}));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(id, path, method = 'GET', body) {
    return fetch(base + path, { method, headers: { ...(id ? { Authorization: 'Bearer ' + jwt.sign({ id }, process.env.JWT_SECRET) } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  try {
    assert.equal((await request(null, '/accounts/signup', 'POST', { role: 'superadmin' })).status, 401);
    for (const id of Object.keys(accounts)) {
      const result = await request(id, '/accounts/me/access'); assert.equal(result.status, 200);
      const { access } = await result.json(); assert.equal(access.role, accounts[id].role);
      assert.equal((await request(id, '/roles')).status, accounts[id].role === 'invite' ? 403 : 200);
    }
    for (const id of ['600000000000000000000002', '600000000000000000000003']) for (const path of ['/agents', '/accounts/signup', '/documents/types', '/accounts/600000000000000000000001/password']) assert.equal((await request(id, path, 'POST', {})).status, 403);
    assert.equal((await request('600000000000000000000003', '/agents')).status, 403);
    accounts['600000000000000000000003'].guestModules = ['utilisateurs'];
    assert.equal((await request('600000000000000000000003', '/roles')).status, 200);
    accounts['600000000000000000000003'].active = false;
    assert.equal((await request('600000000000000000000003', '/roles')).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
