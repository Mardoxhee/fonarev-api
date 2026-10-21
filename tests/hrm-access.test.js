const test = require('node:test');
const assert = require('node:assert/strict');
const { MODULES, accessFor, authorize, normalizeRole } = require('../middlewares/hrmAccess');
function check(role, method, path, guestModules = []) {
  let allowed = false;
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  authorize({ account: { role, guestModules }, method, originalUrl: path }, res, () => { allowed = true; });
  return { allowed, code: res.code };
}
test('owners and superadmins can read and write all HRM resources', () => {
  for (const role of ['rh_owner', 'superadmin', 'RH OWNER', 'SUPERADMIN']) for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) for (const path of ['/agents', '/agents/123/salaire-net-acquis', '/accounts', '/roles', '/documents', '/logs', '/offres-emploi']) assert.equal(check(role, method, path).allowed, true);
});
test('reader reads all resources including salary and accounts but cannot mutate', () => {
  assert.deepEqual(accessFor({ role: 'RH READER' }).modules, MODULES);
  for (const path of ['/agents', '/agents/123/fin-contrat', '/agents/123/salaire-net-acquis', '/accounts', '/roles', '/documents', '/logs']) {
    assert.equal(check('rh_reader', 'GET', path).allowed, true);
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) assert.equal(check('rh_reader', method, path).code, 403);
  }
});
test('guest defaults to no access; configured modules grant read only, including HEAD', () => {
  for (const path of ['/agents', '/accounts', '/documents', '/offres-emploi']) assert.equal(check('invite', 'GET', path).code, 403);
  assert.equal(check('invite', 'GET', '/agents', ['agents']).allowed, true);
  assert.equal(check('invite', 'HEAD', '/agents', ['agents']).allowed, true);
  assert.equal(check('invite', 'GET', '/accounts', ['agents']).code, 403);
  assert.equal(check('invite', 'PATCH', '/agents/123', ['agents']).code, 403);
  assert.equal(check('invite', 'GET', '/agents', ['reporting']).allowed, true);
  assert.equal(check('invite', 'GET', '/agents/123/salaire-net-acquis', ['reporting']).code, 403);
  assert.equal(check('invite', 'GET', '/accounts/me/access').allowed, true);
  assert.equal(check('unknown', 'GET', '/agents').code, 403);
});
test('revoking a module takes effect on the next request, legacy roles map explicitly', () => {
  assert.equal(check('invite', 'GET', '/agents', ['agents']).allowed, true);
  assert.equal(check('invite', 'GET', '/agents', []).code, 403);
  assert.equal(normalizeRole('admin'), 'superadmin'); assert.equal(normalizeRole('rh'), 'rh_owner'); assert.equal(normalizeRole('dg'), 'rh_reader'); assert.equal(normalizeRole('INVITÉ'), 'invite');
});
test('account model defaults to guest and rejects arbitrary roles and modules', () => {
  const Account = require('../models/accountModel');
  const account = new Account(); assert.equal(account.role, 'invite'); assert.deepEqual(account.guestModules.toObject(), []);
  assert.ok(new Account({ role: 'arbitrary' }).validateSync().errors.role);
  assert.ok(new Account({ guestModules: ['arbitrary'] }).validateSync().errors['guestModules.0']);
});
