const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  restrictTo,
  updateMyPassword,
} = require("./../controllers/authController");

const {
  createAccount,
  getAllAccounts,
  getAccount,
  updateAccount,
  resetAccountPassword,
  deleteAccount,
} = require("./../controllers/accountController");

const manageUsers = restrictTo("admin", "administrateur", "superadmin", "rh", "drh", "dg");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);
router.patch("/resetPassword", resetPassword);
router.patch("/me/password", protect, updateMyPassword);

router.route("/").get(protect, manageUsers, getAllAccounts).post(protect, manageUsers, createAccount);
router.patch("/:id/password", protect, manageUsers, resetAccountPassword);
router.route("/:id").get(protect, manageUsers, getAccount).patch(protect, manageUsers, updateAccount).delete(protect, manageUsers, deleteAccount);

module.exports = router;
