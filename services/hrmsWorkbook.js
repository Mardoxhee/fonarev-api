const XLSX = require('xlsx');
const crypto = require('node:crypto');
const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const key = (value) => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/Œ/g, 'OE').replace(/[^A-Z0-9]/g, '');
const columns = {
  matricule: ['ID', 'Matricule', 'Employee ID'], noms: ['Nom et post nom', 'Nom et postnom', 'Noms'], prenom: ['Prénom'], sexe: ['Sexe'],
  lieuNaissance: ['Lieux de Naissance', 'Lieu de naissance'], dateNaissance: ['Date de Naissance'], etatcivile: ['Statut marital', 'État civil'],
  nombreConjoints: ['Conjoint'], nombrenfants: ['Enfant', 'Enfants'], nombrePersonnesCharge: ['Nbre de personne à charge'],
  phone: ['Numéro de téléphone', 'Téléphone'], emailPro: ['adresse email', 'Email'], adresse: ['adresse maison', 'Adresse'],
  fonction: ['Poste', 'Fonction'], grade: ['Grade'], directionLabel: ['Direction'], responsableDirect: ['Responsible directe', 'Responsable directe', 'Responsable direct'],
  lieuRecrutement: ['Lieux de Recrutement'], lieuPrestation: ['Lieux de Prestation'], regionAffectation: ['Region', 'Région'], mutation: ['MUTATION'],
  typeContrat: ['Type de Contrat'], dateEntree: ['Date de début'], dateFinContrat: ['Date de fin'], numeroCNSS: ['Numéro CNSS'], numeroCompte: ['Numero de Compte'], banque: ['Banque'],
};
const derivedColumns = ['N°', 'Âge', 'Date 65 ans', 'Colonne1', 'Colonne2'].map(key);
const stringFields = ['noms', 'prenom', 'matricule', 'lieuNaissance', 'phone', 'emailPro', 'adresse', 'fonction', 'grade', 'directionLabel', 'responsableDirect', 'lieuRecrutement', 'lieuPrestation', 'regionAffectation', 'typeContrat', 'numeroCNSS', 'numeroCompte', 'banque'];

function readLayout(sheet) {
  if (!sheet?.['!ref']) throw new Error('Feuille vide.');
  const range = XLSX.utils.decode_range(sheet['!ref']);
  if (range.e.r > 10000 || range.e.c > 100) throw new Error('La feuille dépasse 10 000 lignes ou 100 colonnes.');
  for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
    const map = {}, headers = [];
    for (let c = 0; c <= range.e.c; c++) {
      const header = text(sheet[XLSX.utils.encode_cell({ r, c })]?.v);
      headers.push(header);
      for (const [field, aliases] of Object.entries(columns)) {
        if (map[field] === undefined && aliases.some((alias) => key(alias) === key(header))) map[field] = c;
      }
    }
    if (map.matricule !== undefined && map.noms !== undefined && map.prenom !== undefined) return { headerRow: r, map, range, headers };
  }
  throw new Error('En-têtes introuvables : ID/Matricule, Nom et post nom, Prénom sont nécessaires.');
}

