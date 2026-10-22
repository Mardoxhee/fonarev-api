const educationLevels = ['', 'aucun', 'secondaire', 'graduat', 'licence', 'master', 'doctorat'];
const criteriaLists = ['studyFields','technicalSkills','softSkills','languages','certifications','tools','screeningQuestions'];
function normalizeCriteria(key, value) {
  if (key === 'minExperienceYears') {
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 60)) throw new Error('Expérience minimale invalide (0 à 60 ans).');
    return value;
  }
  if (key === 'educationLevel') {
    if (!educationLevels.includes(value)) throw new Error('Niveau d’études invalide.');
    return value;
  }
  if (criteriaLists.includes(key)) {
    if (!Array.isArray(value) || value.length > 50 || value.some(item => typeof item !== 'string' || item.length > 500)) throw new Error('Critères invalides : une liste de textes est attendue.');
    return [...new Set(value.map(item => item.trim()).filter(Boolean))];
  }
  return undefined;
}
const escaped = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function candidateFilters(params) {
  const query = {};
  if (params.experienceMin !== undefined && params.experienceMin !== '') {
    const value = Number(params.experienceMin);
    if (!Number.isFinite(value) || value < 0 || value > 60) throw new Error('Filtre d’expérience invalide.');
    query.experienceYears = { $gte: value };
  }
  if (params.educationMinimum) {
    const index = educationLevels.indexOf(params.educationMinimum);
    if (index < 1) throw new Error('Filtre de diplôme invalide.');
    query.educationLevel = { $in: educationLevels.slice(index) };
  }
  for (const [param, field] of [['studyField','studyField'],['competence','competences'],['langue','langues.langue'],['certification','certifications']]) {
    if (params[param]) {
      if (typeof params[param] !== 'string' || params[param].length > 200) throw new Error('Filtre invalide.');
      query[field] = { $regex: `^${escaped(params[param].trim())}$`, $options: 'i' };
    }
  }
  return query;
}
module.exports = { educationLevels, criteriaLists, normalizeCriteria, candidateFilters };
