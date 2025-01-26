const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const paymentGatewayLogs=require("../models/paymentGatewayModel")

const verify_token= require("../validators/verifyToken")

router.post("/",verify_token, async(req,res)=>{
        const log= new paymentGatewayLogs({
            orderId:req.body.orderId,
            amount:req.body.amount,
            currency:req.body.currency,
            initiationTime:new Date(),
        })
        try{
            const newLog=await log.save()
            res.status(201).json({"_id":newLog.id})
        }
        catch(error){
            res.status(400).json({message:error.message})
        }
})
router.get("/",async(req,res)=>{
    try{
        const paymentLogs=await paymentGatewayLogs.find();
        res.status(201).json(paymentLogs)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get("/:oid",async(req,res)=>{
    const log=await paymentGatewayLogs.find({"orderId":req.params.oid});
    if(!log)return res.status(404).json({message: "Payment log is not available"})
    try{
        res.status(201).json(log)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.patch("/:oid",verify_token,async(req,res)=>{
    const transactionLog=await paymentGatewayLogs.findOne({"orderId":req.params.oid});
    if(!transactionLog)return res.status(404).json({message: "Payment log is not available"})
    if(req.body.receipt!=null){
        transactionLog.receipt=req.body.receipt;
        transactionLog.completionTime=new Date();
    }
    try{
        const updatedLog=await transactionLog.save();
        res.status(201).json(updatedLog)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
    
})
module.exports=router
