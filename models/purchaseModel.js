const { required } = require("joi");
const mongoos = require("mongoose");

const purchaseSchema = new mongoos.Schema({
  productName: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  storeId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  category: {
    categoryId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  sku: {
    type: String,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: false,
  },
  salePrice: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  poValue: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: new Date(),
  },
});
module.exports = mongoos.model("PurchaseList", purchaseSchema);
