const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");

const {
    createDirection,
    getAllDirections,
    getOneDirection,
    updateDirection,
    deleteDirection,

  } = require("../controllers/directionController");

  const transfer = require('../controllers/directionTransferController');
  router.get('/:id/dependencies', protect, transfer.dependencies);
  router.post('/:id/transfer-and-delete', protect, transfer.transferAndDelete);
  router.route("/").get(protect,getAllDirections,
    ).post(protect, createDirection);
  router
  .route("/:id")
  .get(getOneDirection)
  .patch(protect, updateDirection)
  .delete(protect, deleteDirection);


module.exports = router;
