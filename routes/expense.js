const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const userModel = require("../models/userModel")
const verifyToken = require("../validators/verifyToken")
const categoryModel= require("../models/categoryModel")
const expanseModel= require("../models/expanseModel")

router.get("/",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        try{
            const allExpanses= await expanseModel.find({
                   storeId:loggedInUser.storeId
                })
            res.status(200).json(allExpanses.reverse())
        }catch(error){res.status(400).json({message:error.message})}
})

router.post("/",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        try{
            let category= req.body.category
            if(category.categoryId==undefined||req.body.category.categoryId==null){
                const newCategory= new categoryModel({
                    storeId:loggedInUser.storeId,
                    type:"expanse",
                    name: category.name
                })
                const cData=await newCategory.save()
                category.categoryId=cData.id
            }
            const newExpanses= new expanseModel({
                userId:loggedInUser._id,
                storeId:loggedInUser.storeId,
                userName:loggedInUser.fullName,
                date:new Date(req.body.date),
                category:category,
                invoiceNumber: req.body.invoiceNumber,
                vendorName:req.body.vendorName,
                description:req.body.description,
                amount:req.body.amount,
                invoiceAmount: (parseFloat(req.body.amount)*parseFloat(req.body.quantity)).toFixed(2) ,
                quantity:req.body.quantity,
                note: req.body.note,
                paid:req.body.paid,
                status:(parseFloat(req.body.amount)*parseFloat(req.body.quantity)).toFixed(2)>parseFloat(req.body.paid)?parseFloat(req.body.paid)==0?"Due":"Partial Due":"Paid"
                
            })
            const eData=await newExpanses.save()
            res.status(201).json({"_id":eData.id})
        }catch(error){res.status(400).json({message:error.message})}
})


module.exports=router