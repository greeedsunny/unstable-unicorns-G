// gameEngine.js
import { buildInitialDecks, CARD_TYPES } from './cardsData.js';
import { executeOnPlayEffect } from './cardEffects.js';

/**
 * Initializes full game state at startup
 */
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

/**
 * Handles playing a card from hand and triggering its onPlay effect
 */
export function playCardFromHand(gameState, playerName, cardIndex, targetData = {}) {
    if (gameState.phase !== 'ACTION') return { success: false, reason: "Not in Action Phase" };

    const player = gameState.players[playerName];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) {
        return { success: false, reason: "Invalid card selection" };
    }

    const card = player.hand[cardIndex];

    // 1. Delegate card effect execution to cardEffects.js

    const result = executeOnPlayEffect(gameState, playerName, card, targetData);

    if (result.success) {
        // Only route card if the effect hasn't already handled its location!
        if (!result.handledDestination) {
            player.hand.splice(cardIndex, 1);

            if (card.category === CARD_TYPES.MAGIC || card.category === CARD_TYPES.INSTANT) {
                gameState.discardPile.push(card);
            } else {
                player.stable.push(card);
            }
        }

        gameState.phase = 'END';
    }

    return result;
}
