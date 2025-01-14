const express = require("express")
const router= express.Router()
const productModel=require("../models/productModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")
const mongodb=require("mongodb");
const categoryModel= require("../models/categoryModel")

router.post("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    let category= req.body.category
    if(category.categoryId==undefined||req.body.category.categoryId==null){
        const newCategory= new categoryModel({
        storeId:loggedInUser.storeId,
        type:"product",
        name: category.name
        })
        const cData=await newCategory.save()
        category.categoryId=cData.id
        }
    const newProduct= new productModel({
        productName:req.body.productName,
        storeId:loggedInUser.storeId,
        description:req.body.description,
        category:category,
        sku:req.body.sku,
        basePrice:req.body.basePrice,
        salePrice:req.body.salePrice,
        quantity:req.body.quantity,
        isOutOfStock:parseInt(req.body.quantity)>0?false:true,
        productImage:"",
        barcode:req.body.barcode,
        isQntRequired:req.body.isQntRequired,
        tax:req.body.tax
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
router.get("/:pId",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    try{
        const selectedProduct= await productModel.findById(req.params.pId)
        if(!selectedProduct)return res.status(500).json({message: "Product dose not exist!"})
        res.status(201).json(selectedProduct)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
router.get("/onTable/get",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    try{
        const storeProducts= await productModel.find({$and: [{storeId:loggedInUser.storeId},{isOutOfStock:false}]})
        res.status(201).json(storeProducts)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.patch("/:pId",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    if(loggedInUser.userDesignation=="Staff")return res.status(500).json({message: "Access Denied!"})
    const selectedProduct= await productModel.findById(req.params.pId)
    if(!selectedProduct)return res.status(500).json({message: "Product dose not exist!"})
        if(req.body.isOutOfStock!=null){
            selectedProduct.isOutOfStock=req.body.isOutOfStock;
        }
        if(req.body.productName!=null){
            selectedProduct.productName=req.body.productName;
        }
        if(req.body.basePrice!=null){
            selectedProduct.basePrice=req.body.basePrice;
        }
        if(req.body.salePrice!=null){
            selectedProduct.salePrice=req.body.salePrice;
        }
        if(req.body.isOutOfStock!=null){
            selectedProduct.isOutOfStock=req.body.isOutOfStock;
        }
        if(req.body.quantity!=null){
            selectedProduct.quantity=req.body.quantity;
            if (selectedProduct.quantity>0)  selectedProduct.isOutOfStock=false;
        }
        if(req.body.barcode!=null){
            selectedProduct.barcode=req.body.barcode;
        }
        if(req.body.category!=null){
            let category= req.body.category
            if(category.categoryId==undefined||req.body.category.categoryId==null){
                const newCategory= new categoryModel({
                storeId:loggedInUser.storeId,
                type:"product",
                name: category.name
                })
                const cData=await newCategory.save()
                category.categoryId=cData.id
            }
            selectedProduct.category=category;
        }
        if(req.body.description!=null){
            selectedProduct.description=req.body.description;
        }
        if(req.body.tax!=null){
            selectedProduct.tax=req.body.tax;
        }
    try{
        const sp=await selectedProduct.save();
        res.status(201).json(sp)
    }catch(error){
        res.status(500).json({message: error.message})
    }

})
router.delete("/:pId",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser)
    if(loggedInUser.userDesignation=="Staff")return res.status(500).json({message: "Access Denied!"})
    const selectedProduct= await productModel.findById(req.params.pId)
    if(!selectedProduct)return res.status(500).json({message: "Product dose not exist!"})
    try{
        const result= await productModel.deleteOne({_id: new mongodb.ObjectId(req.params.pId)})
        res.json(result)
    }catch(error){
        res.status(500).json({message: error.message})
    }

})
module.exports=router