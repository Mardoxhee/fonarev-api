const mongoose = require('mongoose');
const Agent = require('../models/agentModel');
const Direction = require('../models/directionModel');
const Grade = require('../models/gradeModel');
const Province = require('../models/provinceModel');
const { HrmsImport, HrmsImportLock } = require('../models/hrmsImportModel');
const { parseWorkbook } = require('../services/hrmsWorkbook');
const { buildPlan, fingerprint, id } = require('../services/hrmsPlan');

async function snapshot(session = null) {
  // Sequential reads are required inside a MongoDB transaction.
  const agents = await Agent.find({}).select('+hrmsFinance').sort('_id').session(session).lean();
  const directions = await Direction.find({}).sort('_id').session(session).lean();
  const grades = await Grade.find({}).sort('_id').session(session).lean();
  const provinces = await Province.find({}).sort('_id').session(session).lean();
  return { agents, directions, grades, provinces };
}
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function publicPlan(job) {
  const plan = job.plan;
  return {
    id: id(job), fileName: job.fileName, sheetName: job.sheetName, status: job.status, ready: plan.ready,
    summary: plan.summary, issues: plan.issues, references: plan.references,
    excluded: job.source.excluded, ignoredColumns: job.source.ignoredColumns, ignoredSheets: job.source.ignoredSheets,
    rows: plan.rows.map((r) => ({ row: r.row, matricule: r.data.matricule, noms: r.data.noms, prenom: r.data.prenom, direction: r.data.directionLabel, grade: r.data.grade, region: r.data.regionAffectation, matchBy: r.matchBy, photoPreserved: r.photoPreserved, action: r.agentId ? 'update' : 'create' })),
  };
}
exports.preview = async (req, res) => {
  try {
    const { workbook, fileName, corrections = [], excludedRows = [], mappings = {} } = req.body;
    if (typeof workbook !== 'string' || workbook.length > 7 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(workbook)) fail('Fichier Excel invalide ou supérieur à 5 Mo.');
    if (!Array.isArray(corrections) || !Array.isArray(excludedRows) || typeof mappings !== 'object' || mappings === null) fail('Options d’import invalides.');
    const buffer = Buffer.from(workbook, 'base64');
    if (buffer.length > 5 * 1024 * 1024) fail('Le fichier dépasse 5 Mo.');
    const parsed = parseWorkbook(buffer, { corrections, excludedRows });
    const current = await snapshot();
    const plan = buildPlan(parsed, current, mappings);
    await HrmsImportLock.updateOne({ _id: 'agents' }, { $setOnInsert: { revision: 0 } }, { upsert: true });
    const job = await HrmsImport.create({ actor: req.account._id, fileName: String(fileName || 'HRMS.xlsx').slice(0, 200), sheetName: parsed.sheetName, fileHash: parsed.fileHash, fingerprint: fingerprint(current), plan, source: { excluded: parsed.excluded, ignoredColumns: parsed.ignoredColumns, ignoredSheets: parsed.ignoredSheets } });
    res.locals.auditAction = 'hrms_preview';
    res.locals.auditResourceId = job._id;
    res.json({ ...publicPlan(job), choices: { directions: current.directions.map((r) => ({ id: id(r), label: r.denomination })), grades: current.grades.map((r) => ({ id: id(r), label: r.libele })), provinces: current.provinces.map((r) => ({ id: id(r), label: r.nom || r.Province || r.province || '' })) } });
  } catch (error) { res.status(error.status || 400).json({ message: error.message }); }
};
exports.commit = async (req, res) => {
  let session;
  try {
    if (!mongoose.isValidObjectId(req.params.importId)) fail('Import introuvable.', 404);
    if (req.body.confirm !== 'REMPLACER') fail('Confirmez le remplacement depuis l’aperçu.');
    session = await mongoose.startSession();
    let outcome;
    await session.withTransaction(async () => {
      await HrmsImportLock.updateOne({ _id: 'agents' }, { $inc: { revision: 1 } }, { session });
      const job = await HrmsImport.findById(req.params.importId).session(session);
      if (!job || id(job.actor) !== id(req.account)) fail('Import introuvable pour cet utilisateur.', 404);
      if (job.status === 'applied') { outcome = { ...job.plan.summary, importId: id(job), appliedAt: job.appliedAt }; return; }
      if (job.expiresAt < new Date()) fail('L’aperçu a expiré. Relancez l’analyse.', 409);
      if (!job.plan.ready) fail('Corrigez ou excluez les lignes bloquantes avant de remplacer les agents.');
      const current = await snapshot(session);
      if (fingerprint(current) !== job.fingerprint) fail('La base a changé depuis l’aperçu. Relancez l’analyse avant de remplacer les agents.', 409);
      if (Buffer.byteLength(JSON.stringify(current)) > 10 * 1024 * 1024) fail('La sauvegarde dépasse la limite de cet import. Aucune donnée modifiée.');
      const references = new Map();
      for (const ref of job.plan.references) {
        let targetId = ref.id;
        if (ref.action === 'create') {
          const model = ref.kind === 'directions' ? Direction : Grade;
          const attrs = ref.kind === 'directions' ? { denomination: ref.label, description: ref.label } : { libele: ref.label };
          const [created] = await model.create([attrs], { session });
          targetId = id(created);
        }
        references.set(`${ref.kind}:${ref.source}`, { id: targetId, label: ref.label });
      }
      const timestamp = new Date();
      const operations = [];
      for (const row of job.plan.rows) {
        const { directionLabel, grade, numeroCNSS, numeroCompte, banque, emailPro, ...fields } = row.data;
        const direction = references.get(`directions:${row.direction}`);
        const gradeRef = references.get(`grades:${row.grade}`);
        const existing = row.agentId ? current.agents.find((a) => id(a) === row.agentId) : null;
        const update = {
          ...fields, postnom: '', grade: gradeRef?.label || grade || '', direction: direction?.id,
          province: row.province || null,
          emailPro: /@fonarev\.cd$/i.test(emailPro) ? emailPro : '',
          emailPerso: emailPro && !/@fonarev\.cd$/i.test(emailPro) ? emailPro : existing?.emailPerso || '',
          hrmsFinance: { numeroCNSS: row.unusableFields?.includes('numeroCNSS') ? existing?.hrmsFinance?.numeroCNSS || '' : numeroCNSS, numeroCompte: row.unusableFields?.includes('numeroCompte') ? existing?.hrmsFinance?.numeroCompte || '' : numeroCompte, banque },
          hrmsArchived: false, hrmsArchivedAt: null,
          hrmsImport: { batch: job._id, row: row.row, importedAt: timestamp },
        };
        if (existing && id(existing.direction) !== direction?.id) { update.division = null; update.serviceRef = null; update.service = ''; }
        // Photos, documents, statuses, career history and dependent records are never overwritten.
        const validated = new Agent({ ...(existing || {}), ...update, statut: existing?.statut || 'Actif' });
        await validated.validate();
        if (row.agentId) operations.push({ updateOne: { filter: { _id: row.agentId }, update: { $set: update } } });
        else operations.push({ insertOne: { document: validated.toObject() } });
      }
      await Agent.bulkWrite(operations, { session, ordered: true });
      if (job.plan.archiveIds.length) await Agent.updateMany({ _id: { $in: job.plan.archiveIds } }, { $set: { hrmsArchived: true, hrmsArchivedAt: timestamp } }, { session });
      job.backup = current;
      job.status = 'applied'; job.appliedAt = timestamp; job.expiresAt = undefined;
      await job.save({ session });
      outcome = { ...job.plan.summary, importId: id(job), appliedAt: timestamp };
    });
    res.locals.auditAction = 'hrms_replace';
    res.locals.auditResourceId = req.params.importId;
    res.locals.auditMessage = `${outcome.imported} lignes importées, ${outcome.archived} agents archivés.`;
    res.json({ status: 'success', result: outcome });
  } catch (error) {
    const transactionUnavailable = /Transaction numbers|replica set|mongos/i.test(error.message);
    res.status(error.status || 400).json({ message: transactionUnavailable ? 'Cette base ne permet pas un remplacement transactionnel. Aucune donnée n’a été remplacée. Configurez MongoDB en replica set.' : error.message });
  } finally { if (session) await session.endSession(); }
};
exports.getFinance = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select('+hrmsFinance');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable.' });
    res.json({ finance: agent.hrmsFinance || null });
  } catch { res.status(400).json({ message: 'Données administratives indisponibles.' }); }
};

exports.updateFinance = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant agent invalide.' });
    const fields = ['banque', 'numeroCompte', 'numeroCNSS'];
    const updates = {};
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, field)) continue;
      if (typeof req.body[field] !== 'string' || req.body[field].length > 200) {
        return res.status(400).json({ message: 'Les coordonnées doivent être du texte de 200 caractères maximum.' });
      }
      updates[`hrmsFinance.${field}`] = req.body[field].trim();
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'Aucune coordonnée à modifier.' });
    const agent = await Agent.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('+hrmsFinance');
    if (!agent) return res.status(404).json({ message: 'Agent introuvable.' });
    res.locals.auditAction = 'update_finance';
    res.locals.auditResourceId = agent._id;
    res.json({ finance: agent.hrmsFinance || null });
  } catch { res.status(400).json({ message: 'Impossible de modifier les coordonnées bancaires.' }); }
};
