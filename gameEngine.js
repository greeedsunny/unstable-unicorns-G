// gameEngine.js
import { buildInitialDecks, CARD_TYPES, isUnicornCard, isBabyCard, isBasicUnicorn } from './cardsData.js';
import { drawCard, stealCard, getUnicornCount, playCardFromHand, bringDirectlyIntoPlay, sacrificeCard, destroyCard } from './gameActions.js';
import {
    executeOnPlayEffect,
    triggerEntersStable,
    triggerBeginningOfTurn,
    Yay,
    BrokenStable,
    Pandamonium,
    GinormousUnicorn,
    TinyStable,
    UnicornLasso,
    handleTinyStableSacrifice,
    handleSadisticRitual,
    handleRhinocorn
} from './cardEffects.js';
import * as CardEffects from './cardEffects.js';
/**
 * Initializes full game state at startup
 * @param {string[]} playerNames - Array of player names (e.g. ["A", "B"])
 */
export function initializeGameState(playerNames) {
    const { nursery, drawPile, discardPile } = buildInitialDecks();

    /** @type {Record<string, any>} */
    const players = {};

    // Deal 5 cards from draw pile to each player + 1 Baby Unicorn from Nursery
    playerNames.forEach((name) => {
        const hand = drawPile.splice(0, 5);
        const baby = nursery.pop();

        players[name] = {
            name: name,
            hand: hand,
            stable: baby ? [baby] : [],
            upgrades: [],
            downgrades: [] // Added downgrades array
        };
    });

    const firstPlayer = playerNames[0];

    // AUTO-DRAW FOR TURN 1: Draw 1 additional card for First Player's turn
    if (firstPlayer && players[firstPlayer] && drawPile.length > 0) {
        const turnOneCard = drawPile.pop();
        players[firstPlayer].hand.push(turnOneCard);
    }

    return {
        players,
        playerOrder: playerNames,
        currentTurnIndex: 0,
        currentTurn: firstPlayer,
        currentPlayer: firstPlayer,
        currentTurnPlayer: firstPlayer,
        actionsRemaining: 1, // Default 1 action per turn
        phase: 'ACTION',
        pendingChoice: null,
        nursery,
        drawPile,
        discardPile
    };
}

/**
 * Internal helper to advance turn to the next player
 */
function advanceToNextPlayer(gameState) {
    // EXTRA TURN CHECK: If current player has an extra turn stored
    if (gameState.extraTurns && gameState.extraTurns > 0) {
        gameState.extraTurns -= 1; // Consume one extra turn

        const activePlayerName = gameState.currentTurn || gameState.playerOrder[gameState.currentTurnIndex || 0];
        const player = gameState.players ? gameState.players[activePlayerName] : null;

        // Auto-draw 1 card for the start of the extra turn
        if (player && Array.isArray(gameState.drawPile) && gameState.drawPile.length > 0) {
            drawCard(gameState, activePlayerName, 1);
        }

        gameState.actionsRemaining = 1;
        gameState.phase = 'ACTION';
        gameState.pendingChoice = null;

        return gameState; // Turn stays with the SAME player!
    }

    // Standard turn advance if no extra turns remain
    const currentIndex = typeof gameState.currentTurnIndex === 'number' ? gameState.currentTurnIndex : 0;
    const nextIndex = (currentIndex + 1) % gameState.playerOrder.length;
    const nextPlayerName = gameState.playerOrder[nextIndex];

    gameState.currentTurnIndex = nextIndex;
    gameState.currentTurn = nextPlayerName;
    gameState.currentPlayer = nextPlayerName;
    gameState.currentTurnPlayer = nextPlayerName;
    gameState.actionsRemaining = 1; // Reset to 1 action per turn

    // AUTO-DRAW: Draw 1 card from Draw Pile into the player's hand
    const player = gameState.players ? gameState.players[nextPlayerName] : null;
    if (player && Array.isArray(gameState.drawPile) && gameState.drawPile.length > 0) {
        drawCard(gameState, nextPlayerName, 1);
    }

    // BEGINNING OF TURN TRIGGERS (Extra Tail, Glitter Bomb, Double Dutch, Unicorn Lasso, etc.)
    if (typeof triggerBeginningOfTurn === 'function') {
        const turnStartResult = triggerBeginningOfTurn(gameState, nextPlayerName);
        if (turnStartResult && turnStartResult.requiresChoice) {
            gameState.pendingChoice = turnStartResult.pendingChoice;
            gameState.phase = 'CHOICE';
            return gameState;
        }
    }

    gameState.phase = 'ACTION';
    gameState.pendingChoice = null;

    return gameState;
}

/**
 * Checks if a player has reached 7 Unicorns in their Stable
 */
