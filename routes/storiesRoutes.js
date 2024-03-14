const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createStories,
    getAllStories,
    getOneStory,
    updateStory,
    deleteStory,

  } = require("../controllers/storiesController");

  router.route("/").get(protect, getAllStories).post(protect, createStories);
  router
  .route("/:id")
  .get(getOneStory)
  .patch(updateStory)
  .delete(deleteStory);


module.exports = router;