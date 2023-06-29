const express = require("express");

require("dotenv").config();

const port = process.env.PORT || 9001;

const app = express();

app.use(express.json());
app.use("/api/user", require("./routes/userRoutes"));

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
