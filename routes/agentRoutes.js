const express = require("express");
const router = express.Router();
const { protect } = require("./../controllers/authController");

const {
    createAgent,
    getAgents,
    getOneAgent,
    updateAgent,
    deleteAgent,

  } = require("../controllers/agentController");

  router.route("/").get(protect, getAgents).post(protect, createAgent);
  router
  .route("/:id")
  .get(getOneAgent)
  .patch(updateAgent)
  .delete(deleteAgent);


module.exports = router;