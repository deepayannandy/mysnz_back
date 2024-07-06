const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const storeModel=require("../models/storesModel")
const notificationModel=require("../models/notificationModel")

router.post('/',async (req,res)=>{
    const Store=await storeModel.findOne({_id:req.body.storeId});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const newNotification= new notificationModel({
        storeId:req.body.storeId,
        subject:req.body.subject,
        body:req.body.body,
        isRead:false,
        type:req.body.type
    })
    try{
        const notification=await newNotification.save()
        res.status(201).json({"_id":notification.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.get('/byStore/:sid',async (req,res)=>{
    try{
        const notifications=await notificationModel.find({storeId:req.params.sid});
        res.status(201).json(notifications)

    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.patch('/:notificationId',async(req,res)=>{
    const Notification=await notificationModel.findOne({_id:req.params.notificationId});
    if(!Notification) return res.status(400).send({"message":"Notification dose not exist!"});
    if(req.body.isRead!=null){
        Notification.isRead=req.body.isRead;
    }
    try{
        const notification=await Notification.save();
        res.status(201).json(notification)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.delete('/:notificationId',async(req,res)=>{
    const Notification=await notificationModel.findOne({_id:req.params.notificationId});
    if(!Notification) return res.status(400).send({"message":"Notification dose not exist!"});
    try{
        const result= await notificationModel.deleteOne({_id: new mongodb.ObjectId(req.params.notificationId)})
        res.json(result)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

module.exports=router