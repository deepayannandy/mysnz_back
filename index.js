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


app.use("/api/user",userRouter)

app.listen(6622,()=>{
    console.log("Http Server is listning!")
})