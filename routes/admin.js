const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")

router.get("/Dashboard/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    try{
        res.status(201).json({
            storeName:Store.storeName,
            sales: 0,
            transactions: {
              cash: 0,
              card: 0,
              upi: 0,
              prime: 0
            }
    })
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
module.exports=router