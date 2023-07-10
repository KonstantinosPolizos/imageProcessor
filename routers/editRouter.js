const express = require("express");

const { editResize } = require("../controllers/editController");
const validateToken = require("../middlewares/validateToken");

const router = express.Router();

router.put("/resize/:id", validateToken, editResize);

module.exports = router;
