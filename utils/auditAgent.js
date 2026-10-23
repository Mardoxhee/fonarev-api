const Agent = require('../models/agentModel');
const agentIdForLog = (log) => {
  if (log.module !== 'agents') return undefined;
  const pathId = String(log.path || '').match(/^\/agents\/([a-f\d]{24})(?:[/?]|$)/i)?.[1];
  const id = pathId || log.resourceId;
  if (String(log.path || '').includes('/hrms-import')) return undefined;
  return /^[a-f\d]{24}$/i.test(String(id || '')) ? String(id) : undefined;
};
const identity = (agent) => ({ id: String(agent._id), name: [agent.noms, agent.prenom].filter(Boolean).join(' '), matricule: agent.matricule });
async function hydrateAgents(logs) {
  const ids = [...new Set(logs.filter(log => !log.agent?.name).map(agentIdForLog).filter(Boolean))];
  if (!ids.length) return logs;
  const agents = await Agent.find({ _id: { $in: ids } }).select('noms prenom matricule').lean();
  const byId = new Map(agents.map(agent => [String(agent._id), identity(agent)]));
  return logs.map(log => log.agent?.name ? log : { ...log, agent: byId.get(agentIdForLog(log)) });
}
module.exports = { agentIdForLog, hydrateAgents };
