const express = require("express")
const router= express.Router()
const mongodb=require("mongodb");
const deviceModel=require("../models/deviceModel")
const tableModel=require("../models/tablesModel")
const verify_token= require("../validators/verifyToken")
const userModel=require("../models/userModel")
const historyModel= require("../models/historyModel")
const customerModel=require("../models/customersModel")
const storeModel=require("../models/storesModel")
const customerHistoryModel= require("../models/customerHistoryModel")
const productModel= require("../models/productModel")
const mqttAgent=require("../utils/mqtt")

router.post("/SendMqtt",async (req,res)=>{
    try{
        let data=req.body.topic.split("/l")
        const selectedDevice= await deviceModel.findOne({deviceId:data[0]})
        if(!selectedDevice) return res.status(500).json({message: "Device not found!"})
        console.log(selectedDevice)
        selectedDevice.nodeStatus[data[1]-1]=req.body.message=="0"?0:1
        console.log(selectedDevice)
        await selectedDevice.save()
        mqttAgent.client.publish(req.body.topic,req.body.message)
        res.status(200).json({message: "message sent"})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
async function updateCustomerDetails(customerId,status,duration,isCheckout){
    try{
    const selectedCustomer= await customerModel.findById(customerId)
    // if(selectedCustomer.isPlaying==status) return res.status(500).json({message: selectedCustomer.fullName+" is already occupied"})
    if(selectedCustomer){
        console.log(`>>> added ${duration} to  ${selectedCustomer.fullName}`)
        selectedCustomer.isPlaying=status
        selectedCustomer.gameDuration==undefined?selectedCustomer.gameDuration=0:selectedCustomer.gameDuration=selectedCustomer.gameDuration+duration
        if(isCheckout) selectedCustomer.gamePlay==undefined?selectedCustomer.gamePlay=1:selectedCustomer.gamePlay= selectedCustomer.gamePlay+1;
    }
    await selectedCustomer.save()
    }catch(error){
    console.log(error);
    }
}

router.post("/pause/:tableId",async(req,res)=>{
    const selectedTable= await tableModel.findById(req.params.tableId);
    if(!selectedTable) return res.status(500).json({message: "Table not found!"})
    try{
        selectedTable.pauseTime=new Date()
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"0")
        await selectedTable.save();
    return res.status(200).json({message: "Table paused"})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.post("/resume/:tableId",async(req,res)=>{
    const selectedTable= await tableModel.findById(req.params.tableId);
    if(!selectedTable) return res.status(500).json({message: "Table not found!"})
    try{
        if(!selectedTable.pauseTime)return res.status(500).json({message: "Error"})
        let timeDelta=((new Date()- selectedTable.pauseTime)/60000).toFixed(2);
        console.log(timeDelta)
        let newPauseTime=(parseFloat(timeDelta)+parseFloat(selectedTable.pauseMin??0)).toFixed(2)
        console.log(newPauseTime)
        selectedTable.pauseMin=newPauseTime
        selectedTable.pauseTime=null
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"1")
        await selectedTable.save();
        return res.status(200).json({message: `Table resumed after ${newPauseTime}`})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})
router.post("/restart/:tableId",async(req,res)=>{
    const selectedTable= await tableModel.findById(req.params.tableId);
    if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        try{
            selectedTable.gameData.endTime=null;
            mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"1")
            await selectedTable.save();
            return res.status(200).json({message: `Table restarted`})
    }catch(error){{
        res.status(500).json({message: error.message})
    }}
})
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
router.post("/addMeal/:tableId",async (req,res)=>{
    console.log(req.params.tableId)
    try{
        
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        let totalOrderValue=selectedTable.mealAmount??0;
        for(let i in req.body.productList.orders){
           let message= await updateProductCount(req.body.productList.orders[i].productId,req.body.productList.orders[i].qnt)
           if(message!="ok")  return res.status(500).json({message: message})
        }
        if(!selectedTable.productList)
        {
            selectedTable.productList=req.body.productList;
            totalOrderValue=parseFloat(req.body.productList.orderTotal)
        }
        else{
            let isInserted=false;
            for(let i in selectedTable.productList)
            { 
                if(selectedTable.productList[0].customerDetails.customerId==req.body.productList.customerDetails.customerId){
                console.log("existing Customer")
                isInserted=true
                
                console.log(selectedTable.productList[i])
                selectedTable.productList[i].orders=[...selectedTable.productList[i].orders,...req.body.productList.orders]
                selectedTable.productList[i].orderTotal= parseFloat(selectedTable.productList[i].orderTotal)+parseFloat(req.body.productList.orderTotal)
            }
            }
            if(!isInserted){
            console.log("new Customer")
            selectedTable.productList=[...selectedTable.productList,req.body.productList]
            }    
            
            totalOrderValue=totalOrderValue+parseFloat(req.body.productList.orderTotal)
        }
       
        selectedTable.mealAmount=totalOrderValue.toFixed(2);
        const updatedTable = await selectedTable.save();
        res.status(201).json({"_id":updatedTable._id})
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

async function countdownGame(tableId){
    console.log(tableId)
    const selectedTable= await tableModel.findById(tableId);
    if(!selectedTable) return console.log("Table not found!")
    if(selectedTable.gameData.endTime==undefined){
    // if(selectedTable.isOccupied){
    //     // let timeDelta=((new Date()- selectedTable.pauseTime)/60000).toFixed(2);
    //     // console.log(timeDelta)
    //     // let newPauseTime=(parseFloat(timeDelta)+parseFloat(selectedTable.pauseMin??0)).toFixed(2)
    //     // console.log(newPauseTime)
    //     // selectedTable.pauseMin=newPauseTime
    //     // selectedTable.pauseTime=null
    //     // selectedTable.gameData.endTime=new Date();
    // }   
        selectedTable.gameData.countdownGameEndTime=undefined;
        selectedTable.gameData.endTime=new Date();
        const updatedTable = await selectedTable.save();
        console.log("Game Stopped "+updatedTable._id)
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"0")
        console.log("sending message to: "+selectedTable.deviceId+"/"+selectedTable.nodeID )
    }
}
router.post("/validatePlayers/:tableId",async (req,res)=>{
    // console.log(req.params.tableId)
    // console.log(req.body)
    const selectedTable= await tableModel.findById(req.params.tableId)
    if(!selectedTable) return console.log("Table not found!")
    let minimumBalanceCredit
    if(req.body.gameType=="Minute Billing"){
        minimumBalanceCredit= selectedTable.minuteWiseRules.dayMinAmt;
    }if(req.body.gameType=="Slot Billing"){
        minimumBalanceCredit= selectedTable.slotWiseRules[0].slotCharge;
    }if(req.body.gameType=="Countdown Billing"){
        minimumBalanceCredit= selectedTable.countdownRules[0].countdownDayCharge;
    }
    for(let index in req.body.players){
        const selectedPlayer= await customerModel.findById(req.body.players[index].customerId)
        if(selectedPlayer.isBlackListed) return res.status(403).json({message: `${selectedPlayer.fullName} is Blacklisted!`})
        if(selectedPlayer.isPlaying) return res.status(403).json({message: `${selectedPlayer.fullName} is already occupied!`})
        if(selectedPlayer.maxCredit==undefined){
            selectedPlayer.maxCredit=999;
            selectedPlayer.save();
        }else{
        if(selectedPlayer.maxCredit<(selectedPlayer.credit+minimumBalanceCredit)) return res.status(403).json({message: `${selectedPlayer.fullName} hits his maximum credit limit!`})
        }
    }
    return res.status(201).json({"result":true,"minimumBalanceCredit":minimumBalanceCredit})
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
            if(getdata.customerId==undefined && getdata.fullName!="CASH"){
                console.log(`creating userid for ${getdata.fullName}`)
                const newCustomer= new customerModel({
                    fullName:getdata.fullName,
                    storeId:selectedTable.storeId,
                    isBlackListed:false,
                    credit:0,
                    contact:"+910000000000",
                    maxCredit:999,
                    rewardPoint:0
                })
                const cli=await newCustomer.save();
                getdata.customerId=cli._id.toString();
            }
            if(getdata.fullName=="CASH"){
                const searchedUser=await customerModel.findOne({$and: [ {storeId:selectedTable.storeId  }, { fullName:"CASH" }]})
                console.log(searchedUser)
                if(!searchedUser){
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
                else{
                    getdata.customerId=searchedUser._id.toString();
                }
            }
            finalPlayerList.push(getdata)
        }
        console.log(finalPlayerList)
        for(let index in finalPlayerList){
            updateCustomerDetails(finalPlayerList[index].customerId,true,0,false,false)
            console.log(finalPlayerList[index].customerId)
        }
        selectedTable.gameData.endTime=undefined;
        selectedTable.pauseMin=null;
        selectedTable.pauseTime=null;
        selectedTable.gameData.players=finalPlayerList;
        selectedTable.isOccupied=true;
        selectedTable.gameData.startTime=new Date();
        selectedTable.gameData.gameType=req.body.gameType;
        console.log(selectedTable.gameData.startTime.toLocaleTimeString())
        if(req.body.gameType=="Countdown Billing"){
            selectedTable.gameData.countdownGameEndTime=new Date(new Date().getTime() + parseInt(req.body.countdownMin)*60000)
            console.log(selectedTable.countdownGameEndTime)
            let tableId=req.params.tableId
            var timerID = setTimeout(function(){countdownGame(tableId)}, (parseInt(req.body.countdownMin)*60 * 1000)); 
            selectedTable.gameData.countdownMin=req.body.countdownMin
            console.log(">>>>>>>>>>>>Schedular" )
            console.log("Schedule created",timerID)
        }
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
        if(selectedTable.pauseTime!=null){
        let timeDelta=((new Date()- selectedTable.pauseTime)/60000).toFixed(2);
        console.log(timeDelta)
        let newPauseTime=(parseFloat(timeDelta)+parseFloat(selectedTable.pauseMin??0)).toFixed(2)
        console.log(newPauseTime)
        selectedTable.pauseMin=newPauseTime
        selectedTable.pauseTime=null
        }
        selectedTable.gameData.endTime=new Date();
        const updatedTable = await selectedTable.save();
        mqttAgent.client.publish(selectedTable.deviceId+"/"+selectedTable.nodeID,"0")
        res.status(201).json({"_id":updatedTable._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
function isNight(storeData, gameStartTime){
    console.log(gameStartTime.split(":"))
    if(gameStartTime.split(":")[0]=="00"){
        gameStartTime=gameStartTime.replace("00","24")
    }
    if(storeData.nightStartTime>storeData.nightEndTime){
        console.log(storeData.nightStartTime, storeData.nightEndTime, gameStartTime)
        console.log("next day",gameStartTime<storeData.nightEndTime)
        if((gameStartTime>"01:00"||gameStartTime=="01:00") && gameStartTime<storeData.nightEndTime ){
            console.log("Game after 12",storeData.nightStartTime > gameStartTime , storeData.nightEndTime > gameStartTime)
            if(storeData.nightStartTime > gameStartTime && storeData.nightEndTime > gameStartTime){
                return true
        }
    }
        else{
            console.log("Game Before 12",storeData.nightStartTime < gameStartTime , storeData.nightEndTime < gameStartTime)
            if(storeData.nightStartTime < gameStartTime && storeData.nightEndTime < gameStartTime){
                return true
            }
        }
    
    }
    else{
        console.log("same day")
        console.log(storeData.nightStartTime,storeData.nightEndTime,gameStartTime)
        if(storeData.nightStartTime < gameStartTime &&  gameStartTime < storeData.nightEndTime ){
            return true
        }
    }
    return false
}
router.get("/getBilling/:tableId",verify_token,async (req,res)=>{
    console.log(req.params.tableId)
    try{
        console.log(req.tokendata._id)
        const loggedInUser= await userModel.findById(req.tokendata._id)
        if(!loggedInUser) return res.status(500).json({message: "Logged In user not found!"})
        console.log(loggedInUser.storeId)
        const selectedTable= await tableModel.findById(req.params.tableId);
        if(!selectedTable) return res.status(500).json({message: "Table not found!"})
        console.log(selectedTable.storeId)
        const selectedStore= await storeModel.findById(selectedTable.storeId);
        if(selectedTable.storeId!=loggedInUser.storeId)return res.status(401).json({message: "Access denied!"})
        console.log(selectedTable.gameData.gameType)
        if(selectedTable.gameData.gameType=="Minute Billing"){
            let bills=[]
            let totalBillAmt=0;
            let timeDelta=Math.ceil(((selectedTable.gameData.endTime- selectedTable.gameData.startTime)/60000)-parseFloat(selectedTable.pauseMin??0));
            if(timeDelta==NaN)return res.status(502).json({message: "Something went wrong min"})
            const totalGameTime=timeDelta;
            console.log(timeDelta)
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata',hour12: false});
            console.log(indianStartTime)
            const isnightTime=isNight(selectedStore, indianStartTime)
            console.log(isnightTime)
            if((selectedStore.nightStartTime!=null||selectedStore.nightEndTime!=null) && selectedTable.minuteWiseRules.nightMinAmt>0){
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
            return res.status(201).json({"timeDelta":totalGameTime,"billBreakup":bills,"totalBillAmt":totalBillAmt.toFixed(2),"mealTotal":selectedTable.mealAmount,"productList":selectedTable.productList, selectedTable})
        }
        if(selectedTable.gameData.gameType=="Slot Billing"){
            let bills=[]
            let totalBillAmt=0;
            let timeDelta=Math.ceil(((selectedTable.gameData.endTime- selectedTable.gameData.startTime)/60000)-parseFloat(selectedTable.pauseMin??0));
            if(timeDelta==NaN)return res.status(502).json({message: "Something went wrong slot"})
            const totalGameTime=timeDelta;
            console.log(timeDelta)
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString(undefined, {timeZone: 'Asia/Kolkata',hour12: false});
            console.log(indianStartTime)
            let isNightTime=isNight(selectedStore, indianStartTime)
            console.log(isNightTime)
            for(let index in selectedTable.slotWiseRules){
                console.log(selectedTable.slotWiseRules[index])
                if(selectedTable.slotWiseRules[index].nightSlotCharge==0||selectedTable.slotWiseRules[index].nightSlotCharge==null){
                    isNightTime=false
                    console.log("Night charge is missing")
                    break
                }
            } 
            const slotRule=selectedTable.slotWiseRules.sort((a, b) => b.uptoMin - a.uptoMin).reverse()
                console.log(selectedStore.nightStartTime,selectedStore.nightEndTime)
                while (timeDelta!=0){
                    if(timeDelta<slotRule[0].uptoMin){
                        console.log("I am called when time delta is :",timeDelta)
                        if(isNightTime){
                            bills.push({"title":"Night Slot","time":timeDelta,"amount":slotRule[0].nightSlotCharge})
                            timeDelta=0
                            totalBillAmt=totalBillAmt+slotRule[0].nightSlotCharge
                            
                        }else{
                            bills.push({"title":"Day Slot","time":timeDelta,"amount":slotRule[0].slotCharge})
                            timeDelta=0
                            totalBillAmt=totalBillAmt+slotRule[0].slotCharge
                        }
                    }
                    else{
                    let timeToDeduct=0
                    let amountToCharge=0
                    for(let index in slotRule){
                         console.log(timeDelta," Copairing with ", slotRule[index].uptoMin, timeDelta>slotRule[index].uptoMin, timeDelta==slotRule[index].uptoMin)
                        if(timeDelta>slotRule[index].uptoMin || timeDelta==slotRule[index].uptoMin){
                            if(index!=slotRule.length-1 && timeDelta!=slotRule[index].uptoMin){
                                if(timeDelta<slotRule[parseInt(index)+1].uptoMin){
                                    timeToDeduct=slotRule[parseInt(index)+1].uptoMin>timeDelta?timeDelta:slotRule[parseInt(index)+1].uptoMin
                                    amountToCharge=isNightTime?slotRule[parseInt(index)+1].nightSlotCharge:slotRule[parseInt(index)+1].slotCharge
                                }
                            }
                            else{
                                timeToDeduct=slotRule[index].uptoMin
                                amountToCharge=isNightTime?slotRule[index].nightSlotCharge:slotRule[index].slotCharge
                            }
                            
                        }
                        
                       
                    }
                   if(timeToDeduct!=0 && amountToCharge!=0) {
                    bills.push({"title":isNightTime?"Night Slot":"Day Slot","time":timeToDeduct,"amount":amountToCharge})
                    timeDelta=timeDelta-timeToDeduct
                    totalBillAmt=totalBillAmt+amountToCharge
                    }
                }
                    // console.log(timeDelta,totalBillAmt,bills)
                    // await delay(2000);
                }
            return res.status(201).json({"timeDelta":totalGameTime,"billBreakup":bills,"totalBillAmt":totalBillAmt,"mealTotal":selectedTable.mealAmount,"productList":selectedTable.productList,  selectedTable})
        }
        if(selectedTable.gameData.gameType=="Countdown Billing"){
            let bills=[]
            let totalBillAmt=0;
            const indianStartTime= selectedTable.gameData.startTime.toLocaleTimeString(undefined, {timeZone: 'Asia/Kolkata',hour12: false});
            let isNightTime=isNight(selectedStore, indianStartTime)
            if(isNightTime){
                for(let i in selectedTable.countdownRules){
                    console.log(selectedTable.countdownRules[i])
                    if(selectedTable.countdownRules[i].uptoMin==selectedTable.gameData.countdownMin){
                       if(selectedTable.countdownRules[i].countdownNightCharge!=null ||selectedTable.countdownRules[i].countdownNightCharge!=0){
                        totalBillAmt=selectedTable.countdownRules[i].countdownNightCharge
                        bills.push({"title":"Night Countdown","time":selectedTable.gameData.countdownMin,"amount":selectedTable.countdownRules[i].countdownNightCharge})
                       }
                       else{
                        totalBillAmt=selectedTable.countdownRules[i].countdownDayCharge
                        bills.push({"title":"Day Countdown","time":selectedTable.gameData.countdownMin,"amount":selectedTable.countdownRules[i].countdownDayCharge})
                       }
                    }
                }
            }else{
                for(let i in selectedTable.countdownRules){
                    console.log(selectedTable.countdownRules[i])
                    if(selectedTable.countdownRules[i].uptoMin==selectedTable.gameData.countdownMin){
                        totalBillAmt=selectedTable.countdownRules[i].countdownDayCharge
                        bills.push({"title":"Day Countdown","time":selectedTable.gameData.countdownMin,"amount":selectedTable.countdownRules[i].countdownDayCharge})
                    }
                }
            }
            return res.status(201).json({"timeDelta":selectedTable.gameData.countdownMin,"billBreakup":bills,"totalBillAmt":totalBillAmt,"mealTotal":selectedTable.mealAmount,"productList":selectedTable.productList,  selectedTable})
        }
        console.log(selectedTable.gameData,selectedTable._id)
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
            for(let index in selectedTable.gameData.players){
                updateCustomerDetails(selectedTable.gameData.players[index].customerId,false,req.body.timeDelta,true)
            }
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
                status:(req.body.totalBillAmt-dis)-req.body.cashIn>0?"Due":"Paid",
                credit:(req.body.totalBillAmt-dis)-req.body.cashIn,
                transactionId:`${selectedStore.storeName.replace(" ","").substring(0,3).toUpperCase()}${selectedStore.transactionCounter}`,
                empId:loggedInUser._id
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
                    paid:req.body.checkoutPlayers[index].cashIn==null?0:req.body.checkoutPlayers[index].cashIn,
                    due:req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn,
                    startTime:selectedTable.gameData.startTime,
                    endTime:selectedTable.gameData.endTime,
                    transactionId:gHistory.transactionId,
                    storeId:selectedTable.storeId,
                    empId:loggedInUser._id
                })
                if(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn>0)
                    {
                    const pickedCustomer= await customerModel.findById(req.body.checkoutPlayers[index].customerId)
                    if(pickedCustomer)
                    {
                    // console.log("I am called")
                    pickedCustomer.credit=pickedCustomer.credit+(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn)}
                    pickedCustomer.rewardPoint==undefined?pickedCustomer.rewardPoint=parseInt(req.body.checkoutPlayers[index].cashIn/100):pickedCustomer.rewardPoint=pickedCustomer.rewardPoint+parseInt(req.body.checkoutPlayers[index].cashIn/100);
                    const updatedCustomer =await pickedCustomer.save()
                    gHistory.credit=gHistory.credit+(req.body.checkoutPlayers[index].amount-req.body.checkoutPlayers[index].cashIn)
                    }
                else{
                    const pickedCustomer= await customerModel.findById(req.body.checkoutPlayers[index].customerId)
                    pickedCustomer.rewardPoint==undefined?pickedCustomer.rewardPoint=(req.body.checkoutPlayers[index].cashIn/100):pickedCustomer.rewardPoint=pickedCustomer.rewardPoint+(req.body.checkoutPlayers[index].cashIn/100);
                    await pickedCustomer.save()
                }

                const newCustomerHistory =await custHistory.save()
                console.log(newCustomerHistory.id);
            }
           
            
        }
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
        for(let index in req.body.mealSettlement){
            console.log(req.body.mealSettlement[index])
            if(req.body.mealSettlement[index].customerDetails.customerId){
                console.log(">>>>> meal",req.body.mealSettlement[index])
                const custHistory=new customerHistoryModel({
                    customerId:req.body.mealSettlement[index].customerDetails.customerId,
                    date:new Date(),
                    customerName:req.body.mealSettlement[index].customerDetails.fullName.split("(")[0],
                    description:"Meal Order "+req.body.mealSettlement[index].paymentMethod,
                    quantity:0,
                    discount:0,
                    netPay:req.body.mealSettlement[index].payable,
                    paid:req.body.mealSettlement[index].paid,
                    due:parseFloat(req.body.mealSettlement[index].payable)-parseFloat(req.body.mealSettlement[index].paid),
                    transactionId:gHistory.transactionId,
                    storeId:selectedTable.storeId,
                    empId:loggedInUser._id
                })
                if((parseFloat(req.body.mealSettlement[index].payable)-parseFloat(req.body.mealSettlement[index].paid))>0)
                    {
                    const pickedCustomer= await customerModel.findById(req.body.mealSettlement[index].customerDetails.customerId)
                    if(pickedCustomer)
                    {
                    pickedCustomer.credit=pickedCustomer.credit+(parseFloat(req.body.mealSettlement[index].payable)-parseFloat(req.body.mealSettlement[index].paid))}
                    const updatedCustomer =await pickedCustomer.save()
                    gHistory.credit=gHistory.credit+(parseFloat(req.body.mealSettlement[index].payable)-parseFloat(req.body.mealSettlement[index].paid))
                    }
                gHistory.meal=gHistory.meal+parseFloat(req.body.mealSettlement[index].payable)
                const newCustomerHistory =await custHistory.save()
                console.log(newCustomerHistory.id); 
            }
        }

        const updatedStore =await selectedStore.save()
        const newGameHistory= await gHistory.save();
        selectedTable.gameData.startTime=undefined;
        selectedTable.gameData.endTime=undefined;
        selectedTable.gameData.players=[];
        selectedTable.gameData.countdownGameEndTime=undefined;
        selectedTable.gameData.countdownMin=undefined;
        selectedTable.gameData.gameType=undefined;
        selectedTable.pauseMin=null
        selectedTable.pauseTime=null
        selectedTable.mealAmount=null
        selectedTable.productList=null
        selectedTable.isOccupied=false;
        const updatedTable = await selectedTable.save();
        res.status(201).json({"HistoryId":newGameHistory._id,"TableId":updatedTable._id,"UpdatedStoreData":updatedStore._id})

    }catch(error){
        res.status(500).json({message: error.message})
    }
})
module.exports=router