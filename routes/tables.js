const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")
const mqttAgent=require("../utils/mqtt")


router.post("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(req.body)
    const newTable= new tableModel({
        storeId:loggedInUser.storeId,
        tableName:req.body.tableName,
        deviceId:req.body.deviceId,
        nodeID:req.body.nodeID,
        isOccupied:false,
        gameTypes:req.body.gameTypes,
        netAmount:0,
        isBooked:false,
        minuteWiseRules:req.body.minuteWiseRules,
        slotWiseRules:req.body.slotWiseRules,
        countdownRules:req.body.countdownRules,
        fixedBillingRules:req.body.fixedBillingRules,
        isBreak:req.body.isBreak,
        tableType:req.body.tableType
    })
    try{
        console.log(newTable)
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
    // console.log(loggedInUser)
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
    const table=await tableModel.findById(req.params.tableId);
    if(!table) return res.status(404).json({message: "Table not found"})
    if(table.isOccupied) return res.status(409).json({message: "Table is occupied!"})
        console.log(req.body.fixedBillingRules)
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
        if(req.body.slotWiseRules!=null){
            table.slotWiseRules=req.body.slotWiseRules
        }
        if(req.body.countdownRules!=null){
            table.countdownRules=req.body.countdownRules
        }
        if(req.body.gameTypes!=null){
            table.gameTypes=req.body.gameTypes
        }
        if(req.body.fixedBillingRules!=null){
            table.fixedBillingRules=req.body.fixedBillingRules
        }
        if(req.body.isBreak!=null){
            table.isBreak=req.body.isBreak
        }
        if(req.body.tableType!=null){
            table.tableType= req.body.tableType
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



router.patch("/switchTable/switch",async(req,res)=>{
    const oldTable= await tableModel.findById(req.body.oldTable)
    if(!oldTable) return res.status(404).json({message: "From Table not found"})
    const newTable= await tableModel.findById(req.body.newTable)
    if(!newTable) return res.status(404).json({message: "To Table not found"})
    if(!newTable.gameTypes.includes(oldTable.gameData.gameType)) return res.status(404).json({message: `This game type is not available on ${newTable.tableName}`})
    if(newTable.isOccupied) return res.status(404).json({message: `${newTable.tableName} is already occupied`})
    if(oldTable.tableType!=newTable.tableType) return res.status(404).json({message: `${newTable.tableName} is not a ${oldTable.tableType} Table`})
    mqttAgent.client.publish(oldTable.deviceId+"/"+oldTable.nodeID,"0")
    mqttAgent.client.publish(newTable.deviceId+"/"+newTable.nodeID,"1")
        newTable.gameData=oldTable.gameData
        newTable.pauseMin=oldTable.pauseMin
        newTable.pauseTime=oldTable.pauseTime
        newTable.isOccupied=oldTable.isOccupied
        newTable.productList=oldTable.productList
        newTable.mealAmount= oldTable.mealAmount
        oldTable.isOccupied=false
        oldTable.gameData=null
        oldTable.pauseMin=null
        oldTable.pauseTime=null
        oldTable.productList=null
        oldTable.mealAmount=null
    try{
        await oldTable.save()
        await newTable.save()
        res.status(201).json({message:"Table Switched"})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

module.exports=router