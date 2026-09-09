const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const {
  requireAuditAccess,
  getAuditLogs,
  getAuditLog,
  getAuditLogStats,
} = require("../controllers/auditLogController");

router.use(protect, requireAuditAccess);

router.route("/").get(getAuditLogs);
router.route("/stats").get(getAuditLogStats);
router.route("/:id").get(getAuditLog);

module.exports = router;
