// gameActions.js
import { isUnicorn, CARD_TYPES, shuffle, isUnicornCard, isBabyCard, isBasicUnicorn } from './cardsData.js';
import { triggerLeavesStable, triggerEntersStable, Neigh, SuperNeigh, RainbowAura, BlindingLight, BrokenStable, NannyCam, SadisticRitual, Slowdown, TinyStable, GinormousUnicorn, ReTarget, QueenBeeUnicorn, executeOnPlayEffect } from './cardEffects.js';
import { checkWinCondition } from './gameEngine.js';
/**
 * DESTROY: Removes a card from a TARGET player's Stable and moves it to Discard.
 * Respects Rainbow Aura protection for Unicorn cards.
 */
export function destroyCard(gameState, targetPlayerName, cardIdentifier, contextData = {}) {
    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer) return { success: false, reason: "Invalid target player." };

    const zones = ['stable', 'upgrades', 'downgrades'];
    let cardToDestroy = null;

    // Search across ALL zones safely regardless of whether cardIdentifier is index, ID, or object
    for (const zone of zones) {
        if (!Array.isArray(targetPlayer[zone])) continue;

        if (typeof cardIdentifier === 'number') {
            if (targetPlayer[zone][cardIdentifier]) {
                cardToDestroy = targetPlayer[zone][cardIdentifier];
                break;
            }
        } else {
            const found = targetPlayer[zone].find(c => c && (c.id === cardIdentifier || c === cardIdentifier));
            if (found) {
                cardToDestroy = found;
                break;
            }
        }
    }

    if (!cardToDestroy) {
        return { success: false, reason: "Target card not found in player's Stable, Upgrades, or Downgrades." };
    }

    // --- RAINBOW AURA PROTECTION CHECK ---
    if (typeof RainbowAura === 'function' && RainbowAura(gameState, targetPlayerName, cardToDestroy)) {
        return {
            success: false,
            reason: `${cardToDestroy.name} cannot be destroyed because ${targetPlayerName} has Rainbow Aura in play!`
        };
    }

    // --- BLACK KNIGHT UNICORN PROTECTION CHECK ---
    const categoryUpper = (cardToDestroy.category || cardToDestroy.type || '').toString().toUpperCase();
    const isUnicorn = categoryUpper.includes('UNICORN') || ['BABY', 'BASIC', 'MAGICAL'].includes(categoryUpper);
    const isBlackKnight = cardToDestroy.id === 'black_knight_unicorn' || cardToDestroy.name === 'Black Knight Unicorn';

    const hasBlackKnight = (targetPlayer.stable || []).some(c =>
        c && (c.id === 'black_knight_unicorn' || c.name === 'Black Knight Unicorn')
    );

    if (isUnicorn && !isBlackKnight && hasBlackKnight && !contextData.blackKnightBypassed) {
        gameState.pendingChoice = {
            chooser: targetPlayerName,
            prompt: `Black Knight Unicorn: Sacrifice Black Knight Unicorn to prevent ${cardToDestroy.name} from being destroyed?`,
            actionType: 'BLACK_KNIGHT_UNICORN_PROTECT',
            targetScope: 'PROTECTION_CHOICE',
            optional: true,
            targetPlayerName: targetPlayerName,
            cardToDestroy: cardToDestroy,
            contextData: { ...contextData, cardToDestroy, targetPlayerName, originalAction: 'DESTROY_CARD' }
        };
        gameState.phase = 'CHOICE';

        return { requiresChoice: true, pendingChoice: gameState.pendingChoice };
    }

    // Determine if card is a Baby Unicorn
    const isBaby = (
        cardToDestroy.category === 'BABY' ||
        cardToDestroy.category === (typeof CARD_TYPES !== 'undefined' ? CARD_TYPES.BABY : 'BABY') ||
        cardToDestroy.type === 'Baby' ||
        cardToDestroy.category === 'Baby Unicorn' ||
        cardToDestroy.isBaby === true
    );

    // Move to destination: Baby Unicorns ALWAYS go to the Nursery
    let destination = cardToDestroy.returnToHandOnDestroy ? 'hand' : 'discard';
    if (isBaby) destination = 'nursery';

    if (typeof sendCardFromStable === 'function') {
        return sendCardFromStable(gameState, targetPlayerName, cardToDestroy, destination);
    }

    return { success: false, reason: "sendCardFromStable function missing." };
}

export function sacrificeCard(gameState, playerName, cardIdentifier) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    const zones = ['stable', 'upgrades', 'downgrades'];
    let targetCard = null;

    // Search across ALL zones safely
    for (const zone of zones) {
        if (!Array.isArray(player[zone])) continue;

        if (typeof cardIdentifier === 'number') {
            if (player[zone][cardIdentifier]) {
                targetCard = player[zone][cardIdentifier];
                break;
            }
        } else {
            const found = player[zone].find(c => c && (c.id === cardIdentifier || c === cardIdentifier));
            if (found) {
                targetCard = found;
                break;
            }
        }
    }

    if (!targetCard) {
        return { success: false, reason: "Target card not found in player's Stable, Upgrades, or Downgrades." };
    }

    // Determine if card is a Baby Unicorn
    const isBaby = (
        targetCard.category === 'BABY' ||
        targetCard.category === (typeof CARD_TYPES !== 'undefined' ? CARD_TYPES.BABY : 'BABY') ||
        targetCard.type === 'Baby' ||
        targetCard.category === 'Baby Unicorn' ||
        targetCard.isBaby === true
    );

    // Move to destination: Baby Unicorns ALWAYS go to the Nursery
    let destination = targetCard.returnToHandOnDestroy ? 'hand' : 'discard';
    if (isBaby) destination = 'nursery';

    if (typeof sendCardFromStable === 'function') {
        return sendCardFromStable(gameState, playerName, targetCard, destination);
    }

    return { success: false, reason: "sendCardFromStable function missing." };
}

