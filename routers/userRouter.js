const express = require("express");
const validationToken = require("../middlewares/validateToken");
const {
  loginHandler,
  signupHandler,
  forgetPassword,
  resetPassword,
} = require("../controllers/userController");

const router = express.Router();

router.post("/login", loginHandler);
router.post("/signup", signupHandler);
router.post("/forget", forgetPassword);
router.put("/reset", validationToken, resetPassword);

module.exports = router;
