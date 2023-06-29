const express = require("express");

require("dotenv").config();

const port = process.env.PORT || 9001;

const app = express();

app.get("/api/users", (req, res) => {
  res.status(200).json({
    message: "Get all users!",
  });
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
