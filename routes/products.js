const express = require("express")
const router= express.Router()
const productModel=require("../models/productModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")

router.post("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    const newProduct= new productModel({
        productName:req.body.productName,
        storeId:loggedInUser.storeId,
        description:req.body.description,
        category:req.body.category,
        sku:req.body.sku,
        basePrice:req.body.basePrice,
        salePrice:req.body.salePrice,
        quantity:req.body.quantity,
        isOutOfStock:false,
        productImage:""
    })
    try{
        const product=await newProduct.save()
        res.status(201).json({"_id":product.id})
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
        const storeProducts= await productModel.find({storeId:loggedInUser.storeId})
        res.status(201).json(storeProducts)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
module.exports=router