const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const userModel = require("../models/userModel")
const verifyToken = require("../validators/verifyToken")
const categoryModel= require("../models/categoryModel")

router.get("/:type",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(req.params.type)
        try{
            const allCategory= await categoryModel.find({$and:
                [{
                    type:req.params.type
                },{
                   storeId:loggedInUser.storeId
               }]
           })
            res.status(201).json(allCategory)
        }catch(error){res.status(400).json({message:error.message})}
})

module.exports=router