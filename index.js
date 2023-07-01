const { ApiError } = require("@google-cloud/storage/build/src/nodejs-common");
const express = require("express");

require("dotenv").config();

const port = process.env.PORT || 9001;

const app = express();

app.use(express.json());
app.use("/api/auth", require("./routers/userRouter"));
app.use("/api/image", require("./routers/imageRouter"));

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
