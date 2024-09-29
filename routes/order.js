const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const userModel=require("../models/userModel")
const storeModel=require("../models/storesModel")
const productModel=require("../models/productModel")



module.exports=router