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

router.get("/today/:sid",async(req,res)=>{
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
        res.status(201).json(finalCreditUserList)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
}),
router.get("/alltime/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const allCustomers= await customerModel.find({$and:[{credit:{ $gt: 0 }},{ storeId:req.params.sid }] })
    try{    
        res.status(201).json(allCustomers)
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})

module.exports=router