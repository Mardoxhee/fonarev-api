const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createNd,
    getAllNd,
    getOneNd,
    updateNd,
    deleteNd,

  } = require("../controllers/noteDebitController");

  router.route("/").get(protect, getAllNd).post(protect, createNd);
  router
  .route("/:id")
  .get(getOneNd)
  .patch(updateNd)
  .delete(deleteNd);


module.exports = router;