const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const storeModel=require("../models/storesModel")
const deviceModel=require("../models/deviceModel")
const notificationModel=require("../models/notificationModel")
const userModel=require("../models/userModel")
const jwt= require("jsonwebtoken")
const verify_token= require("../validators/verifyToken")
const clientModel=require("../models/clientsModel")


router.get('/getUserDB/',verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const users=await userModel.find();
        res.status(201).json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/getClientDB/',verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const clients=await clientModel.find();
        res.status(201).json(clients)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/getDeviceDB/',verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const devices=await deviceModel.find();
        res.status(201).json(devices)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/getStoreDB/',verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const stores=await storeModel.find();
        res.status(201).json(stores)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get('/getNotificationDB/',verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const Notifications=await notificationModel.find();
        res.status(201).json(Notifications)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

module.exports=router