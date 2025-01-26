const { types, required } = require("joi")
const mongoos=require("mongoose")

const paymentGatewaySchema= new mongoos.Schema({
    orderId:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    currency:{
        type:String,
        required:true
    },
    receipt:{
        razorpayPaymentId: {
          type: String,
          required: false,
        },
        razorpayOrderId: {
          type: String,
          required: false,
        },
        razorpaySignature:{
            type:String,
            required:false
        },
      },
    initiationTime:{
        type:Date,
        required:true
    },
    completionTime:{
        type:Date,
        required:false
    }
})
module.exports=mongoos.model('paymentGatewayLogs',paymentGatewaySchema )