/**
 * DISCARD: Removes a card from a player's HAND and moves it to Discard.
 */
export function discardCard(gameState, playerName, cardIndexInHand) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !Array.isArray(player.hand) || cardIndexInHand < 0 || cardIndexInHand >= player.hand.length) {
        return { success: false, reason: "Invalid hand index or player" };
    }

    gameState.discardPile = gameState.discardPile || [];
    const [discardedCard] = player.hand.splice(cardIndexInHand, 1);

    if (discardedCard) {
        gameState.discardPile.push(discardedCard);
    }

    return {
        success: true,
        card: discardedCard,
        message: `${playerName} discarded ${discardedCard.name || 'a card'}.` // Helpful for UI logs
    };
}

/**
 * DRAW: Pulls the top card from Draw Pile into a player's hand.
 */
export function drawCard(gameState, playerName, count = 1) {
    if (!gameState || !gameState.players || !gameState.players[playerName]) {
        return { success: false, reason: "Player or game state not found!" };
    }

    const player = gameState.players[playerName];
    if (!player.hand) player.hand = [];
    if (!gameState.drawPile) gameState.drawPile = [];

    for (let i = 0; i < count; i++) {
        if (gameState.drawPile.length === 0) {
            if (typeof shuffleDiscardIntoDrawPile === 'function') {
                shuffleDiscardIntoDrawPile(gameState);
            }
        }

        if (gameState.drawPile.length === 0) {
            return { success: false, reason: "No cards left in the deck or discard pile!" };
        }

        const card = gameState.drawPile.pop();
        if (card) {
            player.hand.push(card);
        }
    }

    return { success: true };
}

// 🎯 Call this function when the player clicks "Draw Card" on their turn during the Action phase
export function executeDrawAction(gameState, playerName) {
    const currentActions = gameState.actionsLeft !== undefined ? gameState.actionsLeft : (gameState.actionsRemaining ?? 1);

    if (currentActions <= 0) {
        return { success: false, reason: "You have no actions left this turn!" };
    }

    const drawResult = drawCard(gameState, playerName, 1);
    if (!drawResult.success) {
        return drawResult;
    }

    gameState.actionsLeft = Math.max(0, currentActions - 1);
    gameState.actionsRemaining = gameState.actionsLeft;

    // Advance turn automatically if no actions remain
    if (gameState.actionsLeft <= 0 && typeof advanceToNextPlayer === 'function') {
        return advanceToNextPlayer(gameState);
    }

    return { success: true, message: `${playerName} drew a card.` };
}

/**
 * STEAL: Moves a card from a TARGET player's Stable into YOUR Stable.
 * Triggers ETB effects if triggerETB function is passed.
 */
export function stealCard(
    gameState,
    fromPlayerName,
    toPlayerName,
    cardTarget,
    triggerETB = triggerEntersStable,
    triggerLeaves = triggerLeavesStable
) {
    const fromPlayer = gameState.players ? gameState.players[fromPlayerName] : null;
    const toPlayer = gameState.players ? gameState.players[toPlayerName] : null;

    // Validate both players and their stables upfront
    if (!fromPlayer || !toPlayer || !Array.isArray(fromPlayer.stable)) {
        return { success: false, reason: "Invalid player data for steal action." };
    }
    toPlayer.stable = Array.isArray(toPlayer.stable) ? toPlayer.stable : [];

    // Preserve original phase context
    const originPhase = gameState.previousPhase || (gameState.phase !== 'CHOICE' ? gameState.phase : 'ACTION');

    // 1. Resolve card index
    let cardIndex = -1;
    if (typeof cardTarget === 'number') {
        cardIndex = cardTarget;
    } else {
        cardIndex = fromPlayer.stable.findIndex(c => c && (
            c === cardTarget ||
            (typeof cardTarget === 'string' && c.id === cardTarget) ||
            (c.id && cardTarget && cardTarget.id && c.id === cardTarget.id)
        ));
    }

    if (cardIndex < 0 || cardIndex >= fromPlayer.stable.length) {
        return { success: false, reason: "Card not found in target player's Stable." };
    }

    // 2. Remove card from origin Stable
    const [stolenCard] = fromPlayer.stable.splice(cardIndex, 1);

    // 3. Trigger Leaves-Stable Effect
    let leavesResult = null;
    const leavesFn = typeof triggerLeaves === 'function' ? triggerLeaves : triggerLeavesStable;
    if (typeof leavesFn === 'function') {
        leavesResult = leavesFn(gameState, fromPlayerName, stolenCard);
    }

    // 4. Transfer card to destination Stable
    toPlayer.stable.push(stolenCard);

    // 5. Trigger Enters-Stable (ETB) Effect
    let etbResult = null;
    const etbFn = typeof triggerETB === 'function' ? triggerETB : triggerEntersStable;
    if (typeof etbFn === 'function') {
        etbResult = etbFn(gameState, toPlayerName, stolenCard);
    }

    // 6. Trigger Tiny Stable Check
    let tinyStableResult = null;
    if (typeof checkTinyStableTrigger === 'function') {
        tinyStableResult = checkTinyStableTrigger(gameState, toPlayerName);
    }

    // 7. Resolve Queue Collisions (Leaves -> ETB -> Tiny Stable)
    const rawResults = [
        { res: leavesResult, player: fromPlayerName },
        { res: etbResult, player: toPlayerName },
        { res: tinyStableResult, player: toPlayerName }
    ];

    const pendingChoices = rawResults
        .filter(({ res }) => res && res.requiresChoice)
        .map(({ res, player }) => ({
            ...res.pendingChoice,
            isEnterTrigger: true,
            cardPlayed: stolenCard,
            originalPlayer: player,
            previousPhase: res.pendingChoice?.previousPhase || originPhase
        }));

    if (pendingChoices.length > 0) {
        gameState.triggerQueue = gameState.triggerQueue || [];

        if (pendingChoices.length > 1) {
            gameState.triggerQueue.push(...pendingChoices.slice(1));
        }

        gameState.pendingChoice = pendingChoices[0];
        gameState.phase = 'CHOICE';

        return {
            success: true,
            card: stolenCard,
            requiresChoice: true,
            pendingChoice: gameState.pendingChoice,
            etbResult,
            leavesResult
        };
    }

    return { success: true, card: stolenCard, etbResult, leavesResult };
}

