const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const subscriptionModel=require("../models/subscriptionModel")

const verify_token= require("../validators/verifyToken")

router.post("/",verify_token, async(req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
        const subs= new subscriptionModel({
            subscriptionName:req.body.subscriptionName,
            subscriptionDescription:req.body.subscriptionDescription,
            subscriptionValidity:req.body.subscriptionValidity,
            access:req.body.access,
            billings:req.body.billings,
            subscriptionPrice:req.body.subscriptionPrice,
            isYearly:req.body.isYearly
        })
        try{
            const newSubs=await subs.save()
            res.status(201).json({"_id":newSubs.id})
        }
        catch(error){
            res.status(400).json({message:error.message})
        }
})
router.get("/",async(req,res)=>{
    try{
        const subscriptions=await subscriptionModel.find();
        res.status(201).json(subscriptions)

    }catch{
        res.status(500).json({message: error.message})
    }
})
router.patch("/:sid",verify_token,async(req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)
        res.status(500).json({message: "Access Denied!"})
    const selectedSubscription= await subscriptionModel.findById(req.params.sid)
    if(!selectedSubscription)
        res.status(500).json({message: "Subscription not found"})
    if(req.body.subscriptionPrice!=null){
        selectedSubscription.subscriptionPrice=req.body.subscriptionPrice;
    }
    if(req.body.subscriptionValidity!=null){
        selectedSubscription.subscriptionValidity=req.body.subscriptionValidity;
    }
    if(req.body.access!=null){
        selectedSubscription.access=req.body.access;
    }
    if(req.body.billings!=null){
        selectedSubscription.billings=req.body.billings;
    }
    try{
        const updatedSub=await selectedSubscription.save();
        res.status(201).json(updatedSub)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
    
})
router.delete("/:sid",verify_token,async(req,res)=>{
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
        console.log("Deleting Subs: "+req.params.sid)
        subs=await subscriptionModel.findById(req.params.sid)
            if(subs==null){
                return res.status(404).json({message:"Subscription unavailable!"})
            }
        try{
            const result= await subscriptionModel.deleteOne({_id: new mongodb.ObjectId(req.params.sid)})
            res.json(result)
        }catch(error){
            res.status(500).json({message: error.message})
        }
})
module.exports=router
