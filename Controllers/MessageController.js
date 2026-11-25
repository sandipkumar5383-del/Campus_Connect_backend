
const Message = require('../Models/MessageModel');
const mongoose = require('mongoose');
const Club = require('../Models/ClubModel');

// Get all messages of a club
exports.getClubMessages = async (req, res) => {
    try {
        const { clubId, userId } = req.params;

        // Validate Club ID
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({
                message: "Invalid Club ID"
            });
        }

        // Validate User ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid User ID"
            });
        }

        // Check club membership or creator
        const club = await Club.findOne({
            _id: clubId,
            status: "active",
            $or: [
                { members: userId },
                { createdBy: userId }
            ]
        });

        if (!club) {
            return res.status(404).json({
                message: "Club not found or user is not a member"
            });
        }

        // Fetch messages
        const messages = await Message.find({
            clubId: clubId
        })
        .populate('senderId', 'name email')
        .sort({ timestamp: 1 });

        return res.status(200).json(messages);

    } catch (error) {
        console.error("Get Club Messages Error:", error);

        return res.status(500).json({
            message: "Failed to fetch messages"
        });
    }
};


// Send message to a club

exports.sendClubMessage = async (req, res) => {
    try {
        const { clubId, userId } = req.params;

        const message = (req.body.message || '').trim();

        // Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(clubId) ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return res.status(400).json({
                message: 'Invalid Club ID or User ID'
            });
        }

        // Allow text only, file only, or both
        if (!message && !req.file) {
            return res.status(400).json({
                message: 'Please enter a message or select a file'
            });
        }

        const club = await Club.findOne({
            _id: clubId,
            status: 'active'
        });

        if (!club) {
            return res.status(404).json({
                message: 'Club not found'
            });
        }

        const isCreator =
            String(club.createdBy) === String(userId);

        const isMember = (club.members || []).some(member =>
            String(member?._id || member) === String(userId)
        );

        if (!isCreator && !isMember) {
            return res.status(403).json({
                message: 'You are not a member of this club'
            });
        }

        // Save message and file
        const savedMessage = await Message.create({
            clubId: clubId,
            senderId: userId,
            message: message,

            fileUrl: req.file
                ? `/chat-files/${req.file.filename}`
                : '',

            fileName: req.file
                ? req.file.originalname
                : '',

            fileType: req.file
                ? req.file.mimetype
                : '',

            fileSize: req.file
                ? req.file.size
                : 0
        });

        await savedMessage.populate('senderId', 'name email');

        // Send real-time message
        const io = req.app.get('io');

        if (io) {
            io.to(`club:${clubId}`).emit(
                'newClubMessage',
                savedMessage
            );
        }

        return res.status(201).json(savedMessage);

    } catch (error) {
        console.error('SEND CLUB MESSAGE ERROR:', error);

        return res.status(500).json({
            message: error.message
        });
    }
};
