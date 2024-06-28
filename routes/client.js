const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const clientModel=require("../models/clientsModel")
const storeModel=require("../models/storesModel")

router.post('/',async (req,res)=>{
    let store=await storeModel.findOne({_id:req.body.storeId});
    if(!store) return res.status(400).send({"message":"Store dose not exist!"});
    const newClient= new clientModel({
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
        isBlackListed:false
    })
    try{
        const cli=await newClient.save()
        res.status(201).json({"_id":cli.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

router.get("/byStore/:sid",async (req,res)=>{
    try{
        const clients=await clientModel.find({storeId:req.params.sid});
        res.status(201).json(clients)

    }catch{
        res.status(500).json({message: error.message})
    }
})

router.patch("/:cid",async (req,res)=>{
    const client=await clientModel.findOne({_id:req.params.cid});
    if(!client) return res.status(400).send({"message":"Client dose not exist!"});

    if(req.body.fullName!=null){
        client.fullName=req.body.fullName;
    }
    if(req.body.contact!=null){
        client.contact=req.body.contact;
    }
    if(req.body.email!=null){
        client.email=req.body.email;
    }
    if(req.body.credit!=null){
        if(!client.contact.length>0) return res.status(400).send({"message":"Please update the contact details for this user"});
        client.credit=req.body.credit;
    }
    try{
        const cli=await client.save();
        res.status(201).json(cli)

    }catch{
        res.status(500).json({message: error.message})
    }
})
router.delete("/:cid",async (req,res)=>{
    const client=await clientModel.findOne({_id:req.params.cid});
    if(!client) return res.status(400).send({"message":"Client dose not exist!"});
    try{
        const reasult= await clientModel.deleteOne({_id: new mongodb.ObjectId(req.params.cid)})
        res.json(reasult)
    }catch{
        res.status(500).json({message: error.message})
    }
})
module.exports=router