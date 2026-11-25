
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

// Routes
const UserRouter = require('./Routes/UserRouter');
const ClubRouter = require('./Routes/ClubRouter');
const MessageRouter = require('./Routes/MessageRouter');
const PostRouter = require("./Routes/PostRouter");

// Models
const Club = require('./Models/ClubModel');

// Jobs
const {
    startEventStatusJob
} = require('./Jobs/eventStatusJob');

const app = express();

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/campus_connect')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB Error:', err));

// Start event status job
startEventStatusJob();

// Middleware
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.urlencoded({ extended: false }));

// Static folders
app.use('/events', express.static('events'));
app.use('/clubs', express.static('clubs'));
app.use(
    '/chat-files',
    express.static(path.join(__dirname, 'chat-files'))
);
app.use("/posts", express.static(path.join(__dirname, "posts")));
// Routes
app.use('/api', UserRouter);
app.use('/club', ClubRouter);
app.use('/message', MessageRouter);
app.use("/post", PostRouter);
// HTTP Server
const httpServer = http.createServer(app);

// Socket.IO Setup
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

// Socket Connection
io.on('connection', (socket) => {

    console.log('User connected:', socket.id);

    // JOIN CLUB
    socket.on('joinClub', async ({ clubId, userId }) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(clubId) ||
                !mongoose.Types.ObjectId.isValid(userId)
            ) {
                return socket.emit('chatError', {
                    message: 'Invalid Club ID or User ID'
                });
            }

            // Check membership or creator
            const club = await Club.findOne({
                _id: clubId,
                status: 'active',
                $or: [
                    { members: userId },
                    { createdBy: userId }
                ]
            });

            if (!club) {
                return socket.emit('chatError', {
                    message: 'You are not authorized to join this chat'
                });
            }

            // Leave previous club rooms
            for (const room of socket.rooms) {
                if (room.startsWith('club:')) {
                    socket.leave(room);
                }
            }

            // Join selected club room
            const room = `club:${clubId}`;

            await socket.join(room);

            console.log('User joined:', userId);
            console.log('Club room:', room);
            console.log(
                'Members in room:',
                io.sockets.adapter.rooms.get(room)?.size
            );

            socket.emit('joinedClub', {
                clubId,
                message: 'Successfully joined club chat'
            });

        } catch (error) {

            console.error('Socket Join Error:', error);

            socket.emit('chatError', {
                message: 'Unable to join club chat'
            });

        }

    });

    // LEAVE CLUB
    socket.on('leaveClub', (data) => {

        const clubId =
            typeof data === 'object' ? data.clubId : data;

        if (clubId) {
            socket.leave(`club:${clubId}`);
            console.log('User left club:', clubId);
        }

    });

    // DISCONNECT
    socket.on('disconnect', () => {

        console.log('User disconnected:', socket.id);

    });

});

// Start Server
const port = 8000;

httpServer.listen(port, () => {

    console.log(`Server is running on port ${port}`);
    console.log('Socket.IO is ready');

});
