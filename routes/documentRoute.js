const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createDocument,
    getAllDocuments,
    getOneDocument,
    updateDocument,
    deleteDocument,
    getDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    getAgentDocuments,
    getAgentDossier,

  } = require("../controllers/documentController");

  router.route("/types").get(protect, getDocumentTypes).post(protect, createDocumentType);
  router.route("/types/:id").patch(protect, updateDocumentType).delete(protect, deleteDocumentType);
  router.route("/agent/:agentId").get(protect, getAgentDocuments);
  router.route("/agent/:agentId/dossier").get(protect, getAgentDossier);
  router.route("/").get(protect, getAllDocuments).post(protect, createDocument);
  router
  .route("/:id")
  .get(getOneDocument)
  .patch(updateDocument)
  .delete(deleteDocument);


module.exports = router;