/**
 * BRING DIRECTLY INTO PLAY: Places a card into a player's Stable/Upgrade area
 * WITHOUT consuming their turn's Action Phase play.
 * Triggers ETB effects if triggerETB function is passed.
 */
export function bringDirectlyIntoPlay(
    gameState,
    targetPlayerName,
    card,
    sourceZone = null,
    sourcePlayerName = null,
    triggerETB = null
) {
    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer || !card) {
        return { success: false, reason: "Target player or card not found" };
    }

    // 🛡️ Preserve original phase context so game engine knows where to resume
    const originPhase = gameState.previousPhase || (gameState.phase !== 'CHOICE' ? gameState.phase : 'ACTION');

    const category = (card.category || card.type || '').toString().toUpperCase();
    const isDowngrade = category.includes('DOWNGRADE');
    const isUpgrade = category.includes('UPGRADE') && !isDowngrade;

    // --- 1. RUN GUARD CHECKS BEFORE REMOVING CARD FROM SOURCE ZONE ---
    if (isUpgrade) {
        if (typeof BrokenStable === 'function' && BrokenStable(gameState, targetPlayerName)) {
            return { success: false, reason: `${targetPlayerName} cannot put Upgrade cards into play due to Broken Stable!` };
        }

        if ((card.id === 'rainbow_mane' || card.name === 'Rainbow Mane') && typeof RainbowMane === 'function') {
            const check = RainbowMane(gameState, targetPlayerName, { isPlayConditionCheck: true });
            if (check && !check.canEnter) return check;
        }
    }

    if (!isUpgrade && !isDowngrade && typeof QueenBeeUnicorn === 'function' && QueenBeeUnicorn(gameState, targetPlayerName, card)) {
        return { success: false, reason: `Basic Unicorn cards cannot enter ${targetPlayerName}'s Stable due to Queen Bee Unicorn!` };
    }

    // --- 2. REMOVE CARD FROM SOURCE ZONE ---
    const matchesCard = c => c && (
        c === card ||
        (c.id && card.id && c.id === card.id)
    );

    if (sourceZone) {
        let removed = false;

        if (sourceZone === 'nursery' && Array.isArray(gameState.nursery)) {
            const idx = gameState.nursery.findIndex(matchesCard);
            if (idx !== -1) { gameState.nursery.splice(idx, 1); removed = true; }
        } else if (sourceZone === 'discardPile' && Array.isArray(gameState.discardPile)) {
            const idx = gameState.discardPile.findIndex(matchesCard);
            if (idx !== -1) { gameState.discardPile.splice(idx, 1); removed = true; }
        } else if (sourceZone === 'drawPile' && Array.isArray(gameState.drawPile)) {
            const idx = gameState.drawPile.findIndex(matchesCard);
            if (idx !== -1) { gameState.drawPile.splice(idx, 1); removed = true; }
        } else if (sourceZone === 'hand') {
            const sourceName = sourcePlayerName || targetPlayerName;
            const sourcePlayer = gameState.players ? gameState.players[sourceName] : null;
            if (sourcePlayer && Array.isArray(sourcePlayer.hand)) {
                const idx = sourcePlayer.hand.findIndex(matchesCard);
                if (idx !== -1) { sourcePlayer.hand.splice(idx, 1); removed = true; }
            }
        }

        // 🛑 PREVENT CARD DUPLICATION EXPLOIT
        if (!removed) {
            return { success: false, reason: `Card ${card.name || ''} was not found in specified source zone (${sourceZone}).` };
        }
    }

    // --- 3. PLACE CARD INTO TARGET ZONE & CHECK TRIGGERS ---
    let etbResult = null;
    let tinyStableResult = null;

    if (isUpgrade) {
        targetPlayer.upgrades = targetPlayer.upgrades || [];
        targetPlayer.upgrades.push(card);
    } else if (isDowngrade) {
        targetPlayer.downgrades = targetPlayer.downgrades || [];
        targetPlayer.downgrades.push(card);
    } else {
        targetPlayer.stable = targetPlayer.stable || [];
        targetPlayer.stable.push(card);

        // Fallback to triggerEntersStable if triggerETB parameter wasn't explicitly provided
        const activeTriggerETB = typeof triggerETB === 'function' ? triggerETB : (typeof triggerEntersStable === 'function' ? triggerEntersStable : null);

        if (typeof activeTriggerETB === 'function') {
            etbResult = activeTriggerETB(gameState, targetPlayerName, card);
        }

        if (typeof checkTinyStableTrigger === 'function') {
            tinyStableResult = checkTinyStableTrigger(gameState, targetPlayerName);
        }
    }

    // --- 4. RESOLVE QUEUE COLLISIONS & PRESERVE PHASE ---
    const pendingChoices = [];

    if (etbResult && etbResult.requiresChoice) {
        pendingChoices.push({
            ...etbResult.pendingChoice,
            cardPlayed: card,
            originalPlayer: targetPlayerName,
            previousPhase: etbResult.pendingChoice.previousPhase || originPhase
        });
    }

    if (tinyStableResult && tinyStableResult.requiresChoice) {
        pendingChoices.push({
            ...tinyStableResult.pendingChoice,
            cardPlayed: card,
            originalPlayer: targetPlayerName,
            previousPhase: tinyStableResult.pendingChoice.previousPhase || originPhase
        });
    }

    if (pendingChoices.length > 0) {
        gameState.triggerQueue = gameState.triggerQueue || [];
        if (pendingChoices.length > 1) {
            gameState.triggerQueue.push(...pendingChoices.slice(1));
        }

        gameState.pendingChoice = pendingChoices[0];
        gameState.phase = 'CHOICE';

        return {
            success: true,
            card: card,
            targetPlayer: targetPlayerName,
            etbResult: etbResult,
            requiresChoice: true,
            pendingChoice: gameState.pendingChoice
        };
    }

    return {
        success: true,
        card: card,
        targetPlayer: targetPlayerName,
        etbResult: etbResult,
        requiresChoice: false,
        pendingChoice: null,
        message: `${card.name || 'Card'} was brought directly into ${targetPlayerName}'s Stable!`
    };
}

