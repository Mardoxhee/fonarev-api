const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
  createMarche,
  getPublicMarches,
  getAllMarches,
  getLastMarches,
  getOneMarche,
  updateMarche,
  deleteMarche,
} = require("../controllers/marcheController");

router.route("/").get(getPublicMarches).post(protect, createMarche);
router.get("/last", getLastMarches);
router.get("/admin/all", protect, getAllMarches);
router.route("/:idOrSlug").get(getOneMarche);
router.route("/:id").patch(protect, updateMarche).delete(protect, deleteMarche);

module.exports = router;
