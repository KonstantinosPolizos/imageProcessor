const sharp = require("sharp");
const { parentPort, workerData } = require("worker_threads");

const rgbImg = workerData.rgbImg;
const width = workerData.width;
const height = workerData.height;

sharp(rgbImg)
  .resize(width, height)
  .toBuffer((err, buffer, info) => {
    if (err) {
      throw new Error("Resizing issue image with Sharp!");
    }

    parentPort.postMessage(buffer);
  });
