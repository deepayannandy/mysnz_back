const { required } = require("joi")
const mongoos=require("mongoose")

const productSchema= new mongoos.Schema({
    productName:{
        type:String,
        required:true
    },
    storeId:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    sku:{
        type:String,
        required:true
    },
    basePrice:{
        type:Number,
        required:true
    },
    quantity:{
        type: Number,
        required: true
    },
    isOutOfStock:{
        type: Boolean,
        required: true
    },
    productImage:{
        type:String,
        required: false
    },
    salePrice:{
        type:Number,
        required: true
    }

})
module.exports=mongoos.model('Product',productSchema)