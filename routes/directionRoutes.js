const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createDirection,
    getAllDirections,
    getOneDirection,
    updateDirection,
    deleteDirection,

  } = require("../controllers/directionController");

  router.route("/").get(protect,getAllDirections,
    ).post(protect, createDirection);
  router
  .route("/:id")
  .get(getOneDirection)
  .patch(updateDirection)
  .delete(deleteDirection);


module.exports = router;