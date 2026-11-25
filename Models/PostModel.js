const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: String,
    userRole: {
        type: String,
        enum: ["student", "admin"],
        required: true
    },
    content: {
    type: String,
    required: false,
    default: ""
},
    file: String,
    fileType: {
    type: String,
    enum: ["image", "pdf", null],
    default: null
},
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        userName: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    shares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]

}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);