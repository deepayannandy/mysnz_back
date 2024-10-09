const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const customerHistoryModel=require("../models/customerHistoryModel")
const customerModel=require("../models/customersModel")
const custM= require("../models/customersModel")
const userM= require("../models/userModel")
const historyModle= require("../models/historyModel")
const userModel = require("../models/userModel")

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
        const allHistory= await historyModle.find({$and:
             [{date:{
                $gt: startDate,
                $lt: endDate
            }},{
                storeId:req.params.sid
            }]
        })
        const filteredTransactions_old=allTransactionToday.filter((transactions)=>{return (!transactions.description.includes("Add Old Credit"))})
        const filteredTransactions=filteredTransactions_old.filter((transactions)=>{return transactions.storeId== req.params.sid})
        const creditUserList=filteredTransactions.filter((transactions)=>{return (transactions.due>0)})
        console.log(filteredTransactions)
        let finalCreditUserList=[]
        for(let index in creditUserList){
            const cData= await customerModel.findById(creditUserList[index].customerId)
            if(cData.credit>0 && !addedUserIds.includes(cData._id.toString())){
                finalCreditUserList.push(cData)
                addedUserIds.push(cData._id.toString())
            }
        }
        let sales=0 
        let discount=0
        let cash=0 
        let card=0
        let upi=0
        let prime=0
        let credit=0 
        for(let index in allHistory){
            sales= sales+allHistory[index].booking
            sales= sales+allHistory[index].meal??0
            discount= discount+allHistory[index].discount??0
        }
        for(let index in filteredTransactions){
            console.log(filteredTransactions[index])
            credit=credit+filteredTransactions[index].due
            if(filteredTransactions[index].description.includes("Pay Dues")){
                // sales=sales+filteredTransactions[index].paid
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
            discount:discount,
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
}),

router.get("/signOffReport/:uid",async (req,res)=>{
    const User=await userModel.findOne({_id:req.params.uid});
    if(!User) return res.status(400).send({"message":"User dose not exist!"});
    const today= new Date()
    const startDate=new Date()
    startDate.setHours(0,0,0,0);
    const endDate=new Date()
    endDate.setHours(23,59,59,999);
    console.log(today,startDate,endDate)
    const allTransactionToday= await customerHistoryModel.find({$and:
        [{date:{
           $gt: startDate,
           $lt: endDate
       }},{
         empId:User._id
       }]
   })
   let tableCollection=0
   let mealCollection=0
   let due=0
   for(let index in allTransactionToday){
    console.log(allTransactionToday[index])
    if(allTransactionToday[index].description.includes("Table")){
        tableCollection=tableCollection+allTransactionToday[index].netPay
    }
    if(allTransactionToday[index].description.includes("Meal")){
        mealCollection=mealCollection+allTransactionToday[index].netPay
    }
    due=due+allTransactionToday[index].due
   }

    res.status(201).json({
        "tableCollection":tableCollection,
        "cafeCollection":mealCollection,
        "totalCollection":tableCollection+mealCollection,
        "dues": due
    })
})



module.exports=router