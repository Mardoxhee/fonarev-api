const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createService,
    getAllServices,
    getOneService,
    updateService,
    deleteService,

  } = require("../controllers/serviceController");

  router.route("/").get(protect, getAllServices).post(protect, createService);
  router
  .route("/:id")
  .get(getOneService)
  .patch(protect, updateService)
  .delete(protect, deleteService);


module.exports = router;
