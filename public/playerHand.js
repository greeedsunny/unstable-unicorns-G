// public/playerHand.js

/**
 * Helper to identify Unicorn cards globally
 */
window.isUnicornCard = function (card, gameState = null, ownerName = null) {
    if (!card) return false;
    const cat = (card.category || card.type || '').toString().toUpperCase();
    return cat.includes('UNICORN') || card.isUnicorn === true;
};

/**
 * Helper to identify Baby Unicorn cards globally
 */
window.isBabyCard = function (card, gameState = null, ownerName = null) {
    if (!card) return false;
    if (typeof window.isUnicornCard === 'function' && !window.isUnicornCard(card, gameState, ownerName)) {
        return false;
    }

    const cat = (card.category || card.type || '').toString().toUpperCase();
    return cat.includes('BABY') || card.isBaby === true;
};

let myHand = [];
let isMyTurn = false;
let currentPhase = 'WAITING';

/**
 * Checks if WebSocket is actively open before sending messages
 */
function isSocketReady() {
    if (typeof socket === 'undefined' || !socket || socket.readyState !== WebSocket.OPEN) {
        alert("⚠️ Connection to the game server was lost! Please refresh the page to reconnect.");
        return false;
    }
    return true;
}

/**
 * Creates the bottom hand bar if it doesn't exist yet
 */
function setupHandUI() {
    if (document.getElementById('player-hand-container')) return;

    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;

    const handContainer = document.createElement('div');
    handContainer.id = 'player-hand-container';
    handContainer.className = 'hand-bar';

    handContainer.innerHTML = `
        <div class="turn-status-banner" id="turn-banner">Waiting for game to start...</div>
        <div class="hand-controls" id="hand-controls" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;">
            <button id="draw-card-btn" class="action-btn primary" onclick="drawCardAction()" disabled>Draw Card 🃏</button>
        </div>
        <div class="cards-in-hand" id="cards-in-hand"></div>
    `;

    gameScreen.appendChild(handContainer);
}

/**
 * Updates the local hand UI & renders card elements
 */
function renderPlayerHand(handArray) {
    setupHandUI();

    myHand = handArray || [];
    const cardsContainer = document.getElementById('cards-in-hand');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = "";

    if (myHand.length === 0) {
        cardsContainer.innerHTML = `<span style="color: #94a3b8; font-style: italic;">Your hand is empty</span>`;
        return;
    }

    const localPlayer = window.myPlayerName || (typeof myPlayerName !== 'undefined' ? myPlayerName : '');
    const pendingChoice = (typeof latestGameState !== 'undefined' && latestGameState) ? latestGameState.pendingChoice : null;

    const isHandTargeting = pendingChoice &&
        (pendingChoice.chooser === localPlayer || (Array.isArray(pendingChoice.choosers) && pendingChoice.choosers.includes(localPlayer))) &&
        (
            pendingChoice.targetScope === 'MY_HAND' ||
            pendingChoice.targetScope === 'HAND' ||
            pendingChoice.targetScope === 'DISCARD_HAND' ||
            pendingChoice.actionType === 'BARBED_WIRE_DISCARD' ||
            pendingChoice.actionType === 'BARBED_WIRE'
        );

    const isNeighInterrupt = pendingChoice && pendingChoice.actionType === 'NEIGH_INTERRUPT' && (
        pendingChoice.chooser === localPlayer || (Array.isArray(pendingChoice.choosers) && pendingChoice.choosers.includes(localPlayer))
    );

    myHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        const isPlayable = isMyTurn && currentPhase === 'ACTION' && !pendingChoice;

        let isCardSelectable = false;

        if (isHandTargeting) {
            let categoryMatch = true;
            if (pendingChoice.allowedCategories && pendingChoice.allowedCategories.length > 0) {
                categoryMatch = pendingChoice.allowedCategories.includes(card.category) ||
                    pendingChoice.allowedCategories.includes(card.type);
            }

            let optionsMatch = true;
            if (pendingChoice.options && Array.isArray(pendingChoice.options) && pendingChoice.options.length > 0) {
                optionsMatch = pendingChoice.options.some(opt => {
                    const optId = (typeof opt === 'object' && opt !== null) ? opt.id : opt;
                    return optId && card && (optId === card.id || optId === card);
                });
            }

            isCardSelectable = categoryMatch && optionsMatch;
        }

        const isNeighCard = isNeighInterrupt && card && (
            card.name === "Neigh" || card.id === "neigh" ||
            card.name === "Super Neigh" || card.id === "super_neigh" ||
            card.category === 'INSTANT' || card.category === 'Instant Card'
        );

        cardElement.className = `hand-card ${isPlayable ? 'playable' : ''} ${(isCardSelectable || isNeighCard) ? 'selectable-target' : ''}`;

        if (isCardSelectable) {
            cardElement.style.border = '3px solid #ef4444';
            cardElement.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.8)';
            cardElement.style.cursor = 'pointer';
            cardElement.onclick = () => selectCardFromHand(index);
        } else if (isNeighCard) {
            const isSuper = card.name === "Super Neigh" || card.id === "super_neigh";
            cardElement.style.border = isSuper ? '3px solid #7c3aed' : '3px solid #dc2626';
            cardElement.style.boxShadow = isSuper ? '0 0 12px rgba(124, 58, 237, 0.8)' : '0 0 12px rgba(220, 38, 38, 0.8)';
            cardElement.style.cursor = 'pointer';
            cardElement.onclick = () => respondNeigh(true, index, card.id);
        } else {
            cardElement.onclick = () => playCardFromHand(index);
        }

        cardElement.onmouseenter = (e) => typeof showCardTooltip === 'function' && showCardTooltip(e, card);
        cardElement.onmousemove = (e) => typeof moveCardTooltip === 'function' && moveCardTooltip(e);
        cardElement.onmouseleave = () => typeof hideCardTooltip === 'function' && hideCardTooltip();

        const fileName = card ? (card.file || card.fileName || '') : '';
        const category = card ? (card.category || '') : '';

        const imagePath = typeof getCardImagePath === 'function' && card
            ? getCardImagePath(category, fileName)
            : `image/${category}/${fileName}`;

        // FIX: Reliable placehold.co fallback URL instead of via.placeholder.com
        cardElement.innerHTML = `
            <img src="${imagePath}" alt="${card ? (card.name || 'Card') : 'Card'}" onerror="this.onerror=null; this.src='https://placehold.co/60x84?text=Card';" style="pointer-events: none;" />
        `;
        cardsContainer.appendChild(cardElement);
    });
}

