const express = require("express")
const router= express.Router()
const storeModel=require("../models/storesModel")
const customerHistoryModel=require("../models/customerHistoryModel")

router.get("/Dashboard/:sid",async(req,res)=>{
    const Store=await storeModel.findOne({_id:req.params.sid});
    if(!Store) return res.status(400).send({"message":"Store dose not exist!"});
    const today= new Date()
    const startDate=new Date()
    startDate.setHours(0,0,0,0);
    const endDate=new Date()
    endDate.setHours(23,59,59,999);
    console.log(today,startDate,endDate)
    
    try{
        const allTransactionToday= await customerHistoryModel.find({date:{
            $gt: startDate,
            $lt: endDate
        }})
        const filteredTransactions=allTransactionToday.filter((transactions)=>{return (transactions.description.includes("Table"))})
        let sales=0 
        let cash=0 
        let card=0
        let upi=0
        let prime=0
        for(let index in filteredTransactions){
            sales=sales+ filteredTransactions[index].netPay
            if(filteredTransactions[index].description.includes("undefined")||filteredTransactions[index].description.includes("CASH")){
                cash=cash+filteredTransactions[index].netPay
            }
            if(filteredTransactions[index].description.includes("UPI")){
                upi=upi+filteredTransactions[index].netPay
            }
            if(filteredTransactions[index].description.includes("CARD")){
                card=card+filteredTransactions[index].netPay
            }
            if(filteredTransactions[index].description.includes("PRIME")){
                prime=prime+filteredTransactions[index].netPay
            }
            
        }

        res.status(201).json({
            storeName:Store.storeName,
            sales: sales,
            creditHistoryToday:filteredTransactions,
            transactions: {
              cash: cash,
              card: card,
              upi: upi,
              prime: prime
            }
    })
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})
module.exports=router