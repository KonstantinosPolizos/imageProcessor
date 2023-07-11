const { PrismaClient } = require("@prisma/client");
const asyncHandler = require("express-async-handler");
const { Worker, workerData } = require("node:worker_threads");
const { createClient } = require("redis");

const prisma = new PrismaClient();
let redisClient;

(async () => {
  redisClient = new createClient();
  redisClient.on("error", (err) => {
    throw new Error(err);
  });

  await redisClient.connect();
})();

const editWorker = (rgbImg, width, height) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(process.env.FUNC_PATH + "resize.js", {
      workerData: {
        rgbImg: rgbImg,
        width: width,
        height: height,
      },
    });

    worker.on("message", (data) => resolve(data));
    worker.on("error", (error) => reject(error));
  });
};

const editResize = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { width, height } = req.body;

  if (!id || !width || !height) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }

  let cacheResult = await redisClient.get("rgbImg");
  let rgbImg;

  if (cacheResult) {
    rgbImg = JSON.parse(cacheResult);

    rgbImg.data = Buffer.from(rgbImg.data); // JSON doesn't supports Buffer
  } else {
    rgbImg = await prisma.images.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!rgbImg) {
      res.status(400);
      throw new Error("No image found!");
    }

    // correct approach but in our case we need the edited picture to be saved
    // await redisClient.set("rgbImg", JSON.stringify(rgbImg));
  }

  const workerImg = await editWorker(rgbImg.data, width, height);

  if (!workerImg) {
    res.status(400);
    throw new Error("Worker image gone wrong");
  }

  delete rgbImg.data; // Delete from the rgbImage the previous data

  rgbImg.data = Buffer.from(workerImg); // Bufferized the new edited one

  await redisClient.set("rgbImg", JSON.stringify(rgbImg), {
    EX: 30,
  }); // Cache it

  res.status(200).json({
    message: "ok edit",
  });
});

module.exports = {
  editResize,
};