/**
 * GAME ACTION: Returns a card from a player's Stable to their hand.
 */
export function returnCardToHand(gameState, targetPlayerName, cardId) {
    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer) return { success: false, reason: "Player not found" };

    // 1. Check all stable zones (Stable, Upgrades, Downgrades)
    const cardInStable = (targetPlayer.stable || []).find(c => c && (c.id === cardId || c === cardId));
    const cardInUpgrades = (targetPlayer.upgrades || []).find(c => c && (c.id === cardId || c === cardId));
    const cardInDowngrades = (targetPlayer.downgrades || []).find(c => c && (c.id === cardId || c === cardId));

    const card = cardInStable || cardInUpgrades || cardInDowngrades;

    if (!card) {
        return { success: false, reason: "Card not found in target player's stable/upgrades/downgrades" };
    }

    // 2. Determine if card is a Baby Unicorn
    const isBaby = (
        card.category === 'BABY' ||
        card.category === (typeof CARD_TYPES !== 'undefined' ? CARD_TYPES.BABY : 'BABY') ||
        card.type === 'Baby' ||
        card.category === 'Baby Unicorn' ||
        card.isBaby === true
    );

    const destination = isBaby ? 'nursery' : 'hand';

    // 3. Perform movement and capture result
    if (typeof sendCardFromStable === 'function') {
        const result = sendCardFromStable(gameState, targetPlayerName, cardId, destination);
        if (result && !result.success) {
            return result; // Forward failure if sendCardFromStable failed
        }
    } else {
        return { success: false, reason: "sendCardFromStable function missing" };
    }

    return {
        success: true,
        message: isBaby
            ? `Returned Baby Unicorn from ${targetPlayerName}'s Stable back to the Nursery.`
            : `Returned card from ${targetPlayerName}'s Stable to hand.`
    };
}

export function shuffleDiscardIntoDrawPile(gameState) {
    if (!gameState || !Array.isArray(gameState.discardPile) || gameState.discardPile.length === 0) {
        return { success: false, reason: "Discard pile is empty or invalid" };
    }

    // Safely ensure drawPile exists
    gameState.drawPile = gameState.drawPile || [];

    // Move all discard pile cards into draw pile
    gameState.drawPile.push(...gameState.discardPile);
    gameState.discardPile = [];

    // Shuffle draw pile if function exists
    if (typeof shuffle === 'function') {
        shuffle(gameState.drawPile);
    }

    return { success: true };
}

/**
 * Moves a card out of a player's Stable (or Upgrades area).
 * Intercepts Baby Unicorns automatically to send them back to the Nursery!
 * Intercepts Flying/Phoenix Unicorns to send them back to Hand!
 */
