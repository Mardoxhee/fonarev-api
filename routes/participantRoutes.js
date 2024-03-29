const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createParticipant,
    getAllparticipants,
    getOneParticipant,
    updateParticipant,
    deleteAgent,

  } = require("../controllers/ParticipantController");

  router.route("/").get(protect, getAllparticipants).post(protect, createParticipant);
  router
  .route("/:id")
  .get(getOneParticipant)
  .patch(updateParticipant)
  .delete(deleteAgent);


module.exports = router;