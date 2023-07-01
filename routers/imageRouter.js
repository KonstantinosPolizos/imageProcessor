const express = require("express");
const validateToken = require("../middlewares/validateToken");

const {
  getAllImages,
  getOneImage,
  postOneImage,
  updateOneImage,
  deleteOneImage,
  deleteAllImages,
} = require("../controllers/imageController");

const router = express.Router();

router.get("/", validateToken, getAllImages);
router.get("/:id", validateToken, getOneImage);
router.post("/", validateToken, postOneImage);
router.put("/:id", validateToken, updateOneImage);
router.delete("/:id", validateToken, deleteOneImage);
router.delete("/", validateToken, deleteAllImages);

module.exports = router;
