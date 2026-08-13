// public/playerHand.js

let myHand = [];
let isMyTurn = false;
let currentPhase = 'WAITING'; // 'BEGINNING', 'DRAW', 'ACTION', 'END'

/**
 * Renders the bottom hand area and turn controls container
 */
function setupHandUI() {
    if (document.getElementById('player-hand-container')) return;

    const gameScreen = document.getElementById('game-screen');
    const handContainer = document.createElement('div');
    handContainer.id = 'player-hand-container';
    handContainer.className = 'hand-bar';

    handContainer.innerHTML = `
    <div class="turn-status-banner" id="turn-banner">Waiting for turn...</div>
    <div class="hand-controls" id="hand-controls">
      <button id="draw-phase-btn" class="action-btn" onclick="takeDrawAction()" disabled>Draw Card 🃏</button>
      <button id="pass-turn-btn" class="action-btn secondary" onclick="passTurn()" disabled>End Turn ⏭️</button>
    </div>
    <div class="cards-in-hand" id="cards-in-hand"></div>
  `;

    gameScreen.appendChild(handContainer);
}

/**
 * Updates the local hand UI based on server updates
 */
function updateHandDisplay(handArray) {
    myHand = handArray;
    const cardsContainer = document.getElementById('cards-in-hand');
    if (!cardsContainer) return;

    cardsContainer.innerHTML = "";

    if (myHand.length === 0) {
        cardsContainer.innerHTML = `<span style="color: #94a3b8;">Your hand is empty</span>`;
        return;
    }

    myHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `hand-card ${isMyTurn && currentPhase === 'ACTION' ? 'playable' : ''}`;
        cardElement.onclick = () => playCardFromHand(index);

        const imagePath = `image/${encodeURIComponent(card.category)}/${encodeURIComponent(card.file)}`;
        cardElement.innerHTML = `
      <img src="${imagePath}" alt="${card.name}" onerror="this.src='https://via.placeholder.com/60x84?text=Card';" />
    `;
        cardsContainer.appendChild(cardElement);
    });
}

/**
 * Updates UI banners and enables buttons based on turn state from server
 */
function handleTurnStateUpdate(data) {
    isMyTurn = (data.activePlayer === myPlayerName);
    currentPhase = data.phase;

    const banner = document.getElementById('turn-banner');
    const drawBtn = document.getElementById('draw-phase-btn');
    const passBtn = document.getElementById('pass-turn-btn');

    if (!banner) return;

    if (isMyTurn) {
        banner.innerText = `⭐ YOUR TURN — Phase: ${currentPhase}`;
        banner.classList.add('active-turn');

        drawBtn.disabled = (currentPhase !== 'DRAW' && currentPhase !== 'ACTION');
        passBtn.disabled = (currentPhase !== 'ACTION' && currentPhase !== 'END');
    } else {
        banner.innerText = `⏳ ${data.activePlayer}'s Turn`;
        banner.classList.remove('active-turn');

        drawBtn.disabled = true;
        passBtn.disabled = true;
    }

    updateHandDisplay(myHand);
}

/**
 * Action triggered when player clicks "Draw Card"
 */
function takeDrawAction() {
    if (!isMyTurn || !socket) return;
    socket.send(JSON.stringify({
        type: 'turn_action',
        action: 'draw_card'
    }));
}

/**
 * Action triggered when player clicks a card in hand
 */
function playCardFromHand(cardIndex) {
    if (!isMyTurn || currentPhase !== 'ACTION' || !socket) return;

    const selectedCard = myHand[cardIndex];
    socket.send(JSON.stringify({
        type: 'turn_action',
        action: 'play_card',
        cardIndex: cardIndex,
        card: selectedCard
    }));
}

/**
 * Action triggered when player passes/ends turn
 */
function passTurn() {
    if (!isMyTurn || !socket) return;
    socket.send(JSON.stringify({
        type: 'turn_action',
        action: 'end_turn'
    }));
}