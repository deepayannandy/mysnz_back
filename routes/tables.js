const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")


router.post("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    const newTable= new tableModel({
        storeId:loggedInUser.storeId,
        tableName:req.body.tableName,
        deviceId:req.body.deviceId,
        nodeID:req.body.nodeID,
        isOccupied:false,
        gameTypes:req.body.gameTypes,
        netAmount:0,
        isBooked:false,
        minuteWiseRules:req.body.minuteWiseRules
    })
    try{
        const table=await newTable.save()
        res.status(201).json({"_id":table.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
router.get("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    try{
        const storeHistory= await tableModel.find({storeId:loggedInUser.storeId})
        res.status(201).json(storeHistory)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.patch("/:tableId",verify_token,async (req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    const table=await tableModel.findOne({_id:req.params.tId});
    if(!table) return res.status(404).json({message: "Table not found"})
        if(req.body.tableName!=null){
            table.tableName=req.body.tableName;
        }
        if(req.body.minuteWiseRules!=null){
            table.minuteWiseRules=req.body.minuteWiseRules;
        }
        if(req.body.deviceId!=null){
            table.deviceId=req.body.deviceId;
        }
        if(req.body.nodeID!=null){
            table.nodeID=req.body.nodeID;
        }
        if(req.body.tableName!=null){
            table.tableName=req.body.tableName;
        }
        try{
            const tab=await table.save();
            res.status(201).json(tab)
    
        }catch{
            res.status(500).json({message: error.message})
        }
})


router.delete("/:tId",verify_token,async (req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    const table=await tableModel.findOne({_id:req.params.tId});
    if(!table)return res.status(404).json({message: "Table not found"})
    if(table.isBooked || table.isOccupied)return  res.status(500).json({message: "An occupied table can not be deleted!"})
    console.log(loggedInUser.storeId,table.storeId)
    if(loggedInUser.storeId!=table.storeId)return  res.status(500).json({message: "You are not allowed to perform this task!"})
    try{
        const result= await tableModel.deleteOne({_id: new mongodb.ObjectId(req.params.tId)})
        res.json(result)
    }catch{
        res.status(500).json({message: error.message})
    }
})

module.exports=router