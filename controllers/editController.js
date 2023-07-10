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
    //json don't supports Buffer
    rgbImg.data = Buffer.from(rgbImg.data);
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

    await redisClient.set("rgbImg", JSON.stringify(rgbImg));
  }

  const workerImg = await editWorker(rgbImg.data, width, height);

  if (!workerImg) {
    res.status(400);
    throw new Error("Worker image gone wrong");
  }

  const addResizedImg = await prisma.images.update({
    where: {
      id: parseInt(id),
    },
    data: {
      data: Buffer.from(workerImg),
    },
  });

  res.status(200).json({
    message: "ok edit",
  });
});

module.exports = {
  editResize,
};
