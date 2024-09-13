const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createGrade,
    getAllGrades,
    getOneGrade,
    updateGrade,
    deleteGrade,

  } = require("../controllers/gradeController");

  router.route("/").get(protect, getAllGrades).post(protect, createGrade);
  router
  .route("/:id")
  .get(getOneGrade)
  .patch(updateGrade)
  .delete(deleteGrade);


module.exports = router;