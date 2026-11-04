const { normalizeRole, ROLES } = require('../middlewares/hrmAccess');
const moduleMap = { REPORTING: 'reporting', REPPORTING: 'reporting', AGENTS: 'agents', FORMATION: 'formation', RECRUTEMENT: 'recrutement', UTILISATEURS: 'utilisateurs', REGLAGES: 'reglages' };
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
function parseAccess(payload, userId, applicationId = '19') {
  const { user, application, authorisation } = payload || {};
  if (!user) throw new Error('Réponse Core sans objet utilisateur.');
  if (String(user.id) !== String(userId)) throw new Error('Identité incohérente : user.id ne correspond pas à l’identifiant signé dans le jeton.');
  if (user.status !== true) throw new Error('Compte 360 inactif : user.status doit être true.');
  if (user.isActivate === false) throw new Error('Compte 360 désactivé : user.isActivate vaut false.');
  if (user.isblocked !== false) throw new Error('Compte 360 bloqué ou état isblocked absent : la valeur attendue est false.');
  if (user.deletedAt) throw new Error('Compte 360 supprimé : deletedAt est renseigné.');
  if (!application) throw new Error('Réponse Core sans objet application.');
  if (String(application.id) !== String(applicationId)) throw new Error('Application HRMS incohérente avec FONAREV360_APPLICATION_ID.');
  if (application.status !== true) throw new Error('Application HRMS inactive : application.status doit être true.');
  if (!Array.isArray(authorisation)) throw new Error('Réponse Core sans liste authorisation exploitable.');
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
  if (!modules.size) throw new Error(`Aucun module HRMS autorisé pour ce compte (${authorisation.length} autorisation(s) reçue(s), aucune ne satisfait les règles de module, rôle et privilège de lecture).`);
  const role = ['superadmin', 'rh_owner', 'rh_reader', 'invite'].find(r => roles.has(r));
  return { user, role, ssoModules: [...modules], ssoWriteModules: [...writeModules] };
}
module.exports = { parseAccess };
