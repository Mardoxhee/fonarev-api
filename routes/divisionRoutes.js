const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
  createDivision,
  getAllDivisions,
  getOneDivision,
  updateDivision,
  deleteDivision,
} = require("../controllers/divisionController");

router.route("/").get(protect, getAllDivisions).post(protect, createDivision);
router
  .route("/:id")
  .get(getOneDivision)
  .patch(protect, updateDivision)
  .delete(protect, deleteDivision);

module.exports = router;
