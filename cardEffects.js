// cardEffects.js
import { isUnicornCard, isBabyCard, isBasicUnicorn } from './cardsData.js';
import {
    bringDirectlyIntoPlay,
    sendCardFromStable,
    destroyCard,
    discardCard,
    drawCard,
    shuffleDiscardIntoDrawPile,
    sacrificeCard,
    stealCard,
    searchDeckToHand,
    moveDiscardToHand,
    returnCardToHand
} from './gameActions.js';
/**
 * Main dispatcher to resolve immediate onPlay card abilities
 */
export function executeOnPlayEffect(gameState, playerName, card, targetData = {}) {
    if (!card || !card.onPlay) return { success: true };

    const { action } = card.onPlay;
    let result = { success: true };

    switch (action) {
        case "BACK_KICK":
            result = typeof BackKick === 'function' ? BackKick(gameState, playerName, targetData) : { success: false };
            break;
        case "GLITTER_TORNADO":
            result = GlitterTornado(gameState, playerName, targetData);
            break;
        case "GOOD_DEAL":
            result = GoodDeal(gameState, playerName, targetData);
            break;
        case "MYSTICAL_VORTEX":
            result = MysticalVortex(gameState, playerName, targetData);
            break;
        case "RESET_BUTTON":
            result = ResetButton(gameState);
            break;
        case "SHAKE_UP":
            result = ShakeUp(gameState, playerName);
            break;
        case "TARGETED_DESTRUCTION":
            result = TargetedDestruction(gameState, playerName, targetData);
            break;
        case "TWO_FOR_ONE":
            result = TwoForOne(gameState, playerName, targetData);
            break;
        case "UNFAIR_BARGAIN":
            result = UnfairBargain(gameState, playerName, targetData);
            break;
        case "UNICORN_POISON":
            result = UnicornPoison(gameState, playerName, targetData);
            break;
        case "UNICORN_SHRINKRAY":
            result = UnicornShrinkray(gameState, playerName, targetData);
            break;
        case "UNICORN_SWAP":
            result = UnicornSwap(gameState, playerName, targetData);
            break;
        case "BLATANT_THIEVERY":
            result = BlatantThievery(gameState, playerName, targetData);
            break;
        case "CHANGE_OF_LUCK":
            result = ChangeOfLuck(gameState, playerName, targetData);
            break;
        case "NEIGH":
            result = Neigh(gameState, playerName, targetData);
            break;
        case "SUPER_NEIGH":
            result = SuperNeigh(gameState, playerName, targetData);
            break;
        case "DOUBLE_DUTCH":
            result = DoubleDutch(gameState, playerName, targetData);
            break;
        case "EXTRA_TAIL":
            result = ExtraTail(gameState, playerName, targetData);
            break;
        case "GLITTER_BOMB":
            result = GlitterBomb(gameState, playerName, targetData);
            break;
        case "YAY":
            result = { success: true, isPassive: true };
            break;
        case "RAINBOW_AURA":
            result = { success: true, isPassive: true };
            break;
        case "RAINBOW_MANE":
            result = RainbowMane(gameState, playerName, targetData);
            break;
        case "SUMMONING_RITUAL":
            result = SummoningRitual(gameState, playerName, targetData);
            break;
        case "UNICORN_LASSO":
            result = UnicornLasso(gameState, playerName, targetData);
            break;
        case "RE_TARGET":
            result = ReTarget(gameState, playerName, targetData);
            break;
        case "DRAW_CARDS": {
            const count = card.onPlay.count || 1;
            drawCard(gameState, playerName, count);
            result = { success: true };
            break;
        }
        default:
            result = { success: true };
            break;
    }

    // Attach cardPlayed to pendingChoice if a target choice is required
    if (result && result.requiresChoice && result.pendingChoice) {
        result.pendingChoice.cardPlayed = card;
    }

    return result;
}


/**
 * Triggers ETB ("When this card enters your Stable...") effects
 */
export function triggerEntersStable(gameState, playerName, card, targetData = {}) {
    if (!card) return { success: true };

    // Merge card into context payload so all ETB functions have access to cardPlayed
    const enrichedContext = { ...targetData, cardPlayed: card };

    // 1. BLINDING LIGHT & UNICORN CHECKS
    const unicornCheck = typeof isUnicornCard === 'function'
        ? isUnicornCard(card, gameState, playerName)
        : (card.category || card.type || '').toString().toUpperCase().includes('UNICORN');

    const isBlindingActive = unicornCheck &&
        typeof BlindingLight === 'function' &&
        BlindingLight(gameState, playerName);

    // 2. PASSIVE STABLE TRIGGERS (e.g., Barbed Wire)
    if (unicornCheck && !targetData.barbedWireResolved && typeof BarbedWire === 'function') {
        const barbedWireResult = BarbedWire(gameState, playerName);
        if (barbedWireResult && barbedWireResult.requiresChoice) {
            barbedWireResult.pendingChoice.isEnterTrigger = true;
            barbedWireResult.pendingChoice.cardPlayed = card;
            barbedWireResult.pendingChoice.contextData = {
                ...(barbedWireResult.pendingChoice.contextData || {}),
                ...(targetData || {}),
                barbedWireResolved: true,
                resumeETBCard: card
            };
            return barbedWireResult;
        }
    }

    // 3. CARD'S OWN ETB EFFECT
    let etbResult = null;

    if (card.onEnter && !isBlindingActive) {
        const action = typeof card.onEnter === 'string'
            ? card.onEnter
            : card.onEnter.action;

        if (action) {
            switch (action) {
                case "ALLURING_NARWHAL":
                    if (typeof AlluringNarwhal === 'function') etbResult = AlluringNarwhal(gameState, playerName, enrichedContext);
                    break;
                case "ANNOYING_FLYING_UNICORN":
                    if (typeof AnnoyingFlyingUnicorn === 'function') etbResult = AnnoyingFlyingUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "AMERICORN":
                    if (typeof Americorn === 'function') etbResult = Americorn(gameState, playerName, enrichedContext);
                    break;
                case "CHAINSAW_UNICORN":
                    if (typeof ChainsawUnicorn === 'function') etbResult = ChainsawUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "CLASSY_NARWHAL":
                    if (typeof ClassyNarwhal === 'function') etbResult = ClassyNarwhal(gameState, playerName, enrichedContext);
                    break;
                case "SHABBY_THE_NARWHAL":
                    if (typeof ShabbyTheNarwhal === 'function') etbResult = ShabbyTheNarwhal(gameState, playerName, enrichedContext);
                    break;
                case "THE_GREAT_NARWHAL":
                    if (typeof TheGreatNarwhal === 'function') etbResult = TheGreatNarwhal(gameState, playerName, enrichedContext);
                    break;
                case "GREEDY_FLYING_UNICORN":
                    if (typeof GreedyFlyingUnicorn === 'function') etbResult = GreedyFlyingUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "MAGICAL_FLYING_UNICORN":
                    if (typeof MagicalFlyingUnicorn === 'function') etbResult = MagicalFlyingUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "MAJESTIC_FLYING_UNICORN":
                    if (typeof MajesticFlyingUnicorn === 'function') etbResult = MajesticFlyingUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "MERMAID_UNICORN":
                    if (typeof MermaidUnicorn === 'function') etbResult = MermaidUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "NARWHAL_TORPEDO":
                    if (typeof NarwhalTorpedo === 'function') etbResult = NarwhalTorpedo(gameState, playerName, enrichedContext);
                    break;
                case "RAINBOW_UNICORN":
                    if (typeof RainbowUnicorn === 'function') etbResult = RainbowUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "SEDUCTIVE_UNICORN":
                    if (typeof SeductiveUnicorn === 'function') etbResult = SeductiveUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "SWIFT_FLYING_UNICORN":
                    if (typeof SwiftFlyingUnicorn === 'function') etbResult = SwiftFlyingUnicorn(gameState, playerName, enrichedContext);
                    break;
                case "UNICORN_ON_THE_COB":
                    if (typeof UnicornOnTheCob === 'function') etbResult = UnicornOnTheCob(gameState, playerName, enrichedContext);
                    break;
                default:
                    console.warn(`[triggerEntersStable] No handler implemented for action: "${action}"`);
                    break;
            }
        }
    }

    if (etbResult && etbResult.requiresChoice) {
        return etbResult;
    }

    return etbResult || { success: true };
}

export function triggerLeavesStable(gameState, playerName, card, targetData = {}) {
    if (!card) return { success: true };

    let leaveResult = null;

    // 1. CARD-SPECIFIC LEAVE EFFECTS
    if (card.onLeave) {
        const action = typeof card.onLeave === 'string'
            ? card.onLeave
            : card.onLeave.action;

        switch (action) {
            case "SEDUCTIVE_UNICORN":
            case "SEDUCTIVE_UNICORN_LEAVE":
                if (typeof SeductiveUnicornLeave === 'function') {
                    leaveResult = SeductiveUnicornLeave(gameState, playerName, card, targetData);
                }
                break;
            default:
                console.warn(`[triggerLeavesStable] No handler implemented for action: "${action}"`);
                break;
        }
    }

    if (leaveResult && leaveResult.requiresChoice) {
        return leaveResult;
    }

    // 2. PASSIVE LEAVE TRIGGERS (e.g., Barbed Wire)
    const isUnicorn = typeof isUnicornCard === 'function'
        ? isUnicornCard(card, gameState, playerName)
        : (card.category || card.type || '').toString().toUpperCase().includes('UNICORN');

    if (isUnicorn && !targetData.barbedWireResolved && typeof BarbedWire === 'function') {
        const barbedWireResult = BarbedWire(gameState, playerName);
        if (barbedWireResult && barbedWireResult.requiresChoice) {
            barbedWireResult.pendingChoice.isLeaveTrigger = true;
            barbedWireResult.pendingChoice.cardPlayed = card;
            barbedWireResult.pendingChoice.contextData = {
                ...(barbedWireResult.pendingChoice.contextData || {}),
                ...(targetData || {}),
                barbedWireResolved: true
            };
            return barbedWireResult;
        }
    }

    return leaveResult || { success: true };
}

/**
 * Triggers beginning-of-turn effects for any Upgrade, Downgrade, or Unicorn cards 
 * in the active player's Stable.
 */
export function triggerBeginningOfTurn(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: true };

    // Safely collect all active cards from Stable, Upgrades, and Downgrades
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];

    for (const card of allCards) {
        if (!card) continue;

        // Support string or object-based triggers across onBeginningOfTurn and onTurnStart
        const trigger = card.onBeginningOfTurn || card.onTurnStart;
        if (!trigger) continue;

        const action = typeof trigger === 'string' ? trigger : trigger.action;
        if (!action) continue;

        switch (action) {
            case "UNICORN_LASSO":
                if (typeof UnicornLasso === 'function') {
                    const result = UnicornLasso(gameState, playerName);
                    if (result && result.requiresChoice) return result;
                }
                break;

            case "SUMMONING_RITUAL":
                if (typeof SummoningRitual === 'function') {
                    const result = SummoningRitual(gameState, playerName);
                    if (result && result.requiresChoice) return result;
                }
                break;

            case "RHINOCORN":
                if (typeof Rhinocorn === 'function') {
                    const result = Rhinocorn(gameState, playerName);
                    if (result && result.requiresChoice) return result;
                }
                break;

            case "DOUBLE_DUTCH":
                // Grants +1 additional action for the Action Phase
                gameState.actionsRemaining = (gameState.actionsRemaining || 1) + 1;
                break;

            case "EXTRA_TAIL":
                // Draws 1 additional card at turn start
                if (typeof drawCard === 'function') {
                    drawCard(gameState, playerName, 1);
                }
                break;

            case "GLITTER_BOMB":
                if (typeof GlitterBomb === 'function') {
                    const result = GlitterBomb(gameState, playerName);
                    if (result && result.requiresChoice) return result;
                }
                break;

            case "RAINBOW_MANE":
                if (typeof RainbowMane === 'function') {
                    const result = RainbowMane(gameState, playerName);
                    if (result && result.requiresChoice) return result;
                }
                break;

            default:
                break;
        }
    }

    return { success: true };
}