export function checkWinCondition(gameState) {
    if (!gameState || !gameState.players) return null;

    const playerKeys = Object.keys(gameState.players);
    // Standard rule: 7 unicorns required for 2–5 players, 6 for 6+ players
    const targetUnicorns = playerKeys.length >= 6 ? 6 : 7;

    for (const playerName of playerKeys) {
        const totalUnicorns = getUnicornCount(gameState, playerName);

        if (totalUnicorns >= targetUnicorns) {
            gameState.winner = playerName;
            gameState.status = 'GAME_OVER';
            return playerName; // Returns player's name string ("Player A")
        }
    }
    return null; // Returns null (falsy) when there is no winner yet
}

/**
 * Advances the turn to the next player in order (enforces 7-card hand limit & checks win condition)
 */
// Keep alias so existing code expecting resolveLassoReturn works
export const resolveLassoReturn = returnStolenCards;

export function nextTurn(gameState) {
    if (!gameState || !gameState.playerOrder || gameState.playerOrder.length === 0) {
        return gameState;
    }

    const activePlayerName = gameState.currentTurn || gameState.playerOrder[gameState.currentTurnIndex || 0];

    // 1. CHECK WIN CONDITION INSTANTLY
    const winner = checkWinCondition(gameState);
    if (winner) {
        gameState.winner = winner;
        gameState.phase = 'GAME_OVER';
        gameState.pendingChoice = null;
        return gameState;
    }

    // 2. CLEAR ANY LINGERING QUEUED TRIGGERS FIRST
    // If the engine resumes nextTurn() after a choice, it must finish the queue!
    if (gameState.triggerQueue && gameState.triggerQueue.length > 0) {
        gameState.pendingChoice = gameState.triggerQueue.shift();
        gameState.phase = 'CHOICE';
        return gameState;
    }

    // 3. RETURN UNICORN LASSO CARDS & FIRE RETURN ETB EFFECTS
    // Note: Passed only gameState, as our upgraded function extracts everything it needs safely
    const lassoReturnResult = returnStolenCards(gameState);
    if (lassoReturnResult && lassoReturnResult.requiresChoice) {
        gameState.phase = 'CHOICE';
        gameState.pendingChoice = lassoReturnResult.pendingChoice;
        return gameState;
    }

    const activePlayer = gameState.players ? gameState.players[activePlayerName] : null;

    // 4. CHECK HAND SIZE LIMIT (MAX 7 CARDS)
    // This correctly happens AFTER returns, just in case returning a card triggered a draw effect!
    if (activePlayer && Array.isArray(activePlayer.hand) && activePlayer.hand.length > 7) {
        const excess = activePlayer.hand.length - 7;
        gameState.phase = 'CHOICE';
        gameState.pendingChoice = {
            chooser: activePlayerName,
            prompt: `Hand limit reached! Discard ${excess} card${excess > 1 ? 's' : ''} to end turn.`,
            targetScope: 'MY_HAND',
            actionType: 'DISCARD_TO_7'
        };
        return gameState;
    }

    // 5. CLEANUP & ADVANCE
    return advanceToNextPlayer(gameState);
}

// Export endTurn as an alias so worker.js works whether it calls endTurn or nextTurn!
export const endTurn = nextTurn;

export function returnStolenCards(gameState) {
    if (!gameState.temporaryStolenCards || gameState.temporaryStolenCards.length === 0) {
        return { success: true };
    }

    const pendingChoices = [];

    // Safely process all stolen cards without breaking early
    while (gameState.temporaryStolenCards.length > 0) {
        const record = gameState.temporaryStolenCards.shift();
        const { cardId, stolenFrom, stolenBy } = record;
        const currentOwner = gameState.players[stolenBy];
        const originalOwner = gameState.players[stolenFrom];

        if (currentOwner && originalOwner && Array.isArray(currentOwner.stable)) {
            const cardIdx = currentOwner.stable.findIndex(c => c && c.id === cardId);
            if (cardIdx !== -1) {
                // 1. Return the card
                const [returnedCard] = currentOwner.stable.splice(cardIdx, 1);
                originalOwner.stable.push(returnedCard);

                // 2. Check for ETB Effects
                if (typeof triggerEntersStable === 'function') {
                    const etbResult = triggerEntersStable(gameState, stolenFrom, returnedCard);
                    if (etbResult && etbResult.requiresChoice) {
                        pendingChoices.push({
                            ...etbResult.pendingChoice,
                            isEnterTrigger: true,
                            cardPlayed: returnedCard,
                            originalPlayer: stolenFrom
                        });
                    }
                }

                // 3. Check for Tiny Stable Limits (Crucial safety check!)
                if (typeof checkTinyStableTrigger === 'function') {
                    const tinyStableResult = checkTinyStableTrigger(gameState, stolenFrom);
                    if (tinyStableResult && tinyStableResult.requiresChoice) {
                        pendingChoices.push(tinyStableResult.pendingChoice);
                    }
                }
            }
        }
    }

    // --- RESOLVE QUEUE COLLISIONS ---
    if (pendingChoices.length > 0) {
        gameState.triggerQueue = gameState.triggerQueue || [];

        // Enqueue everything except the first one
        if (pendingChoices.length > 1) {
            gameState.triggerQueue.push(...pendingChoices.slice(1));
        }

        gameState.pendingChoice = pendingChoices[0];
        gameState.phase = 'CHOICE';

        return {
            success: true,
            requiresChoice: true,
            pendingChoice: gameState.pendingChoice,
            message: "Cards returned to owners. Resolving triggered effects..."
        };
    }

    return { success: true };
}

