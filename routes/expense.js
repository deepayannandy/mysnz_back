const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const userModel = require("../models/userModel")
const verifyToken = require("../validators/verifyToken")
const categoryModel= require("../models/categoryModel")
const expenseModel= require("../models/expenseModel")

router.get("/",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        try{
            const allExpenses= await expenseModel.find({
                   storeId:loggedInUser.storeId
                })
            res.status(200).json(allExpenses.reverse())
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
                    type:"expense",
                    name: category.name
                })
                const cData=await newCategory.save()
                category.categoryId=cData.id
            }
            const newExpenses= new expenseModel({
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
            const eData=await newExpenses.save()
            res.status(201).json({"_id":eData.id})
        }catch(error){res.status(400).json({message:error.message})}
})

router.patch("/:eid",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    const selectedExpense= await expenseModel.findById(req.params.eid)
    if(!selectedExpense)return res.status(500).json({message: "Expanse not available!"})
        try{
            if(req.body.paid!=null){
                selectedExpense.paid=req.body.paid;
                selectedExpense.status=(selectedExpense.invoiceAmount).toFixed(2)>parseFloat(selectedExpense.paid)?parseFloat(selectedExpense.paid)==0?"Due":"Partial Due":"Paid"
            }
            const eData=await selectedExpense.save()
            res.status(201).json({"_id":eData.id})
    }catch(error){
        res.status(400).json({message:error.message})
    }
})
router.delete('/:eid',async(req,res)=>{
    const selectedExpense=await expenseModel.findOne({_id:req.params.eid});
    if(!selectedExpense) return res.status(400).send({"message":"Expanse dose not exist!"});
    try{
        const result= await expenseModel.deleteOne({_id: new mongodb.ObjectId(req.params.eid)})
        res.json(result)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})


module.exports=router