export function BackKick(gameState, playerName, targetData = {}) {
    const targetPlayerName = targetData.targetPlayerName || targetData.targetPlayer || targetData.selectedPlayer;
    let targetCardId = targetData.targetCardId || targetData.cardId;

    if (!targetCardId && targetData.targets && targetData.targets[playerName]) {
        targetCardId = targetData.targets[playerName];
    }

    // 1. STEP 1: CHOOSE A CARD FROM ANY STABLE TO RETURN TO HAND
    if (!targetPlayerName || !targetCardId) {
        // Guard: Check if there are any cards in any Stable to target
        const hasCardsInStable = Object.values(gameState.players || {}).some(
            p => Array.isArray(p.stable) && p.stable.length > 0
        );

        if (!hasCardsInStable) {
            return { success: true, message: "No cards in any Stable to return to hand." };
        }

        return {
            success: true,
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                action: 'RETURN_TO_HAND',
                actionType: 'BACK_KICK_TARGET', // Specific actionType for CHOICE_HANDLERS routing
                targetScope: 'ANY_STABLE',
                prompt: "Select a card from any player's Stable to return to their hand",
                contextData: { ...targetData }
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer) {
        return { success: false, reason: "Target player not found." };
    }

    // Return chosen card from stable to hand (only once)
    if (!targetData.returnedToHand) {
        const returnResult = returnCardToHand(gameState, targetPlayerName, targetCardId);
        if (returnResult && returnResult.success === false) {
            return returnResult; // Abort if return failed (e.g. card was protected or missing)
        }
    }

    // 2. STEP 2: TARGET PLAYER MUST CHOOSE 1 CARD FROM HAND TO DISCARD
    let cardIndexToDiscard = targetData.cardIndexToDiscard !== undefined
        ? targetData.cardIndexToDiscard
        : targetData.cardIndex;

    if (cardIndexToDiscard === undefined && targetData.discards && targetData.discards[targetPlayerName] !== undefined) {
        cardIndexToDiscard = targetData.discards[targetPlayerName];
    }

    if (Array.isArray(targetPlayer.hand) && targetPlayer.hand.length > 0 && cardIndexToDiscard === undefined) {
        return {
            success: true,
            requiresChoice: true,
            pendingChoice: {
                chooser: targetPlayerName,
                action: 'DISCARD',
                actionType: 'BACK_KICK_DISCARD', // Specific actionType for CHOICE_HANDLERS routing
                targetScope: 'MY_HAND',
                prompt: `${targetPlayerName}, select a card from your hand to discard`,
                contextData: {
                    ...targetData,
                    targetPlayerName,
                    targetCardId,
                    returnedToHand: true
                }
            }
        };
    }

    // Perform discard step
    if (Array.isArray(targetPlayer.hand) && targetPlayer.hand.length > 0 && cardIndexToDiscard !== undefined) {
        discardCard(gameState, targetPlayerName, cardIndexToDiscard);
    }

    return { success: true };
}

export function GlitterTornado(gameState, playerName, targetData = {}) {
    if (!targetData.glitterTargets) {
        targetData.glitterTargets = {};
    }

    // Process new selection if available from choice resolution
    if (targetData.targetCardId) {
        const cardId = targetData.targetCardId;

        // Find which player owns the selected card (checks Stable, Upgrades, & Downgrades)
        for (const pName of gameState.playerOrder) {
            const player = gameState.players[pName];
            if (player) {
                const allStableCards = [
                    ...(player.stable || []),
                    ...(player.upgrades || []),
                    ...(player.downgrades || [])
                ];
                const found = allStableCards.some(c => c && (c.id === cardId || c === cardId));

                if (found) {
                    targetData.glitterTargets[pName] = cardId;
                    break;
                }
            }
        }
        delete targetData.targetCardId; // Clear for next selection step
    }

    // 1. Iterate through player order to prompt selections (Caster first, then Opponents)
    for (const pName of gameState.playerOrder) {
        const player = gameState.players[pName];
        if (!player) continue;

        const allStableCards = [
            ...(player.stable || []),
            ...(player.upgrades || []),
            ...(player.downgrades || [])
        ];

        // If this player has cards in their stable and we haven't selected a card for them yet
        if (allStableCards.length > 0 && !targetData.glitterTargets[pName]) {
            const isSelf = (pName === playerName);

            return {
                requiresChoice: true,
                pendingChoice: {
                    chooser: playerName, // Caster makes ALL choices
                    actionType: 'GLITTER_TORNADO', // Added for resolveChoice routing
                    targetPlayerName: pName, // Explicitly scope target player
                    prompt: isSelf
                        ? "Glitter Tornado: Select 1 card in YOUR Stable to return to your hand"
                        : `Glitter Tornado: Select 1 card from ${pName}'s Stable to return to their hand`,
                    targetScope: isSelf ? "MY_STABLE" : "OPPONENT_STABLE",
                    contextData: targetData
                }
            };
        }
    }

    // 2. Once a card is selected for all eligible players, return chosen cards to hands
    gameState.playerOrder.forEach(pName => {
        const targetCardId = targetData.glitterTargets[pName];
        if (targetCardId) {
            if (typeof sendCardFromStable === 'function') {
                sendCardFromStable(gameState, pName, targetCardId, 'hand');
            } else if (typeof returnCardToHand === 'function') {
                returnCardToHand(gameState, pName, targetCardId);
            } else {
                // Fallback direct movement logic across stable, upgrades, and downgrades
                const player = gameState.players[pName];
                if (player) {
                    const zones = ['stable', 'upgrades', 'downgrades'];
                    for (const zone of zones) {
                        if (Array.isArray(player[zone])) {
                            const cardIdx = player[zone].findIndex(c => c && (c.id === targetCardId || c === targetCardId));
                            if (cardIdx !== -1) {
                                const [removed] = player[zone].splice(cardIdx, 1);
                                if (!player.hand) player.hand = [];
                                player.hand.push(removed);
                                break;
                            }
                        }
                    }
                }
            }
        }
    });

    return { success: true };
}

export function GoodDeal(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization & State Unpacking
    const ctx = targetData.contextData || targetData || {};
    let hasDrawn = ctx.hasDrawn || false;

    // Standardize the incoming discard index from the UI
    const discardIdx = targetData.targetCardIndex !== undefined
        ? targetData.targetCardIndex
        : (targetData.cardIndexToDiscard !== undefined ? targetData.cardIndexToDiscard : targetData.cardIndex);

    // ==========================================
    // STEP 1: INITIAL ENTRY - DRAW 3 CARDS
    // ==========================================
    if (!hasDrawn) {
        if (typeof drawCard === 'function') {
            // Using your engine's primitive to draw multiple cards
            drawCard(gameState, playerName, 3);
        }
        hasDrawn = true;
    }

    // ==========================================
    // STEP 2: CHOICE RESOLUTION - DISCARD
    // ==========================================
    if (discardIdx !== undefined && discardIdx >= 0 && discardIdx < player.hand.length) {
        if (typeof discardCard === 'function') {
            discardCard(gameState, playerName, discardIdx);
        } else {
            // Safe fallback
            const [discarded] = player.hand.splice(discardIdx, 1);
            gameState.discardPile = gameState.discardPile || [];
            gameState.discardPile.push(discarded);
        }
        return {
            success: true,
            message: `${playerName} played Good Deal, drew 3 cards, and discarded 1.`
        };
    }

    // ==========================================
    // STEP 3: PROMPT FOR DISCARD (IF NEEDED)
    // ==========================================
    if (player.hand && player.hand.length > 0) {
        return {
            success: true,
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: 'Good Deal: Select 1 card from your hand to discard.',
                targetScope: 'MY_HAND',
                actionType: 'GOOD_DEAL', // 👈 ROUTE BACK TO THIS FUNCTION
                contextData: { hasDrawn } // 👈 Carry state forward
            }
        };
    }

    // Edge case: Hand was empty after drawing (highly unlikely but safe to catch)
    return { success: true };
}

export function MysticalVortex(gameState, playerName, targetData = {}) {
    // 🛡️ Variable Normalization & State Unpacking
    const ctx = targetData.contextData || targetData || {};
    const discards = ctx.discards || {};
    let cardRemoved = ctx.cardRemoved || false;

    // Catch the incoming choice from the UI
    const pendingChooser = ctx.pendingChooser;
    const incomingIdx = targetData.targetCardIndex !== undefined
        ? targetData.targetCardIndex
        : (targetData.cardIndexToDiscard !== undefined ? targetData.cardIndexToDiscard : targetData.cardIndex);

    // ==========================================
    // STEP 1: RECORD INCOMING CHOICE
    // ==========================================
    // If the engine just routed a choice back to us, save it to the correct player!
    if (pendingChooser && incomingIdx !== undefined) {
        discards[pendingChooser] = incomingIdx;
    }

    // ==========================================
    // STEP 2: PRE-EMPTIVE SPELL REMOVAL
    // ==========================================
    // Move the Spell to the Discard Pile so it gets shuffled along with everything else
    if (!cardRemoved) {
        const player = gameState.players ? gameState.players[playerName] : null;
        if (player && Array.isArray(player.hand)) {
            const cardIdx = player.hand.findIndex(c => c && (c.id === "mystical_vortex" || c.name === "Mystical Vortex"));
            if (cardIdx !== -1) {
                const [playedCard] = player.hand.splice(cardIdx, 1);
                gameState.discardPile = gameState.discardPile || [];
                gameState.discardPile.push(playedCard);
            }
        }
        cardRemoved = true;
    }

    // ==========================================
    // STEP 3: SEQUENTIAL DISCARD PROMPTS
    // ==========================================
    // Find next player who has cards in hand but hasn't selected a discard card
    for (const pName of (gameState.playerOrder || [])) {
        const player = gameState.players ? gameState.players[pName] : null;

        if (player && Array.isArray(player.hand) && player.hand.length > 0 && discards[pName] === undefined) {
            return {
                requiresChoice: true,
                handledDestination: true, // Prevents gameEngine from moving Mystical Vortex twice
                pendingChoice: {
                    chooser: pName,
                    actionType: 'MYSTICAL_VORTEX', // 👈 Routes back to this function
                    targetScope: 'MY_HAND',
                    prompt: `${pName}, select a card from your hand to discard for Mystical Vortex.`,
                    contextData: {
                        cardRemoved,
                        discards,
                        pendingChooser: pName // 👈 Tell the next loop WHO is making this choice!
                    }
                }
            };
        }
    }

    // ==========================================
    // STEP 4: RESOLUTION (EVERYONE HAS CHOSEN)
    // ==========================================
    // Execute discards for all players who selected a card
    (gameState.playerOrder || []).forEach(pName => {
        const discardIdx = discards[pName];
        if (discardIdx !== undefined && typeof discardCard === 'function') {
            discardCard(gameState, pName, discardIdx);
        }
    });

    // Shuffle discard pile into draw deck
    if (typeof shuffleDiscardIntoDrawPile === 'function') {
        shuffleDiscardIntoDrawPile(gameState);
    }

    return {
        success: true,
        handledDestination: true,
        message: "Mystical Vortex resolved! Everyone discarded a card, and the discard pile was shuffled into the deck."
    };
}

export function ResetButton(gameState, playerName, cardPlayed = null) {
    if (!gameState || !gameState.playerOrder) {
        return { success: false, reason: "Invalid game state." };
    }

    // STEP 1: SACRIFICE ALL UPGRADE AND DOWNGRADE CARDS
    gameState.playerOrder.forEach(pName => {
        const player = gameState.players[pName];
        if (!player) return;

        const upgrades = [...(player.upgrades || [])];
        const downgrades = [...(player.downgrades || [])];
        const stableMods = (player.stable || []).filter(c => {
            if (!c) return false;
            const cat = (c.category || c.type || '').toString().toUpperCase();
            return cat.includes('UPGRADE') || cat.includes('DOWNGRADE');
        });

        const cardsToSacrifice = [...upgrades, ...downgrades, ...stableMods];

        cardsToSacrifice.forEach(card => {
            if (typeof sacrificeCard === 'function') {
                sacrificeCard(gameState, pName, card);
            } else {
                ['upgrades', 'downgrades', 'stable'].forEach(zone => {
                    if (Array.isArray(player[zone])) {
                        const idx = player[zone].findIndex(c => c === card || (card.id && c.id === card.id));
                        if (idx !== -1) player[zone].splice(idx, 1);
                    }
                });

                gameState.discardPile = gameState.discardPile || [];
                gameState.discardPile.push(card);
            }
        });
    });

    // STEP 2: ENSURE RESET BUTTON ITSELF IS IN DISCARD PILE BEFORE SHUFFLE
    if (cardPlayed) {
        gameState.discardPile = gameState.discardPile || [];
        const alreadyInDiscard = gameState.discardPile.some(c => c === cardPlayed || c.id === cardPlayed.id);
        if (!alreadyInDiscard) {
            gameState.discardPile.push(cardPlayed);
        }
    }

    // STEP 3: SHUFFLE DISCARD PILE INTO DRAW PILE
    if (typeof shuffleDiscardIntoDrawPile === 'function') {
        shuffleDiscardIntoDrawPile(gameState);
    } else if (Array.isArray(gameState.discardPile) && Array.isArray(gameState.drawPile)) {
        gameState.drawPile.push(...gameState.discardPile);
        gameState.discardPile = [];

        for (let i = gameState.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
        }
    }

    return {
        success: true,
        message: `${playerName} played Reset Button! All Upgrades and Downgrades were sacrificed, and the discard pile was shuffled into the deck.`
    };
}

export function ShakeUp(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    gameState.drawPile = gameState.drawPile || [];
    gameState.discardPile = gameState.discardPile || [];

    // 🛡️ Variable Normalization (Just in case it comes wrapped in context)
    const ctx = targetData.contextData || {};
    const cardPlayed = targetData.cardPlayed || ctx.cardPlayed;

    // 1. Explicitly push "Shake Up" card itself into Draw Pile
    if (cardPlayed) {
        gameState.drawPile.push(cardPlayed);
    }

    // 2. Move remaining cards in hand into Draw Pile (filter cardPlayed to prevent duplicates)
    if (Array.isArray(player.hand) && player.hand.length > 0) {
        const remainingHand = cardPlayed
            ? player.hand.filter(c => c && c.id !== cardPlayed.id)
            : player.hand;

        gameState.drawPile.push(...remainingHand);
        player.hand = []; // Safely wipe the hand empty
    }

    // 3. Move all cards from Discard Pile into Draw Pile
    if (gameState.discardPile.length > 0) {
        // Filter out any potential empty indices or nulls before pushing
        const validDiscards = gameState.discardPile.filter(c => c);
        gameState.drawPile.push(...validDiscards);
        gameState.discardPile = [];
    }

    // 4. Shuffle Draw Pile
    if (typeof shuffle === 'function') {
        shuffle(gameState.drawPile);
    } else {
        for (let i = gameState.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
        }
    }

    // 5. Draw 5 cards (with empty pile check)
    for (let i = 0; i < 5; i++) {
        if (gameState.drawPile.length === 0) break;
        if (typeof drawCard === 'function') {
            drawCard(gameState, playerName);
        }
    }

    return {
        success: true,
        handledDestination: true, // 👈 Perfect execution here
        message: `${playerName} played Shake Up, shuffled their hand and the discard pile into the deck, and drew 5 cards.`
    };
}

export function TargetedDestruction(gameState, playerName, targetData = {}) {
    // 🛡️ Variable Normalization (Catches nested engine routing)
    const ctx = targetData.contextData || targetData || {};
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || ctx.targetPlayerName;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // 1. Scan the entire gameboard for valid targets (Upgrades or Downgrades)
    const allPlayers = Object.values(gameState.players || {});
    const isUpgradeOrDowngrade = card => {
        if (!card) return false;
        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UPGRADE') || cat.includes('DOWNGRADE');
    };

    const hasValidTargets = allPlayers.some(p =>
        [...(p.upgrades || []), ...(p.downgrades || []), ...(p.stable || [])].some(isUpgradeOrDowngrade)
    );

    // Auto-fail gracefully if no Upgrades or Downgrades exist in any Stable
    if (!hasValidTargets) {
        return { success: false, reason: "No Upgrade or Downgrade cards are currently in play." };
    }

    // 2. Prompt choice if target information is missing
    if (!targetPlayerName || !targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'TARGETED_DESTRUCTION', // 👈 Perfect routing
                targetScope: 'ANY_STABLE',
                allowedCategories: ['UPGRADE', 'DOWNGRADE'],
                prompt: 'Select an Upgrade or Downgrade card to SACRIFICE or DESTROY.'
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer) {
        return { success: false, reason: "Target player not found." };
    }

    // 3. Search zones for the specified card
    const zones = ['upgrades', 'downgrades', 'stable'];
    let targetCard = null;

    for (const zone of zones) {
        if (Array.isArray(targetPlayer[zone])) {
            const found = targetPlayer[zone].find(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));
            if (found) {
                targetCard = found;
                break;
            }
        }
    }

    if (!targetCard) {
        return { success: false, reason: "Target card not found in target's Stable." };
    }

    // 4. Strictly validate that the target card IS an Upgrade or Downgrade
    if (!isUpgradeOrDowngrade(targetCard)) {
        return { success: false, reason: "Target card must be an Upgrade or Downgrade card." };
    }

    // 5. SACRIFICE if target is own card, DESTROY if target is opponent's card
    if (targetPlayerName === playerName) {
        return sacrificeCard(gameState, playerName, targetCard);
    } else {
        return destroyCard(gameState, targetPlayerName, targetCard);
    }
}

