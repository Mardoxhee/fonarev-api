const { criteriaLists, normalizeCriteria } = require('./recruitmentCriteria');
const transitions = {
  brouillon: ['en_validation', 'archive'],
  en_validation: ['valide', 'brouillon', 'archive'],
  valide: ['publie', 'brouillon', 'archive'],
  publie: ['suspendu', 'ferme'],
  suspendu: ['publie', 'brouillon', 'ferme'],
  ferme: ['archive'], annule: ['archive'], archive: [],
};
const fields = ['minExperienceYears', 'educationLevel', 'requiredExperiences', ...criteriaLists, 'titre', 'reference', 'typeOffre', 'contractType', 'direction', 'lieuAffectation', 'resume', 'description', 'missions', 'profilRecherche', 'piecesRequises', 'nombrePostes', 'dateCloture'];
function failure(message, status = 400) { return Object.assign(new Error(message), { status }); }
function content(body) {
  const result = {};
  for (const key of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    if (['minExperienceYears', 'educationLevel', ...criteriaLists].includes(key)) {
      result[key] = normalizeCriteria(key, value);
    } else if (['missions', 'profilRecherche', 'piecesRequises'].includes(key)) {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw failure('Les listes doivent contenir du texte.');
      result[key] = [...new Set(value.map(item => item.trim()).filter(Boolean))];
      if (key === 'piecesRequises' && result[key].length > 20) throw failure('Maximum 20 pièces demandées par offre.');
    } else if (key === 'nombrePostes') {
      if (!Number.isInteger(value) || value < 1) throw failure('Le nombre de postes doit être un entier positif.');
      result[key] = value;
    } else if (key === 'dateCloture') {
      if (value !== null && (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))) throw failure('Date limite invalide.');
      result[key] = value;
    } else {
      if (typeof value !== 'string') throw failure('Les informations de l’offre doivent être du texte.');
      result[key] = value.trim();
    }
  }
  return result;
}
function missing(offer, now = Date.now()) {
  const result = [];
  for (const [key, label] of [['titre','intitulé'],['direction','direction'],['lieuAffectation','lieu'],['description','description']]) {
    if (!offer[key]?.trim()) result.push(label);
  }
  if (!offer.missions?.length) result.push('missions');
  if (!offer.profilRecherche?.length) result.push('profil recherché');
  if (!offer.piecesRequises?.length) result.push('pièces à fournir');
  if (!Number.isInteger(offer.nombrePostes) || offer.nombrePostes < 1) result.push('nombre de postes');
  if (!offer.dateCloture || !(new Date(offer.dateCloture).getTime() > now)) result.push('date limite future');
  return result;
}
function checkTransition(offer, target) {
  if (!transitions[offer.statut]?.includes(target)) throw failure('Ce changement de statut n’est pas autorisé. Actualisez l’offre.', 409);
  if (['en_validation','valide','publie'].includes(target)) {
    const required = missing(offer);
    if (required.length) throw failure(`Complétez l’offre avant de poursuivre : ${required.join(', ')}.`);
  }
}
function event(req, from, to) {
  const user = req.account || {};
  const actor = [user.firstName || user.nom || user.noms, user.postnom, user.lastName || user.prenom].filter(Boolean).join(' ') || user.email || 'Utilisateur HRMS';
  return { from, to, date: new Date(), actor, actorId: req.decoded?.id };
}
module.exports = { transitions, content, missing, checkTransition, event, failure };
