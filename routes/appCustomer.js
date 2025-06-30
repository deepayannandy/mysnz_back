const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const appCustomerModel = require("../models/appCustomerModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const verify_token = require("../validators/verifyToken");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "otp.cuekeeper@gmail.com",
    pass: process.env.SECREAT_TOKEN,
  },
  port: 465,
  host: "smtp.gmail.com",
});

function generateNumericOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString(); // Ensure it's a string
}

router.post("/", async (req, res) => {
  const sameCustomers = await appCustomerModel.findOne({
    $or: [{ contact: req.body.contact ?? "" }, { email: req.body.email ?? "" }],
  });
  console.log(sameCustomers);
  if (sameCustomers)
    return res.status(400).send({
      message: `${req.body.contact} or ${
        req.body.email ? req.body.email : "Email"
      } already exist`,
    });

  const newCustomer = new appCustomerModel({
    fullName: req.body.fullName,
    contact: req.body.contact,
    email: req.body.email,
    credit: 0,
    maxCredit: 999,
    dob: req.body.dob,
    profileImage: req.body.profileImage,
    rewardPoint: !req.body.rewardPoint > 0 ? req.body.rewardPoint : 0,
    coin: !req.body.coin > 0 ? req.body.coin : 0,
    isBlackListed: false,
    isDeleted: false,
    address: req.body.address,
    long: req.body.long,
    lat: req.body.lat,
  });
  try {
    const cli = await newCustomer.save();
    res.status(201).json({ _id: cli.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/generateOTP/", async (req, res) => {
  const selectedCustomer = await appCustomerModel.findOne({
    $or: [{ contact: req.body.userid }, { email: req.body.userid }],
  });
  if (!selectedCustomer)
    return res.status(400).send({
      message: `${req.body.userid} does not exist`,
    });
  try {
    let fiveMinutesLater = new Date();
    fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 5); // Adds 5 minutes to the new Date object

    selectedCustomer.OTP = generateNumericOTP();
    selectedCustomer.otpExpire = fiveMinutesLater;
    // Add the code to send the otp via mail / phone
    let mailOptions = {
      from: "otp.cuekeeper@gmail.com", // Sender address
      to: selectedCustomer.email, // List of recipients
      subject: "Cuekeeper|| Your one-time-password", // Subject line
      html: `<p>Your onetime password is : ${selectedCustomer.OTP}</p>`, // HTML body
    };
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      const cli = await selectedCustomer.save();
      return res
        .status(201)
        .json({ message: `OTP sent to ${req.body.userid}` });
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/validateOTP/", async (req, res) => {
  const selectedCustomer = await appCustomerModel.findOne({
    $or: [{ contact: req.body.userid ?? "" }, { email: req.body.userid ?? "" }],
  });
  if (!selectedCustomer)
    return res.status(400).send({
      message: `${req.body.userid} does not exist`,
    });
  try {
    let token = "";
    if (
      selectedCustomer.OTP === req.body.otp &&
      new Date().getTime() < selectedCustomer.otpExpire.getTime()
    ) {
      //add code to generate token
      token = jwt.sign(
        {
          _id: selectedCustomer._id,
          loginTime: new Date(),
        },
        process.env.SECREAT_TOKEN
      );
    } else {
      return res.status(401).json({ message: "Invalid OTP, Please try again" });
    }
    selectedCustomer.OTP = null;
    selectedCustomer.otpExpire = null;
    const cli = await selectedCustomer.save();
    return res.status(201).json({ message: `Login Successful`, token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/whoAmI/", verify_token, async (req, res) => {
  console.log(req.tokendata);
  try {
    const selectedCustomer = await appCustomerModel.findById(req.tokendata);
    if (!selectedCustomer)
      return res.status(400).send({
        message: `User does not exist`,
      });
    return res.status(201).json(selectedCustomer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
module.exports = router;