export function TwoForOne(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found" };

    if (!targetData.destroyedCardIds) {
        targetData.destroyedCardIds = [];
    }

    const targetCardId = targetData.targetCardId || targetData.cardId;
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer;

    // ==========================================
    // STEP 1: SACRIFICE 1 CARD FROM YOUR STABLE
    // ==========================================
    if (!targetData.sacrificedCardId) {
        if (targetCardId) {
            const sacResult = sacrificeCard(gameState, playerName, targetCardId);

            // If sacrifice triggers an interruption (e.g., Barbed Wire), queue the destroy phase!
            if (sacResult && sacResult.requiresChoice) {
                gameState.triggerQueue = gameState.triggerQueue || [];
                gameState.triggerQueue.push({
                    chooser: playerName,
                    actionType: 'TWO_FOR_ONE',
                    prompt: "Two-for-one: Select a card to DESTROY (2 remaining)",
                    targetScope: "ANY_STABLE",
                    contextData: { ...targetData, sacrificedCardId: targetCardId }
                });
                return sacResult;
            }

            if (!sacResult || !sacResult.success) return sacResult;

            targetData.sacrificedCardId = targetCardId;
            delete targetData.targetCardId;
            delete targetData.cardId;
            delete targetData.targetPlayerName;
            delete targetData.selectedPlayer;
        } else {
            const myCards = [
                ...(player.stable || []),
                ...(player.upgrades || []),
                ...(player.downgrades || [])
            ];

            if (myCards.length === 0) {
                return { success: false, reason: "You have no cards in your Stable to SACRIFICE!" };
            }

            return {
                requiresChoice: true,
                pendingChoice: {
                    chooser: playerName,
                    actionType: 'TWO_FOR_ONE',
                    prompt: "Two-for-one: Select 1 card in your Stable to SACRIFICE",
                    targetScope: "MY_STABLE",
                    contextData: targetData
                }
            };
        }
    }

    // ==========================================
    // STEP 2: DESTROY 2 CARDS FROM ANY STABLE
    // ==========================================
    if (targetData.targetCardId || targetData.cardId) {
        if (!targetPlayerName) {
            return { success: false, reason: "Target player missing for destruction." };
        }

        const destroyResult = destroyCard(gameState, targetPlayerName, targetCardId, targetData);

        // 🛑 THE QUEUE FIX: If destruction is interrupted by a protection choice, queue the final step!
        if (destroyResult && destroyResult.requiresChoice) {
            if (targetData.destroyedCardIds.length === 0) {
                gameState.triggerQueue = gameState.triggerQueue || [];
                gameState.triggerQueue.push({
                    chooser: playerName,
                    actionType: 'TWO_FOR_ONE',
                    prompt: "Two-for-one: Select a card to DESTROY (1 remaining)",
                    targetScope: "ANY_STABLE",
                    contextData: {
                        ...targetData,
                        destroyedCardIds: [targetCardId] // Assume it resolves, store it to prevent infinite loops
                    }
                });
            }
            return destroyResult;
        }

        if (destroyResult.success || destroyResult.protected) {
            targetData.destroyedCardIds.push(targetCardId);
        }

        delete targetData.targetCardId;
        delete targetData.cardId;
        delete targetData.targetPlayerName;
        delete targetData.selectedPlayer;
    }

    // Count valid targets remaining in the game
    let totalRemainingCards = 0;
    (gameState.playerOrder || []).forEach(pName => {
        const p = gameState.players[pName];
        if (p) {
            totalRemainingCards += (p.stable?.length || 0) + (p.upgrades?.length || 0) + (p.downgrades?.length || 0);
        }
    });

    if (targetData.destroyedCardIds.length < 2 && totalRemainingCards > 0) {
        const remainingToDestroy = 2 - targetData.destroyedCardIds.length;
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'TWO_FOR_ONE',
                prompt: `Two-for-one: Select a card to DESTROY (${remainingToDestroy} remaining)`,
                targetScope: "ANY_STABLE", // 👈 Rule fix: Allows destroying your own cards
                contextData: targetData
            }
        };
    }

    return { success: true, message: `${playerName} successfully resolved Two-for-one!` };
}

export function UnfairBargain(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found" };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || targetData.targetPlayer || ctx.targetPlayerName || ctx.selectedPlayer || ctx.targetPlayer;

    // --- STEP 1: REQUEST TARGET PLAYER SELECTION ---
    if (!targetPlayerName) {
        // Filter out current player to find valid opponents
        const opponents = (gameState.playerOrder || []).filter(pName => pName !== playerName);

        if (opponents.length === 0) {
            return { success: false, reason: "No other players available to trade hands with!" };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'UNFAIR_BARGAIN', // 👈 Perfect routing
                prompt: "Unfair Bargain: Select another player to trade hands with.",
                targetScope: "OTHER_PLAYER",
                allowedPlayers: opponents,
                contextData: targetData
            }
        };
    }

    // --- STEP 2: SWAP HANDS ---
    const targetPlayer = gameState.players[targetPlayerName];
    if (!targetPlayer) {
        return { success: false, reason: `Target player "${targetPlayerName}" not found.` };
    }

    if (targetPlayerName === playerName) {
        return { success: false, reason: "You cannot trade hands with yourself!" };
    }

    // Direct atomic swap of hand arrays (cloning ensures clean array reference isolation)
    const tempHand = [...(player.hand || [])];
    player.hand = [...(targetPlayer.hand || [])];
    targetPlayer.hand = tempHand;

    return {
        success: true,
        message: `${playerName} played Unfair Bargain and swapped hands with ${targetPlayerName}!`
    };
}

export function UnicornPoison(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found" };

    // 🛡️ Variable Normalization (Catches nested engine routing)
    const ctx = targetData.contextData || targetData || {};
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // Local fallback helper to verify if a card is currently a valid Unicorn
    const checkIsUnicorn = (card, ownerName) => {
        if (!card) return false;
        if (typeof isUnicornCard === 'function') {
            return isUnicornCard(card, gameState, ownerName);
        }

        // Inline Pandamonium check
        const owner = gameState.players ? gameState.players[ownerName] : null;
        const hasPandamonium = owner && [...(owner.stable || []), ...(owner.downgrades || [])].some(c =>
            c && (c.id === 'pandamonium' || (c.name || '').toLowerCase().includes('pandamonium'))
        );
        if (hasPandamonium) return false;

        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UNICORN') || cat.includes('BASIC') || cat.includes('MAGICAL') || cat.includes('BABY');
    };

    // --- STEP 1: REQUEST TARGET UNICORN SELECTION ---
    if (!targetCardId) {
        let hasUnicorns = false;

        // Check across all players for active Unicorn cards
        for (const pName of (gameState.playerOrder || [])) {
            const p = gameState.players[pName];
            if (p && Array.isArray(p.stable)) {
                if (p.stable.some(c => checkIsUnicorn(c, pName))) {
                    hasUnicorns = true;
                    break;
                }
            }
        }

        if (!hasUnicorns) {
            return { success: false, reason: "There are no Unicorn cards in play to DESTROY!" };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'UNICORN_POISON',
                prompt: "Unicorn Poison: Select a Unicorn card to DESTROY.",
                targetScope: "ANY_STABLE",
                allowedCategories: ['UNICORN'], // 👈 Helps frontend highlight valid targets
                contextData: targetData
            }
        };
    }

    // --- STEP 2: DESTROY TARGETED UNICORN ---
    let targetOwner = null;
    let targetCard = null;

    for (const pName of (gameState.playerOrder || [])) {
        const p = gameState.players[pName];
        if (p && Array.isArray(p.stable)) {
            const found = p.stable.find(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));
            if (found) {
                targetOwner = pName;
                targetCard = found;
                break;
            }
        }
    }

    if (!targetOwner || !targetCard) {
        return { success: false, reason: "Targeted Unicorn card was not found in any Stable." };
    }

    // 🛡️ Strict Validation: Ensure the targeted card is actually a Unicorn (and not Pandamonium-affected)
    if (!checkIsUnicorn(targetCard, targetOwner)) {
        return { success: false, reason: "Targeted card is not a valid Unicorn card." };
    }

    // Delegate to destroyCard so Black Knight Unicorn and Rainbow Aura protection trigger
    if (typeof destroyCard === 'function') {
        return destroyCard(gameState, targetOwner, targetCardId, targetData);
    }

    return { success: false, reason: "destroyCard primitive is missing." };
}

export function UnicornShrinkray(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const targetPlayerName = targetData.targetPlayerName || targetData.targetPlayer || targetData.selectedPlayer || ctx.targetPlayerName || ctx.selectedPlayer || ctx.targetPlayer;

    // --- STEP 1: REQUEST TARGET PLAYER SELECTION ---
    if (!targetPlayerName) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'UNICORN_SHRINKRAY', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Unicorn Shrinkray: Select any player to shrink their Unicorns.",
                targetScope: "ANY_PLAYER",
                contextData: targetData
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer) {
        return { success: false, reason: `Target player "${targetPlayerName}" not found.` };
    }

    // Safe helper to check if a card is currently a valid Unicorn (respecting Pandamonium)
    const checkIsUnicorn = (card, ownerName) => {
        if (!card) return false;
        if (typeof isUnicornCard === 'function') {
            return isUnicornCard(card, gameState, ownerName);
        }

        // Inline Pandamonium check
        const owner = gameState.players ? gameState.players[ownerName] : null;
        const hasPandamonium = owner && [...(owner.stable || []), ...(owner.downgrades || [])].some(c =>
            c && (c.id === 'pandamonium' || (c.name || '').toLowerCase().includes('pandamonium'))
        );
        if (hasPandamonium) return false;

        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UNICORN') || cat.includes('BASIC') || cat.includes('MAGICAL') || cat.includes('BABY');
    };

    // --- STEP 2: REMOVE *ONLY* UNICORNS FROM TARGET'S STABLE ---
    const targetStable = targetPlayer.stable || [];
    const unicornCardsToShrink = targetStable.filter(c => checkIsUnicorn(c, targetPlayerName));
    const countToReplace = unicornCardsToShrink.length;

    for (const unicorn of unicornCardsToShrink) {
        if (typeof sendCardFromStable === 'function') {
            sendCardFromStable(gameState, targetPlayerName, unicorn.id, 'discard');
        } else {
            // Safe inline fallback execution
            const idx = targetPlayer.stable.findIndex(c => c && (String(c.id) === String(unicorn.id) || c === unicorn));
            if (idx !== -1) {
                const [removed] = targetPlayer.stable.splice(idx, 1);
                gameState.discardPile = gameState.discardPile || [];
                gameState.discardPile.push(removed);
            }
        }
    }

    // --- STEP 3: BRING EQUAL NUMBER OF BABY UNICORNS FROM NURSERY ---
    let babiesBroughtIn = 0;
    for (let i = 0; i < countToReplace; i++) {
        if (!gameState.nursery || gameState.nursery.length === 0) {
            break; // Stop if Nursery runs out of Baby Unicorns
        }

        if (typeof bringDirectlyIntoPlay === 'function') {
            const babyCard = gameState.nursery[0];
            bringDirectlyIntoPlay(gameState, targetPlayerName, babyCard, 'nursery');
        } else {
            // Safe inline fallback execution: shift from Nursery to target's Stable
            const babyCard = gameState.nursery.shift();
            if (babyCard) {
                targetPlayer.stable = targetPlayer.stable || [];
                targetPlayer.stable.push(babyCard);
            }
        }
        babiesBroughtIn++;
    }

    return {
        success: true,
        message: `${playerName} played Unicorn Shrinkray on ${targetPlayerName}, moving ${countToReplace} Unicorn card(s) to the discard pile and replacing them with ${babiesBroughtIn} Baby Unicorn(s)!`
    };
}

// cardEffects.js

export function UnicornSwap(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Helper: Verify if a card is currently a valid Unicorn (respects Pandamonium)
    const checkIsUnicorn = (card, ownerName) => {
        if (!card) return false;
        if (typeof isUnicornCard === 'function') {
            return isUnicornCard(card, gameState, ownerName);
        }

        // Inline Pandamonium check
        const owner = gameState.players ? gameState.players[ownerName] : null;
        const hasPandamonium = owner && [...(owner.stable || []), ...(owner.downgrades || [])].some(c =>
            c && (c.id === 'pandamonium' || (c.name || '').toLowerCase().includes('pandamonium'))
        );
        if (hasPandamonium) return false;

        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UNICORN') || cat.includes('BASIC') || cat.includes('MAGICAL') || cat.includes('BABY');
    };

    // ==========================================
    // STEP 0: PRE-REQUISITE VALIDATION
    // ==========================================
    const myUnicorns = (player.stable || []).filter(c => checkIsUnicorn(c, playerName));
    if (myUnicorns.length === 0) {
        return { success: false, reason: "You have no Unicorn cards in your Stable to swap!" };
    }

    const opponentsWithUnicorns = (gameState.playerOrder || [])
        .filter(pName => pName !== playerName)
        .filter(pName => {
            const p = gameState.players[pName];
            return p && (p.stable || []).some(c => checkIsUnicorn(c, pName));
        });

    if (opponentsWithUnicorns.length === 0) {
        return { success: false, reason: "No opponents have any Unicorn cards in their Stable to swap!" };
    }

    // 🛡️ Variable Normalization (Catches nested engine routing)
    const ctx = targetData.contextData || targetData || {};

    let myCardId = targetData.myCardId || ctx.myCardId;
    let opponentName = targetData.opponentName || ctx.opponentName;
    let opponentCardId = targetData.opponentCardId || ctx.opponentCardId;

    // Process single-click card selections from UI
    if (targetData.targetCardId && targetData.targetPlayerName) {
        if (targetData.targetPlayerName === playerName) {
            myCardId = targetData.targetCardId;
        } else if (targetData.targetPlayerName !== playerName) {
            opponentName = targetData.targetPlayerName;
            opponentCardId = targetData.targetCardId;
        }
    }

    // ==========================================
    // STEP 1: CHOICE PROMPTS
    // ==========================================
    // missing opponent selection
    if (myCardId && (!opponentCardId || !opponentName)) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: "UNICORN_SWAP",
                prompt: "Unicorn Swap: Select a Unicorn from an OPPONENT'S Stable to swap.",
                targetScope: "OPPONENT_STABLE",
                allowedPlayers: opponentsWithUnicorns,
                contextData: { myCardId }
            }
        };
    }

    // missing own card selection
    if (opponentCardId && opponentName && !myCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: "UNICORN_SWAP",
                prompt: `Unicorn Swap: Select a Unicorn from YOUR Stable to swap with ${opponentName}'s Unicorn.`,
                targetScope: "MY_STABLE",
                contextData: { opponentName, opponentCardId }
            }
        };
    }

    // missing both selections
    if (!myCardId || !opponentCardId || !opponentName) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: "UNICORN_SWAP",
                prompt: "Unicorn Swap: Select a Unicorn from your Stable and a Unicorn from an opponent's Stable to swap.",
                targetScope: "STABLE_SWAP",
                contextData: {}
            }
        };
    }

    // ==========================================
    // STEP 2: EXECUTION STAGE
    // ==========================================
    if (opponentName === playerName) {
        return { success: false, reason: "You must swap with an opponent, not yourself!" };
    }

    const opponent = gameState.players[opponentName];
    if (!opponent) return { success: false, reason: "Opponent not found." };

    const myCardIdx = (player.stable || []).findIndex(c => c && (String(c.id) === String(myCardId) || c === myCardId));
    const oppCardIdx = (opponent.stable || []).findIndex(c => c && (String(c.id) === String(opponentCardId) || c === opponentCardId));

    if (myCardIdx === -1 || oppCardIdx === -1) {
        return { success: false, reason: "One or both target cards are no longer in their Stables." };
    }

    const myCard = player.stable[myCardIdx];
    const oppCard = opponent.stable[oppCardIdx];

    // Strict validation: Verify both cards are actually valid Unicorns
    if (!checkIsUnicorn(myCard, playerName) || !checkIsUnicorn(oppCard, opponentName)) {
        return { success: false, reason: "One or both selected cards are not valid Unicorn cards." };
    }

    // Execute the physical swap
    const [myUnicorn] = player.stable.splice(myCardIdx, 1);
    const [oppUnicorn] = opponent.stable.splice(oppCardIdx, 1);

    player.stable.push(oppUnicorn);
    opponent.stable.push(myUnicorn);

    // Collect triggered ETB effects safely
    const pendingChoices = [];

    if (typeof triggerEntersStable === 'function') {
        const etb1 = triggerEntersStable(gameState, playerName, oppUnicorn);
        if (etb1 && etb1.requiresChoice) {
            pendingChoices.push({
                ...etb1.pendingChoice,
                isEnterTrigger: true,
                cardPlayed: oppUnicorn,
                originalPlayer: playerName
            });
        }

        const etb2 = triggerEntersStable(gameState, opponentName, myUnicorn);
        if (etb2 && etb2.requiresChoice) {
            pendingChoices.push({
                ...etb2.pendingChoice,
                isEnterTrigger: true,
                cardPlayed: myUnicorn,
                originalPlayer: opponentName
            });
        }
    }

    // Resolve Trigger Queue
    if (pendingChoices.length > 0) {
        gameState.triggerQueue = gameState.triggerQueue || [];

        if (pendingChoices.length > 1) {
            gameState.triggerQueue.push(...pendingChoices.slice(1));
        }

        return {
            success: true,
            requiresChoice: true,
            pendingChoice: pendingChoices[0],
            message: `${playerName} swapped ${myUnicorn.name || 'a Unicorn'} with ${opponentName}'s ${oppUnicorn.name || 'a Unicorn'}!`
        };
    }

    return {
        success: true,
        message: `${playerName} swapped ${myUnicorn.name || 'a Unicorn'} with ${opponentName}'s ${oppUnicorn.name || 'a Unicorn'}!`
    };
}

