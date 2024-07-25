const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const storeModel=require("../models/storesModel")
const deviceModel=require("../models/deviceModel")


router.post('/',async (req,res)=>{
    const Store=await storeModel.findOne({_id:req.body.storeId});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const newDevice= new deviceModel({
        deviceId:req.body.deviceId,
        storeId:req.body.storeId,
        nodes:req.body.nodes,
        nodeStatus:req.body.nodeStatus,
        onboarding:new Date(),
        deviceType:req.body.deviceType,
        isActive:true,
        warrantyExpiryDate:new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    })
    try{
        const dvs=await newDevice.save()
        res.status(201).json({"_id":dvs.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.get('/:did',async (req,res)=>{
    
    try{
        const Device=await deviceModel.findOne({_id:req.params.did});
        if(!Device)return res.status(400).send({"message":"Device dose not exist!"});
        res.status(201).json(Device)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/',async (req,res)=>{
    
    try{
        const Device=await deviceModel.find();
        res.status(201).json(Device)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/byStore/:sid',async (req,res)=>{
    try{
        const devices=await deviceModel.find({storeId:req.params.sid});
        res.status(201).json(devices)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.patch('/:did',async (req,res)=>{
    console.log(req.params.did)
    const Device=await deviceModel.findOne({_id:req.params.did});
    if(!Device) return res.status(400).send({"message":"Device dose not exist!"});
    if(req.body.storeId!=null){
        Device.storeId=req.body.storeId;
    }
    if(req.body.nodeStatus!=null){
        Device.nodeStatus=req.body.nodeStatus;
    }
    if(req.body.nodes!=null){
        Device.nodes=req.body.nodes;
    }
    if(req.body.isActive!=null){
        Device.isActive=req.body.isActive;
    }
    if(req.body.warrantyAvailingDate!=null){
        console.log( Device.warrantyAvailingDate)
        Device.warrantyAvailingDate=[...Device.warrantyAvailingDate,req.body.warrantyAvailingDate]
    }
    try{
        const dvs=await Device.save();
        res.status(201).json(dvs)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.delete('/:did',async(req,res)=>{
    const Device=await deviceModel.findOne({_id:req.params.did});
    if(!Device) return res.status(400).send({"message":"Device dose not exist!"});
    try{
        const result= await deviceModel.deleteOne({_id: new mongodb.ObjectId(req.params.did)})
        res.json(result)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

module.exports=router