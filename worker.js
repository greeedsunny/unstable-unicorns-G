// worker.js
import { initializeGameState, nextTurn, checkWinCondition } from './gameEngine.js';

export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.gameState = null; // Will store full engine state
    }

    async handleTurnAction(playerName, actionData) {
        const activePlayer = this.gameState.playerOrder[this.gameState.activePlayerIndex];
        if (playerName !== activePlayer) return; // Ignore input if not player's turn

        if (actionData.action === 'end_turn') {
            nextTurn(this.gameState);

            const winner = checkWinCondition(this.gameState);
            if (winner) {
                this.broadcast({ type: 'game_over', winner: winner });
                return;
            }
        }

        this.broadcastStateUpdate();
    }
}