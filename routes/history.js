const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const historyModel=require("../models/historyModel")
const customerHistoryModel=require("../models/customerHistoryModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")

router.get("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser.storeId)
    try{
        const storeHistory= await historyModel.find({$and:
            [{storeId:loggedInUser.storeId},{isDeleted :{$ne:true}},{description :{$not:{$regex : "order"}}}]
       })
        
        res.status(201).json(storeHistory.reverse())
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
router.patch("/:transactionId",verify_token, async(req,res)=>{
    try{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    if(loggedInUser.userDesignation!="Admin")return res.status(500).json({message: "Access Denied! This action is only allowed by an Admin user."})
    const transactionData= await historyModel.findOne({transactionId:req.params.transactionId})
    if(!transactionData)return res.status(500).json({message: "TransactionData not available"})
    if(req.body.startTime!=null){
        transactionData.startTime=req.body.startTime;
    }
    if(req.body.endTime!=null){
        transactionData.endTime=req.body.endTime;
    }
    if(req.body.time!=null){
        transactionData.time=req.body.time;
    }
    if(req.body.discount!=null){
        transactionData.discount=req.body.discount;
    }
    if(req.body.booking!=null){
        transactionData.booking=req.body.booking;
    }
    if(req.body.netPay!=null){
        transactionData.netPay=req.body.netPay;
    }
    if(req.body.credit!=null){
        transactionData.credit=req.body.credit;
    }
    await transactionData.save();
    return res.status(201).json({message: `${transactionData._id} updated successfully!`})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
router.delete("/:transactionId",verify_token, async(req,res)=>{
    try{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    if(loggedInUser.userDesignation!="Admin")return res.status(500).json({message: "Access Denied! This action is only allowed by an Admin user."})
    const transactionData= await historyModel.findOne({transactionId:req.params.transactionId})
    if(!transactionData)return res.status(500).json({message: "TransactionData not available"})
    if(transactionData.transactionId.length>0){
        transactionData.isDeleted= true;
        await customerHistoryModel.updateMany({transactionId:req.params.transactionId},{$set:{isDeleted:true}})
        await transactionData.save();
        return res.status(201).json({message: `${req.params.transactionId} Deleted successfully!`})
    }
    res.status(500).json({message: "Something went Wrong"})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
module.exports=router