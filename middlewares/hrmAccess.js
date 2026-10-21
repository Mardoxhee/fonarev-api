const MODULES = ['agents', 'reporting', 'formation', 'recrutement', 'utilisateurs', 'reglages'];
const ROLES = ['rh_owner', 'rh_reader', 'superadmin', 'invite'];
function normalizeRole(role) {
  const value = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  // Compatibility for existing accounts; newly assigned roles use only the four canonical codes.
  return ({ admin: 'superadmin', administrateur: 'superadmin', rh: 'rh_owner', drh: 'rh_owner', dg: 'rh_reader', manager: 'invite', utilisateur: 'invite' })[value] || value;
}
function accessFor(account) {
  const role = normalizeRole(account.role);
  const canWrite = ['rh_owner', 'superadmin'].includes(role);
  const modules = canWrite || role === 'rh_reader' ? MODULES : role === 'invite' ? (account.guestModules || []).filter(module => MODULES.includes(module)) : [];
  return { role, canWrite, modules };
}
const routeModules = {
  agents: ['agents', 'reporting'], personnes: ['agents'],
  directions: ['agents', 'reporting', 'reglages', 'recrutement'], divisions: ['agents', 'reglages', 'recrutement'], services: ['agents', 'reglages', 'recrutement'], grades: ['agents', 'reporting', 'reglages', 'recrutement'], provinces: ['agents', 'reporting', 'reglages', 'recrutement'],
  documents: ['agents', 'reglages'], accounts: ['utilisateurs'], roles: ['utilisateurs'], logs: ['reglages'],
  'offres-emploi': ['recrutement'], candidatures: ['recrutement'], formulaires: ['recrutement'],
};
function authorize(req, res, next) {
  const access = accessFor(req.account);
  req.hrmAccess = access;
  const path = req.originalUrl.split('?')[0];
  if (path === '/accounts/me/access') return next();
  const read = ['GET', 'HEAD'].includes(req.method);
  const route = path.split('/')[1];
  let modules = routeModules[route] || [];
  // Reporting may fetch the list, but not individual dossiers or sensitive subresources.
  if (route === 'documents' && !/^\/documents\/types(?:\/|$)/.test(path)) modules = ['agents'];
  if (route === 'agents' && !/^\/agents\/?$/.test(path)) modules = ['agents'];
  if (!access.canWrite && (!read || !modules.some(module => access.modules.includes(module)))) return res.status(403).json({ message: 'Vous ne disposez pas des habilitations nécessaires pour cette action.' });
  next();
}
module.exports = { MODULES, ROLES, normalizeRole, accessFor, authorize };
