// cardEffects.js
import {
    sendCardFromStable,
    discardCard,
    drawCard,
    shuffleDiscardIntoDrawPile
} from './gameActions.js';

/**
 * Main dispatcher to resolve immediate onPlay card abilities
 */
export function executeOnPlayEffect(gameState, playerName, card, targetData = {}) {
    if (!card.onPlay) return { success: true };

    const { action } = card.onPlay;

    switch (action) {
        case "BACK_KICK":
            return BackKick(gameState, targetData);
        case "GLITTER_TORNADO": // 👈 Add switch case
            return GlitterTornado(gameState, targetData);
        case "GOOD_DEAL": // 👈 Add switch case
            return GoodDeal(gameState, playerName, targetData);
        case "MYSTICAL_VORTEX": // 👈 Add switch case
            return MysticalVortex(gameState, targetData);
        case "RESET_BUTTON": // 👈 Add switch case
            return ResetButton(gameState);
        case "SHAKE_UP": // 👈 Add switch case
            return ShakeUp(gameState, playerName);
        case "TARGETED_DESTRUCTION": // 👈 Add switch case
            return TargetedDestruction(gameState, targetData);
        case "DRAW_CARDS": {
            const count = card.onPlay.count || 1;
            drawCard(gameState, playerName, count);
            return { success: true };
        }

        default:
            return { success: true };
    }
}

function BackKick(gameState, targetData) {
    const { targetPlayerName, targetCardId, cardIndexToDiscard } = targetData;

    // 1. Validate inputs
    if (!targetPlayerName || !targetCardId) {
        return { success: false, reason: "Target player and target card required!" };
    }

    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer) {
        return { success: false, reason: "Target player not found." };
    }

    // 2. Return card in target's stable to hand (Nursery interceptor handles Baby Unicorns automatically!)
    sendCardFromStable(gameState, targetPlayerName, targetCardId, 'hand');

    // 3. Force target player to discard 1 card
    if (targetPlayer.hand.length > 0) {
        let discardIdx = cardIndexToDiscard;
        if (discardIdx === undefined || discardIdx < 0 || discardIdx >= targetPlayer.hand.length) {
            discardIdx = Math.floor(Math.random() * targetPlayer.hand.length); // Fallback auto-discard
        }
        discardCard(gameState, targetPlayerName, discardIdx);
    }

    return { success: true };
}

function GlitterTornado(gameState, targetData) {
    // targetData.targets can be a mapping like: { "Player1": "card_id_1", "Player2": "card_id_2" }
    const targets = targetData.targets || {};

    // Loop through EVERY player in the game
    gameState.playerOrder.forEach(playerName => {
        const player = gameState.players[playerName];

        // Skip players who have no cards in their stable
        if (!player || player.stable.length === 0) return;

        // Check if a target card was specified for this player
        let targetCardId = targets[playerName];

        // Fallback: If no specific card target was passed, default to the first card in their stable
        if (!targetCardId || !player.stable.some(c => c.id === targetCardId)) {
            targetCardId = player.stable[0].id;
        }

        // Return the chosen card from stable to hand
        // (sendCardFromStable automatically diverts Baby Unicorns to Nursery!)
        sendCardFromStable(gameState, playerName, targetCardId, 'hand');
    });

    return { success: true };
}

function GoodDeal(gameState, playerName, targetData) {
    const player = gameState.players[playerName];
    if (!player) return { success: false, reason: "Player not found." };

    // 1. Draw 3 cards from the Draw Pile into the player's hand
    for (let i = 0; i < 3; i++) {
        drawCard(gameState, playerName);
    }

    // 2. Discard 1 card from hand
    if (player.hand.length > 0) {
        let discardIdx = targetData.cardIndexToDiscard;
        if (discardIdx === undefined || discardIdx < 0 || discardIdx >= player.hand.length) {
            discardIdx = Math.floor(Math.random() * player.hand.length); // Fallback safe auto-discard
        }
        discardCard(gameState, playerName, discardIdx);
    }

    return { success: true };
}

function MysticalVortex(gameState, targetData) {
    const discards = targetData.discards || {};

    // 1. Each player discards a card
    gameState.playerOrder.forEach(playerName => {
        const player = gameState.players[playerName];
        if (!player || player.hand.length === 0) return;

        let discardIdx = discards[playerName];
        if (discardIdx === undefined || discardIdx < 0 || discardIdx >= player.hand.length) {
            discardIdx = Math.floor(Math.random() * player.hand.length);
        }

        discardCard(gameState, playerName, discardIdx);
    });

    // 2. Reusable Shuffle Action!
    shuffleDiscardIntoDrawPile(gameState);

    return { success: true };
}

function ResetButton(gameState) {
    // 1. Loop through every player in the game
    gameState.playerOrder.forEach(playerName => {
        const player = gameState.players[playerName];
        if (!player || !player.stable) return;

        // Find all Upgrade and Downgrade cards currently in their Stable
        const cardsToSacrifice = player.stable.filter(
            card => card.category === CARD_TYPES.UPGRADE || card.category === CARD_TYPES.DOWNGRADE
        );

        // Move each identified Upgrade/Downgrade card out of Stable and into Discard
        cardsToSacrifice.forEach(card => {
            sendCardFromStable(gameState, playerName, card.id, 'discard');
        });
    });

    // 2. Reusable action: Shuffle the updated discard pile into the draw deck
    shuffleDiscardIntoDrawPile(gameState);

    return { success: true };
}

function ShakeUp(gameState, playerName) {
    const player = gameState.players[playerName];
    if (!player) return { success: false, reason: "Player not found." };

    // 1. Move all cards in hand (which includes Shake Up itself) into the Draw Pile
    gameState.drawPile.push(...player.hand);
    player.hand = [];

    // 2. Move all cards from Discard Pile into the Draw Pile
    if (gameState.discardPile.length > 0) {
        gameState.drawPile.push(...gameState.discardPile);
        gameState.discardPile = [];
    }

    // 3. Shuffle the whole deck using your helper
    shuffle(gameState.drawPile);

    // 4. DRAW 5 cards into player's hand
    for (let i = 0; i < 5; i++) {
        drawCard(gameState, playerName);
    }

    // Return handledDestination: true so gameEngine knows Shake Up is already in the deck!
    return { success: true, handledDestination: true };
}

function TargetedDestruction(gameState, targetData) {
    const { targetPlayerName, targetCardId } = targetData;

    // 1. Validate inputs
    if (!targetPlayerName || !targetCardId) {
        return { success: false, reason: "Target player and target card are required!" };
    }

    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer) {
        return { success: false, reason: "Target player not found." };
    }

    // 2. Find the card in the target player's Stable
    const targetCard = targetPlayer.stable.find(c => c.id === targetCardId);
    if (!targetCard) {
        return { success: false, reason: "Target card not found in target's Stable." };
    }

    // 3. Verify the card is an Upgrade or Downgrade card
    if (targetCard.category !== CARD_TYPES.UPGRADE && targetCard.category !== CARD_TYPES.DOWNGRADE) {
        return { success: false, reason: "Target card must be an Upgrade or Downgrade card!" };
    }

    // 4. Send the targeted Upgrade/Downgrade card to the Discard Pile
    // (If targeting your own Stable = SACRIFICE, if targeting an opponent's Stable = DESTROY)
    sendCardFromStable(gameState, targetPlayerName, targetCardId, 'discard');

    return { success: true };
}