export function completeSecondSwap(gameState, p1Name, p2Name, p2CardIndex) {
    // STEP 3: Steal Unicorn 2 from Player 2 to Player 1
    const stealResult2 = stealCard(gameState, p2Name, p1Name, p2CardIndex);

    // STEP 4: Trigger ETB for Player 1 if applicable
    if (stealResult2.requiresChoice) {
        return {
            requiresChoice: true,
            pendingChoice: stealResult2.pendingChoice
        };
    }

    return { success: true };
}

export function BlatantThievery(gameState, playerName, targetData = {}) {
    // 🛡️ Variable Normalization & State Unpacking
    const ctx = targetData.contextData || targetData || {};
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || ctx.targetPlayerName;

    // ==========================================
    // STEP 1: SELECT A TARGET PLAYER
    // ==========================================
    if (!targetPlayerName) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'BLATANT_THIEVERY', // 👈 ROUTE BACK
                prompt: "Blatant Thievery: Select a player to view their hand.",
                targetScope: "OPPONENT",
                contextData: targetData
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    const casterPlayer = gameState.players ? gameState.players[playerName] : null;

    if (!targetPlayer || !casterPlayer) {
        return { success: false, reason: "Player state not found" };
    }

    // If opponent has no cards in hand, action terminates safely
    if (!targetPlayer.hand || targetPlayer.hand.length === 0) {
        return {
            success: true,
            message: `${targetPlayerName} has no cards in hand. Blatant Thievery whiffs!`
        };
    }

    // ==========================================
    // STEP 2: SELECT A CARD FROM TARGET'S HAND
    // ==========================================
    // Safely extract the chosen card or index from the UI's response
    const chosenIndex = targetData.targetCardIndex !== undefined
        ? targetData.targetCardIndex
        : (targetData.cardIndexToDiscard !== undefined ? targetData.cardIndexToDiscard : ctx.targetCardIndex);
    const targetCardId = targetData.targetCardId || ctx.targetCardId;

    if (chosenIndex === undefined && !targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'BLATANT_THIEVERY', // 👈 ROUTE BACK
                prompt: `Blatant Thievery: Select a card from ${targetPlayerName}'s hand to steal.`,
                targetScope: "TARGET_HAND",
                targetPlayer: targetPlayerName,
                options: targetPlayer.hand, // 👈 Great UI strategy
                contextData: { targetPlayerName } // 👈 Carry target player forward to Step 3
            }
        };
    }

    // ==========================================
    // STEP 3: EXECUTE THE THEFT
    // ==========================================
    let targetIndex = -1;

    if (targetCardId) {
        targetIndex = targetPlayer.hand.findIndex(c => c && (c.id === targetCardId || String(c) === String(targetCardId)));
    } else if (chosenIndex !== undefined && chosenIndex >= 0 && chosenIndex < targetPlayer.hand.length) {
        targetIndex = chosenIndex;
    }

    if (targetIndex !== -1) {
        // Splice removes it from target, destructuring grabs the single card
        const [stolenCard] = targetPlayer.hand.splice(targetIndex, 1);

        // Ensure caster's hand exists and add the stolen goods
        casterPlayer.hand = casterPlayer.hand || [];
        casterPlayer.hand.push(stolenCard);
    } else {
        return { success: false, reason: "Card not found in target's hand." };
    }

    return {
        success: true,
        message: `${playerName} played Blatant Thievery and stole a card from ${targetPlayerName}'s hand!`
    };
}
export function ChangeOfLuck(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization & State Unpacking
    const ctx = targetData.contextData || targetData || {};
    let drawn = ctx.drawn || false;
    let discardedCount = ctx.discardedCount || 0;

    // Standardize the incoming discard index from the UI
    const discardIdx = targetData.targetCardIndex !== undefined
        ? targetData.targetCardIndex
        : (targetData.cardIndexToDiscard !== undefined ? targetData.cardIndexToDiscard : targetData.cardIndex);

    // ==========================================
    // STEP 1: INITIAL ENTRY - DRAW 2 CARDS
    // ==========================================
    if (!drawn) {
        if (typeof drawCard === 'function') {
            drawCard(gameState, playerName, 2);
        }
        drawn = true;
        discardedCount = 0;
    }

    // ==========================================
    // STEP 2: PROCESS PENDING DISCARD (IF ANY)
    // ==========================================
    if (discardIdx !== undefined && discardIdx >= 0 && discardIdx < player.hand.length) {
        if (typeof discardCard === 'function') {
            discardCard(gameState, playerName, discardIdx);
        } else {
            // Safe fallback just in case primitive is missing
            const [discarded] = player.hand.splice(discardIdx, 1);
            gameState.discardPile = gameState.discardPile || [];
            gameState.discardPile.push(discarded);
        }
        discardedCount++; // Increment our state tracker!
    }

    // ==========================================
    // STEP 3: PROMPT FOR REMAINING DISCARDS
    // ==========================================
    const neededDiscards = 3 - discardedCount;

    // Check if they still need to discard AND actually have cards left to discard
    if (neededDiscards > 0 && player.hand && player.hand.length > 0) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: `Change Of Luck: Select a card to discard (${neededDiscards} left).`,
                targetScope: "MY_HAND",
                actionType: "CHANGE_OF_LUCK", // 👈 ROUTE BACK TO THIS FUNCTION
                contextData: { drawn, discardedCount } // 👈 Carry state to the next loop!
            }
        };
    }

    // ==========================================
    // STEP 4: RESOLUTION - EXTRA TURN
    // ==========================================
    gameState.extraTurns = (gameState.extraTurns || 0) + 1;

    return {
        success: true,
        message: `${playerName} played Change of Luck, drew 2 cards, discarded their quota, and gained an extra turn!`
    };
}

export function AlluringNarwhal(gameState, playerName, targetData = {}) {
    const casterPlayer = gameState.players ? gameState.players[playerName] : null;
    if (!casterPlayer) return { success: false, reason: "Caster not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // Optional trigger / choice opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to steal an Upgrade card.` };
    }

    // Strict helper to verify if a card is an Upgrade card
    const isUpgrade = (card) => {
        if (!card) return false;
        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UPGRADE') && !cat.includes('DOWNGRADE');
    };

    // ==========================================
    // STEP 1: SCAN OPPONENTS FOR UPGRADES
    // ==========================================
    let upgradeAvailable = false;
    for (const pName of (gameState.playerOrder || [])) {
        if (pName !== playerName) {
            const opp = gameState.players[pName];
            if (!opp) continue;

            const oppCards = [
                ...(opp.stable || []),
                ...(opp.upgrades || []),
                ...(opp.upgradesDowngrades || [])
            ];

            if (oppCards.some(isUpgrade)) {
                upgradeAvailable = true;
                break;
            }
        }
    }

    if (!upgradeAvailable) {
        return { success: true, message: "No opponent Upgrade cards available to steal." };
    }

    // ==========================================
    // STEP 2: PROMPT CHOICE IF CARD NOT YET SELECTED
    // ==========================================
    if (!targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'ALLURING_NARWHAL', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Alluring Narwhal: Select an Upgrade card to STEAL",
                targetScope: "OPPONENT_UPGRADE",
                optional: true,
                isEnterTrigger: true,
                contextData: targetData
            }
        };
    }

    // ==========================================
    // STEP 3: LOCATE & STEAL TARGETED UPGRADE
    // ==========================================
    let stolenCard = null;
    let victimName = null;

    for (const pName of (gameState.playerOrder || [])) {
        if (pName === playerName) continue;

        const opp = gameState.players[pName];
        if (!opp) continue;

        const containers = [opp.stable, opp.upgrades, opp.upgradesDowngrades];
        for (const container of containers) {
            if (!Array.isArray(container)) continue;

            const idx = container.findIndex(c =>
                c && (c.id === targetCardId || String(c.id) === String(targetCardId)) && isUpgrade(c)
            );

            if (idx !== -1) {
                [stolenCard] = container.splice(idx, 1);
                victimName = pName;
                break;
            }
        }
        if (stolenCard) break;
    }

    if (!stolenCard) {
        return { success: false, reason: "Selected card is not a valid Upgrade card in an opponent's Stable." };
    }

    // Add card to caster's designated zone
    if (Array.isArray(casterPlayer.upgrades)) {
        casterPlayer.upgrades.push(stolenCard);
    } else if (Array.isArray(casterPlayer.stable)) {
        casterPlayer.stable.push(stolenCard);
    } else {
        casterPlayer.upgrades = [stolenCard];
    }

    return {
        success: true,
        message: `${playerName} used Alluring Narwhal to steal ${stolenCard.name || 'an Upgrade card'} from ${victimName}!`
    };
}

export function AnnoyingFlyingUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || targetData.targetPlayer || ctx.targetPlayerName;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to use Annoying Flying Unicorn's effect.` };
    }

    // ==========================================
    // STEP 1: CASTER SELECTS TARGET PLAYER
    // ==========================================
    if (!targetPlayerName) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'ANNOYING_FLYING_UNICORN', // 👈 REQUIRED ROUTING
                prompt: "Annoying Flying Unicorn: Select a player to DISCARD a card.",
                targetScope: "ANY_PLAYER",
                optional: true,
                isEnterTrigger: true,
                contextData: targetData
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;

    if (!targetPlayer || !Array.isArray(targetPlayer.hand) || targetPlayer.hand.length === 0) {
        return { success: true, message: `${targetPlayerName} has no cards in hand to discard.` };
    }

    // ==========================================
    // STEP 2: TARGET PLAYER CHOOSES CARD TO DISCARD
    // ==========================================
    const discardIdx = targetData.cardIndexToDiscard !== undefined
        ? targetData.cardIndexToDiscard
        : (targetData.cardIndex !== undefined ? targetData.cardIndex : (targetData.targetCardIndex !== undefined ? targetData.targetCardIndex : ctx.cardIndexToDiscard));

    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    if (discardIdx === undefined && !targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: targetPlayerName, // 👈 Target player becomes the decision-maker
                actionType: 'ANNOYING_FLYING_UNICORN', // 👈 Route back to Step 3
                prompt: `Annoying Flying Unicorn: Select 1 card from your hand to DISCARD.`,
                targetScope: "MY_HAND",
                isEnterTrigger: true,
                contextData: { targetPlayerName } // 👈 Carry target player forward to Step 3
            }
        };
    }

    // ==========================================
    // STEP 3: EXECUTE DISCARD
    // ==========================================
    let finalIndex = discardIdx;

    // If card ID was provided instead of index, locate its position in hand
    if (targetCardId && finalIndex === undefined) {
        finalIndex = targetPlayer.hand.findIndex(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));
    }

    if (finalIndex !== undefined && finalIndex >= 0 && finalIndex < targetPlayer.hand.length) {
        if (typeof discardCard === 'function') {
            discardCard(gameState, targetPlayerName, finalIndex);
        } else {
            targetPlayer.hand.splice(finalIndex, 1);
        }
    } else {
        return { success: false, reason: "Selected card to discard was not found in player's hand." };
    }

    return {
        success: true,
        message: `${targetPlayerName} discarded a card due to Annoying Flying Unicorn!`
    };
}

export function Americorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || targetData.targetPlayer || ctx.targetPlayerName;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to pull a card with Americorn.` };
    }

    // ==========================================
    // STEP 1: SELECT A TARGET PLAYER (OPPONENT)
    // ==========================================
    if (!targetPlayerName) {
        // Filter out current player to find valid opponents
        const opponents = (gameState.playerOrder || []).filter(pName => pName !== playerName);

        if (opponents.length === 0) {
            return { success: true, message: "No other players available to pull a card from." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'AMERICORN', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Americorn: Select another player to pull a card at random from their hand.",
                targetScope: "OTHER_PLAYER",
                allowedPlayers: opponents,
                optional: true, // 👈 "You may..."
                isEnterTrigger: true,
                contextData: targetData
            }
        };
    }

    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;

    if (!targetPlayer) {
        return { success: false, reason: `Target player "${targetPlayerName}" not found.` };
    }

    if (targetPlayerName === playerName) {
        return { success: false, reason: "You cannot pull a card from your own hand!" };
    }

    if (!Array.isArray(targetPlayer.hand) || targetPlayer.hand.length === 0) {
        return { success: true, message: `${targetPlayerName} has no cards in hand to pull.` };
    }

    // ==========================================
    // STEP 2: PULL A CARD AT RANDOM FROM TARGET
    // ==========================================
    // Use cardIndexToPull if provided by UI, or fall back to Math.random()
    const pullIndex = (targetData.cardIndexToPull !== undefined)
        ? targetData.cardIndexToPull
        : ((targetData.targetCardIndex !== undefined) ? targetData.targetCardIndex : Math.floor(Math.random() * targetPlayer.hand.length));

    const [pulledCard] = targetPlayer.hand.splice(pullIndex, 1);

    if (pulledCard) {
        player.hand = player.hand || [];
        player.hand.push(pulledCard);
    }

    return {
        success: true,
        message: `${playerName} used Americorn to pull a random card from ${targetPlayerName}'s hand!`
    };
}

