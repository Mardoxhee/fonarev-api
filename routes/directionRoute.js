const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createDirection,
    getDirections,
    getOneDiretion,
    updateDirection,
    deleteDirection,

  } = require("../controllers/directionController");

  router.route("/").get(protect, getDirections).post(protect, createDirection);
  router
  .route("/:id")
  .get(getOneDiretion)
  .patch(updateDirection)
  .delete(deleteDirection);


module.exports = router;