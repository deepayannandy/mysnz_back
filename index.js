require("dotenv").config()
const https= require("https");
var cors = require('cors');
const fs= require("fs");
const path= require("path");
const express= require("express");
const app= express();
const mongoos=require("mongoose");
const { crypto, randomBytes } =require('crypto');

process.env.TZ = "Asia/Calcutta";
mongoos.set("strictQuery", false);
mongoos.connect(process.env.DATABASE_URL)
const db= mongoos.connection
db.on('error',(error)=> console.error(error))
db.once('open',()=> console.log('Connected to Database!'))


app.use(express.json())
app.use(cors());

const userRouter= require("./routes/user_auth")
const storeRouter= require("./routes/store")
const clientRouter= require("./routes/client")
const deviceRouter= require("./routes/device")
const notificationRouter= require("./routes/notifications")
const dbBackupRouter= require("./routes/dbBackup")
const subscriptionRouter= require("./routes/subscription")
const storeSubscriptionRouter= require("./routes/storeSubscription")

app.use("/api/user",userRouter)
app.use("/api/store",storeRouter)
app.use("/api/client",clientRouter)
app.use("/api/devices",deviceRouter)
app.use("/api/notification",notificationRouter)
app.use("/api/dbBackup",dbBackupRouter)
app.use("/api/subscription",subscriptionRouter)
app.use("/api/storeSubscription",storeSubscriptionRouter)

app.listen(6622,()=>{
    console.log("Http Server is listening!")
})