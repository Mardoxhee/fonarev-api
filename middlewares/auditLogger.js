const AuditLog = require("../models/auditLogModel");
const Account = require("../models/accountModel");

const methodActions = {
  GET: "read",
  POST: "create",
  PUT: "replace",
  PATCH: "update",
  DELETE: "delete",
};

const objectIdPattern = /^[a-f\d]{24}$/i;

const getModuleFromPath = (path = "") => {
  const cleanPath = path.split("?")[0].replace(/^\/+/, "");
  return cleanPath.split("/")[0] || "root";
};

const getSanitizedPath = (path = "") => path.split("?")[0] || "/";

const getActorId = (req, res) => {
  const actor = res.locals.auditActor || req.decoded || req.user || {};
  const rawId = actor.id || actor._id || actor.accountId || actor.account || actor.user?.id || actor.user?._id;
  return rawId ? String(rawId) : undefined;
};

const buildActor = async (req, res) => {
  const localActor = res.locals.auditActor || {};
  const actorId = getActorId(req, res);
  const canUseAccountId = actorId && objectIdPattern.test(actorId);
  if (!actorId) {
    return {
      firstName: localActor.firstName,
      lastName: localActor.lastName,
      email: localActor.email,
      role: localActor.role,
    };
  }

  try {
    const account = canUseAccountId ? await Account.findById(actorId).select("firstName lastName email role") : null;
    if (!account) {
      return {
        account: canUseAccountId ? actorId : undefined,
        firstName: localActor.firstName,
        lastName: localActor.lastName,
        email: localActor.email,
        role: localActor.role,
      };
    }

    return {
      account: account._id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    };
  } catch {
    return {
      account: canUseAccountId ? actorId : undefined,
      firstName: localActor.firstName,
      lastName: localActor.lastName,
      email: localActor.email,
      role: localActor.role,
    };
  }
};

const shouldSkip = (req) => {
  if (req.method === "OPTIONS") return true;
  if (req.originalUrl.startsWith("/logs") && process.env.AUDIT_LOG_LOG_READS !== "true") return true;
  return false;
};

const auditLogger = (req, res, next) => {
  if (shouldSkip(req)) return next();

  const startedAt = Date.now();
  res.on("finish", () => {
    setImmediate(async () => {
      try {
        const moduleName = res.locals.auditModule || getModuleFromPath(req.originalUrl);
        const action = res.locals.auditAction || methodActions[req.method] || req.method.toLowerCase();
        const actor = await buildActor(req, res);
        const resourceId = res.locals.auditResourceId || req.params?.id || req.params?.agentId || req.params?.eventId || req.params?.idOrSlug;

        await AuditLog.create({
          action,
          module: moduleName,
          method: req.method,
          path: getSanitizedPath(req.originalUrl),
          route: req.route?.path,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          durationMs: Date.now() - startedAt,
          actor,
          resourceId: resourceId ? String(resourceId) : undefined,
          queryKeys: Object.keys(req.query || {}),
          paramKeys: Object.keys(req.params || {}),
          message: res.locals.auditMessage,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Audit log failed:", error.message);
        }
      }
    });
  });

  next();
};

module.exports = auditLogger;