export function ChainsawUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // Optional trigger opt-out ("You may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to use Chainsaw Unicorn's effect.` };
    }

    // Helper to grab all active Upgrades and Downgrades for a player
    const getUpgradeOrDowngradeCards = (p) => [
        ...(p.upgrades || []),
        ...(p.downgrades || [])
    ];

    // ==========================================
    // STEP 1: PROMPT TARGET SELECTION
    // ==========================================
    if (!targetCardId) {
        // Check across all players if ANY Upgrade or Downgrade exists
        const hasTargets = (gameState.playerOrder || []).some(pName => {
            const p = gameState.players[pName];
            return p && getUpgradeOrDowngradeCards(p).length > 0;
        });

        if (!hasTargets) {
            return { success: true, message: "No Upgrade or Downgrade cards in play to target." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'CHAINSAW_UNICORN', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Chainsaw Unicorn: You may SACRIFICE or DESTROY an Upgrade or Downgrade card.",
                targetScope: "UPGRADE_OR_DOWNGRADE",
                optional: true,
                isEnterTrigger: true,
                contextData: targetData
            }
        };
    }

    // ==========================================
    // STEP 2: LOCATE TARGET CARD & OWNER
    // ==========================================
    let cardOwnerName = null;
    let targetCard = null;

    for (const pName of (gameState.playerOrder || [])) {
        const p = gameState.players[pName];
        if (p) {
            const cards = getUpgradeOrDowngradeCards(p);
            const found = cards.find(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));
            if (found) {
                cardOwnerName = pName;
                targetCard = found;
                break;
            }
        }
    }

    if (!cardOwnerName || !targetCard) {
        return { success: false, reason: "Selected Upgrade/Downgrade card not found in play." };
    }

    // ==========================================
    // STEP 3: SACRIFICE OR DESTROY
    // ==========================================
    // Delegate to proper game primitives so protective effects trigger
    if (cardOwnerName === playerName) {
        return typeof sacrificeCard === 'function'
            ? sacrificeCard(gameState, playerName, targetCard)
            : sendCardFromStable(gameState, cardOwnerName, targetCardId, 'discard');
    } else {
        return typeof destroyCard === 'function'
            ? destroyCard(gameState, cardOwnerName, targetCard)
            : sendCardFromStable(gameState, cardOwnerName, targetCardId, 'discard');
    }
}
// cardEffects.js
export function ClassyNarwhal(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    if (targetData.skipped) {
        return { success: true };
    }

    // STEP 1: PROMPT USER WITH AVAILABLE UPGRADE CARDS IN DECK
    if (!targetData.targetCardId) {
        // Robust category check matching both 'UPGRADE' and 'Upgrade Card'
        const upgradeCardsInDeck = (gameState.drawPile || []).filter(c => {
            const cat = (c.category || c.type || '').toString().toUpperCase();
            return cat.includes('UPGRADE') && !cat.includes('DOWNGRADE');
        });

        if (upgradeCardsInDeck.length === 0) {
            return { success: true, reason: "No Upgrade cards found in the deck." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Classy Narwhal: You may search the deck for an Upgrade card to add to your hand",
                targetScope: "SEARCH_DECK",
                optional: true,
                isEnterTrigger: true,
                options: upgradeCardsInDeck,
                contextData: targetData
            }
        };
    }

    // STEP 2: REMOVE SELECTED UPGRADE CARD FROM DECK & ADD TO PLAYER'S HAND
    const targetCardId = targetData.targetCardId;

    // Cast both IDs to String so string vs integer mismatches won't fail
    const cardIndex = (gameState.drawPile || []).findIndex(c =>
        c && (String(c.id) === String(targetCardId) || c === targetCardId)
    );

    if (cardIndex !== -1) {
        const [chosenCard] = gameState.drawPile.splice(cardIndex, 1);
        if (!player.hand) player.hand = [];
        player.hand.push(chosenCard);
    }

    // STEP 3: SHUFFLE THE DECK
    if (Array.isArray(gameState.drawPile)) {
        for (let i = gameState.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
        }
    }

    return { success: true };
}

export function ShabbyTheNarwhal(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // Check normalized skip parameters
    if (targetData.skipped || targetData.skip) {
        return { success: true, message: `${playerName} declined to search for a Downgrade card.` };
    }

    const targetCardId = targetData.targetCardId || targetData.cardId;

    // STEP 1: PROMPT USER WITH AVAILABLE DOWNGRADE CARDS IN DECK
    if (!targetCardId) {
        const downgradeCardsInDeck = (gameState.drawPile || []).filter(c => {
            if (!c) return false;
            const cat = (c.category || c.type || '').toString().toUpperCase();
            return cat.includes('DOWNGRADE');
        });

        if (downgradeCardsInDeck.length === 0) {
            return { success: true, message: "No Downgrade cards found in the deck." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: "SHABBY_THE_NARWHAL", // 👈 Added missing actionType
                prompt: "Shabby The Narwhal: You may search the deck for a Downgrade card to add to your hand.",
                targetScope: "SEARCH_DECK",
                optional: true,
                isEnterTrigger: true,
                options: downgradeCardsInDeck.map(c => ({ cardId: c.id, name: c.name, card: c })),
                contextData: targetData
            }
        };
    }

    // STEP 2: EXECUTE SEARCH & TRANSFER TO HAND
    let searchResult = null;
    if (typeof searchDeckToHand === 'function') {
        searchResult = searchDeckToHand(gameState, playerName, targetCardId);
    } else {
        // Fallback card transfer
        const cardIndex = (gameState.drawPile || []).findIndex(c => c && (c.id === targetCardId || c === targetCardId));
        if (cardIndex !== -1) {
            const [foundCard] = gameState.drawPile.splice(cardIndex, 1);
            player.hand = player.hand || [];
            player.hand.push(foundCard);
            searchResult = { success: true, card: foundCard };
        } else {
            return { success: false, reason: "Selected Downgrade card not found in deck." };
        }
    }

    // STEP 3: ALWAYS SHUFFLE THE DECK AFTER SEARCHING
    if (searchResult && searchResult.success) {
        if (typeof shuffleDeck === 'function') {
            shuffleDeck(gameState);
        } else if (Array.isArray(gameState.drawPile)) {
            // Fisher-Yates shuffle algorithm
            for (let i = gameState.drawPile.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
            }
        }
    }

    return searchResult || { success: true, message: `${playerName} added a Downgrade card to their hand and shuffled the deck.` };
}

export function TheGreatNarwhal(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 1. Normalize skip flag
    if (targetData.skipped || targetData.skip) {
        return { success: true };
    }

    // 2. Normalize target card identifier
    const targetCardId = targetData.targetCardId || targetData.cardId;

    // STEP 1: PROMPT USER WITH CARDS IN DECK THAT HAVE "NARWHAL" IN THEIR NAME
    if (!targetCardId) {
        const narwhalCardsInDeck = (gameState.drawPile || []).filter(c => {
            const name = (c ? (c.name || '') : '').toString().toUpperCase();
            return name.includes('NARWHAL');
        });

        if (narwhalCardsInDeck.length === 0) {
            return { success: true, reason: "No cards with 'Narwhal' in their name found in the deck." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'THE_GREAT_NARWHAL', // 👈 Required for resolveChoice routing
                prompt: "The Great Narwhal: You may search the deck for a card with 'Narwhal' in its name to add to your hand",
                targetScope: "SEARCH_DECK",
                optional: true,
                isEnterTrigger: true,
                options: narwhalCardsInDeck,
                contextData: targetData
            }
        };
    }

    // STEP 2: EXECUTE SEARCH & SHUFFLE VIA gameActions primitive
    return searchDeckToHand(gameState, playerName, targetCardId);
}
export function GreedyFlyingUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // Draw 1 card using gameActions primitive safely
    if (typeof drawCard === 'function') {
        drawCard(gameState, playerName, 1);
    } else {
        // Fallback draw logic in case primitive isn't injected
        gameState.drawPile = gameState.drawPile || [];
        if (gameState.drawPile.length > 0) {
            const drawn = gameState.drawPile.pop();
            player.hand = player.hand || [];
            player.hand.push(drawn);
        }
    }

    return {
        success: true,
        message: `${playerName} drew a card from Greedy Flying Unicorn's effect!`
    };
}

export function MagicalFlyingUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to retrieve a Magic card with Magical Flying Unicorn.` };
    }

    // Helper to verify if a card is a Magic card
    const isMagicCard = (card) => {
        if (!card) return false;
        const cat = (card.category || card.type || '').toString().toUpperCase();
        // Match MAGIC or MAGIC CARD, but explicitly exclude MAGICAL (e.g., Unicorns)
        return (cat === 'MAGIC' || cat === 'MAGIC CARD' || cat.includes('MAGIC')) && !cat.includes('MAGICAL') && !cat.includes('UNICORN');
    };

    // ==========================================
    // STEP 1: SCAN DISCARD PILE & PROMPT CHOICE
    // ==========================================
    const magicCardsInDiscard = (gameState.discardPile || []).filter(isMagicCard);

    if (magicCardsInDiscard.length === 0) {
        return { success: true, message: "No Magic cards found in the discard pile." };
    }

    if (!targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'MAGICAL_FLYING_UNICORN', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Magical Flying Unicorn: You may choose a Magic card from the discard pile to add to your hand.",
                targetScope: "SEARCH_DISCARD",
                optional: true,
                isEnterTrigger: true,
                options: magicCardsInDiscard,
                contextData: targetData
            }
        };
    }

    // ==========================================
    // STEP 2: MOVE MAGIC CARD FROM DISCARD TO HAND
    // ==========================================
    if (typeof moveDiscardToHand === 'function') {
        return moveDiscardToHand(gameState, playerName, targetCardId);
    }

    // Safe inline fallback execution
    const discardIdx = (gameState.discardPile || []).findIndex(c =>
        c && (String(c.id) === String(targetCardId) || c === targetCardId)
    );

    if (discardIdx !== -1) {
        const [retrievedCard] = gameState.discardPile.splice(discardIdx, 1);
        player.hand = player.hand || [];
        player.hand.push(retrievedCard);
        return {
            success: true,
            message: `${playerName} retrieved ${retrievedCard.name || 'a Magic card'} from the discard pile!`
        };
    }

    return { success: false, reason: "Selected Magic card not found in the discard pile." };
}

export function MajesticFlyingUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to retrieve a Unicorn card with Majestic Flying Unicorn.` };
    }

    // Helper to verify if a card is a Unicorn card
    const isUnicornCard = (card) => {
        if (!card) return false;
        const cat = (card.category || card.type || '').toString().toUpperCase();
        return cat.includes('UNICORN');
    };

    // ==========================================
    // STEP 1: SCAN DISCARD PILE & PROMPT CHOICE
    // ==========================================
    const unicornCardsInDiscard = (gameState.discardPile || []).filter(isUnicornCard);

    if (unicornCardsInDiscard.length === 0) {
        return { success: true, message: "No Unicorn cards found in the discard pile." };
    }

    if (!targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'MAJESTIC_FLYING_UNICORN', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Majestic Flying Unicorn: You may choose a Unicorn card from the discard pile to add to your hand.",
                targetScope: "SEARCH_DISCARD",
                optional: true,
                isEnterTrigger: true,
                options: unicornCardsInDiscard,
                contextData: targetData
            }
        };
    }

    // ==========================================
    // STEP 2: MOVE UNICORN CARD FROM DISCARD TO HAND
    // ==========================================
    if (typeof moveDiscardToHand === 'function') {
        return moveDiscardToHand(gameState, playerName, targetCardId);
    }

    // Safe inline fallback execution
    const discardIdx = (gameState.discardPile || []).findIndex(c =>
        c && (String(c.id) === String(targetCardId) || c === targetCardId)
    );

    if (discardIdx !== -1) {
        const [retrievedCard] = gameState.discardPile.splice(discardIdx, 1);
        player.hand = player.hand || [];
        player.hand.push(retrievedCard);
        return {
            success: true,
            message: `${playerName} retrieved ${retrievedCard.name || 'a Unicorn card'} from the discard pile!`
        };
    }

    return { success: false, reason: "Selected Unicorn card not found in the discard pile." };
}

export function MermaidUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // If the player opted out of this optional trigger ("you may...")
    if (targetData.skipped) {
        return { success: true };
    }

    // STEP 1: PROMPT USER TO SELECT A CARD FROM ANY PLAYER'S STABLE
    if (!targetData.targetCardId) {
        // Check if any player has cards in their Stable, Upgrades, or Downgrades area
        const hasCardsInPlay = gameState.playerOrder.some(pName => {
            const p = gameState.players[pName];
            return p && (
                (Array.isArray(p.stable) && p.stable.length > 0) ||
                (Array.isArray(p.upgrades) && p.upgrades.length > 0) ||
                (Array.isArray(p.downgrades) && p.downgrades.length > 0)
            );
        });

        if (!hasCardsInPlay) {
            return { success: true, reason: "No cards in any player's Stable to return." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'MERMAID_UNICORN', // Added for resolveChoice routing
                prompt: "Mermaid Unicorn: You may select 1 card in any player's Stable to return to their hand",
                targetScope: "ANY_STABLE",
                optional: true,
                isEnterTrigger: true,
                contextData: { ...targetData }
            }
        };
    }

    // STEP 2: FIND WHICH PLAYER OWNS THE SELECTED CARD
    const targetCardId = targetData.targetCardId;
    let cardOwnerName = null;

    for (const pName of gameState.playerOrder) {
        const p = gameState.players[pName];
        if (p) {
            const allCards = [
                ...(p.stable || []),
                ...(p.upgrades || []),
                ...(p.downgrades || [])
            ];
            const found = allCards.some(c => c && (c.id === targetCardId || c === targetCardId));
            if (found) {
                cardOwnerName = pName;
                break;
            }
        }
    }

    if (!cardOwnerName) {
        return { success: false, reason: "Target card not found in any player's Stable." };
    }

    // STEP 3: RETURN CARD TO OWNER'S HAND VIA gameActions primitive
    if (typeof returnCardToHand === 'function') {
        return returnCardToHand(gameState, cardOwnerName, targetCardId);
    }

    return { success: false, reason: "returnCardToHand function missing." };
}

