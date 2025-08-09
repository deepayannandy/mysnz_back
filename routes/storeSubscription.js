const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const subscriptionModel = require("../models/subscriptionModel");
const storeSubscriptionModel = require("../models/storeSubscriptionModel");
const storeModel = require("../models/storesModel");
const verifyToken = require("../validators/verifyToken");
const userModel = require("../models/userModel");

router.post("/", verifyToken, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  // if(loggedInUser.storeId!=req.body.storeId) return res.status(403).json({message:"You are not allowed to perform a subscription renewal for this store"})
  let store = await storeModel.findById({ _id: req.body.storeId });
  if (!store) return res.status(400).send({ message: "Store dose not exist!" });
  const activeSubs = await storeSubscriptionModel.findOne({
    $and: [{ isActive: true }, { storeId: req.body.storeId }],
  });
  const selectedSubs = await subscriptionModel.findById(
    req.body.subscriptionId
  );
  if (!selectedSubs)
    return res.status(400).send({ message: "Subscription dose not exist!" });
  console.log(selectedSubs);
  let StartDate = new Date();
  let EndDate = new Date();
  if (activeSubs) {
    activeSubs.isActive = false;
    await activeSubs.save();
    console.log(activeSubs.startDate);
    StartDate = activeSubs.endDate.setDate(activeSubs.endDate.getDate() + 1);
    EndDate = activeSubs.endDate.setDate(
      activeSubs.endDate.getDate() + selectedSubs.subscriptionValidity
    );
  } else {
    EndDate.setDate(EndDate.getDate() + selectedSubs.subscriptionValidity);
  }
  const storeSubs = new storeSubscriptionModel({
    storeId: req.body.storeId,
    isActive: true,
    subscriptionName: selectedSubs.subscriptionName,
    subscriptionId: req.body.subscriptionId,
    subscriptionValidity: selectedSubs.subscriptionValidity,
    startDate: StartDate,
    endDate: EndDate,
    isYearly: selectedSubs.isYearly,
    subscriptionAmount: selectedSubs.subscriptionPrice,
    transactionRef: req.body.transactionRef,
  });
  try {
    store.validTill = EndDate;
    await store.save();
    const newSSubs = await storeSubs.save();
    res.status(201).json({ _id: newSSubs.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:sid", async (req, res) => {
  try {
    const storeSubscriptions = await storeSubscriptionModel.find({
      storeId: req.params.sid,
    });
    res.status(201).json(storeSubscriptions.reverse());
  } catch {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
