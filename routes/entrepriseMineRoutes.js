const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createEntrepriseMine,
    getAllEntrepriseMine,
    getOneEntreprise,
    updateEntrepriseMine,
    deleteEntrepriseMine,

  } = require("../controllers/entrepriseMine");

  router.route("/").get(protect, getAllEntrepriseMine).post(protect, createEntrepriseMine);
  router
  .route("/:id")
  .get(getOneEntreprise)
  .patch(updateEntrepriseMine)
  .delete(deleteEntrepriseMine);


module.exports = router;