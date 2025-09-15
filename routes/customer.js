const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const customerModel = require("../models/customersModel");
const storeModel = require("../models/storesModel");
const verify_token = require("../validators/verifyToken");
const userModel = require("../models/userModel");
const customerHistoryModel = require("../models/customerHistoryModel");
const membershipModel = require("../models/membershipModel");
const customerMembershipModel = require("../models/customerMembershipModel");

router.post("/", async (req, res) => {
  let store = await storeModel.findOne({ _id: req.body.storeId });
  if (!store) return res.status(400).send({ message: "Store dose not exist!" });
  console.log(req.body.contact, req.body.email, req.body.storeId);
  const sameCustomers = await customerModel.findOne({
    $and: [
      {
        $or: [
          { contact: req.body.contact ?? "" },
          { email: req.body.email ?? "" },
        ],
      },
      { storeId: req.body.storeId },
    ],
  });
  console.log(sameCustomers);
  if (sameCustomers)
    return res.status(400).send({
      message: `${req.body.contact} or ${
        req.body.email ? req.body.email : "Email"
      } already exist`,
    });

  const newCustomer = new customerModel({
    fullName: req.body.fullName,
    contact: req.body.contact,
    email: req.body.email,
    credit: req.body.oldCredit ?? 0,
    maxCredit: 999,
    dob: req.body.dob,
    profileImage: req.body.profileImage,
    rewardPoint: !req.body.rewardPoint > 0 ? req.body.rewardPoint : 0,
    coin: !req.body.coin > 0 ? req.body.coin : 0,
    storeId: req.body.storeId,
    isBlackListed: false,
    isDeleted: false,
    city: req.body.city,
  });
  try {
    const cli = await newCustomer.save();
    res.status(201).json({ _id: cli.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/byStore/:sid", async (req, res) => {
  try {
    const customers = await customerModel.find({
      storeId: req.params.sid,
      isDeleted: { $ne: true },
    });
    res.status(201).json(customers);
  } catch {
    res.status(500).json({ message: error.message });
  }
});
router.post("/upgradeToMember/", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  try {
    const customers = await customerModel.findById(req.body.customerId);
    if (!customers) return res.status(400).json({ message: "User not found" });
    const selectedMembership = await membershipModel.findById(
      req.body.membershipId
    );
    if (!selectedMembership)
      return res.status(400).json({ message: "Membership not found" });
    const startDate = new Date();
    const endDate = new Date().setDate(
      startDate.getDate() + selectedMembership.validity
    );
    const newCustomerMembership = new customerMembershipModel({
      membershipName: selectedMembership.membershipName,
      type: selectedMembership.type,
      balanceMinute: selectedMembership.balanceMinute,
      startTime: selectedMembership.startTime,
      endTime: selectedMembership.endTime,
      amount: selectedMembership.amount,
      dailyLimit: selectedMembership.dailyLimit,
      cafeItems: selectedMembership.cafeItems,
      storeId: selectedMembership.storeId,
      balanceMinuteLeft: selectedMembership.balanceMinute,
      startDay: startDate,
      endDay: endDate,
      customerId: customers._id,
    });
    // console.log(selectedMembership);
    // console.log(newCustomerMembership);
    const customerMembership = await newCustomerMembership.save();
    customers.membershipId = customerMembership._id;
    await customers.save();
    return res.status(201).json({ _id: customerMembership._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/blackListedCustomers/", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  try {
    const customers = await customerModel.find({
      isBlackListed: true,
      isDeleted: { $ne: true },
    });
    res.status(201).json(customers);
  } catch {
    res.status(500).json({ message: error.message });
  }
});

router.get("/myCustomers/", verify_token, async (req, res) => {
  //Need to fix this api
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  // console.log(loggedInUser)
  try {
    const customers = await customerModel.find({
      storeId: loggedInUser.storeId,
      isDeleted: { $ne: true },
    });
    var customer_final = [];
    // await customers.forEach(async (eachCustomer) => {
    //   if (eachCustomer.membershipId) {
    //     console.log(">>>Customer>>>>", eachCustomer.fullName);
    //     eachCustomer.membershipDetails = await customerMembershipModel.findById(
    //       eachCustomer.membershipId
    //     );
    //     console.log(">>>Done>>>>");
    //   }
    //   customer_final.push(eachCustomer);
    // });

    res.status(201).json(customers.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/myCustomers/:searchPar", verify_token, async (req, res) => {
  const loggedInUser = await userModel.findById(req.tokendata._id);
  if (!loggedInUser)
    return res
      .status(500)
      .json({ message: "Access Denied! Not able to validate the user." });
  // console.log(loggedInUser)
  try {
    console.log("search Par: " + req.params.searchPar);
    console.log("search Par: " + loggedInUser.storeId);
    const customers = await customerModel.find({
      $and: [
        { storeId: loggedInUser.storeId },
        { isDeleted: { $ne: true } },
        { fullName: { $regex: req.params.searchPar, $options: "i" } },
      ],
    });
    res.status(201).json(customers.reverse());
  } catch {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const customers = await customerModel.find();
    res.status(201).json(customers);
  } catch {
    res.status(500).json({ message: error.message });
  }
});
router.get("/:cid", async (req, res) => {
  try {
    const customers = await customerModel.findOne({ _id: req.params.cid });
    if (!customers)
      return res.status(400).send({ message: "Customer dose not exist!" });
    const customerHistory = await customerHistoryModel.find({
      customerId: customers._id,
    });
    let totalCredit = 0;
    let winner = 0;
    let orders = 0;
    let totalSpend = 0;
    let membershipData = null;
    const gameCount = customers.gamePlay;
    const hoursSpend = (customers.gameDuration / 36).toFixed(2);
    const membership = {
      membershipName: "NA",
      membershipMin: "0",
    };
    if (gameCount) winner = gameCount;
    for (let i in customerHistory) {
      console.log(customerHistory[i]);
      if (customerHistory[i].description.includes("Table"))
        winner = winner == 0 ? 0 : winner - 1;
      totalSpend =
        totalSpend +
        (customerHistory[i].paid != undefined ? customerHistory[i].paid : 0);
      if (
        customerHistory[i].description.includes("Meal") ||
        customerHistory[i].description.includes("Takeaway")
      )
        orders = orders + 1;
      // console.log(">>>> "+customerHistory[i].netPay, totalSpend)
    }
    totalSpend = (totalSpend - totalCredit).toFixed(2);
    if (totalSpend < 1) totalSpend = 0;

    if (customers.membershipId) {
      membershipData = await customerMembershipModel.findById(
        customers.membershipId
      );
    }
    return res.status(200).json({
      customers,
      membershipData,
      totalCredit,
      winner,
      orders,
      totalSpend,
      membership,
      hoursSpend,
      gameCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:cid", verify_token, async (req, res) => {
  console.log(req.tokendata._id);
  const User = await userModel.findOne({ _id: req.tokendata._id });
  if (!User) return res.status(400).send({ message: "User dose not exist!" });
  console.log(req.tokendata);
  // if(req.tokendata.userDesignation=="Staff")return res.status(500).json({message: "Access Denied!"})
  const customers = await customerModel.findOne({ _id: req.params.cid });
  if (!customers)
    return res.status(400).send({ message: "Customer dose not exist!" });

  if (req.body.fullName != null) {
    customers.fullName = req.body.fullName;
  }
  if (req.body.contact != null && customers.contact != req.body.contact) {
    const sameCustomers = await customerModel.findOne({
      $and: [{ contact: req.body.contact }, { storeId: customers.storeId }],
    });
    if (sameCustomers)
      return res
        .status(400)
        .send({ message: `${req.body.contact} already exist` });
    customers.contact = req.body.contact;
  }
  if (req.body.email != null && customers.email != req.body.email) {
    const sameCustomers = await customerModel.findOne({
      $and: [{ email: req.body.email }, { storeId: customers.storeId }],
    });
    if (sameCustomers)
      return res
        .status(400)
        .send({ message: `${req.body.email} already exist` });
    customers.email = req.body.email;
  }
  if (req.body.dob != null) {
    customers.dob = req.body.dob;
  }
  if (req.body.city != null) {
    customers.city = req.body.city;
  }
  if (req.body.isBlackListed != null) {
    if (User.storeId != customers.storeId)
      return res
        .status(403)
        .send({ message: "You cannot unblock this Customer!" });
    customers.isBlackListed = req.body.isBlackListed;
    if (customers.isBlackListed == true) {
      customers.dateOfBlackList = new Date();
      customers.reasonOfBlackList = req.body.reasonOfBlackList ?? "";
    }
  }
  if (req.body.credit != null && req.body.credit != customers.credit) {
    // if(!customers.contact.length()>0) return res.status(400).send({"message":"Please update the contact details for this user"});
    const newCustomerHistory = new customerHistoryModel({
      customerId: req.params.cid,
      date: new Date(),
      customerName: customers.fullName,
      description:
        req.body.description == "Add Old Credit"
          ? "Add Old Credit"
          : req.body.description + " " + req.body.paymentMethods ??
            "Due Clearance",
      paid:
        req.body.description == "Pay Dues"
          ? req.body.settlementAmount != null
            ? customers.credit - req.body.credit - req.body.settlementAmount
            : customers.credit - req.body.credit
          : 0,
      due:
        req.body.description == "Add Old Credit"
          ? req.body.credit - customers.credit
          : 0,
      storeId: customers.storeId,
      empId: User._id,
    });
    try {
      const savedHistory = await newCustomerHistory.save();
    } catch (error) {
      console.log(error);
    }
    customers.credit = req.body.credit;
  }
  if (req.body.settlementAmount != null) {
    const newCustomerHistory = new customerHistoryModel({
      customerId: req.params.cid,
      date: new Date(),
      customerName: customers.fullName,
      description: "Settlement Due Clearance",
      discount: req.body.settlementAmount,
      paid: 0,
      due: 0,
      storeId: customers.storeId,
      empId: User._id,
    });
    try {
      const savedHistory = await newCustomerHistory.save();
    } catch (error) {
      console.log(error);
    }
    customers.credit = req.body.credit;
  }
  if (req.body.maxCredit != null) {
    if (!customers.contact.length > 0)
      return res
        .status(400)
        .send({ message: "Please update the contact details for this user" });
    customers.maxCredit = req.body.maxCredit;
  }
  try {
    const cli = await customers.save();
    res.status(201).json(cli);
  } catch {
    res.status(500).json({ message: error.message });
  }
});
router.delete("/:cid", verify_token, async (req, res) => {
  console.log(req.tokendata);
  if (req.tokendata.userDesignation == "Staff")
    return res.status(500).json({ message: "Access Denied!" });
  const customer = await customerModel.findOne({ _id: req.params.cid });
  if (!customer)
    return res.status(400).send({ message: "customer dose not exist!" });
  if (customer.isPlaying)
    return res
      .status(400)
      .send({ message: `${customer.fullName} is playing, cannot delete!` });
  if (customer.fullName == "CASH")
    return res.status(400).send({ message: "Delete not possible!" });
  try {
    customer.isDeleted = true;
    const cli = await customer.save();
    res.status(201).json(cli);
  } catch {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
