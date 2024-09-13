const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createPerson,
    getAllPersons,
    getOnePerson,
    updatePerson,
    deletePerson,

  } = require("../controllers/personneAchargeController");

  router.route("/").get(protect, getAllPersons).post(protect, createPerson);
  router
  .route("/:id")
  .get(getOnePerson)
  .patch(updatePerson)
  .delete(deletePerson);


module.exports = router;