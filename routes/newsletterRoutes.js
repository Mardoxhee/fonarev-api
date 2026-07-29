const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
  createNewsletter,
  getPublicNewsletters,
  getAllNewsletters,
  getLastNewsletter,
  getOneNewsletter,
  updateNewsletter,
  deleteNewsletter,
} = require("../controllers/newsletterController");

router.route("/").get(getPublicNewsletters).post(protect, createNewsletter);
router.get("/last", getLastNewsletter);
router.get("/admin/all", protect, getAllNewsletters);
router.route("/:idOrSlug").get(getOneNewsletter);
router.route("/:id").patch(protect, updateNewsletter).delete(protect, deleteNewsletter);

module.exports = router;
