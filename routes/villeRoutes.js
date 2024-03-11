const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createVille,
    getAllVilles,
    getOneVille,
    updateVille,
    deleteVille,

  } = require("../controllers/villeController");

  router.route("/").get(getAllVilles).post(protect, createVille);
  router
  .route("/:id")
  .get(getOneVille)
  .patch(updateVille)
  .delete(deleteVille);


module.exports = router;