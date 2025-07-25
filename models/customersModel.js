const mongoos = require("mongoose");

const customerSchema = new mongoos.Schema({
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
  city: {
    type: String,
    required: false,
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
  storeId: {
    type: String,
    required: true,
  },
  isBlackListed: {
    type: Boolean,
    required: true,
  },
  dateOfBlackList: {
    type: Date,
    required: false,
  },
  reasonOfBlackList: {
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
  isPlaying: {
    type: Boolean,
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
  membershipId: {
    type: String,
    required: false,
  },
});
module.exports = mongoos.model("Customer", customerSchema);
