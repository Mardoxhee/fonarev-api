const AuditLog = require("../models/auditLogModel");
const Account = require("../models/accountModel");

const allowedLogRoles = new Set(["admin", "rh", "drh", "dg", "superadmin", "administrateur"]);

const parseDate = (value, endOfDay = false) => {
  if (!value) return undefined;
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(`${text}T12:00:00Z`).toISOString().slice(0, 10) !== text) throw new Error('Date invalide (AAAA-MM-JJ attendu).');
  // Audit calendar dates are interpreted in Africa/Kinshasa (UTC+01).
  return new Date(`${text}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+01:00`);
};
const SsoAccount = require('../models/sso360Model');
async function hydrateActors(logs) {
  const ids = [...new Set(logs.map(log => log.actor?.account).filter(Boolean).map(String))];
  if (!ids.length) return logs;
  const fields = 'firstName lastName email role';
  const [local, sso] = await Promise.all([Account.find({ _id: { $in: ids } }).select(fields).lean(), SsoAccount.find({ _id: { $in: ids } }).select(fields).lean()]);
  const accounts = new Map([...local, ...sso].map(account => [String(account._id), account]));
  return logs.map(log => {
    const account = accounts.get(String(log.actor?.account));
    if (!account) return log;
    const actor = { ...log.actor };
    for (const field of ['firstName', 'lastName', 'email', 'role']) if (!actor[field]) actor[field] = account[field];
    return { ...log, actor };
  });
}

const buildQuery = (params) => {
  const query = {};

  if (params.module) query.module = String(params.module);
  if (params.action) query.action = String(params.action);
  if (params.method) query.method = String(params.method).toUpperCase();
  if (params.success !== undefined && params.success !== "") query.success = String(params.success) === "true";
  if (params.statusCode) {
    const status = Number(params.statusCode);
    if (!Number.isInteger(status) || status < 100 || status > 599) throw new Error('Code HTTP invalide.');
    query.statusCode = status;
  }
  if (params.actor) query["actor.account"] = params.actor;

  const from = parseDate(params.from);
  const to = parseDate(params.to, true);
  if (from && to && from > to) throw new Error('La date de début doit précéder la date de fin.');
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  if (params.search) {
    const regex = new RegExp(String(params.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { path: regex },
      { module: regex },
      { action: regex },
      { message: regex },
      { "actor.firstName": regex },
      { "actor.lastName": regex },
      { "actor.email": regex },
      { "actor.role": regex },
      { resourceId: regex },
    ];
  }

  return query;
};

exports.requireAuditAccess = async (req, res, next) => {
  if (req.hrmAccess) return next();
  try {
    const accountId = req.decoded?.id || req.decoded?._id || req.user?.id || req.user?._id;
    const account = accountId ? await Account.findById(accountId).select("role") : null;
    const role = String(account?.role || "").trim().toLowerCase();

    if (!allowedLogRoles.has(role)) {
      return res.status(403).json({
        status: "failed",
        message: "Vous n'avez pas la permission de consulter les logs.",
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const query = buildQuery(req.query);
    if (req.query.actorSearch) {
      const regex = new RegExp(String(req.query.actorSearch).slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'i');
      const match = { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] };
      const [local, sso] = await Promise.all([Account.find(match).select('_id').lean(), SsoAccount.find(match).select('_id').lean()]);
      query.$and = [{ $or: [{ 'actor.firstName': regex }, { 'actor.lastName': regex }, { 'actor.email': regex }, { 'actor.account': { $in: [...local, ...sso].map(a => a._id) } }] }];
    }

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      status: "Success",
      numberOfLogs: logs.length,
      totalLogs,
      page,
      limit,
      logs: await hydrateActors(logs),
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .lean();

    if (!log) {
      return res.status(404).json({
        status: "failed",
        message: "Log introuvable",
      });
    }

    res.status(200).json({
      status: "Success",
      log: (await hydrateActors([log]))[0],
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

exports.getAuditLogStats = async (req, res) => {
  try {
    const query = buildQuery(req.query);
    if (req.query.actorSearch) {
      const regex = new RegExp(String(req.query.actorSearch).slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'i');
      const match = { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] };
      const [local, sso] = await Promise.all([Account.find(match).select('_id').lean(), SsoAccount.find(match).select('_id').lean()]);
      query.$and = [{ $or: [{ 'actor.firstName': regex }, { 'actor.lastName': regex }, { 'actor.email': regex }, { 'actor.account': { $in: [...local, ...sso].map(a => a._id) } }] }];
    }
    const [byModule, byAction, byUser, totalLogs, failures] = await Promise.all([
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$module", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$action", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$actor.account",
            total: { $sum: 1 },
            firstName: { $first: "$actor.firstName" },
            lastName: { $first: "$actor.lastName" },
            email: { $first: "$actor.email" },
            role: { $first: "$actor.role" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 20 },
      ]),
      AuditLog.countDocuments(query),
      AuditLog.countDocuments({ ...query, success: false }),
    ]);

    res.status(200).json({
      status: "Success",
      totalLogs,
      failures,
      byModule,
      byAction,
      byUser,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};
