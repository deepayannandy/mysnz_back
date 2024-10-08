const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const userModel=require("../models/userModel")
const storeModel=require("../models/storesModel")
const productModel=require("../models/productModel")
const customerModel=require("../models/customersModel")
const orderHistoryModel= require("../models/orderHistoryModel")
const verify_token= require("../validators/verifyToken")

router.post("/",verify_token,async (req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    const selectedStore= await storeModel.findById(loggedInUser.storeId)
    console.log(req.body)  
    console.log(finalCustomerList)
    const newOrderHistory= new orderHistoryModel({
        storeId:loggedInUser.storeId,
        date:new Date(),
        orderItems:req.body.orderItems,
        customers: customer,
        description:"Takeaway order",
        total:req.body.total,
        discount:req.body.discount,
        netPay:req.body.netPay,
        status:true,
        transactionId:`${selectedStore.storeName.replace(" ","").substring(0,3).toUpperCase()}-${selectedStore.transactionCounter}`,
        credit:req.body.credit
    })
    try{
        const createdHistory= await newOrderHistory.save();
        res.status(201).json({"_id":createdHistory.id})
    }catch(error){
        res.status(400).json({message:error.message})
    }

})

router.get("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser.storeId)
    try{
        const mealHistory= await orderHistoryModel.find({storeId:loggedInUser.storeId})
        res.status(201).json(mealHistory.reverse())
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
module.exports=router