// --- CHOICE HANDLERS ---

function handleBarbedWire(gameState, playerName, choiceData, pending) {
    const player = gameState.players[playerName];
    const discardIdx = choiceData.cardIndexToDiscard !== undefined
        ? choiceData.cardIndexToDiscard
        : choiceData.cardIndex;

    if (player && Array.isArray(player.hand) && discardIdx !== undefined && discardIdx !== null && discardIdx >= 0 && discardIdx < player.hand.length) {
        const [discardedCard] = player.hand.splice(discardIdx, 1);
        if (discardedCard) {
            gameState.discardPile = gameState.discardPile || [];
            gameState.discardPile.push(discardedCard);
        }
    }

    gameState.pendingChoice = null;

    if (pending.isEnterTrigger && pending.cardPlayed) {
        const nextTargetData = {
            ...(pending.contextData || {}),
            barbedWireResolved: true,
            isChoiceResolution: true
        };
        const originalPlayer = pending.originalPlayer || playerName;

        const etbResult = triggerEntersStable(gameState, originalPlayer, pending.cardPlayed, nextTargetData);

        if (etbResult && etbResult.requiresChoice) {
            gameState.pendingChoice = {
                ...etbResult.pendingChoice,
                fromBeginningOfTurn: pending.fromBeginningOfTurn || false,
                isEnterTrigger: true,
                cardPlayed: etbResult.pendingChoice ? etbResult.pendingChoice.cardPlayed || pending.cardPlayed : pending.cardPlayed,
                cardIndex: pending.cardIndex,
                originalPlayer: originalPlayer,
                contextData: {
                    ...(pending.contextData || {}),
                    ...(etbResult.pendingChoice ? etbResult.pendingChoice.contextData : {}),
                    barbedWireResolved: true
                }
            };
            gameState.phase = 'CHOICE';
            return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
        }
    }

    if (pending.fromBeginningOfTurn) {
        gameState.phase = 'ACTION';
        return { success: true, actionsRemaining: gameState.actionsRemaining };
    }

    gameState.actionsRemaining = Math.max(0, (gameState.actionsRemaining || 1) - 1);
    if (gameState.actionsRemaining > 0) {
        gameState.phase = 'ACTION';
    } else {
        gameState.phase = 'END';
        if (typeof nextTurn === 'function') nextTurn(gameState);
    }

    return { success: true };
}

function handleTargetPlayerDowngrade(gameState, playerName, choiceData, pending) {
    const targetPlayerName = choiceData.targetPlayerName || choiceData.targetPlayer || choiceData.selectedPlayer;
    if (!targetPlayerName) {
        return { success: false, reason: "No target player selected for Downgrade card." };
    }

    gameState.pendingChoice = null;

    const playResult = bringDirectlyIntoPlay(
        gameState,
        targetPlayerName,
        pending.cardPlayed,
        'hand',
        pending.originalPlayer,
        triggerEntersStable
    );

    if (!playResult || !playResult.success) {
        return playResult || { success: false, reason: "Failed to place Downgrade card." };
    }

    gameState.actionsRemaining = Math.max(0, (gameState.actionsRemaining || 1) - 1);
    if (gameState.actionsRemaining > 0) {
        gameState.phase = 'ACTION';
    } else {
        gameState.phase = 'END';
        nextTurn(gameState);
    }

    return playResult;
}

