const asyncHandler = require("express-async-handler");
const https = require("node:https");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

const readHTTPImage = async (imageURL) => {
  return new Promise((resolve, reject) => {
    https.get(imageURL, resolve).on("error", reject);
  });
};

const bufferizeHTTPImage = async (response) => {
  return new Promise((resolve, reject) => {
    var chunks = [];

    response.on("data", (chunk) => {
      chunks.push(chunk);
    });

    response.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    response.on("error", reject);
  });
};

//controllers
const getAllImages = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    res.status(402);
    throw new Error("Unauthorized!");
  }

  const prisma = new PrismaClient();

  const userImages = await prisma.images.findMany({
    where: {
      userId: parseInt(user.id),
    },
  });

  if (!userImages) {
    throw new Error("DB issue couldn't return any!");
  }

  userImages.forEach((val, key) => {
    delete userImages[key].userId;
    delete userImages[key].createdAt;
    delete userImages[key].id;
  });

  res.status(200).json({ data: userImages });
});

const getOneImage = asyncHandler(async (req, res) => {
  const imageID = req.params.id;

  if (!imageID) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }

  const prisma = new PrismaClient();

  const user = req.user;

  if (!user) {
    res.status(402);
    throw new Error("Unauthorized");
  }

  const imageInfo = await prisma.images.findUnique({
    where: {
      id: parseInt(imageID),
    },
  });

  if (!imageInfo) {
    throw new Error("Bad response from db!");
  }

  if (imageInfo.userId != parseInt(user.id)) {
    res.status(402);
    throw new Error("Unauthorized for this pic!");
  }

  delete imageInfo.userId;
  delete imageInfo.createdAt;
  delete imageInfo.id;

  res.status(200).json({ data: imageInfo });
});

const postOneImage = asyncHandler(async (req, res) => {
  const { name, img } = req.body;

  if (!name || !img) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }

  const imageReadResp = await readHTTPImage(img);

  if (!imageReadResp) {
    res.status(403);
    throw new Error("Can't read this image!");
  }

  const imageBuffer = await bufferizeHTTPImage(imageReadResp);

  if (!imageBuffer) {
    res.status(400);
    throw new Error("Can't bufferize this image!");
  }

  const prisma = new PrismaClient();

  const user = req.user;

  if (!user) {
    res.status(403);
    throw new Error("Unauthorized user!");
  }

  const newImage = await prisma.images.create({
    data: {
      name: name + ".png",
      data: imageBuffer,
      createdAt: new Date(),
      userId: user.id,
    },
  });

  if (!newImage) {
    throw new Error("Can't create new image!");
  }

  res.status(200).json({ message: "Image saved!" });
});

const updateOneImage = asyncHandler(async (req, res) => {
  const { name, img } = req.body;
  const imageId = req.params.id;

  if (!imageId) {
    res.status(400);
    throw new Error("Id is mendatory!");
  }

  const prisma = new PrismaClient();

  const imageDB = await prisma.images.findUnique({
    where: {
      id: parseInt(imageId),
    },
  });

  if (!imageDB) {
    throw new Error("Couldn't find from DB!");
  }

  if (imageDB.userId != req.user.id) {
    res.status(402);
    throw new Error("Unauthorized in this images");
  }

  var bufferedImg;
  if (img) {
    const response = await readHTTPImage(img);

    if (!response) {
      throw new Error("Couldn't read image url");
    }

    bufferedImg = await bufferizeHTTPImage(response);
    if (!bufferedImg) {
      throw new Error("Couldn't bufferized the image!");
    }
  }

  const updateImage = await prisma.images.update({
    where: {
      id: imageDB.id,
    },
    data: {
      name: name || imageDB.name,
      data: bufferedImg || imageDB.data,
    },
  });

  if (!updateImage) {
    throw new Error("Couldn't update in db!");
  }

  res.status(200).json({ message: `Updated image ${updateImage.name}` });
});

const deleteOneImage = asyncHandler(async (req, res) => {
  const imageID = req.params.id;

  if (!imageID) {
    res.status(400);
    throw new Error("Missing id!");
  }

  const prisma = new PrismaClient();

  const deletedImage = await prisma.images.delete({
    where: {
      id: parseInt(imageID),
    },
  });

  if (!deletedImage) {
    throw new Error("DB issue couldn't delete image!");
  }

  res.status(200).json({ message: "Image deleted" });
});

const deleteAllImages = asyncHandler(async (req, res) => {
  const prisma = new PrismaClient();

  const user = req.user;

  if (!user) {
    res.status(402);
    throw new Error("Unauthorized to delete!");
  }

  const deleteImages = await prisma.images.deleteMany({
    where: {
      userId: user.id,
    },
  });

  res.status(200).json({ message: "Deleted all images" });
});

module.exports = {
  getAllImages,
  getOneImage,
  postOneImage,
  updateOneImage,
  deleteOneImage,
  deleteAllImages,
};
