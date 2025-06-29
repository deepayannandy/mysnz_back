const mongoos = require("mongoose");

const appCustomerSchema = new mongoos.Schema({
  fullName: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  long: {
    type: Number,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  credit: {
    type: Number,
    required: false,
  },
  maxCredit: {
    type: Number,
    required: false,
  },
  dob: {
    type: Date,
    required: false,
  },
  profileImage: {
    type: String,
    required: false,
  },
  rewardPoint: {
    type: Number,
    require: false,
  },
  coin: {
    type: Number,
    require: false,
  },
  isBlackListed: {
    type: Boolean,
    required: true,
  },
  dateOfBlackListed: {
    type: Date,
    required: false,
  },
  reasonOfBlackListed: {
    type: String,
    required: false,
  },
  isDeleted: {
    type: Boolean,
    required: false,
  },
  onBoardingDate: {
    type: Date,
    required: false,
  },
  gameDuration: {
    type: Number,
    required: false,
  },
  gamePlay: {
    type: Number,
    required: false,
  },
  gameWin: {
    type: Number,
    required: false,
  },
  lastGame: {
    type: Date,
    required: false,
  },
  OTP: {
    type: String,
    required: false,
  },
  otpExpire: {
    type: Date,
    required: false,
  },
});
module.exports = mongoos.model("appCustomer", appCustomerSchema);
