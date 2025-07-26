const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createArticle,
    getAllArticles,
    getOneArticle,
    updateArticle,
    deleteArticle,
    getLastArticles
  } = require("../controllers/articlesController");

  router.route("/").get(getAllArticles).post(protect, createArticle);
  router.get("/last", getLastArticles);
  router
  .route("/:id")
  .get(getOneArticle)
  .patch(updateArticle)
  .delete(deleteArticle);


module.exports = router;