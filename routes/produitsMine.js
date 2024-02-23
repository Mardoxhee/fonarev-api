const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,

  } = require("../controllers/produitsMine");

  router.route("/").get(protect, getAllProducts).post(protect, createProduct);
  router
  .route("/:id")
  .get(getOneProduct)
  .patch(updateProduct)
  .delete(deleteProduct);


module.exports = router;