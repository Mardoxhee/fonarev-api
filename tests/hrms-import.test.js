const assert = require('node:assert/strict');
const test = require('node:test');
const XLSX = require('xlsx');
const { parseWorkbook, dateValue } = require('../services/hrmsWorkbook');
const { buildPlan, fingerprint } = require('../services/hrmsPlan');
const Agent = require('../models/agentModel');
const headers = ['ID', 'Nom et post nom', 'Prénom', 'Sexe', 'Direction', 'Grade', 'Date de Naissance', 'Date de début', 'Numero de Compte', 'Region', 'Lieux de Naissance', 'adresse email', 'Type de Contrat', 'Date de fin'];
const row = ['001F', 'TEST NOM', 'Marie', 'F', 'Finances', 'Chef', '20/04/1982', '01/11/2023', '00012345678901234567890', 'Région large', 'Kinshasa', 'marie@example.com', 'CDI', '∞'];
function workbook(rows, extra = [], customize) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Métadonnées'], headers, ...rows]), 'HRMS ');
  for (const [name, data] of extra) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([headers, ...data]), name);
  if (customize) customize(book);
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
}
const empty = () => ({ agents: [], directions: [], grades: [], provinces: [] });
test('header discovery, safe text identifiers, dates and source scope', () => {
  const parsed = parseWorkbook(workbook([row], [['HRMS HISTORIQUE', [['OLD', ...row.slice(1)]]]]));
  assert.equal(parsed.rows.length, 1); assert.equal(parsed.rows[0].row, 3);
  assert.equal(parsed.rows[0].data.numeroCompte, row[8]);
  assert.equal(parsed.rows[0].data.dateEntree, '2023-11-01');
  assert.equal(parsed.rows[0].data.dateFinContrat, null);
  assert.equal(parsed.issues.filter((i) => i.severity === 'error').length, 0);
});
test('no date rollover and correct leap years / Excel date system', () => {
  assert.equal(dateValue('31/02/2026'), undefined);
  assert.equal(dateValue('29/02/2024'), '2024-02-29');
  assert.equal(dateValue('29/02/2025'), undefined);
  assert.equal(dateValue(1, true), '1904-01-02');
});
test('duplicate identities block the replacement; exclusions are explicit', () => {
  const file = workbook([row, [row[0], 'DIFFERENT', ...row.slice(2)]]);
  assert.equal(parseWorkbook(file).issues.filter((i) => i.severity === 'error').length, 2);
  const parsed = parseWorkbook(file, { excludedRows: [4] });
  assert.equal(parsed.rows.length, 1); assert.equal(parsed.excluded.length, 1);
  assert.equal(buildPlan(parsed, empty()).ready, true);
});
test('identity correction requires consensus on ID and first name', () => {
  const blank = [...row]; blank[1] = '';
  const parsed = parseWorkbook(workbook([blank], [['ORDINATEUR', [row]]]));
  assert.equal(parsed.rows[0].data.noms, row[1]);
  const conflict = [...row]; conflict[1] = 'OTHER';
  assert.ok(parseWorkbook(workbook([blank], [['ORDINATEUR', [row]], ['HRMS HISTORIQUE', [conflict]]])).issues.some((i) => i.field === 'noms' && i.severity === 'error'));
});
test('Excel errors and imprecise bank numbers are never stored as valid data', () => {
  const file = workbook([row], [], (b) => { b.Sheets['HRMS '].K3 = { t: 'e', v: 15 }; b.Sheets['HRMS '].I3 = { t: 'n', v: 123456789012345678 }; });
  const parsed = parseWorkbook(file);
  assert.equal(parsed.rows[0].data.lieuNaissance, '');
  assert.equal(parsed.rows[0].data.numeroCompte, '');
  assert.ok(parsed.rows[0].unusableFields.includes('numeroCompte'));
  assert.equal(parsed.issues.filter((i) => i.severity === 'error').length, 0);
});
test('matched agents retain IDs/photos and historical records; missing agents are archived', () => {
  const snapshot = empty();
  snapshot.agents = [{ _id: 'existing', matricule: row[0], photo: 'photo.jpg', documents: ['doc'] }, { _id: 'old', matricule: 'OTHER' }];
  snapshot.directions = [{ _id: 'dir', denomination: 'FINANCES' }];
  snapshot.grades = [{ _id: 'grade', libele: 'Chef' }];
  const plan = buildPlan(parseWorkbook(workbook([row])), snapshot);
  assert.equal(plan.rows[0].agentId, 'existing'); assert.equal(plan.summary.photosPreserved, 1);
  assert.deepEqual(plan.archiveIds, ['old']);
  assert.equal(plan.references.filter((r) => r.action === 'create').length, 0);
  assert.equal(plan.rows[0].province, null); // A broad region is not invented as a province.
  assert.deepEqual(snapshot.agents[0].documents, ['doc']);
});
test('excluded matricules protect existing files; repeat imports match the same IDs', () => {
  const other = ['002M', 'OTHER', ...row.slice(2)];
  const parsed = parseWorkbook(workbook([row, other]), { excludedRows: [4] });
  const snapshot = empty(); snapshot.agents = [{ _id: 'a', matricule: row[0] }, { _id: 'b', matricule: '002M' }];
  const plan = buildPlan(parsed, snapshot);
  assert.deepEqual(plan.archiveIds, []); assert.equal(plan.summary.held, 1); assert.equal(plan.summary.finalCount, 2);
});
test('ambiguous existing identities cannot be fused', () => {
  const snapshot = empty(); snapshot.agents = [{ _id: 'a', matricule: row[0] }, { _id: 'b', matricule: row[0] }];
  assert.equal(buildPlan(parseWorkbook(workbook([row])), snapshot).ready, false);
});
test('email matching needs a second identity signal', () => {
  const snapshot = empty(); snapshot.agents = [{ _id: 'a', matricule: 'OLD', noms: 'Someone else', emailPro: row[11] }];
  assert.equal(buildPlan(parseWorkbook(workbook([row])), snapshot).rows[0].agentId, null);
  snapshot.agents[0].noms = row[1]; snapshot.agents[0].prenom = row[2];
  assert.equal(buildPlan(parseWorkbook(workbook([row])), snapshot).rows[0].agentId, 'a');
});
test('reference mappings must belong to the actual database', () => {
  const parsed = parseWorkbook(workbook([row]));
  assert.throws(() => buildPlan(parsed, empty(), { directions: { Finances: 'unknown' } }), /invalide/);
});
test('snapshot hashing detects changes and ignores object key order', () => {
  assert.equal(fingerprint({ b: 2, a: 1 }), fingerprint({ a: 1, b: 2 }));
  assert.notEqual(fingerprint({ a: 'old' }), fingerprint({ a: 'new' }));
});
test('financial identifiers are strings and excluded from ordinary agent queries', () => {
  assert.equal(Agent.schema.path('hrmsFinance').options.select, false);
  const agent = new Agent({ noms: 'TEST', hrmsFinance: { numeroCompte: row[8] }, dateFinContrat: null });
  assert.equal(agent.hrmsFinance.numeroCompte, row[8]);
  assert.equal(agent.validateSync(), undefined);
});

test('case and spacing variants in one workbook create only one reference', () => {
  const variant = [...row]; variant[0] = '002M'; variant[4] = ' FINANCES  '; variant[5] = 'CHEF';
  const plan = buildPlan(parseWorkbook(workbook([row, variant])), empty());
  assert.equal(plan.references.filter((r) => r.kind === 'directions').length, 1);
  assert.equal(plan.references.filter((r) => r.kind === 'grades').length, 1);
});
