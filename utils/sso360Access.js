const { normalizeRole, ROLES } = require('../middlewares/hrmAccess');
const moduleMap = { REPORTING: 'reporting', REPPORTING: 'reporting', AGENTS: 'agents', FORMATION: 'formation', RECRUTEMENT: 'recrutement', UTILISATEURS: 'utilisateurs', REGLAGES: 'reglages' };
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
function parseAccess(payload, userId, applicationId = '19') {
  const { user, application, authorisation } = payload || {};
  if (!user || String(user.id) !== String(userId) || user.status !== true || user.isActivate === false || user.isblocked !== false || user.deletedAt) throw new Error('Compte 360 inactif ou identité incohérente.');
  if (!application || String(application.id) !== String(applicationId) || application.status !== true || !Array.isArray(authorisation)) throw new Error('Accès HRMS non autorisé.');
  const modules = new Set(), writeModules = new Set(), roles = new Set();
  for (const entry of authorisation) {
    const role = normalizeRole(entry.role?.role);
    const module = moduleMap[normalize(entry.module?.module)];
    if (!ROLES.includes(role) || !module || entry.module?.deletedAt || String(entry.role?.applicationId) !== String(application.id)) continue;
    const privileges = (entry.role.privileges || []).map(p => normalize(p.privilege));
    if (!privileges.some(p => ['LIRE', 'AFFICHER', 'CONSULTER'].includes(p))) continue;
    roles.add(role); modules.add(module);
    // Owner roles retain full editing within explicitly granted modules (HRMS role contract).
    if (['rh_owner', 'superadmin'].includes(role)) writeModules.add(module);
  }
  if (!modules.size) throw new Error('Aucun module HRMS autorisé pour ce compte.');
  const role = ['superadmin', 'rh_owner', 'rh_reader', 'invite'].find(r => roles.has(r));
  return { user, role, ssoModules: [...modules], ssoWriteModules: [...writeModules] };
}
module.exports = { parseAccess };
