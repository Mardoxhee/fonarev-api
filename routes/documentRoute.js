const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createDocument,
    getAllDocuments,
    getOneDocument,
    updateDocument,
    deleteDocument,

  } = require("../controllers/documentController");

  router.route("/").get(protect, getAllDocuments).post(protect, createDocument);
  router
  .route("/:id")
  .get(getOneDocument)
  .patch(updateDocument)
  .delete(deleteDocument);


module.exports = router;