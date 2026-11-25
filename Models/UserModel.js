const mongoose=require('mongoose');
const UserSchema=new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    yearOfJoining:{
        type: Number,
        required: true
},
role:{
    type: String,
    required: true,
    enum: ['student', 'faculty', 'admin'],
},
status:{
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'inactive'
},
});
const UserModel=mongoose.model('User',UserSchema);
module.exports=UserModel;