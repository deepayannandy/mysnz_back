const express = require("express")
const router= express.Router()
const customerModel=require("../models/customersModel")
const customerHistoryModel=require("../models/customerHistoryModel")

router.get("/:cid",async(req,res)=>{
    const customers=await customerModel.findOne({_id:req.params.cid});
    if(!customers) return res.status(400).send({"message":"Customer dose not exist!"});
    try{
        const customerHistory= await customerHistoryModel.find({customerId:req.params.cid})
        res.status(201).json(customerHistory)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
module.exports=router