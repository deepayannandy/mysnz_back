const { types, required } = require("joi")
const mongoos=require("mongoose")

const subscriptionSchema= new mongoos.Schema({
    subscriptionName:{
        type:String,
        required:true
    },
    subscriptionPrice:{
        type:Number,
        required:true
    },
    subscriptionDescription:{
        type:String,
        required:true
    },
    subscriptionValidity:{
        type:Number,
        required:true
    },
    access:{
        type:Array,
        required:true
    },
    billings:{
        type:Array,
        required:true
    },
    isYearly:{
        type:Boolean,
        required:true
    },

})
module.exports=mongoos.model('subscription',subscriptionSchema )