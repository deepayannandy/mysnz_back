const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const customerHistoryModel=require("../models/customerHistoryModel")
const customerModel=require("../models/customersModel")
const custM= require("../models/customersModel")
const userM= require("../models/userModel")
router.get("/Dashboard/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const today= new Date()
    const startDate=new Date()
    startDate.setHours(0,0,0,0);
    const endDate=new Date()
    endDate.setHours(23,59,59,999);
    console.log(today,startDate,endDate)
    let addedUserIds=[]
    try{
        const allTransactionToday= await customerHistoryModel.find({ date:{
            $gt: startDate,
            $lt: endDate
        }})
        const filteredTransactions=allTransactionToday.filter((transactions)=>{return (transactions.description.includes("Table")||transactions.description.includes("Pay Dues"))})
        const creditUserList=filteredTransactions.filter((transactions)=>{return (transactions.due>0)})
        let finalCreditUserList=[]
        for(let index in creditUserList){
            const cData= await customerModel.findById(creditUserList[index].customerId)
            console.log(addedUserIds," already added ",addedUserIds.includes(cData._id.toString()),cData._id.toString())
            if(cData.credit>1 && !addedUserIds.includes(cData._id.toString()) && cData.storeId==req.params.sid){
                finalCreditUserList.push(cData)
                addedUserIds.push(cData._id.toString())
            }
        }

        let sales=0 
        let cash=0 
        let card=0
        let upi=0
        let prime=0
        let credit=0 
        for(let index in filteredTransactions){
            console.log(filteredTransactions[index].netPay,sales)
            sales=sales+filteredTransactions[index].netPay!=undefined?filteredTransactions[index].netPay:0
            credit=credit+filteredTransactions[index].due
            if(filteredTransactions[index].description.includes("Pay Dues")){
                console.log("Credit settelment",filteredTransactions[index].paid)
                credit=credit-filteredTransactions[index].paid;
            }
            if(filteredTransactions[index].description.includes("undefined")||filteredTransactions[index].description.includes("CASH")){
                cash=cash+filteredTransactions[index].paid
            }
            if(filteredTransactions[index].description.includes("UPI")){
                upi=upi+filteredTransactions[index].paid
            }
            if(filteredTransactions[index].description.includes("CARD")){
                card=card+filteredTransactions[index].paid
            }
            if(filteredTransactions[index].description.includes("PRIME")){
                prime=prime+filteredTransactions[index].paid
            }
            
        }
        console.log(sales)
        res.status(201).json({
            storeName:Store.storeName,
            sales: sales,
            credit:credit,
            transactions: {
              cash: cash,
              card: card,
              upi: upi,
              prime: prime
            },
            creditHistoryToday:finalCreditUserList
    })
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
module.exports=router