export function NarwhalTorpedo(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // Helper to check if a card is a Downgrade
    const isDowngradeCard = (c) => {
        if (!c) return false;
        const cat = (c.category || c.type || '').toString().toUpperCase();
        return cat.includes('DOWNGRADE');
    };

    // Gather all Downgrades across all stable zones (downgrades, stable, upgrades)
    const downgradesToSacrifice = [];
    const zones = ['downgrades', 'stable', 'upgrades'];

    for (const zone of zones) {
        if (Array.isArray(player[zone])) {
            player[zone].forEach(card => {
                if (isDowngradeCard(card)) {
                    // Prevent duplicate tracking if reference is already present
                    const isTracked = downgradesToSacrifice.some(d =>
                        d === card || (d.id && card.id && d.id === card.id)
                    );
                    if (!isTracked) {
                        downgradesToSacrifice.push(card);
                    }
                }
            });
        }
    }

    if (downgradesToSacrifice.length === 0) {
        return { success: true, message: "No Downgrade cards in Stable to sacrifice." };
    }

    // Mandatory: SACRIFICE all Downgrade cards in player's Stable
    const sacrificed = [];

    if (typeof sacrificeCard !== 'function') {
        return { success: false, reason: "sacrificeCard function missing." };
    }

    for (const card of downgradesToSacrifice) {
        // Pass card object directly or fallback to string/id
        const cardIdentifier = (typeof card === 'object' && card.id) ? card.id : card;
        const res = sacrificeCard(gameState, playerName, cardIdentifier);
        if (res && res.success) {
            sacrificed.push(res.card || card);
        }
    }

    return {
        success: true,
        sacrificedCount: sacrificed.length,
        message: `Narwhal Torpedo sacrificed ${sacrificed.length} Downgrade card(s).`
    };
}

export function RainbowUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // --- 1. HANDLE SKIPPED CHOICE ---
    if (targetData.skip || targetData.skipped || targetData.selectedCardIndex === -1 || targetData.cardIndex === -1) {
        return { success: true, message: "Skipped Rainbow Unicorn effect." };
    }

    // --- 2. FILTER VALID BASIC UNICORNS ---
    const basicUnicornsInHand = (player.hand || []).filter(c => isBasicUnicorn(c, gameState, playerName));

    if (basicUnicornsInHand.length === 0) {
        return { success: true, message: "No Basic Unicorn cards in hand for Rainbow Unicorn." };
    }

    // --- 3. EXTRACT SELECTION ---
    const chosenIndex = targetData.selectedCardIndex !== undefined
        ? targetData.selectedCardIndex
        : targetData.cardIndex;

    const targetCardId = targetData.targetCardId || targetData.cardId;

    // --- 4. PROMPT USER IF NO CHOICE HAS BEEN MADE YET ---
    if (chosenIndex === undefined && !targetCardId) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Rainbow Unicorn: You may bring a Basic Unicorn card from your hand directly into your Stable.",
                actionType: 'RAINBOW_UNICORN_SELECT', // 👈 Required by resolveChoice
                targetScope: "MY_HAND",
                optional: true,
                isEnterTrigger: true,
                validCards: basicUnicornsInHand,
                contextData: targetData
            }
        };
    }

    // --- 5. RESOLVE SELECTED CARD ---
    let selectedCard = null;

    if (chosenIndex !== undefined && chosenIndex !== null && player.hand[chosenIndex]) {
        selectedCard = player.hand[chosenIndex];
    } else if (targetCardId) {
        selectedCard = player.hand.find(c => c && (c.id === targetCardId || c === targetCardId));
    }

    if (!selectedCard) {
        return { success: false, reason: "Selected card not found in hand." };
    }

    if (!isBasicUnicorn(selectedCard, gameState, playerName)) {
        return { success: false, reason: "Selected card is not a valid Basic Unicorn." };
    }

    // --- 6. BRING DIRECTLY INTO PLAY ---
    return bringDirectlyIntoPlay(gameState, playerName, selectedCard, 'hand', playerName);
}

/**
 * ENTER STABLE: Mandatory STEAL a Unicorn card from an opponent's stable.
 */
/**
 * ENTER STABLE: Mandatory STEAL a Unicorn card from an opponent's stable.
 */
export function SeductiveUnicorn(gameState, playerName, targetData = {}) {
    // Keep reference to exact card instance
    const cardInstance = targetData.cardPlayed;

    // STEP 1: PROMPT PLAYER TO CHOOSE A UNICORN TO STEAL
    if (!targetData.targetCardId) {
        const opponentUnicorns = [];

        for (const pName of gameState.playerOrder) {
            if (pName !== playerName) {
                const opponent = gameState.players[pName];
                if (opponent && Array.isArray(opponent.stable)) {
                    opponent.stable.forEach(c => {
                        const isUnicorn = typeof isUnicornCard === 'function'
                            ? isUnicornCard(c, gameState, pName)
                            : (c.category || c.type || '').toString().toUpperCase().includes('UNICORN');

                        if (c && isUnicorn) {
                            opponentUnicorns.push({ cardId: c.id, owner: pName, name: c.name });
                        }
                    });
                }
            }
        }

        if (opponentUnicorns.length === 0) {
            return { success: true, message: "No Unicorn cards in opponent stables to steal." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: "SEDUCTIVE_UNICORN",
                prompt: "Seductive Unicorn: Select a Unicorn card in an opponent's Stable to STEAL",
                targetScope: "OPPONENT_STABLE",
                optional: false,
                isEnterTrigger: true,
                options: opponentUnicorns,
                contextData: {
                    ...targetData,
                    cardPlayed: cardInstance // 👈 Preserves exact instance reference
                }
            }
        };
    }

    // STEP 2: LOCATE VICTIM & CARD INDEX
    const targetCardId = targetData.targetCardId;
    const targetOwner = targetData.owner || targetData.targetPlayerName;

    let victimName = targetOwner;
    let cardIndex = -1;

    if (victimName && gameState.players[victimName]) {
        cardIndex = gameState.players[victimName].stable.findIndex(c => c && (c.id === targetCardId || c === targetCardId));
    } else {
        for (const pName of gameState.playerOrder) {
            if (pName !== playerName) {
                const p = gameState.players[pName];
                if (p && Array.isArray(p.stable)) {
                    const idx = p.stable.findIndex(c => c && (c.id === targetCardId || c === targetCardId));
                    if (idx !== -1) {
                        victimName = pName;
                        cardIndex = idx;
                        break;
                    }
                }
            }
        }
    }

    if (!victimName || cardIndex === -1) {
        return { success: false, reason: "Target card not found in opponent's Stable." };
    }

    // STEP 3: EXECUTE STEAL & ATTACH METADATA DIRECTLY TO CARD INSTANCE
    const stealResult = typeof stealCard === 'function'
        ? stealCard(gameState, victimName, playerName, cardIndex)
        : { success: false, reason: "stealCard function missing." };

    if (stealResult.success) {
        // Fallback: search player's stable if targetData.cardPlayed is missing
        const targetSeductive = cardInstance || (gameState.players[playerName].stable || []).find(
            c => c && (c.id === 'seductive_unicorn' || c.name === 'Seductive Unicorn') && !c.stolenCardInfo
        );

        if (targetSeductive) {
            targetSeductive.stolenCardInfo = {
                cardId: targetCardId,
                originalOwner: victimName,
                stolenCard: stealResult.card
            };
        }
    }

    return stealResult;
}

/**
 * LEAVE STABLE: Return the stolen Unicorn card back to its original owner's stable.
 */
// --- LEAVE TRIGGER (RETURN STOLEN CARD) ---
export function SeductiveUnicornLeave(gameState, playerName, card, targetData = {}) {
    if (!card || !card.stolenCardInfo) {
        return { success: true, message: "No card was bound to Seductive Unicorn." };
    }

    const { cardId, originalOwner, stolenCard } = card.stolenCardInfo;
    const player = gameState.players[playerName];
    const originalPlayer = gameState.players[originalOwner];

    // Clean up metadata immediately to prevent duplicate executions
    delete card.stolenCardInfo;

    if (!player || !originalPlayer) return { success: false, reason: "Player missing." };

    // Locate stolen card in player's stable
    const stolenIdx = (player.stable || []).findIndex(
        c => c && (c === stolenCard || c.id === cardId)
    );

    // If card was already destroyed/sacrificed earlier, exit safely
    if (stolenIdx === -1) {
        return { success: true, message: "Stolen card was no longer in Stable." };
    }

    // Return stolen card to original owner's stable
    const [returnedCard] = player.stable.splice(stolenIdx, 1);
    originalPlayer.stable = originalPlayer.stable || [];
    originalPlayer.stable.push(returnedCard);

    return {
        success: true,
        message: `${returnedCard.name || 'Stolen Unicorn'} returned to ${originalOwner}'s Stable.`
    };
}

export function SwiftFlyingUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // Handle optional pass
    if (targetData.passed || targetData.declined || targetData.action === 'PASS') {
        return { success: true, message: `${playerName} chose not to take an Instant card.` };
    }

    const discardPile = gameState.discardPile || [];
    const isInstant = card => (card.category || card.type || '').toString().toUpperCase().includes('INSTANT');
    const instantCards = discardPile.filter(isInstant);

    // Auto-pass if no Instant cards are in the discard pile
    if (instantCards.length === 0) {
        return { success: true, message: "No Instant cards available in the discard pile." };
    }

    const chosenCardId = targetData.targetCardId || targetData.cardId;
    const chosenCard = discardPile.find(c =>
        c && (String(c.id) === String(chosenCardId) || c === chosenCardId || String(c.uuid) === String(chosenCardId))
    );

    // Prompt selection if card not yet selected
    if (!chosenCard || !isInstant(chosenCard)) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Swift Flying Unicorn: You may choose an Instant card from the discard pile to add to your hand.",
                actionType: 'SWIFT_FLYING_UNICORN',
                targetScope: 'DISCARD_PILE',
                validCards: instantCards,
                optional: true
            }
        };
    }

    // Move chosen card from discard pile to player hand
    const idx = discardPile.findIndex(c => c === chosenCard);
    if (idx !== -1) {
        discardPile.splice(idx, 1);
    }

    player.hand = player.hand || [];
    player.hand.push(chosenCard);

    return {
        success: true,
        message: `${playerName} added ${chosenCard.name} from the discard pile to their hand!`
    };
}
export function UnicornOnTheCob(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // Standardize how the engine passes the selected index back
    const discardIdx = targetData.targetCardIndex !== undefined
        ? targetData.targetCardIndex
        : targetData.cardIndexToDiscard;

    // ==========================================
    // STEP 1: INITIAL ENTRY - DRAW 2 & PROMPT
    // ==========================================
    if (discardIdx === undefined) {
        // Draw 2 cards immediately
        if (typeof drawCard === 'function') {
            drawCard(gameState, playerName, 2);
        }

        // Now prompt them to discard. 
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Unicorn on the Cob: Choose 1 card from your hand to discard.",
                targetScope: "MY_HAND",
                actionType: "UNICORN_ON_THE_COB", // 👈 Ensure it routes back to THIS function
                isEnterTrigger: true,
                contextData: targetData
            }
        };
    }

    // ==========================================
    // STEP 2: CHOICE RESOLUTION - DISCARD
    // ==========================================
    if (discardIdx >= 0 && discardIdx < player.hand.length) {
        // 👈 Use your engine primitive instead of manually splicing!
        if (typeof discardCard === 'function') {
            return discardCard(gameState, playerName, discardIdx);
        } else {
            // Fallback just in case the primitive isn't imported
            const [discarded] = player.hand.splice(discardIdx, 1);
            gameState.discardPile = gameState.discardPile || [];
            gameState.discardPile.push(discarded);
            return { success: true, message: `${playerName} discarded a card for Unicorn on the Cob.` };
        }
    }

    return { success: false, reason: "Invalid discard selection." };
}

export function Neigh(gameState, playerName, targetData = {}) {
    return {
        success: true,
        isNeigh: true,
        cardName: "Neigh",
        message: `${playerName} played Neigh!`
    };
}

/**
 * Super Neigh Card Effect
 */
export function SuperNeigh(gameState, playerName, targetData = {}) {
    return {
        success: true,
        isSuperNeigh: true,
        message: `${playerName} played SUPER NEIGH! It cannot be Neigh'd.`
    };
}

/**
 * DOUBLE DUTCH: Allows player to play 2 cards during their Action phase.
 */
export function DoubleDutch(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) {
        return { success: false, reason: "Player not found" };
    }

    // Increments allowed actions for this turn's Action Phase
    gameState.actionsRemaining = (gameState.actionsRemaining || 1) + 1;

    return {
        success: true,
        message: `${playerName} activated Double Dutch and can play 2 cards during their Action phase!`
    };
}

/**
 * EXTRA TAIL Requirement Check: Checks if a player's Stable contains a Basic Unicorn.
 */
export function canPlayExtraTail(gameState, targetPlayerName) {
    const targetPlayer = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!targetPlayer || !Array.isArray(targetPlayer.stable)) return false;

    return targetPlayer.stable.some(card =>
        card && (
            card.category === CARD_TYPES.BASIC ||
            card.category === "Basic Unicorn" ||
            card.type === "Basic"
        )
    );
}

/**
 * EXTRA TAIL: Draws an extra card at the beginning of the player's turn.
 */
