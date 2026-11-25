const UserModel=require('../Models/UserModel');
const bcrypt=require('bcrypt');
exports.createUser=async(req,res)=>{
    const body=req.body;
    if(!body.name || !body.email || !body.password || !body.phone || !body.yearOfJoining || !body.role){
        return res.json({message:'All fields are required'});
    }
    else{
        const newPassword=bcrypt.hashSync(body.password,10);
        await UserModel.create({
            name:body.name,
            email:body.email,
            password:newPassword,
            phone:body.phone,
            yearOfJoining:body.yearOfJoining,
            role:body.role,
        });
        return res.json({message:'User created successfully'});
    }
}
exports.loginUser=async(req,res)=>{
    const body=req.body;
    if(!body.email || !body.password){
        return res.json({message:'Email and password are required'});
    }else{
        const user=await UserModel.findOne({email:body.email});
        if(!user){
            return res.json({message:'User not found'});
        }else{
            const matchPassword=bcrypt.compareSync(body.password,user.password);
            if(!matchPassword){
                return res.json({message:'Invalid password'});
            }else{
                if(user.status=='inactive'){
                    return res.json({"message":"You are not an active user"});
                }else{
                    return res.json(user);
                }
            }
        }
    }
}
exports.allUser=async(req,res)=>{
    const users=await UserModel.find({"role":"student"});
    return res.json(users);
}
exports.changeStatus=async(req,res)=>{
    const id=req.params.id;
    const user=await UserModel.findById(id);
    const status=user.status;
    if(status=='active'){
        await UserModel.findByIdAndUpdate(id,{status:'inactive'});
        return res.json({message:'User status changed to inactive'});
    } else {
        await UserModel.findByIdAndUpdate(id,{status:'active'});
        return res.json({message:'User status changed to active'});
    }
}
exports.allFaculty=async(req,res)=>{
    const users=await UserModel.find({"role":"faculty"});
    return res.json(users);
}
