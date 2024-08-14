const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const storeModel=require("../models/storesModel")

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
router.get("/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    try{
        res.status(201).json(Store)
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
module.exports=router