export function handleNeighInterrupt(gameState, playerName, choiceData, pending) {
    const decision = (choiceData.useNeigh || choiceData.action === 'PLAY') ? 'PLAY' : 'PASS';
    const originPhase = pending.previousPhase || gameState.previousPhase || 'ACTION';

    // Safe helper: Matches by strict object equality or valid ID
    const findInHand = (playerObj, cardRef) => {
        if (!playerObj || !Array.isArray(playerObj.hand) || !cardRef) return -1;
        return playerObj.hand.findIndex(c => c && (
            c === cardRef ||
            (c.id && cardRef.id && c.id === cardRef.id)
        ));
    };

    if (decision === 'PLAY') {
        // 🛑 SLOWDOWN CHECK
        if (typeof Slowdown === 'function' && Slowdown(gameState, playerName)) {
            return { success: false, reason: "Slowdown is in your Stable! You cannot play Instant cards." };
        }

        // 🛡️ YAY CHECK
        const targetPlayerCheck = pending.lastNeighPlayer || pending.originalPlayer;
        if (targetPlayerCheck && typeof Yay === 'function' && Yay(gameState, targetPlayerCheck)) {
            return { success: false, reason: `${targetPlayerCheck} has YAY in play! Their cards cannot be Neigh'd.` };
        }

        const neighPlayer = gameState.players[playerName];
        if (!neighPlayer || !Array.isArray(neighPlayer.hand)) {
            return { success: false, reason: "Player or hand not found." };
        }

        let neighIdx = -1;
        if (choiceData.cardIndex !== undefined && choiceData.cardIndex !== null && neighPlayer.hand[choiceData.cardIndex]) {
            neighIdx = choiceData.cardIndex;
        } else if (choiceData.cardId) {
            neighIdx = neighPlayer.hand.findIndex(c => c && c.id === choiceData.cardId);
        } else {
            neighIdx = neighPlayer.hand.findIndex(c => c && (
                c.name === "Super Neigh" || c.id === "super_neigh" ||
                c.name === "Neigh" || c.id === "neigh" ||
                (c.category || '').toUpperCase().includes('INSTANT') ||
                (c.type || '').toUpperCase().includes('INSTANT')
            ));
        }

        // 🛑 PREVENT GHOST NEIGH EXPLOIT
        if (neighIdx === -1) {
            return { success: false, reason: "You do not have a valid Neigh or Instant card in your hand!" };
        }

        const playedCard = neighPlayer.hand[neighIdx];
        const isSuperNeigh = playedCard && (
            playedCard.id === 'super_neigh' ||
            playedCard.name === 'Super Neigh' ||
            (playedCard.onPlay && playedCard.onPlay.action === 'SUPER_NEIGH')
        );

        // Discard the played Neigh/Super Neigh card
        const [neighCard] = neighPlayer.hand.splice(neighIdx, 1);
        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(neighCard);

        const currentNeighCount = (pending.neighCount || 0) + 1;
        const playerHasYay = typeof Yay === 'function' && Yay(gameState, playerName);

        // Check if other players can counter-respond
        if (!isSuperNeigh && !playerHasYay) {
            const playersWithNeigh = [];
            for (const pName of gameState.playerOrder) {
                if (pName === playerName) continue;
                if (typeof Slowdown === 'function' && Slowdown(gameState, pName)) continue;

                const p = gameState.players[pName];
                if (p && Array.isArray(p.hand)) {
                    const hasNeigh = p.hand.some(c => c && (
                        c.name === "Neigh" || c.id === "neigh" ||
                        c.name === "Super Neigh" || c.id === "super_neigh" ||
                        (c.category || '').toUpperCase().includes('INSTANT') ||
                        (c.type || '').toUpperCase().includes('INSTANT')
                    ));
                    if (hasNeigh) playersWithNeigh.push(pName);
                }
            }

            if (playersWithNeigh.length > 0) {
                gameState.pendingChoice = {
                    actionType: 'NEIGH_INTERRUPT',
                    choosers: playersWithNeigh,
                    responses: {},
                    prompt: `${playerName} played NEIGH! Do you want to play NEIGH to stop it?`,
                    cardPlayed: pending.cardPlayed,
                    cardIndex: pending.cardIndex,
                    originalPlayer: pending.originalPlayer,
                    lastNeighPlayer: playerName,
                    neighCount: currentNeighCount,
                    previousPhase: originPhase,
                    contextData: pending.contextData
                };
                gameState.phase = 'CHOICE';
                return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
            }
        }

        // --- RESOLVE NEIGH CHAIN ---
        const origPlayerObj = gameState.players[pending.originalPlayer];
        const actualCardIndex = findInHand(origPlayerObj, pending.cardPlayed);

        if (currentNeighCount % 2 === 1) {
            // ODD count: Original Card CANCELLED
            if (origPlayerObj && actualCardIndex !== -1) {
                const [cancelledCard] = origPlayerObj.hand.splice(actualCardIndex, 1);
                gameState.discardPile.push(cancelledCard);
            }

            gameState.pendingChoice = null;
            gameState.phase = originPhase;

            return {
                success: true,
                cancelled: true,
                isSuperNeigh: isSuperNeigh,
                message: `${playerName} played ${isSuperNeigh ? 'SUPER NEIGH' : 'NEIGH'}! ${pending.cardPlayed ? pending.cardPlayed.name : 'The card'} was stopped.`
            };
        } else {
            // EVEN count: Original Card SUCCEEDS
            const targetData = { ...(pending.contextData || {}), neighResolved: true };
            gameState.pendingChoice = null;
            gameState.phase = originPhase;
            return playCardFromHand(gameState, pending.originalPlayer, actualCardIndex, targetData);
        }
    }

    // --- PLAYER PASSED ---
    pending.responses = pending.responses || {};
    pending.responses[playerName] = 'PASS';
    pending.choosers = pending.choosers.filter(p => p !== playerName);

    if (pending.choosers.length > 0) {
        return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
    }

    // All players passed -> Final resolution
    const finalNeighCount = pending.neighCount || 0;
    const origPlayerObj = gameState.players[pending.originalPlayer];
    const actualCardIndex = findInHand(origPlayerObj, pending.cardPlayed);

    if (finalNeighCount % 2 === 1) {
        // ODD count: CANCELLED
        if (origPlayerObj && actualCardIndex !== -1) {
            const [cancelledCard] = origPlayerObj.hand.splice(actualCardIndex, 1);
            gameState.discardPile.push(cancelledCard);
        }

        gameState.pendingChoice = null;
        gameState.phase = originPhase;

        return {
            success: true,
            cancelled: true,
            message: `NEIGH resolved! ${pending.cardPlayed ? pending.cardPlayed.name : 'The card'} was stopped.`
        };
    } else {
        // EVEN count: SUCCEEDS
        const targetData = { ...(pending.contextData || {}), neighResolved: true };
        gameState.pendingChoice = null;
        gameState.phase = originPhase;
        return playCardFromHand(gameState, pending.originalPlayer, actualCardIndex, targetData);
    }
}

