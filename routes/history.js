const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const historyModel=require("../models/historyModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")

router.get("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser.storeId)
    try{
        const storeHistory= await historyModel.find({storeId:loggedInUser.storeId})
        res.status(201).json(storeHistory.reverse())
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
module.exports=router