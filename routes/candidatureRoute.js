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

  router.route("/").get(getAllCandidatures).post(createCandidature);
  router
  .route("/:id")
  .get(getOneCandidature)
  .patch(updateCandidature)
  .delete(deleteCandidature);


module.exports = router;