function dateValue(value, date1904 = false) {
  if (value === null || value === undefined || text(value) === '' || text(value) === '∞') return null;
  let y, m, d;
  if (typeof value === 'number') { const parsed = XLSX.SSF.parse_date_code(value, { date1904 }); if (!parsed) return undefined; ({ y, m, d } = parsed); }
  else if (value instanceof Date) { y = value.getUTCFullYear(); m = value.getUTCMonth() + 1; d = value.getUTCDate(); }
  else {
    const fr = text(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const iso = text(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (fr) [, d, m, y] = fr.map(Number);
    else if (iso) [, y, m, d] = iso.map(Number);
    else return undefined;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return undefined;
  return date.toISOString().slice(0, 10);
}

function parseWorkbook(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, cellNF: true, cellText: true });
  const sheetName = workbook.SheetNames.find((name) => key(name) === 'HRMS');
  if (!sheetName) throw new Error('Le classeur doit contenir une feuille HRMS. Les feuilles historiques ne remplacent pas cette feuille.');
  const sheet = workbook.Sheets[sheetName], layout = readLayout(sheet), issues = [], rows = [], excluded = [];
  const issue = (row, field, message, severity = 'warning') => issues.push({ row, field, message, severity });
  for (const field of ['sexe', 'directionLabel', 'grade', 'dateNaissance', 'dateEntree']) {
    if (layout.map[field] === undefined) throw new Error(`Colonne obligatoire manquante : ${columns[field][0]}.`);
  }
  const known = new Set([...Object.values(columns).flat().map(key), ...derivedColumns]);
  const ignoredColumns = layout.headers.filter((h) => h && !known.has(key(h)));
  const excludedSet = new Set((options.excludedRows || []).map(Number));
  const correctionMap = new Map((options.corrections || []).map((c) => [Number(c.row), c]));
  const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
  const support = [];
  for (const name of workbook.SheetNames.filter((name) => ['HRMSHISTORIQUE', 'ORDINATEUR'].includes(key(name)))) {
    try {
      const source = workbook.Sheets[name], info = readLayout(source);
      for (let r = info.headerRow + 1; r <= info.range.e.r; r++) {
        const get = (f) => text(source[XLSX.utils.encode_cell({ r, c: info.map[f] })]?.v);
        support.push({ matricule: get('matricule'), noms: get('noms'), prenom: get('prenom'), source: name });
      }
    } catch { /* Optional supporting sheets never define the active roster. */ }
  }
  for (let r = layout.headerRow + 1; r <= layout.range.e.r; r++) {
    const rowNumber = r + 1;
    const raw = (field) => layout.map[field] === undefined ? undefined : sheet[XLSX.utils.encode_cell({ r, c: layout.map[field] })];
    if (!Object.keys(columns).some((field) => text(raw(field)?.v))) continue;
    const originalMatricule = text(raw('matricule')?.v);
    if (excludedSet.has(rowNumber)) { excluded.push({ row: rowNumber, matricule: originalMatricule, noms: text(raw('noms')?.v), prenom: text(raw('prenom')?.v) }); continue; }
    const values = {}, unusableFields = [];
    for (const field of Object.keys(columns)) {
      const cell = raw(field);
      if (cell?.t === 'e' || /^#(VALUE!|REF!|N\/A|DIV\/0!|NAME\?|NUM!|NULL!)/.test(text(cell?.v)) || (cell?.f && cell.v === undefined)) {
        issue(rowNumber, field, 'Erreur de formule Excel : valeur existante conservée si disponible.'); values[field] = ''; unusableFields.push(field); continue;
      }
      values[field] = cell?.v;
      if (['numeroCompte', 'numeroCNSS', 'matricule'].includes(field) && cell?.t === 'n') {
        if (!Number.isSafeInteger(cell.v) || String(Math.trunc(cell.v)).length > 15) {
          issue(rowNumber, field, 'Identifiant numérique de plus de 15 chiffres : précision incertaine. Valeur non importée ; fournir du texte.', field === 'matricule' ? 'error' : 'warning');
          values[field] = ''; unusableFields.push(field);
        } else if (cell.w && !/[Ee][+-]\d/.test(cell.w)) values[field] = cell.w;
      }
    }
    const correction = correctionMap.get(rowNumber);
    for (const field of ['matricule', 'noms', 'prenom']) {
      if (correction && typeof correction[field] === 'string') { values[field] = correction[field]; issue(rowNumber, field, 'Correction appliquée dans l’aperçu.'); }
    }
    const data = Object.fromEntries(stringFields.map((field) => [field, text(values[field])]));
    data.matricule = data.matricule.toUpperCase();
    if (!data.noms && data.matricule) {
      const matches = support.filter((s) => key(s.matricule) === key(data.matricule) && key(s.prenom) === key(data.prenom) && s.noms);
      const names = new Set(matches.map((s) => key(s.noms)));
      if (names.size === 1) { data.noms = matches[0].noms; issue(rowNumber, 'noms', `Nom complété par matricule et prénom depuis ${matches[0].source}.`); }
    }
    for (const field of ['matricule', 'noms', 'directionLabel']) if (!data[field]) issue(rowNumber, field, `${columns[field][0]} manquant.`, 'error');
    data.sexe = key(values.sexe);
    if (!['F', 'M'].includes(data.sexe)) issue(rowNumber, 'sexe', 'Sexe attendu : F ou M.', 'error');
    data.etatcivile = ({ M: 'Marié(e)', C: 'Célibataire', D: 'Divorcé(e)', V: 'Veuf/Veuve' })[key(values.etatcivile)] || text(values.etatcivile);
    for (const field of ['nombreConjoints', 'nombrenfants', 'nombrePersonnesCharge']) {
      const v = text(values[field]); data[field] = v === '' ? null : Number(v);
      if (v && (!Number.isInteger(data[field]) || data[field] < 0)) { issue(rowNumber, field, 'Nombre entier positif ou zéro attendu.', 'error'); data[field] = null; }
    }
    for (const field of ['dateNaissance', 'dateEntree', 'dateFinContrat']) {
      data[field] = dateValue(values[field], date1904);
      if (data[field] === undefined) { issue(rowNumber, field, 'Date non valide.', 'error'); data[field] = null; }
    }
    if (data.dateNaissance && data.dateEntree && data.dateNaissance >= data.dateEntree) issue(rowNumber, 'dateNaissance', 'Naissance postérieure ou égale à l’entrée.', 'error');
    if (data.dateFinContrat && data.dateEntree && data.dateFinContrat < data.dateEntree) issue(rowNumber, 'dateFinContrat', 'Fin de contrat antérieure au début.', 'error');
    if (key(data.typeContrat) === 'CDD' && !data.dateFinContrat) issue(rowNumber, 'dateFinContrat', 'CDD sans échéance dans le fichier : date de fin à compléter.');
    data.mutation = key(values.mutation) === 'OUI' ? true : key(values.mutation) === 'NON' ? false : null;
    if (text(values.mutation) && data.mutation === null) issue(rowNumber, 'mutation', 'Mutation attendue : Oui ou Non.', 'error');
    if (!data.fonction) issue(rowNumber, 'fonction', 'Poste non renseigné.');
    if (!data.dateNaissance || !data.dateEntree) issue(rowNumber, 'dates', 'Date de naissance ou d’entrée manquante.');
    if (data.emailPro && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailPro)) issue(rowNumber, 'emailPro', 'Adresse email à vérifier.');
    rows.push({ row: rowNumber, data, unusableFields });
  }
  const ids = new Map();
  for (const row of rows) { const k = key(row.data.matricule); if (!ids.has(k)) ids.set(k, []); ids.get(k).push(row.row); }
  for (const [matricule, duplicates] of ids) if (matricule && duplicates.length > 1) for (const row of duplicates) issue(row, 'matricule', `Matricule en doublon aux lignes ${duplicates.join(', ')}. Corriger ou exclure ces lignes.`, 'error');
  if (!rows.length) throw new Error('Aucune ligne d’agent à importer.');
  return { sheetName, fileHash: crypto.createHash('sha256').update(buffer).digest('hex'), rows, excluded, issues, ignoredColumns, ignoredSheets: workbook.SheetNames.filter((name) => name !== sheetName) };
}
module.exports = { text, key, dateValue, parseWorkbook };
