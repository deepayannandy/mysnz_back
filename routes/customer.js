const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const customerModel=require("../models/customersModel")
const storeModel=require("../models/storesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")

router.post('/',async (req,res)=>{
    let store=await storeModel.findOne({_id:req.body.storeId});
    if(!store) return res.status(400).send({"message":"Store dose not exist!"});
    const newCustomer= new customerModel({
        fullName:req.body.fullName,
        contact:req.body.contact,
        email:req.body.email,
        credit:0,
        maxCredit:999,
        dob:req.body.dob,
        profileImage:req.body.profileImage,
        rewardPoint:!req.body.rewardPoint>0?req.body.rewardPoint:0,
        coin:!req.body.coin>0?req.body.coin:0,
        storeId:req.body.storeId,
        isBlackListed:false,
        isDeleted:false
    })
    try{
        const cli=await newCustomer.save()
        res.status(201).json({"_id":cli.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.get("/byStore/:sid",async (req,res)=>{
    try{
        const customers=await customerModel.find({storeId:req.params.sid,isDeleted: {$ne:true}});
        res.status(201).json(customers)

    }catch{
        res.status(500).json({message: error.message})
    }
})

router.get("/myCustomers/",verify_token,async (req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    try{
        const customers=await customerModel.find({storeId:loggedInUser.storeId,isDeleted: {$ne:true}});
        res.status(201).json(customers)

    }catch{
        res.status(500).json({message: error.message})
    }
})

router.get("/",async (req,res)=>{
    try{
        const customers=await customerModel.find();
        res.status(201).json(customers)
    }catch{
        res.status(500).json({message: error.message})
    }
})
router.get("/:cid",async (req,res)=>{
    try{
        const customers=await customerModel.findOne({_id:req.params.cid});
        if(!customers) return res.status(400).send({"message":"Customer dose not exist!"});
        const tableCredit=0
        const cafeCredit=0
        const gameWin=0
        const orders=0
        const totalSpend=0
        const membership={
            "membershipName":"NA",
            "membershipMin":"0",
        }
        res.status(200).json({customers,tableCredit,cafeCredit,gameWin,orders,totalSpend,membership})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.patch("/:cid",async (req,res)=>{
    const customers=await customerModel.findOne({_id:req.params.cid});
    if(!customers) return res.status(400).send({"message":"Customer dose not exist!"});

    if(req.body.fullName!=null){
        customers.fullName=req.body.fullName;
    }
    if(req.body.contact!=null){
        customers.contact=req.body.contact;
    }
    if(req.body.email!=null){
        customers.email=req.body.email;
    }
    if(req.body.credit!=null){
        if(!customers.contact.length>0) return res.status(400).send({"message":"Please update the contact details for this user"});
        customers.credit=req.body.credit;
    }
    if(req.body.maxCredit!=null){
        if(!customers.contact.length>0) return res.status(400).send({"message":"Please update the contact details for this user"});
        customers.maxCredit=req.body.maxCredit;
    }
    try{
        const cli=await customers.save();
        res.status(201).json(cli)

    }catch{
        res.status(500).json({message: error.message})
    }
})
router.delete("/:cid",async (req,res)=>{
    const customer=await customerModel.findOne({_id:req.params.cid});
    if(!customer) return res.status(400).send({"message":"customer dose not exist!"});
    try{
        customer.isDeleted=true;
        const cli=await customer.save();
        res.status(201).json(cli)
    }catch{
        res.status(500).json({message: error.message})
    }
})
module.exports=router