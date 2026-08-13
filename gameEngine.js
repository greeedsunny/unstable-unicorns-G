// gameEngine.js
import { buildInitialDecks } from './cardsData.js';

export function initializeGameState(playerNames) {
    const { nursery, drawPile, discardPile } = buildInitialDecks();
    const players = {};

    // Deal 5 cards from draw pile to each player + 1 Baby Unicorn from Nursery
    playerNames.forEach((name) => {
        const hand = drawPile.splice(0, 5);
        const baby = nursery.pop();

        players[name] = {
            name: name,
            hand: hand,
            stable: baby ? [baby] : [],
            upgrades: []
        };
    });

    return {
        gameStarted: true,
        players: players,
        playerOrder: playerNames,
        activePlayerIndex: 0,
        phase: 'DRAW', // 'DRAW' | 'ACTION' | 'END'
        nursery: nursery,
        drawPile: drawPile,
        discardPile: discardPile
    };
}

/**
 * Advances the turn to the next player in order
 */
export function nextTurn(gameState) {
    gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.playerOrder.length;
    gameState.phase = 'DRAW';
    return gameState;
}

/**
 * Checks if a player has reached 7 Unicorns in their Stable
 */
export function checkWinCondition(gameState) {
    for (const name of gameState.playerOrder) {
        if (gameState.players[name].stable.length >= 7) {
            return name; // Winner found!
        }
    }
    return null;
}

export function playCardFromHand(gameState, playerName, cardIndex) {
    if (gameState.phase !== 'ACTION') return { success: false, reason: "Not in Action Phase" };

    const player = gameState.players[playerName];
    const card = player.hand[cardIndex];

    // Execute card's specific onPlay effect
    const result = card.onPlay(gameState, playerName);

    if (result.success) {
        // Standard play consumes the turn action and moves to END phase!
        gameState.phase = 'END';
    }

    return result;
}