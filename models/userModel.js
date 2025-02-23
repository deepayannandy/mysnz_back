const { object } = require("joi")
const mongoos=require("mongoose")

const userSchema= new mongoos.Schema({
    fullName:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    userStatus:{
        type:Boolean,
        required:false
    },
    userDesignation:{
        type:String,
        required:true
    },
    isSuperAdmin:{
        type:Boolean,
        required:false
    },
    onBoardingDate:{
        type:Date,
        required:false
    },
    profileImage:{
        type:String,
        required:false
    },
    password:{
        type:String,
        required:true
    },
    storeId:{
        type:String,
        required:true
    },
    loginTime:{
        type:Date,
        required:false
    },
    passwordRev:{
        type:Number,
        required:false
    },
    loginIndex:{
        type:Number,
        required:false
    },
    tempOTP:{
        type:Number,
        required:false
    },
    isRootUser:{
        type:Boolean,
        required:false
    },
})

module.exports=mongoos.model('User',userSchema )