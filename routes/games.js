const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")


router.post("/startGame/:tableId",async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        selectedTable.gameData.players=req.body.players;
        selectedTable.isOccupied=true;
        selectedTable.gameData.startTime=new Date();
        selectedTable.gameData.gameType=req.body.gameType;

        const updatedTable = await selectedTable.save();
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.patch("/stopGame/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
        selectedTable.gameData.endTime=new Date();
        const updatedTable = await selectedTable.save();
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
module.exports=router