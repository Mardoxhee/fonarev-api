const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createCandidature,
    getAllCandidatures,
    getOneCandidature,
    updateCandidature,
    deleteCandidature,

  } = require("../controllers/candidatureSpontController");

  router.route("/").get(protect, getAllCandidatures).post(createCandidature);
  router.get("/admin/all", protect, getAllCandidatures);
  router
  .route("/:id")
  .get(protect, getOneCandidature)
  .patch(protect, updateCandidature)
  .delete(protect, deleteCandidature);


module.exports = router;
