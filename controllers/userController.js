const asyncHandler = require("express-async-handler");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const nodemailer = require("nodemailer");

const createToken = asyncHandler(async (user, min) => {
  const secret = await fs.readFile(__dirname + "/secret.public", {
    encoding: "utf-8",
  });

  return jwt.sign(
    {
      user: {
        email: user.email,
        id: user.id,
      },
    },
    secret,
    { expiresIn: min + "min" }
  );
});

const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mendatory!");
  }

  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    res.status(404);
    throw new Error("No such user plz sign up");
  }

  const hashedPassword = user.password;

  if (!(await bcrypt.compare(password, hashedPassword))) {
    res.status(400);
    throw new Error("Wrong password!");
  }

  res.status(200).json({
    token: await createToken(user, 600),
  });
});

const signupHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mendatory");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);

  const prisma = new PrismaClient();

  const newUser = await prisma.user.create({
    data: {
      email: email,
      password: hashedPass,
    },
  });

  if (!newUser) {
    res.statu(400);
    throw new Error("Can't create this user or already exists!");
  }

  res.status(200).json({
    message: "User created!",
  });
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Sending the email is mendatory!");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    res.status(400);
    throw new Error("Couldn't find user in db!");
  }

  await transporter.sendMail({
    to: email, // list of receivers
    subject: "Hello ✔", // Subject line
    text: "token: " + (await createToken(user, 5)), // plain text body
  });

  res.status(200).json({
    message: "Email has been sent!",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { newPass, confirmPass } = req.body;

  if (!newPass || !confirmPass) {
    res.status(404);
    throw new Error("All fields are mendatory");
  }

  if (newPass != confirmPass) {
    res.status(400);
    throw new Error("New pass and confirmed pass must be the same!");
  }

  const user = req.user;

  if (!user) {
    res.status(400);
    throw new Error("Token is invalid!");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(newPass, salt);

  const prisma = new PrismaClient();

  const updateUser = await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      password: hashedPass,
    },
  });

  if (!updateUser) {
    res.status(400);
    throw new Error("Can't update the password server error!");
  }

  res.status(200).json({
    message: "Passowrd changed!",
  });
});

module.exports = { loginHandler, signupHandler, forgetPassword, resetPassword };
