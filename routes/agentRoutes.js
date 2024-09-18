const express = require("express");
const router = express.Router();
const { protect } = require("./../controllers/authController");

const {
  createAgent,
  getAgents,
  getOneAgent,
  updateAgent,
  deleteAgent,
  getAgentByMatricule
} = require("../controllers/agentController");

// Route pour récupérer tous les agents et créer un nouvel agent
router.route("/").get(protect, getAgents).post(protect, createAgent);

// Route pour récupérer un agent par son matricule
router.route("/matricule/:matricule").get(getAgentByMatricule);

// Routes pour les opérations CRUD sur un agent spécifique par ID
router.route("/:id").get(getOneAgent).patch(updateAgent).delete(deleteAgent);

module.exports = router;
