const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const asyncHandler = require("express-async-handler");

module.exports = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) {
    res.status(400);
    throw new Error("Bad request in not sending token!");
  }

  if (!auth.includes("Bearer")) {
    res.status(400);
    throw new Error("Bad request on header sending token!");
  }

  const token = auth.split("Bearer ")[1];
  if (!token) {
    res.status(400);
    throw new Error("No token found!");
  }

  var path = __dirname.split("/");
  path[path.length - 1] = "controllers";

  const secret = await fs.readFile(path.join("/") + "/secret.public");
  var decoded = await jwt.verify(token, secret);

  if (!decoded) {
    res.status(400);
    throw new Error("Token is invalid!");
  }

  req.user = decoded.user;
  next();
});