export function ExtraTail(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;
    const confirmed = targetData.confirmed || targetData.execute || ctx.confirmed || ctx.choiceMade;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to draw an extra card with Extra Tail.` };
    }

    // ==========================================
    // STEP 1: PROMPT OPTIONAL DRAW TRIGGER
    // ==========================================
    if (!confirmed) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'EXTRA_TAIL', // 👈 ROUTE BACK TO THIS FUNCTION
                prompt: "Extra Tail: You may DRAW an extra card.",
                targetScope: "NONE",
                optional: true,
                isBeginningOfTurnTrigger: true,
                contextData: { ...targetData, confirmed: true }
            }
        };
    }

    // ==========================================
    // STEP 2: EXECUTE DRAW
    // ==========================================
    if (typeof drawCard === 'function') {
        const result = drawCard(gameState, playerName, 1);
        if (result && result.success === false) {
            return result;
        }
    } else {
        // Fallback draw logic if primitive is missing
        gameState.drawPile = gameState.drawPile || [];
        if (gameState.drawPile.length > 0) {
            const drawnCard = gameState.drawPile.pop();
            player.hand = player.hand || [];
            player.hand.push(drawnCard);
        } else {
            return { success: false, reason: "Draw pile is empty." };
        }
    }

    return {
        success: true,
        message: `${playerName} activated Extra Tail and drew an extra card!`
    };
} 

export function GlitterBomb(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛡️ Variable Normalization (Unpacks nested engine contexts)
    const ctx = targetData.contextData || targetData || {};
    const skipped = targetData.skipped || targetData.skip || ctx.skipped;

    // Optional trigger opt-out ("you may...")
    if (skipped) {
        return { success: true, message: `${playerName} chose not to use Glitter Bomb.` };
    }

    // State tracking across multi-step choice routing
    let sacrificed = targetData.sacrificed || ctx.sacrificed || false;
    const targetCardId = targetData.targetCardId || targetData.cardId || ctx.targetCardId;
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || targetData.targetPlayer || ctx.targetPlayerName;

    // Helper to get all cards in player's Stable
    const getStableCards = (p) => [
        ...(p.stable || []),
        ...(p.upgrades || []),
        ...(p.downgrades || [])
    ];

    // ==========================================
    // STEP 1: SACRIFICE A CARD
    // ==========================================
    if (!sacrificed) {
        const playerStableCards = getStableCards(player);

        if (playerStableCards.length === 0) {
            return { success: true, message: "No cards in Stable available to sacrifice for Glitter Bomb." };
        }

        // Prompt for Sacrifice target if not yet selected
        if (!targetCardId) {
            return {
                requiresChoice: true,
                pendingChoice: {
                    chooser: playerName,
                    actionType: 'GLITTER_BOMB', // 👈 ROUTE BACK
                    prompt: "Glitter Bomb: Select a card in your Stable to SACRIFICE.",
                    targetScope: "MY_STABLE",
                    optional: true,
                    isBeginningOfTurnTrigger: true,
                    contextData: targetData
                }
            };
        }

        // Locate and execute Sacrifice
        const sacTarget = playerStableCards.find(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));
        if (!sacTarget) {
            return { success: false, reason: "Selected card to sacrifice not found in your Stable." };
        }

        const sacResult = typeof sacrificeCard === 'function'
            ? sacrificeCard(gameState, playerName, sacTarget)
            : sendCardFromStable(gameState, playerName, targetCardId, 'discard');

        if (sacResult && sacResult.success === false) {
            return sacResult;
        }

        sacrificed = true; // Mark sacrifice phase complete
    }

    // ==========================================
    // STEP 2: DESTROY A CARD
    // ==========================================
    // Check across all players for valid target cards in Stables
    const hasDestroyTargets = (gameState.playerOrder || []).some(pName => {
        const p = gameState.players[pName];
        return p && getStableCards(p).length > 0;
    });

    if (!hasDestroyTargets) {
        return { success: true, message: `${playerName} sacrificed a card with Glitter Bomb, but no targets were available to destroy!` };
    }

    // Prompt for Destroy target if not yet selected (or if target Card ID was used for the sacrifice phase)
    if (!targetPlayerName || (sacrificed && !ctx.sacrificed)) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'GLITTER_BOMB', // 👈 ROUTE BACK FOR DESTROY PHASE
                prompt: "Glitter Bomb: Select a card in any Stable to DESTROY.",
                targetScope: "ANY_STABLE",
                contextData: { sacrificed: true } // 👈 Remembers sacrifice completed!
            }
        };
    }

    // Execute Destroy
    const destPlayer = gameState.players[targetPlayerName];
    if (!destPlayer) {
        return { success: false, reason: `Target player "${targetPlayerName}" not found.` };
    }

    const destStableCards = getStableCards(destPlayer);
    const destTarget = destStableCards.find(c => c && (String(c.id) === String(targetCardId) || c === targetCardId));

    if (!destTarget) {
        return { success: false, reason: "Selected card to destroy not found in target's Stable." };
    }

    const destResult = typeof destroyCard === 'function'
        ? destroyCard(gameState, targetPlayerName, destTarget)
        : sendCardFromStable(gameState, targetPlayerName, targetCardId, 'discard');

    if (destResult && destResult.success === false) {
        return destResult;
    }

    return {
        success: true,
        message: `${playerName} activated Glitter Bomb to sacrifice a card and destroy ${destTarget.name || 'a card'} in ${targetPlayerName}'s Stable!`
    };
}

/**
 * YAY: Passive rule modifier check.
 * Returns true if the player has "Yay" in their Stable/Upgrades,
 * making their played cards immune to Neigh cards.
 */
export function Yay(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    // Check all areas where an Upgrade card could physically reside in a player's area
    const activeCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];

    return activeCards.some(card => {
        if (!card) return false;
        const cardId = String(card.id || '').toLowerCase();
        const cardName = String(card.name || '').toLowerCase();

        return cardId === 'yay' || cardId.startsWith('yay_') || cardName === 'yay';
    });
}

/**
 * RAINBOW AURA: Passive protection check.
 * Returns true if the target player has Rainbow Aura in play and the card being destroyed is a Unicorn.
 */
export function RainbowAura(gameState, targetPlayerName, targetCard) {
    const player = gameState.players ? gameState.players[targetPlayerName] : null;
    if (!player || !targetCard) return false;

    // 1. Check if targetCard is a valid Unicorn (respects Pandamonium and avoids CARD_TYPES ReferenceError)
    const isUnicorn = typeof isUnicornCard === 'function'
        ? isUnicornCard(targetCard, gameState, targetPlayerName)
        : (targetCard.category || targetCard.type || '').toString().toUpperCase().includes('UNICORN');

    if (!isUnicorn) return false;

    // 2. Check if player has Rainbow Aura in Stable, Upgrades, or Downgrades
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];

    return allCards.some(card => card && (card.id === 'rainbow_aura' || card.name === 'Rainbow Aura'));
}

/**
 * RAINBOW MANE
 */
export function RainbowMane(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    const stable = player.stable || [];

    // --- 1. PLAY / ENTRY CONDITION CHECK ---
    if (targetData.isPlayConditionCheck) {
        // Fix: Explicit arrow function prevents array index from corrupting gameState parameter
        const hasBasicInStable = stable.some(c => isBasicUnicorn(c, gameState, playerName));
        if (!hasBasicInStable) {
            return {
                success: false,
                canEnter: false,
                reason: "Rainbow Mane requires at least one Basic Unicorn in your Stable to enter play!"
            };
        }
        return { success: true, canEnter: true };
    }

    // --- 2. BEGINNING OF TURN TRIGGER ---
    const basicUnicornsInHand = (player.hand || []).filter(c => isBasicUnicorn(c, gameState, playerName));

    // Auto-pass safely if no Basic Unicorns in hand
    if (basicUnicornsInHand.length === 0) {
        return { success: true, message: "No Basic Unicorns in hand for Rainbow Mane." };
    }

    // Handle user skipping the optional effect
    if (targetData.skip || targetData.selectedCardIndex === -1 || targetData.cardIndex === -1) {
        return { success: true, message: "Skipped Rainbow Mane effect." };
    }

    // Extract selected card index
    const chosenIndex = targetData.selectedCardIndex !== undefined
        ? targetData.selectedCardIndex
        : targetData.cardIndex;

    // Prompt user to choose or skip
    if (chosenIndex === undefined || chosenIndex === null) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Rainbow Mane: You may bring a Basic Unicorn from your hand directly into your Stable.",
                actionType: 'RAINBOW_MANE_SELECT',
                targetScope: 'MY_HAND',
                optional: true,
                validCards: basicUnicornsInHand,
                contextData: targetData
            }
        };
    }

    // Execute choice resolution
    const chosenCard = player.hand[chosenIndex];
    if (!chosenCard || !isBasicUnicorn(chosenCard, gameState, playerName)) {
        return { success: false, reason: "Selected card is not a valid Basic Unicorn." };
    }

    // Bring directly into play without consuming turn actions
    return bringDirectlyIntoPlay(gameState, playerName, chosenCard, 'hand', playerName);
}

export function SummoningRitual(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 1. Handle PASS / Decline selection (Added 'skip' and 'skipped' for UI safety)
    if (targetData.passed || targetData.declined || targetData.action === 'PASS' || targetData.skip || targetData.skipped) {
        return { success: true, message: `${playerName} chose not to use Summoning Ritual.` };
    }

    const discardsCompleted = targetData.discardsCompleted || (targetData.contextData && targetData.contextData.discardsCompleted);

    // --- STEP 1: Prompt or process discarding 2 Unicorn cards ---
    if (!discardsCompleted) {
        const hand = player.hand || [];
        const unicornHandIndices = hand
            .map((c, idx) => (isUnicorn(c) ? idx : -1))
            .filter(idx => idx !== -1);

        // Auto-pass if player has fewer than 2 Unicorn cards in hand
        if (unicornHandIndices.length < 2) {
            return { success: true, message: "Not enough Unicorn cards in hand to trigger Summoning Ritual." };
        }

        const discardIndices = targetData.discardIndices || targetData.selectedHandIndices;

        if (!discardIndices || !Array.isArray(discardIndices) || discardIndices.length < 2) {
            return {
                requiresChoice: true,
                pendingChoice: {
                    chooser: playerName,
                    prompt: "Summoning Ritual: You may DISCARD 2 Unicorn cards to revive a Unicorn card from the discard pile.",
                    actionType: 'SUMMONING_RITUAL', // 👈 ROUTE BACK TO THIS FUNCTION
                    targetScope: 'MY_HAND',
                    optional: true,
                    requiredCount: 2,
                    validIndices: unicornHandIndices
                }
            };
        }

        // Validate selected indices are Unicorn cards
        const validDiscards = discardIndices.every(idx => player.hand[idx] && isUnicorn(player.hand[idx]));
        if (!validDiscards) {
            return { success: false, reason: "Selected cards must be Unicorns." };
        }

        // Execute discards in descending order to avoid index shifting
        const sortedIndices = [...discardIndices].sort((a, b) => b - a);
        for (const idx of sortedIndices) {
            discardCard(gameState, playerName, idx);
        }
    }

    // --- STEP 2: Prompt or process selecting 1 Unicorn card from Discard Pile ---
    const discardPile = gameState.discardPile || [];
    const unicornDiscardCards = discardPile.filter(isUnicorn);

    if (unicornDiscardCards.length === 0) {
        return { success: true, message: "No Unicorn cards available in the discard pile." };
    }

    const chosenCardId = targetData.targetCardId || targetData.chosenDiscardCardId || targetData.selectedCardId;
    const chosenCard = discardPile.find(c =>
        c && (String(c.id) === String(chosenCardId) || c === chosenCardId || String(c.uuid) === String(chosenCardId))
    );

    if (!chosenCard || !isUnicorn(chosenCard)) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                prompt: "Summoning Ritual: Select a Unicorn card from the discard pile to bring into your Stable.",
                actionType: 'SUMMONING_RITUAL', // 👈 ROUTE BACK TO THIS FUNCTION
                targetScope: 'DISCARD_PILE',
                validCards: unicornDiscardCards,
                contextData: { discardsCompleted: true } // Carry state forward to next resolve call
            }
        };
    }

    // Bring chosen Unicorn directly into Stable and trigger its enters-stable effect
    return bringDirectlyIntoPlay(
        gameState,
        playerName,
        chosenCard,
        'discardPile',
        playerName,
        typeof triggerEntersStable === 'function' ? triggerEntersStable : null
    );
}

/**
 * END OF TURN CLEANUP HELPER
 * Resolves return of temporary lasso'd cards back to their original owners
 * and captures ETB trigger results for the original owner.
 */
export function UnicornLasso(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // 🛑 THE FIX: If the player clicked "Skip" or "No", resolve immediately!
    if (targetData.skipped || targetData.skip) {
        return {
            success: true,
            message: `${playerName} chose not to use Unicorn Lasso.`
        };
    }

    const targetPlayerName = targetData.targetPlayerName || targetData.targetPlayer || targetData.selectedPlayer;
    const targetCardId = targetData.targetCardId || targetData.cardId;

    // ==========================================
    // STEP 1: IF TARGET SELECTED, EXECUTE STEAL
    // ==========================================
    if (targetPlayerName && targetCardId) {
        const targetPlayer = gameState.players[targetPlayerName];
        if (!targetPlayer || !targetPlayer.stable) {
            return { success: false, reason: "Invalid target player." };
        }

        const targetCard = targetPlayer.stable.find(c => c && c.id === targetCardId);
        if (!targetCard) return { success: false, reason: "Target card not found." };

        const checkIsUnicorn = typeof isUnicorn === 'function' ? isUnicorn :
            (c) => c && ['UNICORN', 'BASIC UNICORN', 'MAGICAL UNICORN', 'BABY UNICORN']
                .includes((c.category || c.type || '').toString().toUpperCase());

        if (!checkIsUnicorn(targetCard)) {
            return { success: false, reason: "Target card must be a Unicorn card." };
        }

        const stealResult = stealCard(gameState, targetPlayerName, playerName, targetCard);

        if (stealResult && stealResult.success) {
            gameState.temporaryStolenCards = gameState.temporaryStolenCards || [];
            gameState.temporaryStolenCards.push({
                cardId: targetCard.id,
                stolenFrom: targetPlayerName,
                stolenBy: playerName
            });
        }

        return stealResult;
    }

    // ==========================================
    // STEP 2: NO TARGET YET, ASK FOR ONE
    // ==========================================
    const opponentsWithUnicorns = [];
    const checkIsUnicorn = typeof isUnicorn === 'function' ? isUnicorn :
        (c) => c && ['UNICORN', 'BASIC UNICORN', 'MAGICAL UNICORN', 'BABY UNICORN']
            .includes((c.category || c.type || '').toString().toUpperCase());

    for (const pName of (gameState.playerOrder || [])) {
        if (pName !== playerName) {
            const opp = gameState.players[pName];
            if (opp && Array.isArray(opp.stable) && opp.stable.some(c => checkIsUnicorn(c))) {
                opponentsWithUnicorns.push(pName);
            }
        }
    }

    if (opponentsWithUnicorns.length === 0) {
        return { success: true, message: "No Unicorn cards in opponent Stables to lasso." };
    }

    return {
        requiresChoice: true,
        pendingChoice: {
            chooser: playerName,
            prompt: "Unicorn Lasso: You may STEAL a Unicorn card. It will return to its owner at the end of your turn.",
            actionType: 'UNICORN_LASSO',
            targetScope: 'OPPONENT_STABLE',
            allowedCategories: ['UNICORN', 'BASIC UNICORN', 'MAGICAL UNICORN', 'BABY UNICORN'],
            optional: true,
            validPlayers: opponentsWithUnicorns,
            contextData: targetData
        }
    };
}

// Barbed Wire effect logic
export function BarbedWire(gameState, playerName) {
    const player = gameState.players[playerName];
    if (!player || !player.hand || player.hand.length === 0) {
        return { success: true };
    }

    // Verify Barbed Wire is present in player's stable or upgrades/downgrades
    const allStableCards = [...(player.stable || []), ...(player.upgrades || []), ...(player.downgrades || [])];
    const hasBarbedWire = allStableCards.some(c => c && (
        c.id === 'barbed_wire' ||
        c.name === 'Barbed Wire' ||
        c.name === 'Barbed Stable' ||
        (c.onEnter && c.onEnter.action === 'BARBED_WIRE')
    ));

    if (!hasBarbedWire) {
        return { success: true };
    }

    return {
        success: true,
        requiresChoice: true,
        pendingChoice: {
            chooser: playerName,
            actionType: 'BARBED_WIRE_DISCARD',
            targetScope: 'HAND',
            prompt: 'Barbed Wire effect: Select 1 card from your hand to DISCARD.'
        }
    };
}

// Checks if Blinding Light is present in the player's Stable or Upgrades/Downgrades
export function BlindingLight(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    const allCards = [...(player.stable || []), ...(player.upgrades || [])];
    return allCards.some(c => c && (c.id === 'blinding_light' || c.name === 'Blinding Light'));
}

