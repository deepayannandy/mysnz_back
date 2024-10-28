const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const customerHistoryModel=require("../models/customerHistoryModel")
const customerModel=require("../models/customersModel")
const custM= require("../models/customersModel")
const userM= require("../models/userModel")
const historyModle= require("../models/historyModel")
const userModel = require("../models/userModel")
const dailyReportModel=require("../models/dailyReportModel")
const verifyToken = require("../validators/verifyToken")

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
            sales: sales.toFixed(2),
            credit: Math.abs(credit).toFixed(2),
            discount:discount.toFixed(2),
            transactions: {
              cash: cash.toFixed(2),
              card: card.toFixed(2),
              upi: upi.toFixed(2),
              prime: prime.toFixed(2)
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
    const startDate=new Date(User.loginTime)
    // startDate.setHours(0,0,0,0);
    const endDate=new Date()
    // endDate.setHours(23,59,59,999);
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
   let cash=0 
   let card=0
   for(let index in allTransactionToday){
    console.log(allTransactionToday[index])
    if(allTransactionToday[index].description.toLowerCase().includes("table")){
        tableCollection=tableCollection+allTransactionToday[index].netPay
    }
    if(allTransactionToday[index].description.toLowerCase().includes("meal")){
        mealCollection=mealCollection+allTransactionToday[index].netPay
    }
    if(allTransactionToday[index].description.toLowerCase().includes("cash")){
        cash=cash+allTransactionToday[index].paid
    }
    if(allTransactionToday[index].description.toLowerCase().includes("card")){
        card=card+allTransactionToday[index].paid
    }
    due=due+allTransactionToday[index].due
    if(allTransactionToday[index].description.toLowerCase().includes("pay dues")){
        console.log(">> ",allTransactionToday[index].paid)
        due=due-allTransactionToday[index].paid
    }

   }

    res.status(201).json({
        "tableCollection":tableCollection,
        "cafeCollection":mealCollection,
        "totalCollection":tableCollection+mealCollection,
        "cash":cash,
        "card":card,
        "dues": Math.abs(due)
    })
})

router.post("/addMyDailyReport/",verifyToken, async(req,res)=>{
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        const newDailyReport= new dailyReportModel({
            userId:loggedInUser._id,
            storeId:loggedInUser.storeId,
            userName:loggedInUser.fullName,
            tableCollection:req.body.tableCollection,
            cafeCollection:req.body.cafeCollection,
            totalCollection:req.body.totalCollection,
            cash:req.body.cash,
            card:req.body.card,
            dues: req.body.dues,
            loginTime:loggedInUser.loginTime,
            logoutTime: new Date()
        })
    try{
        const report= await newDailyReport.save();
        res.status(201).json({"_id":report.id})
    }catch(error){res.status(400).json({message:error.message})}
})


module.exports=router