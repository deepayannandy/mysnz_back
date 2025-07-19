const mongoos = require("mongoose");

const membershipSchema = new mongoos.Schema({
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
  validity: {
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
  isVisible: {
    type: Boolean,
    required: true,
  },
});
module.exports = mongoos.model("memberships", membershipSchema);
