const { required } = require("joi")
const mongoos=require("mongoose")

const expanseSchema= new mongoos.Schema({
    userId:{
        type:String,
        required:true
    },
    storeId:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    category: {
        categoryId: {
            type:String,
            required:true
        },
        name: {
            type:String,
            required:true
        }
    },
    invoiceNumber: {
        type:String,
        required:true
    },
    vendorName: {
        type:String,
        required:true
    },
    description:{
        type:String,
        required:false
    },
    amount: {
        type:Number,
        required:true
    },
    invoiceAmount: {
        type:Number,
        required:true
    },
    quantity: {
        type:Number,
        required:true
    },
    note: {
        type:String,
        required:true
    },
    paid: {
        type:Number,
        required:true
    },
    status: {
        type:String,
        required:true
    }
    

})
module.exports=mongoos.model('expanse',expanseSchema)