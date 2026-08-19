import { initializeGameState, nextTurn, checkWinCondition, resolveChoice } from './gameEngine.js';
import { drawCard, playCardFromHand } from './gameActions.js';

export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map(); // ws -> playerName
        this.gameState = null;     // active game state
    }

    /**
     * Helper to reliably obtain the active turn player name
     */
    getActivePlayer() {
        if (!this.gameState) return null;
        return this.gameState.currentTurn || this.gameState.currentPlayer || this.gameState.currentTurnPlayer;
    }

    /**
     * Cloudflare Durable Object HTTP / WebSocket Entry Point
     */
    async fetch(request) {
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
            return new Response("This Durable Object endpoint expects a WebSocket connection.", { status: 426 });
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        server.accept();

        server.addEventListener("message", async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this.handleMessage(server, data);
            } catch (err) {
                server.send(JSON.stringify({ type: "room_error", message: err.message }));
            }
        });

        const cleanupSocket = () => {
            if (this.sessions.has(server)) {
                this.sessions.delete(server);
                this.broadcastRoomStatus();
            }
        };

        server.addEventListener("close", cleanupSocket);
        server.addEventListener("error", cleanupSocket);

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

                this.gameState = initializeGameState(playerNames);
                this.broadcast({ type: "game_started" });
                this.broadcastStateUpdate();
                break;
            }

            case "draw_card": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                if (playerName !== this.getActivePlayer()) return;

                if (this.gameState.phase === 'ACTION' && !this.gameState.pendingChoice) {
                    const result = drawCard(this.gameState, playerName);

                    if (result && result.success === false) {
                        ws.send(JSON.stringify({ type: "room_error", message: result.reason || "Failed to draw card" }));
                        return;
                    }

                    nextTurn(this.gameState);
                    this.evaluateGameState();
                }
                break;
            }

            case "play_card": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                if (playerName !== this.getActivePlayer()) return;

                const result = playCardFromHand(this.gameState, playerName, data.cardIndex, data.targetData);
                if (!result.success) {
                    ws.send(JSON.stringify({ type: "room_error", message: result.reason }));
                } else {
                    if (!result.requiresChoice) {
                        nextTurn(this.gameState);
                    }
                    this.evaluateGameState();
                }
                break;
            }

            case "resolve_choice": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);

                const result = resolveChoice(this.gameState, playerName, data);
                if (!result.success) {
                    ws.send(JSON.stringify({ type: "room_error", message: result.reason }));
                } else {
                    if (!result.requiresChoice && this.gameState.phase === 'END') {
                        nextTurn(this.gameState);
                    }
                    this.evaluateGameState();
                }
                break;
            }

            case "end_turn": {
                if (!this.gameState) return;
                const playerName = this.sessions.get(ws);
                if (playerName !== this.getActivePlayer()) return;

                nextTurn(this.gameState);
                this.evaluateGameState();
                break;
            }
        }
    }

    /**
     * Checks win condition and updates game phase accordingly
     */
    evaluateGameState() {
        const winner = checkWinCondition(this.gameState);
        if (winner) {
            this.gameState.phase = 'GAME_OVER';
            this.gameState.winner = winner;
            this.broadcastStateUpdate();
            this.broadcast({ type: 'game_over', winner: winner });
        } else {
            this.broadcastStateUpdate();
        }
    }

    broadcastRoomStatus() {
        const players = Array.from(this.sessions.values());
        this.broadcast({
            type: "room_status",
            playerCount: players.length,
            maxPlayers: 5,
            players: players
        });
    }

    getSanitizedGameState(targetPlayerName) {
        if (!this.gameState) return null;

        const sanitized = JSON.parse(JSON.stringify(this.gameState));

        if (sanitized.players) {
            for (const pName in sanitized.players) {
                const pData = sanitized.players[pName];
                pData.handCount = Array.isArray(pData.hand) ? pData.hand.length : 0;

                if (pName !== targetPlayerName) {
                    delete pData.hand;
                }
            }
        }

        return sanitized;
    }

    /**
     * Sends unified state and hand updates per connected socket
     */
    broadcastStateUpdate() {
        if (!this.gameState) return;

        for (const [ws, playerName] of this.sessions.entries()) {
            const publicState = this.getSanitizedGameState(playerName);
            const playerData = this.gameState.players[playerName];

            ws.send(JSON.stringify({
                type: 'turn_update',
                gameState: publicState,
                privateHand: playerData ? playerData.hand || [] : []
            }));
        }
    }

    broadcast(message) {
        const jsonStr = JSON.stringify(message);
        for (const ws of this.sessions.keys()) {
            ws.send(jsonStr);
        }
    }
}

export default {
    async fetch(request, env, ctx) {
        const upgradeHeader = request.headers.get("Upgrade");

        if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
            const url = new URL(request.url);
            const roomCode = url.searchParams.get("room") || "default";

            const id = env.GAME_ROOM.idFromName(roomCode);
            const roomObject = env.GAME_ROOM.get(id);

            return roomObject.fetch(request);
        }

        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response("Assets binding not found. Please check wrangler configuration.", { status: 500 });
    }
};