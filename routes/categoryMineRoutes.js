const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createCategory,
    getAllCategories,
    getOneCategory,
    updateCategory,
    deleteCategory,

  } = require("../controllers/categoryMineController");

  router.route("/").get(protect, getAllCategories).post(protect, createCategory);
  router
  .route("/:id")
  .get(getOneCategory)
  .patch(updateCategory)
  .delete(deleteCategory);


module.exports = router;