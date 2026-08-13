// Cloudflare Worker Real-Time Room Controller
const rooms = new Map();

export default {
    async fetch(request, env, ctx) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
            return new Response('Expected WebSocket connection', { status: 426 });
        }

        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        server.accept();

        let currentRoom = null;

        server.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'join_room') {
                    const { roomCode, playerName } = data;

                    if (!rooms.has(roomCode)) {
                        rooms.set(roomCode, new Set());
                    }

                    const room = rooms.get(roomCode);

                    // Capacity check
                    if (room.size >= 5) {
                        server.send(JSON.stringify({
                            type: 'room_error',
                            message: `Room "${roomCode}" is full! (Max 5 players)`
                        }));
                        return;
                    }

                    currentRoom = roomCode;
                    const assignedName = playerName || `Player ${room.size + 1}`;
                    const playerObj = { ws: server, name: assignedName };

                    room.add(playerObj);
                    broadcastRoomStatus(roomCode);
                }
            } catch (err) {
                console.error('Error handling message:', err);
            }
        });

        const handleDisconnect = () => {
            if (currentRoom && rooms.has(currentRoom)) {
                const room = rooms.get(currentRoom);
                for (const player of room) {
                    if (player.ws === server) {
                        room.delete(player);
                        break;
                    }
                }
                if (room.size === 0) {
                    rooms.delete(currentRoom);
                } else {
                    broadcastRoomStatus(currentRoom);
                }
            }
        };

        server.addEventListener('close', handleDisconnect);
        server.addEventListener('error', handleDisconnect);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }
};

function broadcastRoomStatus(roomCode) {
    if (!rooms.has(roomCode)) return;
    const room = rooms.get(roomCode);
    const players = Array.from(room).map(p => p.name);

    const statusMsg = JSON.stringify({
        type: 'room_status',
        roomCode,
        playerCount: players.length,
        maxPlayers: 5,
        players
    });

    for (const player of room) {
        try {
            player.ws.send(statusMsg);
        } catch (e) { }
    }
}