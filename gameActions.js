// gameActions.js
import { CARD_TYPES } from './cardsData.js';
import { shuffle } from './cardsData.js';
/**
 * DESTROY: Removes a card from a TARGET player's Stable and moves it to Discard.
 */
export function destroyCard(gameState, targetPlayerName, cardIndex) {
    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer || cardIndex < 0 || cardIndex >= targetPlayer.stable.length) {
        return { success: false, reason: "Invalid target or card index" };
    }

    // 1. Remove card from target's stable
    const [destroyedCard] = targetPlayer.stable.splice(cardIndex, 1);

    // 2. Add to Discard Pile
    gameState.discardPile.push(destroyedCard);

    return { success: true, card: destroyedCard };
}

/**
 * SACRIFICE: Removes a card from YOUR OWN Stable and moves it to Discard.
 */
export function sacrificeCard(gameState, playerName, cardIndex) {
    const player = gameState.players[playerName];
    if (!player || cardIndex < 0 || cardIndex >= player.stable.length) {
        return { success: false, reason: "Invalid card selection" };
    }

    const [sacrificedCard] = player.stable.splice(cardIndex, 1);
    gameState.discardPile.push(sacrificedCard);

    return { success: true, card: sacrificedCard };
}

/**
 * DISCARD: Removes a card from a player's HAND and moves it to Discard.
 */
export function discardCard(gameState, playerName, cardIndexInHand) {
    const player = gameState.players[playerName];
    if (!player || cardIndexInHand < 0 || cardIndexInHand >= player.hand.length) {
        return { success: false, reason: "Invalid hand index" };
    }

    const [discardedCard] = player.hand.splice(cardIndexInHand, 1);
    gameState.discardPile.push(discardedCard);

    return { success: true, card: discardedCard };
}

/**
 * DRAW: Pulls the top card from Draw Pile into a player's hand.
 */
export function drawCard(gameState, playerName) {
    const player = gameState.players[playerName];
    if (!player) return { success: false, reason: "Player not found!" };

    // 1. If drawPile is empty, attempt an auto-reshuffle from discardPile
    if (gameState.drawPile.length === 0) {
        shuffleDiscardIntoDrawPile(gameState);
    }

    // 2. If it's STILL empty after trying to reshuffle, there are no cards left to draw!
    if (gameState.drawPile.length === 0) {
        return { success: false, reason: "No cards left in the deck or discard pile!" };
    }

    // 3. Draw top card from draw pile and add to hand
    const card = gameState.drawPile.pop();
    player.hand.push(card);

    return { success: true, card: card };
}

/**
 * STEAL: Moves a card from a TARGET player's Stable into YOUR Stable.
 */
export function stealCard(gameState, fromPlayerName, toPlayerName, cardIndex) {
    const fromPlayer = gameState.players[fromPlayerName];
    const toPlayer = gameState.players[toPlayerName];

    if (!fromPlayer || !toPlayer || cardIndex < 0 || cardIndex >= fromPlayer.stable.length) {
        return { success: false, reason: "Invalid steal action" };
    }

    const [stolenCard] = fromPlayer.stable.splice(cardIndex, 1);
    toPlayer.stable.push(stolenCard);

    return { success: true, card: stolenCard };
}

// gameActions.js

/**
 * BRING DIRECTLY INTO PLAY: Places a card into a player's Stable/Upgrade area
 * WITHOUT consuming their turn's Action Phase play.
 *
 * @param {Object} gameState - Current backend state
 * @param {string} targetPlayerName - Player whose Stable receives the card
 * @param {Object} card - The card object being brought into play
 * @param {string} [sourceZone] - Optional source: 'nursery', 'discardPile', 'drawPile', or 'hand'
 * @param {string} [sourcePlayerName] - Required if sourceZone is 'hand'
 */
export function bringDirectlyIntoPlay(gameState, targetPlayerName, card, sourceZone = null, sourcePlayerName = null) {
    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer || !card) {
        return { success: false, reason: "Target player or card not found" };
    }

    // 1. Remove card from its source location (if provided)
    if (sourceZone === 'nursery') {
        const idx = gameState.nursery.findIndex(c => c.id === card.id);
        if (idx !== -1) gameState.nursery.splice(idx, 1);
    } else if (sourceZone === 'discardPile') {
        const idx = gameState.discardPile.findIndex(c => c.id === card.id);
        if (idx !== -1) gameState.discardPile.splice(idx, 1);
    } else if (sourceZone === 'drawPile') {
        const idx = gameState.drawPile.findIndex(c => c.id === card.id);
        if (idx !== -1) gameState.drawPile.splice(idx, 1);
    } else if (sourceZone === 'hand' && sourcePlayerName) {
        const sourcePlayer = gameState.players[sourcePlayerName];
        if (sourcePlayer) {
            const idx = sourcePlayer.hand.findIndex(c => c.id === card.id);
            if (idx !== -1) sourcePlayer.hand.splice(idx, 1);
        }
    }

    // 2. Route the card to the correct area in the target player's stable
    if (card.category === 'Upgrade Card' || card.category === 'Downgrade Card') {
        targetPlayer.upgrades = targetPlayer.upgrades || [];
        targetPlayer.upgrades.push(card);
    } else {
        // Basic, Magical, or Baby Unicorns go to the main stable area
        targetPlayer.stable.push(card);
    }

    // CRUCIAL: We do NOT set gameState.hasTakenAction = true or advance the phase.
    // The active player keeps their main Action Phase play intact!

    return {
        success: true,
        card: card,
        targetPlayer: targetPlayerName,
        message: `${card.name} was brought directly into ${targetPlayerName}'s Stable!`
    };
}

// gameActions.js
import { sendCardFromStable } from './gameEngine.js';

/**
 * GAME ACTION: Returns a card from a player's Stable to their hand.
 * (Automatically routes Baby Unicorns to Nursery!)
 */
export function returnCardToHand(gameState, targetPlayerName, cardId) {
    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer) return { success: false, reason: "Player not found" };

    // sendCardFromStable handles the move + Nursery interceptor!
    sendCardFromStable(gameState, targetPlayerName, cardId, 'hand');

    return {
        success: true,
        message: `Returned card from ${targetPlayerName}'s Stable.`
    };
}

export function shuffleDiscardIntoDrawPile(gameState) {
    if (!gameState.discardPile || gameState.discardPile.length === 0) return;

    // 1. Transfer all cards from discardPile to drawPile
    gameState.drawPile.push(...gameState.discardPile);

    // 2. Empty the discard pile
    gameState.discardPile = [];

    // 3. Shuffle the updated draw pile
    shuffle(gameState.drawPile); }

/**
 * Moves a card out of a player's Stable.
 * Intercepts Baby Unicorns automatically to send them back to the Nursery!
 */
export function sendCardFromStable(gameState, playerName, cardId, destination) {
    const player = gameState.players[playerName];
    if (!player) return;

    // Find index of target card in player's stable
    const cardIndex = player.stable.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return; // Card not in stable

    // Remove card from stable
    const [removedCard] = player.stable.splice(cardIndex, 1);

    // --- BABY UNICORN INTERCEPTOR ---
    if (removedCard.category === CARD_TYPES.BABY) {
        gameState.nursery.push(removedCard); // Always returns to Nursery!
        return;
    }

    // --- NORMAL CARDS ---
    if (destination === 'discard') {
        gameState.discardPile.push(removedCard);
    } else if (destination === 'hand') {
        player.hand.push(removedCard);
    }
}