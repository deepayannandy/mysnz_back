const express = require("express")
const router= express.Router()
const bcrypt = require("bcryptjs")
const jwt= require("jsonwebtoken")
const userModel=require("../models/userModel")
const validator= require("../validators/validation")
const nodemailer = require('nodemailer');
const mongodb=require("mongodb");
const storeModel= require("../models/storesModel")
const storeSubsModel= require("../models/storeSubscriptionModel")
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

const verify_token= require("../validators/verifyToken")

//login user
router.post('/login',async (req,res)=>{

    //validate the data
    const valid=validator.login_validation(req.body);
    if(valid.error){
        return res.status(400).send({"message":valid.error.details[0].message});
    };
    let user=await userModel.findOne({$or:[{email:req.body.userId},{mobile:req.body.userId}]});
    if(!user) return res.status(400).send({"message":"User dose not exist!"});
    if(user.loginIndex!=undefined ||user.loginIndex>0)  return res.status(400).send({"message":"User is already logged in!"});
    // validate password
    const validPass=await bcrypt.compare(req.body.password,user.password);
    if(!validPass) return res.status(400).send({"message":"Email id or password is invalid!"});
    if (!user.userStatus) return res.status(400).send({"message":"User is not an active user!"});
    
    //login counter check
    user.loginIndex=1;
    await user.save()
    //create and assign token
    const token= jwt.sign({_id:user._id,isSuperAdmin:user.isSuperAdmin,userDesignation:user.userDesignation,passwordRev:user.passwordRev},process.env.SECREAT_TOKEN);
    res.header('auth-token',token).send(token);
    
})
//ClientLogin 
router.post('/clientLogin',async (req,res)=>{
    //validate the data
    const valid=validator.login_validation(req.body);
    if(valid.error){
        return res.status(400).send({"message":valid.error.details[0].message});
    };
    let user=await userModel.findOne({$or:[{email:req.body.userId},{mobile:req.body.userId}],userDesignation: {$ne:"SuperAdmin"}});
    if(!user) return res.status(400).send({"message":"User dose not exist!"});
    console.log(user)
    if(user.userDesignation=="SuperAdmin") return res.status(400).send({"message":"SuperAdmin Login is not possible!"});
    // if(user.loginIndex!= undefined) if(user.loginIndex>0) return res.status(400).send({"message":"User is already logged in!"});
    //validate subscription
    const activeSubscription= await storeSubsModel.find({$and:
        [{endDate:{
           $gt: new Date(),
       }},{
           storeId:user.storeId
       }, {isActive:true}]
   })
   if(activeSubscription.length<1) return res.status(400).send({"message":"Your subscription is over! Please renew your Subscription"});
    // validate password
    const validPass=await bcrypt.compare(req.body.password,user.password);
    if(!validPass) return res.status(400).send({"message":"Email id or password is invalid!"});
    if (!user.userStatus) return res.status(400).send({"message":"User is not an active user!"});
    if(user.passwordRev==undefined) user.passwordRev=0;
    user.loginTime=new Date();
    //create and assign token
    const token= jwt.sign({_id:user._id,isSuperAdmin:user.isSuperAdmin,userDesignation:user.userDesignation,passwordRev:user.passwordRev,loginTime:user.loginTime},process.env.SECREAT_TOKEN);
    // res.header('auth-token',token).send(token);
     //login counter check
     user.loginIndex=1;
    await user.save();
    res.status(201).json({"auth_token":token,"storeId":user.storeId})
})
//create user
router.post('/register',async (req,res)=>{
    let ts =new Date();
    //validate the data
    const valid=validator.resistration_validation(req.body);
    if(valid.error){
        return res.status(400).send(valid.error.details[0].message);
    }
    const email_exist=await userModel.findOne({email:req.body.email});
    if(email_exist) if(email_exist.userDesignation==req.body.userDesignation) return res.status(400).send({"message":"Email already exist!"});
    

    const mobile_exist=await userModel.findOne({mobile:req.body.mobile});
    if(mobile_exist ) if(email_exist.userDesignation==req.body.userDesignation) return res.status(400).send({"message":"Phone number already exist!"});

    //hash the password
    const salt= await bcrypt.genSalt(10);
    const hashedPassword= await bcrypt.hash(req.body.password,salt);
    
    console.log(ts.toString());
    const user= new userModel({
        fullName:req.body.fullName,
        mobile:req.body.mobile,
        email:req.body.email,
        userStatus:true,
        isSuperAdmin:req.body.isSuperAdmin,
        onBoardingDate:ts,
        profileImage:req.body.profileImage==null ? "-":req.body.profileImage,
        password:hashedPassword,
        storeId:req.body.storeId,
        userDesignation:req.body.userDesignation,
        passwordRev:0,
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
router.get('/', verify_token, async (req,res)=>{
    console.log(req.tokendata)
    if(!req.tokendata.isSuperAdmin)return res.status(500).json({message: "Access Denied!"})
    try{
        const users=await userModel.find();
        res.status(201).json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.get('/whoAmI', verify_token, async (req,res)=>{
    // console.log(req.tokendata)
    try{
        const loggedInUser= await userModel.findById(req.tokendata._id)
        if(!loggedInUser)return res.status(500).json({message: "User Not found!"})
        if(req.tokendata.passwordRev==undefined || loggedInUser.passwordRev!=req.tokendata.passwordRev) return res.status(409).json({message: "Password Changed pleas login again!"})
        console.log(new Date(req.tokendata.loginTime),loggedInUser.loginTime,(new Date(req.tokendata.loginTime)>loggedInUser.loginTime))
        if(req.tokendata.loginTime== undefined || new Date(req.tokendata.loginTime)<loggedInUser.loginTime) return res.status(409).json({message: "User is already logged in!"})
        const myStore=loggedInUser.userDesignation=="SuperAdmin"?"SuperAdmin": await  storeModel.findById(loggedInUser.storeId)
        const storeName=myStore.storeName
        res.status(201).json({...loggedInUser.toObject(),storeName})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//update user
router.patch('/:id', getUser,async(req,res)=>{
    if(req.body.fullName!=null){
        res.user.fullName=req.body.fullName;
    }
    if(req.body.email!=null){
        res.user.email=req.body.email;
    }
    if(req.body.mobile!=null){
        res.user.mobile=req.body.mobile;
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
    if(req.body.password!=null){
         //hash the password
        const salt= await bcrypt.genSalt(10);
        const hashedPassword= await bcrypt.hash(req.body.password,salt);
        res.user.password=hashedPassword
    }
    try{
        const newUser=await res.user.save()
        res.status(201).json({"_id":newUser.id})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})


router.delete("/:id",verify_token,async (req,res)=>{  
    console.log("Deleting user: "+req.params.id)
    user=await userModel.findById(req.params.id)
        if(user==null){
            return res.status(404).json({message:"User unavailable!"})
        }
    try{
        const result= await userModel.deleteOne({_id: new mongodb.ObjectId(req.params.id)})
        res.json(result)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

router.patch("/updatePassword/:id",getUser,async(req,res)=>{
    if(req.body.newPassword){
        //hash the password
        const salt= await bcrypt.genSalt(10);
        const hashedpassword= await bcrypt.hash(req.body.newPassword,salt);
        res.user.password=hashedpassword;
        res.user.passwordRev=res.user.passwordRev+1;
    }
    try{
        const newUser=await res.user.save()
        res.status(201).json({"_id":newUser.id})
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//get all user
router.get('/getMyStaffs', verify_token, async (req,res)=>{
    console.log("I am called")
    console.log(req.tokendata)
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        console.log(loggedInUser)
    try{
        const users=await userModel.find({storeId:loggedInUser.storeId,$or:[{userDesignation:"staff"}, {userDesignation:"Staff"}]});
        res.status(201).json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//get all user
router.get('/getAllAdmins', verify_token, async (req,res)=>{
    console.log("I am called")
    console.log(req.tokendata)
    const loggedInUser= await userModel.findById(req.tokendata._id)
    if(!loggedInUser)return res.status(500).json({message: "Access Denied! Not able to validate the user."})
        console.log(loggedInUser)
    try{
        const users=await userModel.find({$or:[{userDesignation:"Admin"}, {userDesignation:"admin"}]});
        res.status(201).json(users)
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//middleware
async function getUser(req,res,next){
    let user
    console.log(req.params.id);
    try{
        user=await userModel.findById(req.params.id)
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