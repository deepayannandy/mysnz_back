const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const userModel=require("../models/userModel")
const storeModel=require("../models/storesModel")
const productModel=require("../models/productModel")
const customerModel=require("../models/customersModel")
const orderHistoryModel= require("../models/orderHistoryModel")
const verify_token= require("../validators/verifyToken")
const historyModel= require("../models/historyModel")
const customerHistoryModel= require("../models/customerHistoryModel")

async function updateProductCount(productId,itemsToDeduct){
    const orderedProduct= await productModel.findById(productId);
    if(!orderedProduct) return res.status(500).json({message: "Product not found!"})
        if(orderedProduct.isQntRequired){
            if(orderedProduct.quantity<itemsToDeduct) 
                {
                     return "Product not is stock"
                    }
                orderedProduct.quantity=parseInt(orderedProduct.quantity)-parseInt(itemsToDeduct)
        }
        await orderedProduct.save()
        return "ok"

}

router.post("/",verify_token,async (req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    const selectedStore= await storeModel.findById(loggedInUser.storeId)
    for(let i in req.body.orderItems){
        let message= await updateProductCount(req.body.orderItems[i].productId,req.body.orderItems[i].qnt)
        if(message!="ok")  return res.status(500).json({message: message})
     }
    const transId=`${selectedStore.storeName.replace(" ","").substring(0,3).toUpperCase()}${selectedStore.transactionCounter}`
    const newOrderHistory= new orderHistoryModel({
        storeId:loggedInUser.storeId,
        date:new Date(),
        orderItems:req.body.orderItems,
        customers: req.body.customer,
        description:"Takeaway order "+req.body.paymentMethod,
        total:req.body.total,
        discount:req.body.discount,
        netPay:req.body.netPay,
        status:true,
        transactionId:`${selectedStore.storeName.replace(" ","").substring(0,3).toUpperCase()}${selectedStore.transactionCounter}`,
        credit:req.body.credit
    })
    const newHistory= new historyModel({
        storeId:loggedInUser.storeId,
        date:new Date(),
        customerName:req.body.customer.fullName,
        description:"Takeaway order "+req.body.paymentMethod,
        meal:req.body.netPay,
        discount:req.body.discount,
        netPay:req.body.netPay,
        time:0,
        booking:0,
        status:req.body.netPay-req.body.cashIn>0?"Due":"Paid",
        credit:req.body.netPay-req.body.cashIn<0?0:req.body.netPay-req.body.cashIn,
        transactionId:transId,
        empId:loggedInUser._id
    })
    const newCustomerHistory= new customerHistoryModel({
        customerId:req.body.customer.customerId,
        date:new Date(),
        customerName:req.body.customer.fullName,
        description:"Takeaway order "+req.body.paymentMethod,
        quantity:0,
        discount:req.body.discount,
        netPay:req.body.netPay,
        paid:req.body.netPay-req.body.cashIn<0?req.body.netPay:req.body.cashIn,
        due:req.body.netPay-req.body.cashIn<0?0:req.body.netPay-req.body.cashIn,
        transactionId:transId,
        storeId:loggedInUser.storeId,
        empId:loggedInUser._id
    })
    if(req.body.netPay-req.body.cashIn>0)
        {
        const pickedCustomer= await customerModel.findById(req.body.customer.customerId)
        if(pickedCustomer)
        {
        console.log("I am called")
        pickedCustomer.credit=pickedCustomer.credit+(req.body.netPay-req.body.cashIn)}
        const updatedCustomer =await pickedCustomer.save()
        }
    try{
        const createdOrderHistory= await newOrderHistory.save();
        const createdCustomerHistory= await newCustomerHistory.save();
        const createdHistory= await newHistory.save();
        res.status(201).json({"_id":createdOrderHistory.id})
    }catch(error){
        res.status(400).json({message:error.message})
    }

})

router.get("/",verify_token,async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
    console.log(loggedInUser.storeId)
    try{
        const mealHistory= await orderHistoryModel.find({storeId:loggedInUser.storeId})
        res.status(201).json(mealHistory.reverse())
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
module.exports=router