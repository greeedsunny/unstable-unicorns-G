// worker.js

// 1. Durable Object Class - Manages state and connections for ONE specific room
export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.sessions = new Map(); // Tracks WebSocket -> { name: string }
    }

    async fetch(request) {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        server.accept();
        this.sessions.set(server, { name: "" });

        server.addEventListener("message", (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "join_room") {
                    const player = this.sessions.get(server);
                    if (player) {
                        player.name = data.playerName || `Player ${this.sessions.size}`;
                    }
                    this.broadcastRoomStatus(data.roomCode);
                }

                if (data.type === "start_game") {
                    const players = Array.from(this.sessions.values()).map((p) => p.name);
                    const msg = JSON.stringify({
                        type: "game_started",
                        roomCode: data.roomCode,
                        players: players,
                    });
                    this.broadcast(msg);
                }
            } catch (e) {
                console.error("Message error:", e);
            }
        });

        const handleDisconnect = () => {
            this.sessions.delete(server);
            this.broadcastRoomStatus();
        };

        server.addEventListener("close", handleDisconnect);
        server.addEventListener("error", handleDisconnect);

        return new Response(null, { status: 101, webSocket: client });
    }

    broadcast(msg) {
        for (const [ws] of this.sessions) {
            try {
                if (ws.readyState === 1) {
                    ws.send(msg);
                }
            } catch (e) {
                this.sessions.delete(ws);
            }
        }
    }

    broadcastRoomStatus(roomCode) {
        const players = Array.from(this.sessions.values()).map((p) => p.name);
        const statusMsg = JSON.stringify({
            type: "room_status",
            roomCode: roomCode || "123",
            playerCount: players.length,
            maxPlayers: 5,
            players: players,
        });
        this.broadcast(statusMsg);
    }
}

// 2. Main Cloudflare Worker Handler - Routes connections to the right Durable Object
export default {
    async fetch(request, env, ctx) {
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
            return new Response("Expected WebSocket connection", { status: 426 });
        }

        const url = new URL(request.url);
        const roomCode = url.searchParams.get("room") || "123";

        // Direct connection to the unique Durable Object for this roomCode
        const id = env.GAME_ROOM.idFromName(roomCode);
        const stub = env.GAME_ROOM.get(id);

        return stub.fetch(request);
    },
};