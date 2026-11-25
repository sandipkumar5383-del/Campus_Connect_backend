
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Message is optional because users can send files alone
    message: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },

    fileUrl: {
        type: String,
        default: ''
    },

    fileName: {
        type: String,
        default: ''
    },

    fileType: {
        type: String,
        default: ''
    },

    fileSize: {
        type: Number,
        default: 0
    },

    timestamp: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
