const AuditLog = require("../models/auditLogModel");
const Account = require("../models/accountModel");

const allowedLogRoles = new Set(["admin", "rh", "drh", "dg", "superadmin", "administrateur"]);

const parseDate = (value, endOfDay = false) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

const buildQuery = (params) => {
  const query = {};

  if (params.module) query.module = String(params.module);
  if (params.action) query.action = String(params.action);
  if (params.method) query.method = String(params.method).toUpperCase();
  if (params.success !== undefined) query.success = String(params.success) === "true";
  if (params.statusCode) query.statusCode = Number(params.statusCode);
  if (params.actor) query["actor.account"] = params.actor;

  const from = parseDate(params.from);
  const to = parseDate(params.to, true);
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

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .populate("actor.account", "firstName lastName email role")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      status: "Success",
      numberOfLogs: logs.length,
      totalLogs,
      page,
      limit,
      logs,
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
      .populate("actor.account", "firstName lastName email role")
      .lean();

    if (!log) {
      return res.status(404).json({
        status: "failed",
        message: "Log introuvable",
      });
    }

    res.status(200).json({
      status: "Success",
      log,
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
