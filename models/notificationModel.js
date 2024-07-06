const { required } = require("joi")
const mongoos=require("mongoose")

const notificationSchema= new mongoos.Schema({
    storeId:{
        type:String,
        required:true
    },
    subject:{
        type:Array,
        required:true
    },
    body:{
        type:Array,
        required:true
    },
    isRead:{
        type:Boolean,
        required:true
    },
    type:{
        type: String,
        required: true
    }
})
module.exports=mongoos.model('Notifications',notificationSchema)