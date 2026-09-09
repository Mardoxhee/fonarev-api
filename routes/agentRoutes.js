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
const { getAgentDossier } = require("../controllers/documentController");
const {
  getAgentCareerEvents,
  createAgentCareerEvent,
  updateCareerEvent,
  deleteCareerEvent,
} = require("../controllers/careerEventController");
const {
  getAgentDisciplinaryEvents,
  createAgentDisciplinaryEvent,
  updateDisciplinaryEvent,
  deleteDisciplinaryEvent,
} = require("../controllers/disciplinaryEventController");

// Route pour récupérer tous les agents et créer un nouvel agent
router.route("/").get(protect, getAgents).post(protect, createAgent);

// Route pour récupérer un agent par son matricule
router.route("/matricule/:matricule").get(getAgentByMatricule);
router.route("/:agentId/dossier/checklist").get(protect, getAgentDossier);
router.route("/:agentId/career").get(protect, getAgentCareerEvents).post(protect, createAgentCareerEvent);
router.route("/:agentId/disciplinary").get(protect, getAgentDisciplinaryEvents).post(protect, createAgentDisciplinaryEvent);
router.route("/career/:eventId").patch(protect, updateCareerEvent).delete(protect, deleteCareerEvent);
router.route("/disciplinary/:eventId").patch(protect, updateDisciplinaryEvent).delete(protect, deleteDisciplinaryEvent);

// Routes pour les opérations CRUD sur un agent spécifique par ID
router.route("/:id").get(getOneAgent).patch(updateAgent).delete(deleteAgent);

module.exports = router;