function handleDiscardTo7(gameState, playerName, choiceData) {
    const player = gameState.players[playerName];
    const discardIdx = choiceData.cardIndexToDiscard !== undefined
        ? choiceData.cardIndexToDiscard
        : choiceData.cardIndex;

    if (player && player.hand && discardIdx >= 0 && discardIdx < player.hand.length) {
        const [discardedCard] = player.hand.splice(discardIdx, 1);
        if (discardedCard && Array.isArray(gameState.discardPile)) {
            gameState.discardPile.push(discardedCard);
        }
    }

    const winner = checkWinCondition(gameState);
    if (winner) {
        gameState.winner = winner;
        gameState.phase = 'GAME_OVER';
        gameState.pendingChoice = null;
        return { success: true, winner: winner };
    }

    if (player && player.hand && player.hand.length > 7) {
        const excess = player.hand.length - 7;
        gameState.pendingChoice = {
            chooser: playerName,
            prompt: `Hand limit reached! Discard ${excess} card${excess > 1 ? 's' : ''} to end turn.`,
            targetScope: 'MY_HAND',
            actionType: 'DISCARD_TO_7'
        };
        return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
    } else {
        gameState.pendingChoice = null;
        advanceToNextPlayer(gameState);

        const postTurnWinner = checkWinCondition(gameState);
        if (postTurnWinner) {
            gameState.winner = postTurnWinner;
            gameState.phase = 'GAME_OVER';
            gameState.pendingChoice = null;
            return { success: true, winner: postTurnWinner };
        }

        return { success: true };
    }
}

function handleSkippedChoice(gameState, pending) {
    gameState.pendingChoice = null;

    const winner = checkWinCondition(gameState);
    if (winner) {
        gameState.winner = winner;
        gameState.phase = 'GAME_OVER';
        return { success: true, skipped: true, winner };
    }

    if (pending.fromBeginningOfTurn) {
        gameState.phase = 'ACTION';
        return { success: true, skipped: true, actionsRemaining: gameState.actionsRemaining };
    }

    gameState.actionsRemaining = Math.max(0, (gameState.actionsRemaining || 1) - 1);

    if (gameState.actionsRemaining > 0) {
        gameState.phase = 'ACTION';
        return { success: true, skipped: true, actionsRemaining: gameState.actionsRemaining };
    } else {
        gameState.phase = 'END';
        nextTurn(gameState);
        return { success: true, skipped: true };
    }
}

