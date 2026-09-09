const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.use(protect, restrictTo("admin", "administrateur", "superadmin", "rh", "drh", "dg"));

router.route("/").get(getRoles).post(createRole);
router.route("/:id").get(getRole).patch(updateRole).delete(deleteRole);

module.exports = router;
