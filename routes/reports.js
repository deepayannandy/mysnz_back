const express = require("express");
const router = express.Router();
const storeModel = require("../models/storesModel");
const customerHistoryModel = require("../models/customerHistoryModel");
const orderHistoryModel = require("../models/orderHistoryModel");
const customerModel = require("../models/customersModel");
const userModel = require("../models/userModel");
const historyModel = require("../models/historyModel");
const verify_token = require("../validators/verifyToken");
const dailyReportModel = require("../models/dailyReportModel");

router.get("/transactionReport/:storeId/", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  console.log(req.query.startDate, req.query.endDate, req.params.storeId);
  let allTransactions;
  if (req.query.startDate == undefined || req.query.endDate == undefined) {
    console.log("All data");
    allTransactions = await customerHistoryModel.find({
      $and: [{ storeId: req.params.storeId }, { isDeleted: { $ne: true } }],
    });
  } else {
    console.log("custom date range");
    const today = new Date();
    const startDate = new Date(req.query.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999);
    console.log(today, startDate, endDate);
    allTransactions = await customerHistoryModel.find({
      $and: [
        {
          date: {
            $gt: startDate,
            $lt: endDate,
          },
        },
        {
          storeId: req.params.storeId,
        },
      ],
    });
  }
  let netAmount = 0;
  let discount = 0;
  let dues = 0;
  let cash = 0;
  let card = 0;
  let upi = 0;
  let gems = 0;
  for (let i in allTransactions) {
    console.log(allTransactions[i]);
    netAmount =
      netAmount +
      (allTransactions[i].netPay > 0 ? allTransactions[i].netPay : 0);
    dues = dues + allTransactions[i].due ?? 0;
    discount =
      discount +
      (allTransactions[i].discount > 0 ? allTransactions[i].discount : 0);
    if (allTransactions[i].description.toLowerCase().includes("pay dues")) {
      dues = dues - allTransactions[i].paid ?? 0;
    }
    if (
      allTransactions[i].description.toLowerCase().includes("cash") ||
      allTransactions[i].description.toLowerCase().includes("meal order")
    ) {
      cash = cash + allTransactions[i].paid ?? 0;
    }
    if (allTransactions[i].description.toLowerCase().includes("card")) {
      card = card + allTransactions[i].paid ?? 0;
    }
    if (allTransactions[i].description.toLowerCase().includes("upi")) {
      upi = upi + allTransactions[i].paid ?? 0;
    }
  }

  res.status(201).json({
    allTransaction: allTransactions.reverse(),
    netAmount: netAmount.toFixed(2),
    gems: gems.toFixed(2),
    upi: upi.toFixed(2),
    discount: discount.toFixed(2),
    cash: cash.toFixed(2),
    card: card.toFixed(2),
    dues: dues.toFixed(2),
  });
});
router.get("/collectionReport/:sId", async (req, res) => {
  console.log(">>>", req.params.sId);
  try {
    const dailyReports = await dailyReportModel.find({
      storeId: req.params.sId,
    });
    res.status(201).json(dailyReports.reverse());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/duesReport/:sId", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  console.log(req.query.startDate, req.query.endDate, req.params.sId);
  try {
    if (req.query.startDate == undefined || req.query.endDate == undefined) {
      const dues = await historyModel.find({
        $and: [{ storeId: req.params.sId }, { credit: { $gt: 0 } }],
      });
      res.status(201).json(dues.reverse());
    } else {
      console.log("custom date range");
      const today = new Date();
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      console.log(startDate, endDate);
      const dues = await historyModel.find({
        $and: [
          { storeId: req.params.sId },
          { credit: { $gt: 0 } },
          {
            date: {
              $gt: startDate,
              $lt: endDate,
            },
          },
        ],
      });
      res.status(201).json(dues.reverse());
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/cafeReport/:sId", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  console.log(req.query.startDate, req.query.endDate, req.params.sId);
  try {
    if (req.query.startDate == undefined || req.query.endDate == undefined) {
      const dues = await orderHistoryModel.find({
        $and: [{ storeId: req.params.sId }],
      });
      res.status(201).json(dues.reverse());
    } else {
      console.log("custom date range");
      const today = new Date();
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      console.log(startDate, endDate);
      const dues = await orderHistoryModel.find({
        $and: [
          { storeId: req.params.sId },
          {
            date: {
              $gt: startDate,
              $lt: endDate,
            },
          },
        ],
      });
      res.status(201).json(dues.reverse());
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
