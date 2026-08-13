const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));

// Set max room capacity (change this number whenever you like!)
const MAX_PLAYERS = 5;

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // When a player attempts to join
    socket.on('join_room', ({ roomCode, playerName }) => {
        const room = io.sockets.adapter.rooms.get(roomCode);
        const currentSize = room ? room.size : 0;

        // Check if room is full
        if (currentSize >= MAX_PLAYERS) {
            socket.emit('room_error', `Room "${roomCode}" is full! (Max ${MAX_PLAYERS} players)`);
            return;
        }

        // Attach room code and name to this specific player's socket connection
        socket.join(roomCode);
        socket.currentRoom = roomCode;
        socket.playerName = playerName || `Player ${currentSize + 1}`;

        console.log(`${socket.playerName} (${socket.id}) joined room: "${roomCode}"`);

        // Update room list for everyone currently in the room
        broadcastRoomStatus(roomCode);
    });

    // Handle player leaving or closing tab
    socket.on('disconnect', () => {
        if (socket.currentRoom) {
            console.log(`${socket.playerName} left room: "${socket.currentRoom}"`);
            broadcastRoomStatus(socket.currentRoom);
        }
    });

    // Helper function to count and collect player names in a room
    function broadcastRoomStatus(roomCode) {
        const room = io.sockets.adapter.rooms.get(roomCode);
        if (!room) return;

        const playerList = [];
        for (const socketId of room) {
            const playerSocket = io.sockets.sockets.get(socketId);
            if (playerSocket) {
                playerList.push(playerSocket.playerName);
            }
        }

        // Send updated info to ALL connected players in this room
        io.to(roomCode).emit('room_status', {
            roomCode: roomCode,
            playerCount: playerList.length,
            maxPlayers: MAX_PLAYERS,
            players: playerList
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});