function handleDefaultEffectResolution(gameState, playerName, choiceData, pending) {
    const targetData = {
        ...(pending.contextData || {}),
        targets: { ...(pending.targets || {}), ...(choiceData.targets || {}) },
        discards: { ...(pending.discards || {}), ...(choiceData.discards || {}) },
        isChoiceResolution: true,
        ...choiceData
    };

    if (choiceData.targetCardId) {
        if (!targetData.targets) targetData.targets = {};
        targetData.targets[playerName] = choiceData.targetCardId;
    }
    if (choiceData.cardIndexToDiscard !== undefined) {
        if (!targetData.discards) targetData.discards = {};
        targetData.discards[playerName] = choiceData.cardIndexToDiscard;
    }

    const originalPlayer = pending.originalPlayer || playerName;
    const card = pending.cardPlayed;
    const isEnterTrigger = !!pending.isEnterTrigger;

    let result = isEnterTrigger
        ? triggerEntersStable(gameState, originalPlayer, card, targetData)
        : executeOnPlayEffect(gameState, originalPlayer, card, targetData);

    if (result && result.etbResult && result.etbResult.requiresChoice) {
        result = result.etbResult;
    }

    if (result && result.requiresChoice) {
        const resultIsEnterTrigger = isEnterTrigger || (result.pendingChoice ? !!result.pendingChoice.isEnterTrigger : false);
        const effectiveOriginalPlayer = (result.pendingChoice && result.pendingChoice.originalPlayer) || originalPlayer;

        gameState.pendingChoice = {
            ...result.pendingChoice,
            fromBeginningOfTurn: pending.fromBeginningOfTurn || false,
            isEnterTrigger: resultIsEnterTrigger,
            cardPlayed: result.pendingChoice ? result.pendingChoice.cardPlayed || card : card,
            cardIndex: pending.cardIndex,
            originalPlayer: effectiveOriginalPlayer,
            targets: targetData.targets,
            discards: targetData.discards,
            contextData: {
                ...(pending.contextData || {}),
                ...(result.pendingChoice ? result.pendingChoice.contextData : {}),
                skipNeigh: true,
                isEnterTrigger: resultIsEnterTrigger
            }
        };
        gameState.phase = 'CHOICE';
        return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
    }

    if (result && result.success) {
        const nextStep = pending.nextStep || (pending.contextData && pending.contextData.nextStep);

        if (nextStep && nextStep.type === 'UNICORN_SWAP_SECOND_STEAL') {
            const { p1, p2, p2CardIndex, p2CardId } = nextStep;
            const targetIdentifier = p2CardId !== undefined ? p2CardId : p2CardIndex;

            const swap2Result = stealCard(gameState, p2, p1, targetIdentifier);

            if (!swap2Result || !swap2Result.success) {
                return swap2Result || { success: false, reason: "Failed to transfer second Unicorn in Unicorn Swap." };
            }

            if (swap2Result.requiresChoice) {
                const swap2IsEnterTrigger = swap2Result.pendingChoice ? !!swap2Result.pendingChoice.isEnterTrigger : true;
                gameState.pendingChoice = {
                    ...swap2Result.pendingChoice,
                    fromBeginningOfTurn: pending.fromBeginningOfTurn || false,
                    isEnterTrigger: swap2IsEnterTrigger,
                    cardPlayed: swap2Result.card || (swap2Result.pendingChoice && swap2Result.pendingChoice.cardPlayed),
                    originalPlayer: p1,
                    chooser: p1,
                    contextData: {
                        ...(swap2Result.pendingChoice ? swap2Result.pendingChoice.contextData : {}),
                        skipNeigh: true,
                        isEnterTrigger: swap2IsEnterTrigger
                    }
                };
                gameState.phase = 'CHOICE';
                return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
            }
        }

        if (!isEnterTrigger) {
            const origPlayerObj = gameState.players[originalPlayer];

            if (origPlayerObj && !result.handledDestination && card) {
                const playedIdx = origPlayerObj.hand.findIndex(c => c && (c.id === card.id || c === card));
                if (playedIdx !== -1) {
                    origPlayerObj.hand.splice(playedIdx, 1);

                    const category = card.category || '';
                    const isMagicOrInstant =
                        category === CARD_TYPES.MAGIC ||
                        category === CARD_TYPES.INSTANT ||
                        category === 'Magic Card' ||
                        category === 'Instant Card';

                    if (isMagicOrInstant) {
                        gameState.discardPile.push(card);
                    } else {
                        origPlayerObj.stable.push(card);
                    }
                }
            }
        }

        const winner = checkWinCondition(gameState);
        if (winner) {
            gameState.winner = winner;
            gameState.phase = 'GAME_OVER';
            gameState.pendingChoice = null;
            return { success: true, winner: winner };
        }

        if (pending.fromBeginningOfTurn) {
            gameState.pendingChoice = null;
            gameState.phase = 'ACTION';
            return { success: true, actionsRemaining: gameState.actionsRemaining };
        }

        gameState.actionsRemaining = Math.max(0, (gameState.actionsRemaining || 1) - 1);

        if (gameState.actionsRemaining > 0) {
            gameState.pendingChoice = null;
            gameState.phase = 'ACTION';
            return { success: true, actionsRemaining: gameState.actionsRemaining };
        } else {
            gameState.pendingChoice = null;
            gameState.phase = 'END';
            nextTurn(gameState);
        }
    }

    return result;
}