export function sendCardFromStable(gameState, playerName, cardId, destination = 'discard') {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found" };

    let removedCard = null;

    // Helper matcher to prevent false positive matches on undefined IDs
    const matchesCard = c => {
        if (!c) return false;
        if (c === cardId) return true;
        const targetId = typeof cardId === 'object' ? (cardId.id || cardId.uuid) : cardId;
        if (!targetId) return false;
        return (c.id && String(c.id) === String(targetId)) || (c.uuid && String(c.uuid) === String(targetId));
    };

    // 1. Search all stable zones (Stable, Upgrades, Downgrades)
    const zones = ['stable', 'upgrades', 'downgrades'];
    for (const zone of zones) {
        if (Array.isArray(player[zone])) {
            const idx = player[zone].findIndex(matchesCard);
            if (idx !== -1) {
                [removedCard] = player[zone].splice(idx, 1);
                break;
            }
        }
    }

    if (!removedCard) {
        return { success: false, reason: "Card not found in player's stable/upgrades/downgrades" };
    }

    // --- LEAVE STABLE TRIGGER INTERCEPTOR ---
    if (typeof triggerLeavesStable === 'function') {
        triggerLeavesStable(gameState, playerName, removedCard);
    }

    // --- BABY UNICORN INTERCEPTOR ---
    const cat = (removedCard.category || removedCard.type || '').toString().toUpperCase();
    const isBaby = cat.includes('BABY') || cat === 'BABY UNICORN';

    if (isBaby || destination === 'nursery') {
        gameState.nursery = gameState.nursery || [];
        gameState.nursery.push(removedCard);
        return { success: true, card: removedCard, message: `${removedCard.name} returned to the Nursery!` };
    }

    // --- REPLACEMENT EFFECT INTERCEPTOR (FLYING UNICORNS) ---
    if (destination === 'discard' && removedCard.returnToHandOnDestroy) {
        player.hand = player.hand || [];
        player.hand.push(removedCard);
        return { success: true, card: removedCard, message: `${removedCard.name} was returned to hand instead!` };
    }

    // --- NORMAL ROUTING ---
    if (destination === 'discard') {
        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(removedCard);
    } else if (destination === 'hand') {
        player.hand = player.hand || [];
        player.hand.push(removedCard);
    }

    return { success: true, card: removedCard };
}

/**
 * SEARCH DECK TO HAND: Moves a specific card from the draw pile into a player's hand
 * and shuffles the remaining draw pile.
 */
export function searchDeckToHand(gameState, playerName, cardId) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !Array.isArray(gameState.drawPile)) {
        return { success: false, reason: "Player or draw pile not found" };
    }

    // UPDATED: Safe string matching to prevent number vs. string type mismatches
    const cardIndex = gameState.drawPile.findIndex(c => {
        if (!c) return false;
        if (c === cardId) return true;

        const targetId = typeof cardId === 'object' ? (cardId.id || cardId.uuid) : cardId;
        return (c.id && String(c.id) === String(targetId)) || (c.uuid && String(c.uuid) === String(targetId));
    });

    if (cardIndex === -1) {
        return { success: false, reason: "Card not found in draw pile" };
    }

    const [chosenCard] = gameState.drawPile.splice(cardIndex, 1);
    player.hand = player.hand || [];
    player.hand.push(chosenCard);

    // Safe Fisher-Yates Shuffle Fallback
    if (typeof shuffle === 'function') {
        shuffle(gameState.drawPile);
    } else {
        for (let i = gameState.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
        }
    }

    return { success: true, card: chosenCard };
}

/**
 * MOVE DISCARD TO HAND: Removes a specific card from the Discard Pile and adds it to a player's hand.
 */
export function moveDiscardToHand(gameState, playerName, cardId) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !Array.isArray(gameState.discardPile)) {
        return { success: false, reason: "Player or discard pile not found" };
    }

    const cardIndex = gameState.discardPile.findIndex(c => c && (c.id === cardId || c === cardId));
    if (cardIndex === -1) {
        return { success: false, reason: "Card not found in discard pile" };
    }

    const [chosenCard] = gameState.discardPile.splice(cardIndex, 1);
    player.hand = player.hand || [];
    player.hand.push(chosenCard);

    return { success: true, card: chosenCard };
}

/**
 * PLAY NEIGH: Plays Neigh from hand to cancel a targeted played card and send it to Discard.
 */
export function playNeighCard(gameState, playerName, neighCardIndexInHand, targetedCard = null, targetPlayerName = null) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !player.hand || neighCardIndexInHand < 0 || neighCardIndexInHand >= player.hand.length) {
        return { success: false, reason: "Invalid Neigh card selection in hand." };
    }

    // 🛡️ STEP 1: Check YAY Protection (Cards played by a player with YAY cannot be Neigh'd)
    if (targetPlayerName && typeof Yay === 'function' && Yay(gameState, targetPlayerName)) {
        return {
            success: false,
            reason: `${targetPlayerName} has YAY in play! Cards played by ${targetPlayerName} cannot be Neigh'd.`
        };
    }

    // 🛡️ STEP 2: Discard the Neigh card from hand after passing validation
    const discardResult = discardCard(gameState, playerName, neighCardIndexInHand);
    if (!discardResult || !discardResult.success) {
        return { success: false, reason: "Failed to discard Neigh card." };
    }

    // 🛡️ STEP 3: Cancel targeted card & clean up pending engine state
    if (targetedCard) {
        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(targetedCard);

        // Clear pending target card if engine uses pendingCard state
        if (gameState.pendingCard && (String(gameState.pendingCard.id) === String(targetedCard.id) || gameState.pendingCard === targetedCard)) {
            gameState.pendingCard = null;
        }
    }

    return {
        success: true,
        neighCard: discardResult.card,
        cancelledCard: targetedCard,
        message: `${playerName} played ${discardResult.card.name || 'Neigh'} to stop ${targetedCard ? targetedCard.name : "the card"} from being played!`
    };
}