const updateHandDisplay = renderPlayerHand;

/**
 * Updates UI banners and enables buttons based on turn state from server
 */
function handleTurnStateUpdate(gameState) {
    setupHandUI();
    if (!gameState) return;

    if (typeof window !== 'undefined') {
        window.latestGameState = gameState;
    }
    latestGameState = gameState;

    const localPlayer = window.myPlayerName || (typeof myPlayerName !== 'undefined' ? myPlayerName : '');
    const activePlayer = gameState.currentTurn || gameState.currentPlayer || gameState.currentTurnPlayer;

    isMyTurn = (activePlayer === localPlayer);
    currentPhase = gameState.phase || 'WAITING';

    const banner = document.getElementById('turn-banner');
    const drawBtn = document.getElementById('draw-card-btn');
    const controlsContainer = document.getElementById('hand-controls');

    if (!banner) return;

    const pendingChoice = gameState.pendingChoice;

    if (pendingChoice) {
        if (drawBtn) drawBtn.disabled = true;

        const isMyChoice = pendingChoice.chooser === localPlayer ||
            (Array.isArray(pendingChoice.choosers) && pendingChoice.choosers.includes(localPlayer));

        if (isMyChoice) {
            if (pendingChoice.actionType === 'NEIGH_INTERRUPT' && pendingChoice.cardPlayed) {
                const card = pendingChoice.cardPlayed;
                const origPlayer = pendingChoice.originalPlayer || 'A player';
                const cardLinkHtml = `<span onmouseenter="showCardTooltip(event, latestGameState.pendingChoice.cardPlayed)" onmousemove="moveCardTooltip(event)" onmouseleave="hideCardTooltip()" style="color: #7c3aed; text-decoration: underline; font-weight: bold; cursor: pointer; padding: 0 2px;">${card.name}</span>`;

                if (pendingChoice.lastNeighPlayer) {
                    banner.innerHTML = `🎯 YOUR CHOICE: ${pendingChoice.lastNeighPlayer} played NEIGH on ${cardLinkHtml}! Do you want to play NEIGH to stop it?`;
                } else {
                    banner.innerHTML = `🎯 YOUR CHOICE: ${origPlayer} is playing ${cardLinkHtml}! Do you want to play NEIGH to stop it?`;
                }
            } else {
                banner.innerHTML = `🎯 YOUR CHOICE: ${pendingChoice.prompt || 'Select a card'}`;
            }

            banner.classList.add('active-turn');

            let actionBtnContainer = document.getElementById('neigh-buttons-container');
            if (!actionBtnContainer && (pendingChoice.actionType === 'NEIGH_INTERRUPT' || pendingChoice.optional)) {
                actionBtnContainer = document.createElement('div');
                actionBtnContainer.id = 'neigh-buttons-container';
                actionBtnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 6px; justify-content: center; flex-wrap: wrap;';
                controlsContainer.appendChild(actionBtnContainer);
            }

            if (actionBtnContainer) {
                if (pendingChoice.actionType === 'NEIGH_INTERRUPT') {
                    actionBtnContainer.innerHTML = `<button onclick="respondNeigh(false)" style="padding: 8px 16px; background: #64748b; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Pass / Don't Neigh ⏩</button>`;
                } else if (pendingChoice.optional) {
                    actionBtnContainer.innerHTML = `<button onclick="skipChoice()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Pass / Skip ⏭️</button>`;
                }
            }
        } else {
            const oldBtns = document.getElementById('neigh-buttons-container');
            if (oldBtns) oldBtns.remove();

            if (pendingChoice.actionType === 'NEIGH_INTERRUPT' && pendingChoice.responses && pendingChoice.responses[localPlayer]) {
                banner.innerText = `⏳ Responded. Waiting for other players with Neigh...`;
            } else {
                banner.innerText = `⏳ Waiting for choice...`;
            }
            banner.classList.remove('active-turn');
        }
    } else {
        const oldNeighBtns = document.getElementById('neigh-buttons-container');
        if (oldNeighBtns) oldNeighBtns.remove();

        if (isMyTurn) {
            if (currentPhase === 'ACTION') {
                banner.innerText = `⭐ YOUR TURN — Play a card or Draw a card 🃏`;
                banner.classList.add('active-turn');
                if (drawBtn) drawBtn.disabled = false;
            } else {
                banner.innerText = `⏳ Ending turn...`;
                banner.classList.add('active-turn');
                if (drawBtn) drawBtn.disabled = true;
            }
        } else {
            banner.innerText = `⏳ ${activePlayer}'s Turn`;
            banner.classList.remove('active-turn');
            if (drawBtn) drawBtn.disabled = true;
        }
    }

    if ((!myHand || myHand.length === 0) && gameState.players && gameState.players[localPlayer]) {
        myHand = gameState.players[localPlayer].hand || [];
    }

    renderPlayerHand(myHand);
}

