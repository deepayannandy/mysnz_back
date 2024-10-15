const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const customerHistoryModel=require("../models/customerHistoryModel")
const customerModel= require("../models/customersModel")
const userModel= require("../models/userModel")
const historyModel= require("../models/historyModel")
const verify_token= require("../validators/verifyToken")

router.get("/transactionReport/:startDate/:endDate/:storeId",verify_token, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(req.params.startDate,req.params.endDate,req.params.storeId)
    const today= new Date()
    const startDate=new Date(req.params.startDate)
    startDate.setHours(0,0,0,0);
    const endDate=new Date(req.params.endDate)
    endDate.setHours(23,59,59,999);
    console.log(today,startDate,endDate)
    let netAmount=0
    let discount=0
    let dues=0
    let cash=0
    let card=0
    let upi=0
    let gems=0
    const allTransactionToday= await customerHistoryModel.find({$and:
        [{date:{
           $gt: startDate,
           $lt: endDate
       }},{
        storeId:req.params.storeId
       }]
   })
   res.status(201).json({
    "allTransaction":allTransactionToday,
    "netAmount":netAmount,
    "gems":gems,
    "upi":upi,
    "discount":discount,
    "cash":cash,
    "card":card,
    "dues":dues
})
})

module.exports=router