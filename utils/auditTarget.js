const configs = {
 candidatures: ['candidatureSpont', 'nom prenom reference'], formulaires: ['applicationFormModel', 'titre'],
 agents: ['agentModel', 'noms prenom matricule'],
 directions: ['directionModel', 'denomination'], divisions: ['divisionModel', 'denomination'], services: ['serviceModel', 'denomination'],
 grades: ['gradeModel', 'libele'], provinces: ['provinceModel', 'nom Province province'],
 documents: ['documentModel', 'type fileName'], 'offres-emploi': ['offreEmploiModel', 'titre reference'],
 accounts: ['accountModel', 'firstName lastName'], roles: ['roleModel', 'name code'],
};
const validId = value => /^[a-f\d]{24}$/i.test(String(value || ''));
function targetId(log) {
 if (!configs[log.module] || /\/hrms-import(?:\/|$)/.test(log.path || '')) return undefined;
 const segment = String(log.path || '').split('/')[2];
 return validId(segment) ? segment : validId(log.resourceId) ? String(log.resourceId) : undefined;
}
function snapshot(module, doc) {
 if (!doc || !configs[module] || !validId(doc._id)) return undefined;
 const fields = configs[module][1].split(' ');
 const values = Object.fromEntries(fields.map(key => [key, typeof doc[key] === 'string' ? doc[key] : '']));
 const name = module === 'agents' ? [values.noms, values.prenom].filter(Boolean).join(' ') : module === 'candidatures' ? [values.nom, values.prenom].filter(Boolean).join(' ') : module === 'accounts' ? [values.firstName, values.lastName].filter(Boolean).join(' ') : fields.map(key => values[key]).find(Boolean);
 return name ? { id: String(doc._id), name, reference: values.matricule || values.reference || values.code || undefined } : undefined;
}
async function hydrateTargets(logs) {
 const result = logs.map(log => ({ ...log, target: log.target || (log.agent?.name ? { id: log.agent.id, name: log.agent.name, reference: log.agent.matricule } : undefined) }));
 await Promise.all(Object.entries(configs).map(async ([module, [model, fields]]) => {
  const ids = [...new Set(result.filter(log => log.module === module && !log.target).map(targetId).filter(Boolean))];
  if (!ids.length) return;
  const docs = await require('../models/' + model).find({ _id: { $in: ids } }).select(fields).lean();
  const byId = new Map(docs.map(doc => [String(doc._id), snapshot(module, doc)]));
  result.forEach(log => { if (log.module === module && !log.target) log.target = byId.get(targetId(log)); });
 }));
 return result;
}
module.exports = { hydrateTargets, snapshot, targetId };
