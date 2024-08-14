const mongoos=require("mongoose")

const storeSchema= new mongoos.Schema({
    storeName:{
        type:String,
        required:true
    },
    contact:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    onboarding:{
        type:Date,
        required:true
    },
    validTill:{
        type:Date,
        required:false
    },
    profileImage:{
        type:String,
        required:false
    },
    transactionCounter:{
        type:Number,
        required:false
    }
})
module.exports=mongoos.model('Store',storeSchema )