/**
 * Action triggered when player clicks "Draw Card 🃏"
 */
function drawCardAction() {
    if (!isMyTurn || currentPhase !== 'ACTION' || (typeof latestGameState !== 'undefined' && latestGameState && latestGameState.pendingChoice)) return;
    if (!isSocketReady()) return;

    socket.send(JSON.stringify({
        type: 'draw_card'
    }));
}

/**
 * Action triggered when selecting a card from hand for choice resolution
 */
function selectCardFromHand(cardIndex) {
    if (!isSocketReady()) return;

    const selectedCard = myHand[cardIndex];
    const targetCardId = selectedCard ? (selectedCard.id || selectedCard) : null;

    socket.send(JSON.stringify({
        type: 'resolve_choice',
        cardIndexToDiscard: cardIndex,
        targetCardId: targetCardId
    }));
}

/**
 * Action triggered when player clicks a card in hand to play normally
 */
function playCardFromHand(cardIndex) {
    if (!isMyTurn || currentPhase !== 'ACTION' || (typeof latestGameState !== 'undefined' && latestGameState && latestGameState.pendingChoice)) return;
    if (!isSocketReady()) return;

    socket.send(JSON.stringify({
        type: 'play_card',
        cardIndex: cardIndex
    }));
}

/**
 * Action triggered when player clicks "End Turn ⏭️"
 */
function passTurn() {
    if (!isMyTurn || (typeof latestGameState !== 'undefined' && latestGameState && latestGameState.pendingChoice)) return;
    if (!isSocketReady()) return;

    socket.send(JSON.stringify({
        type: 'end_turn'
    }));
}

/**
 * Sends Neigh decision back to server with optional card targeting
 */
function respondNeigh(useNeigh, cardIndex = null, cardId = null) {
    if (!isSocketReady()) return;

    const container = document.getElementById('neigh-buttons-container');
    if (container) {
        const btns = container.querySelectorAll('button');
        btns.forEach(b => b.disabled = true);
    }

    const payload = {
        type: 'resolve_choice',
        useNeigh: useNeigh,
        action: useNeigh ? 'PLAY' : 'PASS'
    };
    if (cardIndex !== null && cardIndex !== undefined) payload.cardIndex = cardIndex;
    if (cardId) payload.cardId = cardId;

    socket.send(JSON.stringify(payload));
}