const { required } = require("joi")
const mongoos=require("mongoose")

const dailyReportSchema= new mongoos.Schema({
    userId:{
        type:String,
        required:true
    },
    storeId:{
        type:String,
        required:true
    },
    userName:{
        type:Array,
        required:true
    },
    tableCollection:{
        type:Number,
        required:true
    },
    cafeCollection:{
        type:Number,
        required:true
    },
    totalCollection:{
        type:Number,
        required:true
    },
    cash:{
        type:Number,
        required:true
    },
    card:{
        type:Number,
        required:true
    },
    dues: {
        type:Number,
        required:true
    }
    

})
module.exports=mongoos.model('DailyReport',dailyReportSchema)