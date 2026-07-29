const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
  createApplicationForm,
  getPublicApplicationForms,
  getAllApplicationForms,
  getOneApplicationForm,
  updateApplicationForm,
  deleteApplicationForm,
} = require("../controllers/applicationFormController");

router.route("/").get(getPublicApplicationForms).post(protect, createApplicationForm);
router.get("/admin/all", protect, getAllApplicationForms);
router.route("/:idOrSlug").get(getOneApplicationForm);
router.route("/:id").patch(protect, updateApplicationForm).delete(protect, deleteApplicationForm);

module.exports = router;
