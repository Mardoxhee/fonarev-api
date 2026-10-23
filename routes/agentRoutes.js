const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("./../controllers/authController");

const {
  archiveAgent,
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

const hrmsImport = require('../controllers/hrmsImportController');
const importRoles = restrictTo('admin', 'administrateur', 'superadmin', 'rh', 'drh', 'dg');
router.post('/hrms-import/preview', protect, importRoles, hrmsImport.preview);
router.post('/hrms-import/:importId/commit', protect, importRoles, hrmsImport.commit);
const contract = require('../controllers/agentContractController');
router.post('/:id/fin-contrat', protect, importRoles, contract.endContract);
router.get('/:id/salaire-net-acquis', protect, importRoles, contract.getSalary);
router.patch('/:id/salaire-net-acquis', protect, importRoles, contract.updateSalary);
router.patch('/:id/archive', protect, importRoles, archiveAgent);
router.get('/:id/hrms-finance', protect, importRoles, hrmsImport.getFinance);
router.patch('/:id/hrms-finance', protect, importRoles, hrmsImport.updateFinance);

router.get('/matricule-preview', protect, require('../controllers/agentController').previewMatricule);

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
router.route("/:id").get(getOneAgent).patch(protect, importRoles, updateAgent).delete(deleteAgent);

module.exports = router;
