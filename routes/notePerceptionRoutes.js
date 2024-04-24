const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createNp,
    getAllNp,
    getOneNp,
    updateNotePerception,
    deleteNotePerception,

  } = require("../controllers/notePerceptionController");

  router.route("/").get(protect, getAllNp).post(protect, createNp);
  router
  .route("/:id")
  .get(getOneNp)
  .patch(updateNotePerception)
  .delete(deleteNotePerception);


module.exports = router;