/**
 * PLAY SUPER NEIGH: Plays Super Neigh from hand to immediately cancel a targeted card.
 * Cannot be countered by any subsequent Neigh card.
 */
export function playSuperNeighCard(gameState, playerName, superNeighCardIndexInHand, targetedCard = null, targetPlayerName = null) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !player.hand || superNeighCardIndexInHand < 0 || superNeighCardIndexInHand >= player.hand.length) {
        return { success: false, reason: "Invalid Super Neigh card selection in hand." };
    }

    // 🛡️ STEP 1: Check YAY Protection
    if (targetPlayerName && typeof Yay === 'function' && Yay(gameState, targetPlayerName)) {
        return {
            success: false,
            reason: `${targetPlayerName} has YAY in play! Cards played by ${targetPlayerName} cannot be Neigh'd.`
        };
    }

    // 🛡️ STEP 2: Discard Super Neigh card
    const discardResult = discardCard(gameState, playerName, superNeighCardIndexInHand);
    if (!discardResult || !discardResult.success) {
        return { success: false, reason: "Failed to discard Super Neigh card." };
    }

    // 🛡️ STEP 3: Remove targeted card from target player's hand if present & send to Discard
    if (targetedCard && targetPlayerName && gameState.players[targetPlayerName]) {
        const targetHand = gameState.players[targetPlayerName].hand || [];
        const cardIdx = targetHand.findIndex(c => c && ((c.id && c.id === targetedCard.id) || c === targetedCard));
        
        if (cardIdx !== -1) {
            targetHand.splice(cardIdx, 1);
        }

        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(targetedCard);

        if (gameState.pendingCard && (String(gameState.pendingCard.id) === String(targetedCard.id) || gameState.pendingCard === targetedCard)) {
            gameState.pendingCard = null;
        }
    }

    return {
        success: true,
        isSuperNeigh: true,
        superNeighCard: discardResult.card,
        cancelledCard: targetedCard,
        message: `${playerName} played SUPER NEIGH! ${targetedCard ? targetedCard.name : "The card"} was stopped and sent to the discard pile!`
    };
}

/**
 * START TURN PHASE: Initializes the active player's turn and scans for Beginning of Turn triggers.
 */
export function startTurnPhase(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    gameState.activePlayer = playerName;
    gameState.currentPhase = "BEGINNING_OF_TURN";
    gameState.turnTriggers = []; // 👈 Queue for all Beginning of Turn effects

    // SCAN 1: Sadistic Ritual
    if (typeof SadisticRitual === 'function' && SadisticRitual(gameState, playerName)) {
        const unicorns = (player.stable || []).filter(c => isUnicornCard(c, gameState, playerName));
        if (unicorns.length > 0) {
            gameState.turnTriggers.push('SADISTIC_RITUAL');
        }
    }

    // SCAN 2: Rhinocorn
    if (typeof Rhinocorn === 'function') {
        const rhinocornResult = Rhinocorn(gameState, playerName);
        if (rhinocornResult && rhinocornResult.requiresChoice) {
            gameState.turnTriggers.push('RHINOCORN');
        }
    }

    // PROCESS FIRST TRIGGER IN QUEUE
    return processNextTurnTrigger(gameState, playerName);
}

export function processNextTurnTrigger(gameState, playerName) {
    if (!gameState.turnTriggers || gameState.turnTriggers.length === 0) {
        gameState.currentPhase = "DRAW";
        gameState.phase = "DRAW";
        return {
            success: true,
            phase: "DRAW",
            activePlayer: playerName,
            message: `Beginning of Turn complete. Advanced to Draw phase.`
        };
    }

    const nextTrigger = gameState.turnTriggers.shift();

    if (nextTrigger === 'SADISTIC_RITUAL') {
        const player = gameState.players[playerName];
        const unicorns = (player.stable || []).filter(c => isUnicornCard(c, gameState, playerName));

        // Fix: Auto-skip if the player has no Unicorns to sacrifice
        if (unicorns.length === 0) {
            return processNextTurnTrigger(gameState, playerName);
        }

        gameState.pendingChoice = {
            chooser: playerName,
            actionType: 'SADISTIC_RITUAL',
            prompt: 'Sadistic Ritual: Choose a Unicorn card in your Stable to SACRIFICE, then DRAW a card.',
            targetScope: 'MY_STABLE',
            allowedCardIds: unicorns.map(c => typeof c === 'object' ? (c.id || c.uuid) : c)
        };
        gameState.phase = 'CHOICE';
        return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
    }

    if (nextTrigger === 'RHINOCORN') {
        const rhinocornResult = typeof Rhinocorn === 'function' ? Rhinocorn(gameState, playerName) : null;
        if (rhinocornResult && rhinocornResult.requiresChoice) {
            gameState.pendingChoice = rhinocornResult.pendingChoice;
            gameState.phase = 'CHOICE';
            return rhinocornResult;
        }
    }

    return processNextTurnTrigger(gameState, playerName);
}

/**
 * Checks whether a player's hand is visible to all players in the game.
 */
export function isHandVisibleToAll(gameState, playerName) {
    return typeof NannyCam === 'function' && NannyCam(gameState, playerName);
}

