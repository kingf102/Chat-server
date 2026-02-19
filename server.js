const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows connections from mobile apps
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Memory storage for active connections
// Key: username, Value: socket.id
const onlineUsers = {};

// 1. LOGIN/STORE ENDPOINT (from your HTML/Flutter request)
app.post('/store', (req, res) => {
    const { username, password } = req.body;
    console.log(`User attempting login: ${username}`);
    
    // In a real app, you'd verify the password here.
    // For now, we return a success status.
    res.status(200).json({ 
        status: "success", 
        id: username 
    });
});

// 2. REAL-TIME SOCKET LOGIC
io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);

    // When the app connects, it "registers" the username
    socket.on('register_user', (username) => {
        onlineUsers[username] = socket.id;
        console.log(`User Registered: ${username} (Socket: ${socket.id})`);
    });

    // Handling message routing
    socket.on('send_message', (data) => {
        const { from, to, message } = data;
        const recipientSocket = onlineUsers[to];

        if (recipientSocket) {
            // Forward message to the specific friend
            io.to(recipientSocket).emit('receive_message', {
                from: from,
                to: to,
                message: message
            });
            console.log(`Message relayed from ${from} to ${to}`);
        } else {
            console.log(`User ${to} is offline. Message not delivered via Socket.`);
