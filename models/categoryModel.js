const { required } = require("joi")
const mongoos=require("mongoose")

const categorySchema= new mongoos.Schema({
    storeId:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    name: {
        type:String,
        required:true
    }

})
module.exports=mongoos.model('category',categorySchema)