/**
 * Helper to check and enforce Tiny Stable limit (> 5 Unicorns).
 */
export function checkTinyStableTrigger(gameState, playerName) {
    if (typeof TinyStable !== 'function') return null;

    const result = TinyStable(gameState, playerName);
    if (!result || !result.requiresChoice) return null;

    // 🛡️ Preserve phase context on the pendingChoice object
    const currentPhase = gameState.previousPhase || (gameState.phase !== 'CHOICE' ? gameState.phase : 'ACTION');

    if (result.pendingChoice) {
        result.pendingChoice.previousPhase = result.pendingChoice.previousPhase || currentPhase;
    }

    // Return the result object without directly mutating gameState.
    // The calling function (or resolveChoice) will handle assigning gameState.pendingChoice and queueing!
    return result;
}

/**
 * Calculates the total Unicorn count for a player.
 * Ginormous Unicorn counts as 2 Unicorns.
 */
export function getUnicornCount(gameState, playerName) {
    const player = gameState?.players?.[playerName];
    if (!player || !Array.isArray(player.stable)) return 0;

    return player.stable.reduce((total, card) => {
        if (!card) return total;

        const category = (card.category || card.type || card.cardType || '').toUpperCase();
        const name = (card.name || '').toUpperCase();

        // Exclude Upgrades, Downgrades, Instants, and non-Unicorn Magic cards
        if (
            category.includes('UPGRADE') ||
            category.includes('DOWNGRADE') ||
            category.includes('INSTANT') ||
            (category.includes('MAGIC') && !category.includes('UNICORN') && !category.includes('MAGICAL'))
        ) {
            return total;
        }

        // Verify card is a valid Unicorn
        const isUnicorn =
            category.includes('UNICORN') ||
            category.includes('BABY') ||
            category.includes('BASIC') ||
            category.includes('MAGICAL') ||
            name.includes('UNICORN') ||
            name.includes('NARWHAL');

        if (!isUnicorn) return total;

        // Check for Ginormous Unicorn (counts as 2 Unicorns)
        const isGinormous =
            card.id === 'ginormous_unicorn' ||
            card.name === 'Ginormous Unicorn';

        return total + (isGinormous ? 2 : 1);
    }, 0);
}
/**
 * PLAY CARD FROM HAND: Plays a card from a player's hand into play or resolves its Magic effect.
 */
import * as CardEffects from './cardEffects.js'; // Adjust path if needed

