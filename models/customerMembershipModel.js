const mongoos = require("mongoose");

const customerMembershipName = new mongoos.Schema({
  membershipName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  balanceMinute: {
    type: Number,
    required: true,
  },
  balanceMinuteLeft: {
    type: Number,
    required: true,
  },
  startTime: {
    type: String,
    required: false,
  },
  endTime: {
    type: String,
    required: false,
  },
  startDay: {
    type: Date,
    required: true,
  },
  endDay: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  dailyLimit: {
    type: Number,
    required: false,
  },
  cafeItems: [
    {
      itemName: {
        type: String,
        require: false,
      },
      itemId: {
        type: String,
        require: false,
      },
      itemCount: {
        type: Number,
        require: false,
      },
    },
  ],
  storeId: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
});
module.exports = mongoos.model("customerMemberships", customerMembershipName);
