const crypto = require('node:crypto');
const { key, text } = require('./hrmsWorkbook');
const id = (v) => String(v?._id || v || '');
const fullName = (a) => key(`${a.noms || a.nom || ''} ${a.postnom || ''} ${a.prenom || ''}`);
const birth = (v) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toISOString().slice(0, 10) : '';
function stable(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toHexString === 'function') return value.toHexString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  return value;
}
const fingerprint = (snapshot) => crypto.createHash('sha256').update(JSON.stringify(stable(snapshot))).digest('hex');
function buildPlan(parsed, snapshot, mappings = {}) {
  const issues = [...parsed.issues], referencePlans = [], rows = [], used = new Set();
  const lookup = (kind, label, list, getLabel, allowCreate) => {
    if (!label) return null;
    const selected = mappings[kind]?.[label];
    let matches = selected && selected !== '__new__' ? list.filter((r) => id(r) === selected) : selected === '__new__' ? [] : list.filter((r) => key(getLabel(r)) === key(label));
    if (selected && selected !== '__new__' && matches.length !== 1) throw new Error('Correspondance de référentiel invalide. Relancez l’analyse.');
    // Reuse exact canonical references even if the user requests a new one.
    if (!matches.length && allowCreate) matches = list.filter((r) => key(getLabel(r)) === key(label));
    const existing = referencePlans.find((r) => r.kind === kind && key(r.source) === key(label));
    if (existing) return existing;
    const entry = { kind, source: label, label: matches.length === 1 ? getLabel(matches[0]) : label, id: matches.length === 1 ? id(matches[0]) : null, action: matches.length === 1 ? 'reuse' : allowCreate ? 'create' : 'unmapped' };
    if (matches.length > 1) { entry.action = 'ambiguous'; issues.push({ row: 0, field: kind, severity: 'error', message: `Plusieurs ${kind} correspondent à « ${label} ». Choisissez le référentiel à conserver.` }); }
    referencePlans.push(entry);
    return entry;
  };
  const held = new Set(snapshot.agents.filter((a) => parsed.excluded.some((r) => key(r.matricule) && key(r.matricule) === key(a.matricule))).map((a) => id(a)));
  for (const row of parsed.rows) {
    const data = { ...row.data };
    let matches = snapshot.agents.filter((a) => key(a.matricule) && key(a.matricule) === key(data.matricule));
    let matchBy = 'matricule';
    if (!matches.length && data.emailPro) {
      matches = snapshot.agents.filter((a) => [a.emailPro, a.emailPerso].some((email) => text(email).toLowerCase() === data.emailPro.toLowerCase()));
      matchBy = 'email';
      // An email alone is not sufficient to move an existing identity/photo.
      matches = matches.filter((a) => fullName(a) === fullName(data) || (a.dateNaissance && data.dateNaissance && birth(a.dateNaissance) === data.dateNaissance));
    }
    if (!matches.length && data.dateNaissance && data.noms) {
      matches = snapshot.agents.filter((a) => fullName(a) === fullName(data) && a.dateNaissance && birth(a.dateNaissance) === data.dateNaissance);
      matchBy = 'nom et naissance';
    }
    if (matches.length > 1) issues.push({ row: row.row, field: 'identity', severity: 'error', message: 'Plusieurs agents existants correspondent. Aucun rapprochement automatique possible.' });
    const existing = matches.length === 1 ? matches[0] : null;
    if (existing && used.has(id(existing))) issues.push({ row: row.row, field: 'identity', severity: 'error', message: 'Deux lignes du fichier correspondent à la même fiche existante.' });
    if (existing) used.add(id(existing));
    const direction = lookup('directions', data.directionLabel, snapshot.directions, (r) => r.denomination, true);
    const grade = lookup('grades', data.grade, snapshot.grades, (r) => r.libele, true);
    const province = lookup('provinces', data.regionAffectation, snapshot.provinces, (r) => r.nom || r.Province || r.province || '', false);
    if (province?.action === 'unmapped') issues.push({ row: row.row, field: 'regionAffectation', severity: 'warning', message: `« ${data.regionAffectation} » conservé comme région, sans inventer une province. Choisissez une province si elle est connue.` });
    rows.push({ row: row.row, data, unusableFields: row.unusableFields || [], agentId: existing ? id(existing) : null, matchBy: existing ? matchBy : null, photoPreserved: Boolean(existing?.photo), direction: direction?.source, grade: grade?.source, province: province?.id || null });
  }
  const archiveIds = snapshot.agents.filter((a) => !a.hrmsArchived && !used.has(id(a)) && !held.has(id(a))).map((a) => id(a));
  const heldCount = snapshot.agents.filter((a) => !a.hrmsArchived && held.has(id(a)) && !used.has(id(a))).length;
  return {
    rows, references: referencePlans, archiveIds, issues,
    summary: { imported: rows.length, created: rows.filter((r) => !r.agentId).length, updated: rows.filter((r) => r.agentId).length, archived: archiveIds.length, excluded: parsed.excluded.length, held: heldCount, photosPreserved: rows.filter((r) => r.photoPreserved).length, finalCount: rows.length + heldCount },
    ready: !issues.some((issue) => issue.severity === 'error'),
  };
}
module.exports = { buildPlan, fingerprint, id };
