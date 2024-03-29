const jwt = require("jsonwebtoken");
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

  const secret = process.env.SECRET;

  await jwt.verify(token, secret, (err, decoded) => {
    var expiredErr = err instanceof jwt.TokenExpiredError;
    if (err && expiredErr) {
      res.status(403);
      throw new Error("Token is expired!");
    }

    if (err && !expiredErr) {
      res.status(403);
      throw new Error("Token is invalid!");
    }

    req.user = decoded.user;
  });

  next();
});
