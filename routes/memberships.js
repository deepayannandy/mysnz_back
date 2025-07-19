const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const membershipModel = require("../models/membershipModel");
const userModel = require("../models/userModel");
const verify_token = require("../validators/verifyToken");

router.post("/", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });

  const newMembership = new membershipModel({
    membershipName: req.body.membershipName,
    type: req.body.type,
    balanceMinute: req.body.balanceMinute,
    validity: req.body.validity,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    amount: req.body.amount,
    dailyLimit: req.body.dailyLimit,
    cafeItems: req.body.cafeItems,
    storeId: loggedInUser.storeId,
    isVisible: true,
  });
  try {
    const membership = await newMembership.save();
    return res.status(201).json({ _id: membership.id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/:membershipId", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  const selectedMembership = await membershipModel.findById(
    req.params.membershipId
  );
  if (!selectedMembership)
    return res.status(500).json({ message: "Membership not found!" });
  if (req.body.balanceMinute != null) {
    selectedMembership.balanceMinute = req.body.balanceMinute;
  }
  if (req.body.validity != null) {
    selectedMembership.validity = req.body.validity;
  }
  if (req.body.startTime != null) {
    selectedMembership.startTime = req.body.startTime;
  }
  if (req.body.endTime != null) {
    selectedMembership.endTime = req.body.endTime;
  }
  if (req.body.amount != null) {
    selectedMembership.amount = req.body.amount;
  }
  if (req.body.dailyLimit != null) {
    selectedMembership.dailyLimit = req.body.dailyLimit;
  }
  if (req.body.cafeItems != null) {
    selectedMembership.cafeItems = req.body.cafeItems;
  }
  try {
    const updatedMembership = await selectedMembership.save();
    return res.status(201).json({ _id: updatedMembership.id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
router.get("/", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });

  try {
    const availableMemberships = await membershipModel.find({
      storeId: loggedInUser.storeId,
      isVisible: true,
    });
    return res.status(201).json(availableMemberships);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
router.delete("/:membershipId", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  const selectedMembership = await membershipModel.findById(
    req.params.membershipId
  );
  selectedMembership.isVisible = false;
  try {
    const updatedMembership = await selectedMembership.save();
    return res.status(201).json({ _id: updatedMembership.id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
module.exports = router;
