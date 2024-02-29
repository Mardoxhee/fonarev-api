const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createArticle,
    getAllArticles,
    getOneArticle,
    updateArticle,
    deleteArticle,

  } = require("../controllers/articlesController");

  router.route("/").get(getAllArticles).post(protect, createArticle);
  router
  .route("/:id")
  .get(getOneArticle)
  .patch(updateArticle)
  .delete(deleteArticle);


module.exports = router;