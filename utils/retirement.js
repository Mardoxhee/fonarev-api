/**
 * Projection RH à 65 ans. Une date de naissance prime toujours sur l’âge.
 * @param {{dateNaissance?: string | Date | null, age?: number | null, ageReferenceDate?: string | Date | null}} person
 * @param {Date} now
 */
function retirementProjection(person = {}, now = new Date()) {
  /** @param {string | Date | null | undefined} value */
  function calendarDate(value) {
    if (!value) return null;
    const text = value instanceof Date ? (Number.isFinite(value.getTime()) ? value.toISOString() : '') : value;
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);
    const french = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!iso && !french) return null;
    const [year, month, day] = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : [Number(french[3]), Number(french[2]), Number(french[1])];
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  const birth = calendarDate(person.dateNaissance);
  if (birth && birth.getTime() <= now.getTime()) {
    const year = birth.getUTCFullYear() + 65;
    const month = birth.getUTCMonth();
    // Le 29 février est ramené au dernier jour de février dans l’année cible.
    const day = Math.min(birth.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    const date = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
    return { date, year, estimated: false };
  }
  // Une naissance invalide renseignée doit être corrigée, pas masquée par l’âge.
  if (person.dateNaissance) return { date: null, year: null, estimated: false };
  const age = person.age;
  if (typeof age === 'number' && Number.isInteger(age) && age >= 0 && age <= 120) {
    const reference = person.ageReferenceDate ? calendarDate(person.ageReferenceDate) : now;
    if (reference && reference.getTime() <= now.getTime()) return { date: null, year: reference.getUTCFullYear() + 65 - age, estimated: true };
  }
  return { date: null, year: null, estimated: false };
}
module.exports = { retirementProjection };
