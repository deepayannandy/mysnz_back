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
const customerHistoryModel= require("../models/customerHistoryModel")

router.post("/testMqtt",async (req,res)=>{
    try{
        mqttAgent.client.publish("test",req.body.message)
        res.status(200).json({message: "message sent"})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
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
        console.log("sending message to: "+selectedTable.deviceId+"/"+selectedTable.nodeID )
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"1")
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
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"0")
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
function isNight(storeData, gameStartTime){
    if(gameStartTime.split(":")[0]=="00"){
        gameStartTime.replace("00","24")
    }
    if(storeData.nightStartTime>storeData.nightEndTime){
        console.log(storeData.nightStartTime < gameStartTime,storeData.nightEndTime < gameStartTime,storeData.nightEndTime > gameStartTime,storeData.nightStartTime, storeData.nightEndTime, gameStartTime)
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
            const isNightTime=isNight(selectedStore, indianStartTime)
            console.log(isNightTime)
            const slotRule=selectedTable.slotWiseRules.sort((a, b) => b.uptoMin - a.uptoMin)
            if(selectedStore.nightStartTime!=null||selectedStore.nightEndTime!=null || selectedTable.slotWiseRules[0].nightSlotCharge>0){
                console.log(selectedStore.nightStartTime,selectedStore.nightEndTime)
                while (timeDelta!=0){
                    if(timeDelta<slotRule[slotRule.length-1].uptoMin){
                        console.log("I am called when time delta is :",timeDelta)
                        if(isNightTime){
                            bills.push({"title":"Night Slot","time":timeDelta,"amount":slotRule[slotRule.length-1].nightSlotCharge})
                            timeDelta=0
                            totalBillAmt=totalBillAmt+slotRule[slotRule.length-1].nightSlotCharge
                            
                        }else{
                            bills.push({"title":"Day Slot","time":timeDelta,"amount":slotRule[slotRule.length-1].slotCharge})
                            timeDelta=0
                            totalBillAmt=totalBillAmt+slotRule[slotRule.length-1].slotCharge
                           
                        }
                    }
                    else{
                    for(let index in slotRule){
                        console.log(timeDelta," Copairing with ", slotRule[index].uptoMin, timeDelta>slotRule[index].uptoMin, timeDelta==slotRule[index].uptoMin)
                        if(timeDelta>slotRule[index].uptoMin || timeDelta==slotRule[index].uptoMin){
                            if(isNightTime){
                                bills.push({"title":"Night Slot","time":slotRule[index].uptoMin,"amount":slotRule[index].nightSlotCharge})
                                timeDelta=timeDelta-slotRule[index].uptoMin
                                totalBillAmt=totalBillAmt+slotRule[index].nightSlotCharge
                                break
                            }else{
                                bills.push({"title":"Day Slot","time":slotRule[index].uptoMin,"amount":slotRule[index].slotCharge})
                                timeDelta=timeDelta-slotRule[index].uptoMin
                                totalBillAmt=totalBillAmt+slotRule[index].slotCharge
                                break
                            }
                           
                        }
                    }
                }
                    console.log(timeDelta,totalBillAmt,bills)
                    // await delay(2000);
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
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

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
                credit:(req.body.totalBillAmt-dis)-req.body.cashIn,
                transactionId:`${selectedStore.storeName.replace(" ","").substring(0,3).toUpperCase()}-${selectedStore.transactionCounter}`
            })
        selectedStore.transactionCounter= selectedStore.transactionCounter+1;
        for(let index in req.body.checkoutPlayers){
            if(req.body.checkoutPlayers[index].customerId){
                const custHistory=new customerHistoryModel({
                    customerId:req.body.checkoutPlayers[index].customerId,
                    date:new Date(),
                    customerName:req.body.checkoutPlayers[index].fullName.split("(")[0],
                    description:selectedTable.tableName+" "+req.body.checkoutPlayers[index].paymentMethod,
                    quantity:0,
                    discount:0,
                    netPay:req.body.checkoutPlayers[index].amount,
                    paid:req.body.checkoutPlayers[index].cashIn,
                    due:req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn,
                    startTime:selectedTable.gameData.startTime,
                    endTime:selectedTable.gameData.endTime,
                    transactionId:gHistory.transactionId
                })
                if(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn>0)
                    {
                    const pickedCustomer= await customerModel.findById(req.body.checkoutPlayers[index].customerId)
                    if(pickedCustomer)
                    {
                    console.log("I am called")
                    pickedCustomer.credit=pickedCustomer.credit+(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn)}
                    const updatedCustomer =await pickedCustomer.save()
                    gHistory.credit=gHistory.credit+(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn)
                    }

                const newCustomerHistory =await custHistory.save()
                console.log(newCustomerHistory.id);
            }
           
            
        }
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