// --- ACTION HANDLERS ROUTING MAP ---

// --- CHOICE HANDLERS MAPPING ---
const CHOICE_HANDLERS = {
    // Universal Engine Mechanics
    DISCARD_TO_7: handleDiscardTo7,
    TINY_STABLE_SACRIFICE: handleTinyStableSacrifice,
    BLACK_KNIGHT_UNICORN_PROTECT: handleBlackKnightProtect,
    NEIGH_INTERRUPT: handleNeighInterrupt,

    // Global Status / Passive Effects
    BARBED_WIRE: handleBarbedWire,
    BARBED_WIRE_DISCARD: handleBarbedWire,
    TARGET_PLAYER_DOWNGRADE: handleTargetPlayerDowngrade,

    // Turn Phase Queues
    SADISTIC_RITUAL: handleSadisticRitual,
    RHINOCORN: handleRhinocorn
};

// --- MAIN FUNCTION ---

export function resolveChoice(gameState, playerName, choiceData = {}) {
    const pending = gameState.pendingChoice;
    if (!pending) return { success: false, reason: "No choice pending" };

    // 🛡️ Preserve original phase context so chained choices never lose phase state
    const originPhase = pending.previousPhase || gameState.previousPhase || gameState.phase || 'ACTION';

    // --- 1. VALIDATE CHOOSER PERMISSIONS ---
    if (pending.choosers && Array.isArray(pending.choosers)) {
        if (!pending.choosers.includes(playerName)) {
            return { success: false, reason: `You are not prompted or have already responded.` };
        }
    } else if (pending.chooser && pending.chooser !== playerName) {
        return { success: false, reason: `Waiting for ${pending.chooser} to make a choice` };
    }

    // --- 2. EXECUTE HANDLER (EXPLICIT OR DYNAMIC FALLBACK) ---
    let handler = (typeof CHOICE_HANDLERS !== 'undefined' && CHOICE_HANDLERS) ? CHOICE_HANDLERS[pending.actionType] : null;

    if (!handler && pending.actionType) {
        const functionName = pending.actionType
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        const targetModule = typeof CardEffects !== 'undefined' ? CardEffects : (typeof window !== 'undefined' ? window : globalThis);

        if (targetModule && typeof targetModule[functionName] === 'function') {
            handler = (g, p, cData, pChoice) => {
                // Merge context while preserving step 1 parameters
                const mergedContext = {
                    ...(pChoice.contextData || {}),
                    ...cData
                };

                // 🛡️ Fix: DO NOT overwrite existing context data with undefined values!
                if (cData.targetCardId || cData.cardId) {
                    mergedContext.targetCardId = cData.targetCardId || cData.cardId;
                }
                if (cData.skipped !== undefined || cData.skip !== undefined) {
                    mergedContext.skipped = cData.skipped || cData.skip;
                }

                return targetModule[functionName](g, p, mergedContext);
            };
        }
    }

    let result = null;

    if (handler) {
        result = handler(gameState, playerName, choiceData, pending);
    } else if (choiceData.skipped || choiceData.skip) {
        if (typeof handleSkippedChoice === 'function') {
            result = handleSkippedChoice(gameState, pending);
        }
    } else {
        if (typeof handleDefaultEffectResolution === 'function') {
            result = handleDefaultEffectResolution(gameState, playerName, choiceData, pending);
        }
    }

    if (!result || !result.success) {
        return result || { success: false, reason: "Choice resolution failed." };
    }

    // --- 3. HANDLE MULTI-PLAYER CHOOSERS ---
    if (pending.choosers && Array.isArray(pending.choosers)) {
        pending.choosers = pending.choosers.filter(p => p !== playerName);
        if (pending.choosers.length > 0) {
            return {
                success: true,
                message: `Choice recorded for ${playerName}. Waiting for remaining players.`,
                requiresChoice: true,
                pendingChoice: pending
            };
        }
    }

    // --- 4. HANDLE CHAINED NEXT CHOICE ---
    if (result.requiresChoice && result.pendingChoice) {
        // 🛡️ Fix: Inherit previousPhase so chained choices never lose origin phase
        result.pendingChoice.previousPhase = result.pendingChoice.previousPhase || originPhase;
        gameState.pendingChoice = result.pendingChoice;
        gameState.phase = 'CHOICE';
        return result;
    }

    // --- 5. RESUME ETB CHAIN ---
    const context = pending.contextData || {};
    if (context.resumeETBCard && typeof triggerEntersStable === 'function') {
        const resumeResult = triggerEntersStable(gameState, playerName, context.resumeETBCard, {
            ...context,
            barbedWireResolved: true
        });

        if (resumeResult && resumeResult.requiresChoice) {
            resumeResult.pendingChoice.previousPhase = resumeResult.pendingChoice.previousPhase || originPhase;
            gameState.pendingChoice = resumeResult.pendingChoice;
            gameState.phase = 'CHOICE';
            return resumeResult;
        }
    }

    // --- 6. PROCESS GENERIC TRIGGER QUEUE (Fix for Choice Collisions) ---
    if (gameState.triggerQueue && gameState.triggerQueue.length > 0) {
        const nextChoice = gameState.triggerQueue.shift();
        nextChoice.previousPhase = nextChoice.previousPhase || originPhase;
        gameState.pendingChoice = nextChoice;
        gameState.phase = 'CHOICE';
        return {
            success: true,
            requiresChoice: true,
            pendingChoice: gameState.pendingChoice,
            message: result.message ? `${result.message} Processing next triggered effect...` : "Processing next triggered effect..."
        };
    }

    // --- 7. PROCESS TURN TRIGGER QUEUE OR RESTORE PHASE ---
    if (originPhase === 'BEGINNING_OF_TURN' && gameState.turnTriggers?.length > 0 && typeof processNextTurnTrigger === 'function') {
        return processNextTurnTrigger(gameState, playerName);
    }

    gameState.pendingChoice = null;
    gameState.phase = originPhase;
    return result;
}

