const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")
const historyModel= require("../models/historyModel")
const customerModel=require("../models/customersModel")
const storeModel=require("../models/storesModel")
const mqttAgent=require("../utils/mqtt")
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
        console.log("sending message to: "+selectedTable.deviceId+"/"+nodeID )
        mqttAgent.client.publish(selectedTable.deviceId+"/"+nodeID,1)
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
        if(selectedTable.gameData.endTime!=undefined) return res.status(401).json({message: "Game already stopped"})
        selectedTable.gameData.endTime=new Date();
        const updatedTable = await selectedTable.save();
        mqttAgent.client.publish(selectedTable.deviceId+"/"+nodeID,1)
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
function isNight(storeData, gameStartTime){
    
    if(storeData.nightStartTime>storeData.nightEndTime){
        console.log("next day")
        if(storeData.nightStartTime < gameStartTime && storeData.nightEndTime < gameStartTime){
            return true
        }
    }
    else{
        console.log("same day")
        console.log(storeData.nightStartTime,storeData.nightEndTime,gameStartTime)
        if(storeData.nightStartTime < gameStartTime && storeData.nightEndTime > gameStartTime){
            return true
        }
    }
    return false
}
router.get("/getBilling/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        const selectedTable= await tableModel.findById(req.params.tableId);
        const selectedStore= await storeModel.findById(selectedTable.storeId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
        console.log(selectedTable.gameData.gameType)
        if(selectedTable.gameData.gameType=="Minute Billing"){
            let bills=[]
            let totalBillAmt=0;
            let timeDelta=Math.ceil(((selectedTable.gameData.endTime- selectedTable.gameData.startTime)/60000));
            const totalGameTime=timeDelta;
            console.log(timeDelta)
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata',hour12: false});
            console.log(indianStartTime)
            const isnightTime=isNight(selectedStore, indianStartTime)
            console.log(isnightTime)
            if(selectedStore.nightStartTime!=null||selectedStore.nightEndTime!=null || selectedTable.minuteWiseRules.nightMinAmt>0){
                console.log(selectedStore.nightStartTime,selectedStore.nightEndTime)
                if(isnightTime){
                    if(selectedTable.minuteWiseRules.nightUptoMin < timeDelta){
                        let uptoTime=selectedTable.minuteWiseRules.nightUptoMin 
                        let restTime=timeDelta-uptoTime
                        console.log(uptoTime,restTime)
                        bills.push({"title":"Night minimum","time":uptoTime,"amount":selectedTable.minuteWiseRules.nightMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.nightMinAmt
                        bills.push({"title":"Night per minute","time":restTime,"amount":(selectedTable.minuteWiseRules.nightPerMin*restTime)})
                        totalBillAmt=totalBillAmt+(selectedTable.minuteWiseRules.nightPerMin*restTime)
                    }
                    else{
                        bills.push({"title":"Night minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.nightMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.nightMinAmt
                    }
                }else {
                    if(selectedTable.minuteWiseRules.dayUptoMin < timeDelta){
                        let uptoTime=selectedTable.minuteWiseRules.dayUptoMin 
                        let restTime=timeDelta-uptoTime
                        console.log(uptoTime,restTime)
                        bills.push({"title":"Day minimum","time":uptoTime,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt
                        bills.push({"title":"Day per minute","time":restTime,"amount":(selectedTable.minuteWiseRules.dayPerMin*restTime)})
                        totalBillAmt=totalBillAmt+(selectedTable.minuteWiseRules.dayPerMin*restTime)
                    }
                    else{
                        console.log("I am called")
                        bills.push({"title":"Day minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                        totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt
                    }
                }
            }
            else{
                console.log("only day time billing applicable")
                if(selectedTable.minuteWiseRules.dayUptoMin < timeDelta){
                    let uptoTime=selectedTable.minuteWiseRules.dayUptoMin 
                    let restTime=timeDelta-uptoTime
                    console.log(uptoTime,restTime)
                    bills.push({"title":"Day minimum","time":uptoTime,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                    totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt
                    bills.push({"title":"Day per minute","time":restTime,"amount":(selectedTable.minuteWiseRules.dayPerMin*restTime)})
                    totalBillAmt=totalBillAmt+(selectedTable.minuteWiseRules.dayPerMin*restTime)
                }
                else{
                    bills.push({"title":"Day minimum","time":timeDelta,"amount":selectedTable.minuteWiseRules.dayMinAmt})
                    totalBillAmt=selectedTable.minuteWiseRules.dayMinAmt
                }
            }
            return res.status(201).json({"timeDelta":totalGameTime,"billBreakup":bills,"totalBillAmt":totalBillAmt.toFixed(2), selectedTable})
        }
        if(selectedTable.gameData.gameType=="Slot Billing"){
            let bills=[]
            let totalBillAmt=0;
            let timeDelta=Math.ceil(((selectedTable.gameData.endTime- selectedTable.gameData.startTime)/60000));
            const totalGameTime=timeDelta;
            console.log(timeDelta)
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString(undefined, {timeZone: 'Asia/Kolkata',hour12: false});
            console.log(indianStartTime)
            if(selectedStore.nightStartTime!=null||selectedStore.nightEndTime!=null || selectedTable.slotWiseRules[0].nightSlotCharge>0){
                console.log(selectedStore.nightStartTime,selectedStore.nightEndTime)
                if(selectedStore.nightStartTime < indianStartTime && selectedStore.nightEndTime < indianStartTime){
                    

                }else{
                    console.log("day time billing")
                }
            }
            else{
                console.log("Only day time billing")
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