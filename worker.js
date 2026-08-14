// worker.js
import { initializeGameState, nextTurn, checkWinCondition, playCardFromHand } from './gameEngine.js';
import { drawCard } from './gameActions.js';

export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map(); // Stores active WebSocket connections: ws -> playerName
        this.gameState = null;     // Stores full active game state
    }

    /**
     * Cloudflare Durable Object HTTP / WebSocket Entry Point
     */
    async fetch(request) {
        // Check if client is requesting a WebSocket upgrade
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
            return new Response("Expected WebSocket connection", { status: 426 });
        }

        // Create WebSocket pair (Client <-> Server)
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept WebSocket connection inside Durable Object
        server.accept();

        // Register event listeners on server socket
        server.addEventListener("message", async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this.handleMessage(server, data);
            } catch (err) {
                server.send(JSON.stringify({ type: "room_error", message: err.message }));
            }
        });

        server.addEventListener("close", () => {
            this.sessions.delete(server);
            this.broadcastRoomStatus();
        });

        return new Response(null, { status: 101, webSocket: client });
    }

    /**
     * Router for incoming WebSocket action messages
     */
    async handleMessage(ws, data) {
        switch (data.type) {
            case "join_room": {
                this.sessions.set(ws, data.playerName);
                this.broadcastRoomStatus();
                break;
            }

            case "start_game": {
                const playerNames = Array.from(this.sessions.values());
                if (playerNames.length < 2) {
                    ws.send(JSON.stringify({ type: "room_error", message: "Need at least 2 players to start!" }));
                    return;
                }

                // Initialize Decks and Game State from gameEngine.js
                this.gameState = initializeGameState(playerNames);

                // Notify everyone that the game started
                this.broadcast({ type: "game_started", gameState: this.gameState });
                this.broadcastStateUpdate();
                break;
            }

            case "draw_card": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                const activePlayer = this.gameState.playerOrder[this.gameState.activePlayerIndex];

                if (playerName !== activePlayer) return;

                if (this.gameState.phase === 'DRAW') {
                    drawCard(this.gameState, playerName);
                    this.gameState.phase = 'ACTION'; // Move automatically to ACTION phase
                    this.broadcastStateUpdate();
                }
                break;
            }

            case "play_card": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                const activePlayer = this.gameState.playerOrder[this.gameState.activePlayerIndex];

                if (playerName !== activePlayer) return;

                const result = playCardFromHand(this.gameState, playerName, data.cardIndex, data.targetData);
                if (!result.success) {
                    ws.send(JSON.stringify({ type: "room_error", message: result.reason }));
                } else {
                    this.broadcastStateUpdate();
                }
                break;
            }

            case "end_turn": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                const activePlayer = this.gameState.playerOrder[this.gameState.activePlayerIndex];

                if (playerName !== activePlayer) return;

                nextTurn(this.gameState);

                const winner = checkWinCondition(this.gameState);
                if (winner) {
                    this.broadcast({ type: 'game_over', winner: winner });
                } else {
                    this.broadcastStateUpdate();
                }
                break;
            }
        }
    }

    /**
     * Sends lobby player count to all connected clients
     */
    broadcastRoomStatus() {
        const players = Array.from(this.sessions.values());
        this.broadcast({
            type: "room_status",
            playerCount: players.length,
            maxPlayers: 5,
            players: players
        });
    }

    /**
     * Broadcasts public gameState + private player hands to each individual socket
     */
    broadcastStateUpdate() {
        if (!this.gameState) return;

        for (const [ws, playerName] of this.sessions.entries()) {
            // 1. Send public state to this player
            ws.send(JSON.stringify({
                type: 'turn_update',
                gameState: this.gameState
            }));

            // 2. Send private hand specifically to this player
            const playerData = this.gameState.players[playerName];
            if (playerData) {
                ws.send(JSON.stringify({
                    type: 'hand_update',
                    hand: playerData.hand
                }));
            }
        }
    }

    /**
     * Helper to send a message to all connected sockets
     */
    broadcast(message) {
        const jsonStr = JSON.stringify(message);
        for (const ws of this.sessions.keys()) {
            ws.send(jsonStr);
        }
    }
}

/**
 * --- REQUIRED ES MODULE ENTRY POINT ---
 * This worker receives HTTP requests, extracts room name, and routes to Durable Object
 */
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const roomCode = url.searchParams.get("room") || "default";

        // Get Durable Object Instance ID for this room name
        const id = env.GAME_ROOM.idFromName(roomCode);
        const roomObject = env.GAME_ROOM.get(id);

        // Pass the WebSocket request into the Durable Object
        return roomObject.fetch(request);
    }
};