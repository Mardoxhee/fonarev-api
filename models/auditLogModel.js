const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    route: String,
    statusCode: {
      type: Number,
      index: true,
    },
    success: {
      type: Boolean,
      index: true,
    },
    durationMs: Number,
    actor: {
      account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", index: true },
      firstName: String,
      lastName: String,
      email: String,
      role: String,
    },
    resourceId: {
      type: String,
      index: true,
    },
    queryKeys: [String],
    paramKeys: [String],
    message: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ "actor.account": 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
