const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const storeModel=require("../models/storesModel")
const storeSubscriptionModel= require("../models/storeSubscriptionModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")

router.post('/',async (req,res)=>{
    var today = new Date();
    console.log("Onboarding Date:"+today)
    today.setDate(today.getDate() + req.body.valid_days);
    console.log("End Date:"+today)

    const newStore= new storeModel({
        storeName:req.body.storeName,
        contact:req.body.contact,
        email:req.body.email,
        address:req.body.address,
        onboarding: new Date(),
        validTill:today,
        profileImage:req.body.profileImage,
        transactionCounter:1
    })
    try{
        const str=await newStore.save()
        res.status(201).json({"_id":str.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.patch('/renew/:sid',async (req,res)=>{
    //todo validate the payment id
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});

    var today = new Date(Store.validTill);
    console.log("Last Date: "+today)
    today.setDate(today.getDate() + req.body.valid_days);
    console.log("End Date: "+today)

    Store.validTill=today;

    try{
        const str=await Store.save();
        res.status(201).json(str)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.patch('/:sid',async (req,res)=>{
    //todo validate the payment id
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    if(req.body.nightStartTime!=null){
        Store.nightStartTime=req.body.nightStartTime;
    }
    if(req.body.nightEndTime!=null){
        Store.nightEndTime=req.body.nightEndTime;
    }
    if(req.body.requiredCustomerCount!=null){
        Store.requiredCustomerCount=req.body.requiredCustomerCount;
    }
    if(req.body.isPauseResume!=null){
        Store.isPauseResume=req.body.isPauseResume;
    }
    if(req.body.isRoundOff!=null){
        Store.isRoundOff=req.body.isRoundOff;
    }
    if(req.body.happyHrsStartTime!=null){
        Store.happyHrsStartTime=req.body.happyHrsStartTime;
    }
    if(req.body.happyHrsEndTime!=null){
        Store.happyHrsEndTime=req.body.happyHrsEndTime;
    }
    if(req.body.happyHrsDiscount!=null){
        Store.happyHrsDiscount=req.body.happyHrsDiscount;
    }
    if(req.body.isCancel!=null){
        Store.isCancel=req.body.isCancel;
    }
    if(req.body.cancelMins!=null){
        Store.cancelMins=req.body.cancelMins;
    }
    if(req.body.isBillPrint!=null){
        Store.isBillPrint=req.body.isBillPrint;
    }
    if(req.body.isPrepaidMode!=null){
        Store.isPrepaidMode=req.body.isPrepaidMode;
    }
    if(req.body.isSwitchTable!=null){
        Store.isSwitchTable=req.body.isSwitchTable;
    }
    if(req.body.isSelfStart!=null){
        Store.isSelfStart=req.body.isSelfStart;
    }
    if(req.body.isHoldEnable!=null){
        Store.isHoldEnable=req.body.isHoldEnable;
    }
    try{
        const str=await Store.save();
        res.status(201).json(str)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.get("/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const StoreSubs= await storeSubscriptionModel.find({storeId:Store._id,isActive:true})
    try{
        res.status(201).json({"StoreData":Store,"SubscriptionData":StoreSubs.length>0?StoreSubs[0]:"No active Subscription found"})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.get("/",async(req,res)=>{
    try{
        const Store=await storeModel.find();
        res.status(201).json(Store)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.delete("/:sid",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(loggedInUser.userDesignation!="SuperAdmin")return res.status(404).json({message: "Access denied!"})
    try{
        const result= await storeModel.deleteOne({_id: new mongodb.ObjectId(req.params.sid)})
        res.json(result)
    }catch{
        res.status(500).json({message: error.message})
    }
})
module.exports=router