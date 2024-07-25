const { required } = require("joi")
const mongoos=require("mongoose")

const deviceSchema= new mongoos.Schema({
    deviceId:{
        type:String,
        required:true
    },
    storeId:{
        type:String,
        required:true
    },
    nodes:{
        type:Array,
        required:true
    },
    nodeStatus:{
        type:Array,
        required:true
    },
    onboarding:{
        type:Date,
        required:true
    },
    warrantyExpiryDate:{
        type:Date,
        required:true
    },
    deviceType:{
        type: String,
        required: true
    },
    isActive:{
        type: Boolean,
        required: true
    },
    warrantyAvailingDate:{
        type:Array,
        required: false
    }

})
module.exports=mongoos.model('Device',deviceSchema)