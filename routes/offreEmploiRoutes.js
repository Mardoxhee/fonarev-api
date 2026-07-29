const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
  createOffreEmploi,
  getPublicOffresEmploi,
  getAllOffresEmploi,
  getLastOffresEmploi,
  getOneOffreEmploi,
  updateOffreEmploi,
  deleteOffreEmploi,
} = require("../controllers/offreEmploiController");

router.route("/").get(getPublicOffresEmploi).post(protect, createOffreEmploi);
router.get("/last", getLastOffresEmploi);
router.get("/admin/all", protect, getAllOffresEmploi);
router.route("/:idOrSlug").get(getOneOffreEmploi);
router.route("/:id").patch(protect, updateOffreEmploi).delete(protect, deleteOffreEmploi);

module.exports = router;
