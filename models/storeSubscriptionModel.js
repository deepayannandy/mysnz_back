const { types, required } = require("joi")
const mongoos=require("mongoose")

const storeSubscriptionSchema= new mongoos.Schema({
    storeId:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    },
    isYearly:{
        type:Boolean,
        required:true
    },
    subscriptionName:{
        type:String,
        required:true
    },
    subscriptionAmount:{
        type:Number,
        required:true
    },
    subscriptionId:{
        type:String,
        required:true
    },
    subscriptionValidity:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date,
        required:false
    },
    endDate:{
        type:Date,
        required:false
    }
})
module.exports=mongoos.model('storeSubscription',storeSubscriptionSchema )