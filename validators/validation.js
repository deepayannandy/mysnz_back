//validation
const joi =require("joi")

const resistration_validation=data=>{
const schema=joi.object().keys({ 
    email:joi.string().email().required(),
    mobile: joi.string().length(10).pattern(/[1-9]{1}[0-9]{9}/).required(),
    fullName:joi.string().min(3).required(),
    userStatus:joi.boolean(),
    isSuperAdmin:joi.boolean(),
    profileImage:joi.string(),
    password:joi.string().required(),
    shopId:joi.string().required(),
    userDesignation:joi.string().required(),
});
return schema.validate(data);
}

const login_validation=data=>{
    const schema=joi.object().keys({ 
        userId:joi.string().required(),
        password:joi.string().min(6).required(), 
    });
    return schema.validate(data);
    }

module.exports.resistration_validation=resistration_validation;
module.exports.login_validation=login_validation;