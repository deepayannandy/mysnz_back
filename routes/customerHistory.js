const express = require("express")
const router= express.Router()
const customerModel=require("../models/customersModel")
const customerHistoryModel=require("../models/customerHistoryModel")

router.get("/:cid",async(req,res)=>{
    const customers=await customerModel.findOne({_id:req.params.cid});
    if(!customers) return res.status(400).send({"message":"Customer dose not exist!"});
    try{
        const customerHistory= await customerHistoryModel.find({$and:[{customerId:req.params.cid},{isDeleted :{$ne:true}}]})
        res.status(201).json(customerHistory.reverse())
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
module.exports=router