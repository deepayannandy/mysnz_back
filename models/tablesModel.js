const mongoos=require("mongoose")

const tablesSchema= new mongoos.Schema({
    storeId:{
        type:String,
        required:true
    },
    tableName:{
        type:String,
        required:true
    },
    deviceId:{
        type:String,
        required:true
    },
    nodeID:{
        type:String,
        required:true
    },
    isOccupied:{
        type:Boolean,
        required:true
    },
    gameTypes:{
        type:Array,
        required:true
    },
    netAmount:{
        type:Number,
        required:false
    },
    gameData:
        {
            players: [
                {
                    fullName:{
                        type:String,
                        required:true
                    },
                    customerId:{
                        type:String,
                        required:true
                    }
                }
            ],
            startTime: {
              type: Date,
              required: false,
            },
            endTime: {
              type: Date,
              required: false,
            },
            gameType:{
                type:String,
                required:false
            }
          },
    minuteWiseRules:{
        dayUptoMin:{
            type:Number,
            required:false
        },
        dayMinAmt:{
            type:Number,
            required:false
        },
        dayPerMin:{
            type:Number,
            required:false
        },
        nightUptoMin:{
            type:Number,
            required:false
        },
        nightMinAmt:{
            type:Number,
            required:false
        },
        nightPerMin:{
            type:Number,
            required:false
        },
    },
    isBooked:{
        type:Boolean,
        required:true
    }
})
module.exports=mongoos.model('Table',tablesSchema )