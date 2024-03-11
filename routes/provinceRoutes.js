const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createProvince,
    getAllProvinces,
    getOneProvince,
    updateProvince,
    deleteProvince,

  } = require("../controllers/provinceController");

  router.route("/").get(getAllProvinces).post(protect, createProvince);
  router
  .route("/:id")
  .get(getOneProvince)
  .patch(updateProvince)
  .delete(deleteProvince);


module.exports = router;