
const MessageController = require("../Controllers/MessageController");
const express = require("express");
const upload = require("../Middleware/chatUpload");

const MessageRouter = express.Router();

// Get club messages
MessageRouter.get(
    "/clubs/:clubId/users/:userId/messages",
    MessageController.getClubMessages
);

// Send club message
MessageRouter.post(
    "/clubs/:clubId/users/:userId/messages",upload.single('file'),
    MessageController.sendClubMessage
);

module.exports = MessageRouter;
