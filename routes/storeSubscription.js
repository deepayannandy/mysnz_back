const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const subscriptionModel=require("../models/subscriptionModel")
const storeSubscriptionModel= require("../models/storeSubscriptionModel")
const storeModel=require("../models/storesModel")

router.post("/",async(req,res)=>{
    let store=await storeModel.findOne({_id:req.body.storeId});
    if(!store) return res.status(400).send({"message":"Store dose not exist!"});
    // let subs=await subscriptionModel.findOne({_id:req.body.subscriptionId});
    // if(!subs)res.status(500).json({"message":"Subscription dose not exist!"})

    const storeSubs= new storeSubscriptionModel({
        storeId:req.body.storeId,
        isActive:req.body.isActive,
        subscriptionName:req.body.subscriptionName,
        subscriptionId:req.body.subscriptionId,
        subscriptionValidity:req.body.subscriptionValidity,
        startDate:req.body.startDate,
        endDate:req.body.endDate,
        isYearly:req.body.isYearly,
        subscriptionAmount:req.body.subscriptionAmount
    })
    try{
        const newSSubs=await storeSubs.save()
        res.status(201).json({"_id":newSSubs.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.get("/:sid",async(req,res)=>{
    try{
        const storeSubscriptions=await storeSubscriptionModel.find({storeId:req.params.sid});
        res.status(201).json(storeSubscriptions)

    }catch{
        res.status(500).json({message: error.message})
    }
})
router.patch("/:sid",async(req,res)=>{
    const selectedSubscription= await storeSubscriptionModel.findById(req.params.sid)
    if(!selectedSubscription)
        res.status(500).json({message: "Subscription not found"})
    if(req.body.startDate!=null){
        selectedSubscription.startDate=req.body.startDate;
    }
    if(req.body.endDate!=null){
        selectedSubscription.endDate=req.body.endDate;
    }
    if(req.body.isActive!=null){
        selectedSubscription.isActive=req.body.isActive;
    }
    try{
        const updatedSub=await selectedSubscription.save();
        res.status(201).json(updatedSub)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

module.exports=router