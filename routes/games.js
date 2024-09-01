const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")
const historyModel= require("../models/historyModel")
const customerModel=require("../models/customersModel")
const storeModel=require("../models/storesModel")

router.post("/startGame/:tableId",async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        let finalPlayerList=[];
        for(count in req.body.players){
            let getdata=req.body.players[count]
            console.log(getdata)
            console.log( getdata.fullName!="CASH")
            if(getdata.customerId==undefined && getdata.fullName!="CASH"){
                console.log(`creating userid for ${getdata.fullName}`)
                const newCustomer= new customerModel({
                    fullName:getdata.fullName,
                    storeId:selectedTable.storeId,
                    isBlackListed:false,
                    credit:0,
                    contact:"+910000000000"
                })
                const cli=await newCustomer.save();
                getdata.customerId=cli._id.toString();
            }
            finalPlayerList.push(getdata)
        }
        console.log(finalPlayerList)
        selectedTable.gameData.players=finalPlayerList;
        selectedTable.isOccupied=true;
        selectedTable.gameData.startTime=new Date();
        selectedTable.gameData.gameType=req.body.gameType;

        const updatedTable = await selectedTable.save();
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.patch("/stopGame/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
        selectedTable.gameData.endTime=new Date();
        const updatedTable = await selectedTable.save();
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.get("/getBilling/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
        console.log(selectedTable.gameData.gameType)
        if(selectedTable.gameData.gameType=="Minute Billing"){
            let bills=[]
            let totalBillAmt=0;
            let timeDelta=Math.ceil(((selectedTable.gameData.endTime- selectedTable.gameData.startTime)/60000));
            const totalGameTime=timeDelta;
            console.log(timeDelta)
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString(undefined, {timeZone: 'Asia/Kolkata'});
            console.log(indianStartTime)
            if(selectedTable.minuteWiseRules.nightMinAmt>0||selectedTable.minuteWiseRules.nightPerMin>0){
                if((indianStartTime.split(":")[0]>8 && indianStartTime.includes("PM"))|| (indianStartTime.split(":")[0]<6 && indianStartTime.includes("AM"))||(indianStartTime.split(":")[0]==12 && indianStartTime.includes("AM"))){
                if(timeDelta<selectedTable.minuteWiseRules.nightUptoMin){
                    bills.push({"title":"Night Minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.nightMinAmt})
                    totalBillAmt=selectedTable.minuteWiseRules.nightMinAmt;
                }
                else{
                        bills.push({"title":"Night Minimum","time":selectedTable.minuteWiseRules.nightUptoMin,"amount":selectedTable.minuteWiseRules.nightMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.nightMinAmt;
                        timeDelta=timeDelta-selectedTable.minuteWiseRules.nightUptoMin;
                        bills.push({"title":`Night perMin(${timeDelta} * ${selectedTable.minuteWiseRules.nightPerMin})`,"time":timeDelta,"amount":selectedTable.minuteWiseRules.nightPerMin*timeDelta})
                    totalBillAmt=totalBillAmt+selectedTable.minuteWiseRules.nightPerMin*timeDelta;
                }
                }
                else{
                    if(timeDelta<selectedTable.minuteWiseRules.dayUptoMin){
                        bills.push({"title":"Day Minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt;
                      }
                      else{
                            bills.push({"title":"Day Minimum","time":selectedTable.minuteWiseRules.dayUptoMin,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                            totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt;
                            timeDelta=timeDelta-selectedTable.minuteWiseRules.nightUptoMin;
                            bills.push({"title":`Day perMin(${timeDelta} * ${selectedTable.minuteWiseRules.dayPerMin})`,"time":timeDelta,"amount":selectedTable.minuteWiseRules.dayPerMin*timeDelta})
                           totalBillAmt=totalBillAmt+selectedTable.minuteWiseRules.dayPerMin*timeDelta;
                      }
                }
            }
            else{
                if(timeDelta<selectedTable.minuteWiseRules.dayUptoMin){
                    bills.push({"title":"Day Minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                    totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt;
                  }
                  else{
                        bills.push({"title":"Day Minimum","time":selectedTable.minuteWiseRules.dayUptoMin,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt;
                        timeDelta=timeDelta-selectedTable.minuteWiseRules.nightUptoMin;
                        bills.push({"title":`Day perMin(${timeDelta} * ${selectedTable.minuteWiseRules.dayPerMin})`,"time":timeDelta,"amount":selectedTable.minuteWiseRules.dayPerMin*timeDelta})
                       totalBillAmt=totalBillAmt+selectedTable.minuteWiseRules.dayPerMin*timeDelta;
                  }
            }
            return res.status(201).json({"timeDelta":totalGameTime,"billBreakup":bills,"totalBillAmt":totalBillAmt, selectedTable})
        }
        res.status(502).json({message: "Billing not supported"})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.patch("/checkoutTable/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        const selectedTable= await tableModel.findById(req.params.tableId);
        const selectedStore= await storeModel.findById(selectedTable.storeId)
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
            let dis= req.body.discount==undefined?0:req.body.discount
            const gHistory= new historyModel({
                storeId:selectedTable.storeId,
                date:new Date(),
                customerName:selectedTable.gameData.players.map((player)=>{
                    return player.fullName;
                }).join(","),
                description:selectedTable.tableName,
                startTime:selectedTable.gameData.startTime,
                endTime:selectedTable.gameData.endTime,
                time:req.body.timeDelta,
                booking:req.body.totalBillAmt,
                meal:0,
                discount:dis,
                netPay:req.body.totalBillAmt-dis,
                status:"Paid",
                transactionId:`${selectedStore.storeName.replace(" ","").substring(0,3).toLowerCase()}-${selectedStore.transactionCounter}`
            })
        selectedStore.transactionCounter= selectedStore.transactionCounter+1;
        const updatedStore =await selectedStore.save()
        const newGameHistory= await gHistory.save();
        selectedTable.gameData.startTime=undefined;
        selectedTable.gameData.endTime=undefined;
        selectedTable.gameData.players=[];
        selectedTable.gameData.gameType=undefined;
        selectedTable.isOccupied=false;
        const updatedTable = await selectedTable.save();
        res.status(201).json({"HistoryId":newGameHistory._id,"TableId":updatedTable._id,"UpdatedStoreData":updatedStore._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
module.exports=router