// Checks if Broken Stable is active in the player's Stable or Upgrades/Downgrades
export function BrokenStable(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    const allCards = [...(player.stable || []), ...(player.upgrades || [])];
    return allCards.some(c => c && (c.id === 'broken_stable' || c.name === 'Broken Stable'));
}

// Checks if Nanny Cam is active in the player's Stable or Upgrades/Downgrades
export function NannyCam(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    // Checks stable, upgrades, and downgrades for Nanny Cam
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];
    return allCards.some(c => c && (c.id === 'nanny_cam' || c.name === 'Nanny Cam'));
}

// Checks if Pandamonium is active in the player's Stable or Upgrades/Downgrades
export function Pandamonium(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    // Search all stable zones including downgrades
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];
    return allCards.some(c => c && (c.id === 'pandamonium' || c.name === 'Pandamonium'));
}

export function SadisticRitual(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    // Checks stable, upgrades, and downgrades for Sadistic Ritual
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];

    return allCards.some(c => c && (c.id === 'sadistic_ritual' || c.name === 'Sadistic Ritual'));
}

// Checks if Sadistic Ritual is active in the player's Stable or Upgrades/Downgrades
export function handleSadisticRitual(gameState, playerName, choiceData = {}, pending = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // --- 1. RESOLVE TARGET BY INDEX OR ID ---
    const chosenIndex = choiceData.selectedCardIndex ?? choiceData.cardIndex;
    const targetCardId = choiceData.targetCardId || choiceData.cardId;

    let selectedCard = null;
    let cardIndexInStable = -1;

    if (chosenIndex !== undefined && player.stable && player.stable[chosenIndex]) {
        cardIndexInStable = chosenIndex;
        selectedCard = player.stable[chosenIndex];
    } else if (targetCardId) {
        cardIndexInStable = (player.stable || []).findIndex(c => c && (c.id === targetCardId || c === targetCardId));
        if (cardIndexInStable !== -1) selectedCard = player.stable[cardIndexInStable];
    }

    if (!selectedCard || cardIndexInStable === -1) {
        return { success: false, reason: "No valid Unicorn selected for Sadistic Ritual." };
    }

    // --- 2. VALIDATE TARGET IS A UNICORN ---
    if (typeof isUnicornCard === 'function' && !isUnicornCard(selectedCard, gameState, playerName)) {
        return { success: false, reason: "Selected card is not a valid Unicorn card to sacrifice." };
    }

    // --- 3. SACRIFICE THE SELECTED UNICORN ---
    if (typeof sacrificeCard === 'function') {
        const sacResult = sacrificeCard(gameState, playerName, selectedCard);
        if (sacResult && !sacResult.success) {
            return sacResult; // Handles cases where card is protected (e.g. Rainbow Aura)
        }
    } else {
        player.stable.splice(cardIndexInStable, 1);
        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(selectedCard);
    }

    // --- 4. DRAW A CARD ---
    if (typeof drawCard === 'function') {
        drawCard(gameState, playerName);
    }

    // Return result and let resolveChoice handle queue progression / phase transition
    return {
        success: true,
        message: `${playerName} sacrificed ${selectedCard.name} to Sadistic Ritual and drew a card.`
    };
}
// Checks if Slowdown is active in the player's Stable/Downgrades
export function Slowdown(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || []) // 👈 Fixed missing array
    ];

    return allCards.some(c => c && (c.id === 'slowdown' || c.name === 'Slowdown'));
}

// Checks if Tiny Stable limit (> 5 Unicorns) is exceeded for a player
export function TinyStable(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return null;

    // Search all stable zones for Tiny Stable
    const allCards = [
        ...(player.stable || []),
        ...(player.upgrades || []),
        ...(player.downgrades || [])
    ];
    const hasTinyStable = allCards.some(c => c && (c.id === 'tiny_stable' || c.name === 'Tiny Stable'));

    if (!hasTinyStable) return null;

    // Filter using isUnicornCard to account for Pandamonium
    const unicornCards = (player.stable || []).filter(c => isUnicornCard(c, gameState, playerName));

    if (unicornCards.length > 5) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'TINY_STABLE_SACRIFICE',
                prompt: 'Tiny Stable: You have more than 5 Unicorns in your Stable! Choose a Unicorn card to SACRIFICE.',
                targetScope: 'MY_STABLE',
                allowedCardIds: unicornCards.map(c => (typeof c === 'object' ? c.id : c))
            }
        };
    }

    return null;
}

export function handleTinyStableSacrifice(gameState, playerName, choiceData = {}, pending = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return { success: false, reason: "Player not found." };

    // --- 1. RESOLVE SELECTED CARD FROM STABLE ---
    const chosenIndex = choiceData.selectedCardIndex ?? choiceData.cardIndex;
    const targetCardId = choiceData.targetCardId || choiceData.cardId;

    let selectedCard = null;
    let cardIndexInStable = -1;

    if (chosenIndex !== undefined && player.stable && player.stable[chosenIndex]) {
        cardIndexInStable = chosenIndex;
        selectedCard = player.stable[chosenIndex];
    } else if (targetCardId) {
        cardIndexInStable = (player.stable || []).findIndex(c => c && (c.id === targetCardId || c === targetCardId));
        if (cardIndexInStable !== -1) selectedCard = player.stable[cardIndexInStable];
    }

    if (!selectedCard || cardIndexInStable === -1) {
        return { success: false, reason: "No valid Unicorn selected for Tiny Stable sacrifice." };
    }

    // --- 2. SACRIFICE THE SELECTED UNICORN ---
    if (typeof sacrificeCard === 'function') {
        const sacResult = sacrificeCard(gameState, playerName, selectedCard);
        if (sacResult && !sacResult.success) {
            return sacResult; // Returns protection error if card is protected
        }
    } else {
        player.stable.splice(cardIndexInStable, 1);
        gameState.discardPile = gameState.discardPile || [];
        gameState.discardPile.push(selectedCard);
    }

    // --- 3. RE-CHECK TINY STABLE (> 5 UNICORNS LOOP) ---
    const recheck = TinyStable(gameState, playerName);
    if (recheck && recheck.requiresChoice) {
        return {
            success: true,
            requiresChoice: true,
            pendingChoice: recheck.pendingChoice,
            message: `${playerName} sacrificed ${selectedCard.name}. You still have more than 5 Unicorns!`
        };
    }

    return {
        success: true,
        message: `${playerName} sacrificed ${selectedCard.name} to satisfy Tiny Stable.`
    };
}

// Checks if Ginormous Unicorn is active in the player's Stable
export function GinormousUnicorn(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return false;

    return (player.stable || []).some(c => c && (c.id === 'ginormous_unicorn' || c.name === 'Ginormous Unicorn'));
}

/**
 * RE-TARGET: Moves an Upgrade or Downgrade card from any player's Stable to any other player's Stable.
 */
export function ReTarget(gameState, playerName, targetData = {}) {
    // Normalize targetData parameters from multi-step choice triggers
    const context = targetData.contextData || {};
    const cardId = targetData.cardId || targetData.targetCardId || context.cardId;
    const sourcePlayerName = targetData.sourcePlayerName || targetData.sourcePlayer || context.sourcePlayerName;
    const targetPlayerName = targetData.targetPlayerName || targetData.selectedPlayer || targetData.targetPlayer;

    // STEP 1: PROMPT FOR AN UPGRADE OR DOWNGRADE CARD IN PLAY
    if (!cardId || !sourcePlayerName) {
        const selectableCards = [];

        for (const pName of (gameState.playerOrder || Object.keys(gameState.players || {}))) {
            const p = gameState.players[pName];
            if (!p) continue;

            const cardsInArea = [
                ...(p.upgrades || []),
                ...(p.downgrades || []),
                ...(p.stable || [])
            ];

            cardsInArea.forEach(c => {
                if (!c) return;
                const cat = (c.category || c.type || '').toString().toUpperCase();
                if (cat.includes('UPGRADE') || cat.includes('DOWNGRADE')) {
                    selectableCards.push({ cardId: c.id, card: c, owner: pName, name: c.name });
                }
            });
        }

        if (selectableCards.length === 0) {
            return { success: false, reason: "No Upgrade or Downgrade cards in play to re-target." };
        }

        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'RE_TARGET_SELECT_CARD',
                prompt: 'Choose an Upgrade or Downgrade card to move.',
                targetScope: 'ALL_STABLES_MODIFIERS',
                validCards: selectableCards
            }
        };
    }

    // STEP 2: PROMPT FOR DESTINATION PLAYER
    if (!targetPlayerName) {
        return {
            requiresChoice: true,
            pendingChoice: {
                chooser: playerName,
                actionType: 'RE_TARGET_SELECT_PLAYER',
                prompt: 'Choose a player to move the card to.',
                targetScope: 'ALL_PLAYERS',
                contextData: { cardId, sourcePlayerName }
            }
        };
    }

    // STEP 3: EXECUTE CARD MOVE
    const sourcePlayer = gameState.players[sourcePlayerName];
    const destPlayer = gameState.players[targetPlayerName];

    if (!sourcePlayer || !destPlayer) {
        return { success: false, reason: "Invalid player selection." };
    }

    // Locate card across upgrades, downgrades, and stable
    let sourceArray = null;
    let cardIndex = -1;

    if (sourcePlayer.upgrades) {
        cardIndex = sourcePlayer.upgrades.findIndex(c => c && (c.id === cardId || c === cardId));
        if (cardIndex !== -1) sourceArray = sourcePlayer.upgrades;
    }

    if (cardIndex === -1 && sourcePlayer.downgrades) {
        cardIndex = sourcePlayer.downgrades.findIndex(c => c && (c.id === cardId || c === cardId));
        if (cardIndex !== -1) sourceArray = sourcePlayer.downgrades;
    }

    if (cardIndex === -1 && sourcePlayer.stable) {
        cardIndex = sourcePlayer.stable.findIndex(c => c && (c.id === cardId || c === cardId));
        if (cardIndex !== -1) sourceArray = sourcePlayer.stable;
    }

    if (cardIndex === -1 || !sourceArray) {
        return { success: false, reason: "Card not found in source player's Stable." };
    }

    const movedCard = sourceArray[cardIndex];
    const category = (movedCard.category || movedCard.type || '').toString().toUpperCase();
    const isDowngrade = category.includes('DOWNGRADE');

    // Check Broken Stable restriction before moving Upgrades
    if (!isDowngrade && typeof BrokenStable === 'function' && BrokenStable(gameState, targetPlayerName)) {
        return { success: false, reason: `${targetPlayerName} cannot receive Upgrade cards due to Broken Stable!` };
    }

    // Perform move
    sourceArray.splice(cardIndex, 1);

    if (isDowngrade) {
        destPlayer.downgrades = destPlayer.downgrades || [];
        destPlayer.downgrades.push(movedCard);
    } else {
        destPlayer.upgrades = destPlayer.upgrades || [];
        destPlayer.upgrades.push(movedCard);
    }

    return {
        success: true,
        message: `${playerName} moved ${movedCard.name} from ${sourcePlayerName}'s Stable to ${targetPlayerName}'s Stable!`
    };
}

/**
 * RHINOCORN: Beginning of turn check.
 * Allows the player to optionally DESTROY a Unicorn card.
 * If destroyed, immediately skips to the End of Turn phase.
 */
export function Rhinocorn(gameState, playerName) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player) return null;

    const hasRhinocorn = (player.stable || []).some(c => c && (c.id === 'rhinocorn' || c.name === 'Rhinocorn'));
    if (!hasRhinocorn) return null;

    // Collect all valid Unicorn cards in play across all player stables
    const validTargets = [];
    for (const pName of (gameState.playerOrder || Object.keys(gameState.players))) {
        const p = gameState.players[pName];
        if (!p) continue;

        (p.stable || []).forEach(card => {
            if (card && typeof isUnicornCard === 'function' && isUnicornCard(card, gameState, pName)) {
                validTargets.push({ cardId: card.id, card: card, owner: pName });
            }
        });
    }

    if (validTargets.length === 0) return null;

    return {
        requiresChoice: true,
        pendingChoice: {
            chooser: playerName,
            actionType: 'RHINOCORN',
            prompt: 'Rhinocorn: You may DESTROY a Unicorn card. If you do, immediately skip to your End of Turn phase.',
            optional: true,
            targetScope: 'ALL_STABLES_UNICORNS',
            validTargets: validTargets, // 👈 Included valid options for UI
            previousPhase: 'DRAW' // 👈 Next phase if player skips
        }
    };
}

export function handleRhinocorn(gameState, playerName, choiceData = {}, pending = {}) {
    // If player skips optional effect, proceed to Draw phase
    if (choiceData.skipped || choiceData.skip) {
        gameState.currentPhase = 'DRAW';
        gameState.phase = 'DRAW';
        return { success: true, message: `${playerName} declined Rhinocorn effect.` };
    }

    const targetCardId = choiceData.targetCardId || choiceData.cardId;
    const targetOwner = choiceData.owner || choiceData.targetPlayerName;

    if (!targetCardId || !targetOwner) {
        return { success: false, reason: "Invalid target selection for Rhinocorn." };
    }

    // Execute destruction
    const destroyResult = typeof destroyCard === 'function'
        ? destroyCard(gameState, playerName, targetCardId, targetOwner)
        : { success: false, reason: "destroyCard function missing." };

    if (destroyResult && destroyResult.success) {
        // Skip directly to End of Turn Phase
        gameState.currentPhase = 'END_OF_TURN';
        gameState.phase = 'END_OF_TURN';
        return {
            success: true,
            message: `${playerName} destroyed a Unicorn using Rhinocorn and skipped directly to their End of Turn phase!`
        };
    }

    return destroyResult || { success: false, reason: "Failed to destroy target Unicorn." };
}

/**
 * QUEEN BEE UNICORN: Checks whether a Basic Unicorn card is prevented 
 * from entering targetPlayerName's Stable.
 * Returns true if the placement is blocked.
 */
export function QueenBeeUnicorn(gameState, targetPlayerName, card) {
    if (!card) return false;

    // 1. Safely check if the card is a Basic Unicorn (case-insensitive)
    const cat = (card.category || card.type || '').toString().toUpperCase();
    const isBasicUnicorn = cat.includes('BASIC');

    if (!isBasicUnicorn) return false;

    // 2. Check if any OPPONENT has Queen Bee Unicorn in their Stable
    for (const pName of (gameState.playerOrder || Object.keys(gameState.players || {}))) {
        if (pName === targetPlayerName) continue; // Skip target player (their own Queen Bee doesn't block them)

        const player = gameState.players ? gameState.players[pName] : null;
        if (!player) continue;

        const hasQueenBee = (player.stable || []).some(c =>
            c && (c.id === 'queen_bee_unicorn' || c.name === 'Queen Bee Unicorn')
        );

        if (hasQueenBee) {
            return true; // Placement is blocked
        }
    }

    return false;
}