// Helper to evaluate hand limits and transition the active player's turn
function finishTurnForActivePlayer(gameState) {
    const activePlayerName = gameState.activePlayer;
    const activePlayer = gameState.players ? gameState.players[activePlayerName] : null;

    // Check win condition first
    const winner = checkWinCondition(gameState);
    if (winner) {
        gameState.winner = winner;
        gameState.phase = 'GAME_OVER';
        gameState.pendingChoice = null;
        return { success: true, winner: winner };
    }

    // Check active player's hand size limit (max 7)
    if (activePlayer && activePlayer.hand && activePlayer.hand.length > 7) {
        const excess = activePlayer.hand.length - 7;
        gameState.pendingChoice = {
            chooser: activePlayerName,
            prompt: `Hand limit reached! Discard ${excess} card${excess > 1 ? 's' : ''} to end turn.`,
            targetScope: 'MY_HAND',
            actionType: 'DISCARD_TO_7'
        };
        gameState.phase = 'CHOICE';
        return { success: true, requiresChoice: true, pendingChoice: gameState.pendingChoice };
    }

    // Advance turn to the next player
    gameState.pendingChoice = null;
    advanceToNextPlayer(gameState);

    const postTurnWinner = checkWinCondition(gameState);
    if (postTurnWinner) {
        gameState.winner = postTurnWinner;
        gameState.phase = 'GAME_OVER';
        gameState.pendingChoice = null;
        return { success: true, winner: postTurnWinner };
    }

    return { success: true };
}

export function handleBlackKnightProtect(gameState, playerName, choiceData = {}, pending = {}) {
    const cardToDestroy = pending.cardToDestroy || pending.cardIndexToDestroy;
    const targetPlayerName = pending.targetPlayerName || playerName;
    const contextData = { ...(pending.contextData || {}), blackKnightBypassed: true };

    // 1. If player skipped / passed protection
    if (choiceData.skipped || choiceData.skip || choiceData.action === 'PASS') {
        return destroyCard(gameState, targetPlayerName, cardToDestroy, contextData);
    }

    // 2. If player chose to sacrifice Black Knight Unicorn
    const targetPlayer = gameState.players[playerName];
    const bkCard = (targetPlayer?.stable || []).find(c =>
        c && (c.id === 'black_knight_unicorn' || c.name === 'Black Knight Unicorn')
    );

    if (bkCard) {
        const sacResult = sacrificeCard(gameState, playerName, bkCard);
        if (sacResult && sacResult.success) {
            return {
                success: true,
                protected: true,
                message: `${playerName} sacrificed Black Knight Unicorn to prevent destruction!`
            };
        }
    }

    // 3. Fallback if Black Knight was not found or sacrifice failed
    return destroyCard(gameState, targetPlayerName, cardToDestroy, contextData);
}