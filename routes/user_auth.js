const express = require("express")
const router= express.Router()
const bcrypt = require("bcryptjs")
const jwt= require("jsonwebtoken")
const usermodel=require("../models/userModel")
const validator= require("../validators/validation")
const nodemailer = require('nodemailer');
const mongodb=require("mongodb");

require("dotenv").config()
process.env.TZ = "Asia/Calcutta";
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@circolife.com',
    pass: process.env.MAILER_PASS,
  },
  port:465,
  host:"smtp.gmail.com"
});

const verifie_token= require("../validators/verifyToken")

//login user
router.post('/login',async (req,res)=>{

    //validate the data
    const valid=validator.login_validation(req.body);
    if(valid.error){
        return res.status(400).send({"message":valid.error.details[0].message});
    };
    let user=await usermodel.findOne({$or:[{userId:req.body.email},{userId:req.body.email}]});
    if(!user) return res.status(400).send({"message":"User dose not exist!"});

    // validate password
    const validPass=await bcrypt.compare(req.body.password,user.password);
    if(!validPass) return res.status(400).send({"message":"Email id or password is invalid!"});
    if (!user.userStatus) return res.status(400).send({"message":"User is not an active user!"});

    //create and assign token
    const token= jwt.sign({_id:user._id,isSuperAdmin:user.isSuperAdmin,userDesignation:user.userDesignation},process.env.SECREAT_TOKEN);
    res.header('auth-token',token).send(token);
})

//create user
router.post('/register',async (req,res)=>{
    let ts =new Date();
    //validate the data
    const valid=validator.resistration_validation(req.body);
    if(valid.error){
        return res.status(400).send(valid.error.details[0].message);
    }
    const email_exist=await usermodel.findOne({email:req.body.email});
    if(email_exist) return res.status(400).send({"message":"Email already exist!"});

    //hash the password
    const salt= await bcrypt.genSalt(10);
    const hashedpassword= await bcrypt.hash(req.body.password,salt);
    
    console.log(ts.toString());
    const user= new usermodel({
        fullName:req.body.fullName,
        mobile:req.body.mobile,
        email:req.body.email,
        userStatus:req.body.userStatus,
        isSuperAdmin:req.body.isSuperAdmin,
        onBoardingDate:ts,
        profileImage:req.body.profileImage,
        password:hashedpassword,
        storeId:req.body.storeId,
        userDesignation:req.body.userDesignation,
    })
    try{
        const newUser=await user.save()
        res.status(201).json({"_id":newUser.id})
    }
    catch(error){
        res.status(400).json({message:error.message})
    }
})



//get all user
router.get('/', verifie_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    try{
        const users=await usermodel.find();
        res.status(201).json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})



//update user
router.patch('/:id', getUser,async(req,res)=>{
    if(req.body.fullName!=null){
        res.user.fullName=req.body.fullName;
    }
    if(req.body.profileImage!=null){
        res.user.profileImage=req.body.profileImage;
    }
    if(req.body.userDesignation!=null){
        res.user.userDesignation=req.body.userDesignation;
    }
    if(req.body.shopId!=null){
        res.user.shopId=req.body.shopId;
    }
    try{
        const newUser=await res.user.save()
        res.status(201).json({"_id":newUser.id})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})


router.delete("/:id",verifie_token,async (req,res)=>{
    if(!req.tokendata.isSuperAdmin)res.status(500).json({message: "Access Denied!"})
    console.log("Deleting user: "+req.params.id)
    user=await usermodel.findById(req.params.id)
        if(user==null){
            return res.status(404).json({message:"User unavailable!"})
        }
    try{
        const reasult= await usermodel.deleteOne({_id: new mongodb.ObjectId(req.params.id)})
        res.json(reasult)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//middleware
async function getUser(req,res,next){
    let user
    console.log(req.params.id);
    try{
        user=await usermodel.findById(req.params.id)
        console.log(user);
        if(user==null){
            return res.status(404).json({message:"User unavailable!"})
        }
    }catch(error){
        res.status(500).json({message: error.message})
    }
    res.user=user
    next()
}
module.exports=router