export function playCardFromHand(gameState, playerName, handIndex, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !player.hand || handIndex < 0 || handIndex >= player.hand.length) {
        return { success: false, reason: "Invalid card selection or player not found." };
    }

    const card = player.hand[handIndex];
    const category = (card.category || card.type || card.cardType || '').toUpperCase();

    const isInstantCard = category.includes('INSTANT');
    const isMagicCard = category.includes('MAGIC') && !category.includes('UNICORN') && !category.includes('MAGICAL');
    const isDowngradeCard = category.includes('DOWNGRADE');
    const isUpgradeCard = category.includes('UPGRADE');

    // 🛡️ PIPELINE STEP 1: VERIFY ACTION RESOURCE
    // Detect choice resolution via explicit flags OR presence of target fields
    const isResumingChoice = Boolean(
        targetData.isChoiceResolved ||
        targetData.neighResolved ||
        targetData.actionDeducted ||
        targetData.targetPlayerName ||
        targetData.targetPlayer ||
        targetData.selectedPlayer ||
        (gameState.pendingChoice && gameState.pendingChoice.cardPlayed)
    );

    const currentActions = gameState.actionsLeft !== undefined ? gameState.actionsLeft : (gameState.actionsRemaining ?? 1);

    if (!isInstantCard && !isResumingChoice && currentActions <= 0) {
        return { success: false, reason: "You have no actions left this turn!" };
    }

    // Helper to ensure action cost is charged exactly once per card play execution
    const deductActionOnce = () => {
        if (!targetData.actionDeducted && !isInstantCard && currentActions > 0) {
            gameState.actionsLeft = Math.max(0, currentActions - 1);
            gameState.actionsRemaining = gameState.actionsLeft;
            targetData.actionDeducted = true;
        }
    };

    // 🛡️ PIPELINE STEP 2: CHECK PASSIVE RESTRICTIONS
    if (isUpgradeCard) {
        const hasBrokenStable = (player.downgrades || []).some(c => c && c.name === 'Broken Stable') ||
            (player.stable || []).some(c => c && c.name === 'Broken Stable');

        if (hasBrokenStable) {
            return { success: false, reason: "Broken Stable is active in your Stable! You cannot play Upgrade cards." };
        }
    }

    // --- 0. INSTANT CARD HANDLING ---
    if (isInstantCard) {
        if (typeof Slowdown === 'function' && Slowdown(gameState, playerName)) {
            return { success: false, reason: "Slowdown is active in your Stable! You cannot play Instant cards." };
        }

        if (card.onPlay?.action === 'SUPER_NEIGH' || card.id === 'super_neigh') {
            return playSuperNeighCard(gameState, playerName, handIndex, targetData.targetedCard, targetData.targetPlayerName);
        }
        return playNeighCard(gameState, playerName, handIndex, targetData.targetedCard, targetData.targetPlayerName);
    }

    // --- 1. NEIGH INTERRUPT WINDOW CHECK ---
    const playerHasYay = typeof Yay === 'function' && Yay(gameState, playerName);
    if (!targetData.neighResolved && !playerHasYay) {
        const playersWithNeigh = (gameState.playerOrder || []).filter(pName => {
            if (pName === playerName) return false;
            if (typeof Slowdown === 'function' && Slowdown(gameState, pName)) return false;

            const p = gameState.players[pName];
            return p && Array.isArray(p.hand) && p.hand.some(c => c && (
                (c.category || '').toUpperCase().includes('INSTANT') ||
                c.name === 'Neigh' || c.name === 'Super Neigh'
            ));
        });

        if (playersWithNeigh.length > 0) {
            deductActionOnce();
            gameState.pendingChoice = {
                actionType: 'NEIGH_INTERRUPT',
                choosers: playersWithNeigh,
                responses: {},
                prompt: `${playerName} is playing ${card.name}! Do you want to play NEIGH?`,
                cardPlayed: card,
                cardIndex: handIndex,
                originalPlayer: playerName,
                lastNeighPlayer: null,
                neighCount: 0,
                previousPhase: gameState.phase || 'ACTION',
                contextData: { ...targetData, actionDeducted: true }
            };
            gameState.phase = 'CHOICE';
            return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
        }
    }

    // --- 2. MAGIC CARDS ---
    if (isMagicCard) {
        deductActionOnce();
        const effectResult = executeOnPlayEffect(gameState, playerName, card, { ...targetData, cardPlayed: card });

        if (effectResult && effectResult.requiresChoice) {
            gameState.pendingChoice = {
                ...effectResult.pendingChoice,
                cardPlayed: card,
                cardIndex: handIndex,
                originalPlayer: playerName,
                contextData: { ...(effectResult.pendingChoice.contextData || {}), actionDeducted: true }
            };
            gameState.phase = 'CHOICE';
            return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
        }

        if (effectResult && effectResult.success) {
            if (!effectResult.handledDestination) {
                player.hand.splice(handIndex, 1);
                gameState.discardPile = gameState.discardPile || [];
                gameState.discardPile.push(card);
            }

            // Auto-advance turn if no actions remain
            if (gameState.actionsLeft <= 0 && typeof advanceToNextPlayer === 'function') {
                advanceToNextPlayer(gameState);
            }

            return {
                success: true,
                card: card,
                effectResult,
                message: `${playerName} played Magic card: ${card.name}!`
            };
        }

        return effectResult || { success: false, reason: "Failed to execute Magic card effect." };
    }

    // --- 3. RESOLVE TARGET DESTINATION PLAYER ---
    let destinationPlayer = playerName;
    const functionName = (card.name || '').replace(/[^a-zA-Z0-9]/g, '');
    const effectFn = (typeof CardEffects !== 'undefined' && CardEffects[functionName]) ||
        (typeof window !== 'undefined' && window[functionName]) ||
        (typeof globalThis !== 'undefined' && globalThis[functionName]);

    if (isDowngradeCard || isUpgradeCard) {
        destinationPlayer = targetData.targetPlayerName || targetData.targetPlayer || targetData.selectedPlayer;

        if (!destinationPlayer) {
            let possibleTargets = isDowngradeCard
                ? (gameState.playerOrder || []).filter(name => name !== playerName)
                : (gameState.playerOrder || []);

            if (typeof effectFn === 'function') {
                possibleTargets = possibleTargets.filter(pName => {
                    const check = effectFn(gameState, pName, { ...targetData, isPlayConditionCheck: true, targetPlayerName: pName });
                    return !(check && check.canEnter === false);
                });
            }

            if (possibleTargets.length === 0) {
                return { success: false, reason: `No valid targets available for ${card.name}.` };
            }

            deductActionOnce();
            gameState.pendingChoice = {
                chooser: playerName,
                actionType: isDowngradeCard ? 'TARGET_PLAYER_DOWNGRADE' : 'TARGET_PLAYER_UPGRADE',
                targetScope: isDowngradeCard ? 'OTHER_PLAYER' : 'ANY_PLAYER',
                prompt: `Choose a player to receive ${card.name}`,
                cardIndex: handIndex,
                cardPlayed: card,
                originalPlayer: playerName,
                allowedPlayers: possibleTargets,
                contextData: { ...(targetData || {}), actionDeducted: true, isChoiceResolved: false }
            };
            gameState.phase = 'CHOICE';
            return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
        }
    }

    // --- 4. SAFE ENTRY CONDITION CHECK ---
    if (typeof effectFn === 'function') {
        const conditionCheck = effectFn(gameState, destinationPlayer, {
            ...targetData,
            isPlayConditionCheck: true,
            targetPlayerName: destinationPlayer
        });

        if (conditionCheck && conditionCheck.canEnter === false) {
            return { success: false, reason: conditionCheck.reason || `${card.name} play requirements not met.` };
        }
    }

    // --- 5. ENTER PLAY & DEDUCT ACTION ---
    deductActionOnce();
    const result = bringDirectlyIntoPlay(gameState, destinationPlayer, card, 'hand', playerName, triggerEntersStable);

    if (result && result.requiresChoice) {
        gameState.pendingChoice = result.pendingChoice;
        gameState.phase = 'CHOICE';
    } else if (result && result.success) {
        if (gameState.actionsLeft <= 0 && typeof advanceToNextPlayer === 'function') {
            advanceToNextPlayer(gameState);
        }
    }

    return result;
}