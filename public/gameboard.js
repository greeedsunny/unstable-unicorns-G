// public/gameboard.js

/**
 * Updates the pile counter badges at the top
 */
function updatePileCounts(nurseryCount, drawCount, discardCount) {
    const nurseryEl = document.getElementById('nursery-count');
    const drawEl = document.getElementById('draw-count');
    const discardEl = document.getElementById('discard-count');

    if (nurseryEl) nurseryEl.innerText = nurseryCount;
    if (drawEl) drawEl.innerText = drawCount;
    if (discardEl) discardEl.innerText = discardCount;
}

/**
 * Helper to build visual card elements
 */
function createCardElement(category, fileName, cardName) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-item';
    cardDiv.style.cssText = `
    width: 70px;
    height: 100px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;
    font-size: 0.75rem;
    text-align: center;
  `;

    if (fileName) {
        const img = document.createElement('img');
        img.src = `images/${fileName}`;
        img.alt = cardName;
        img.style.cssText = "width:100%; height:100%; object-fit:cover; border-radius:6px;";
        cardDiv.appendChild(img);
    } else {
        cardDiv.innerText = cardName;
    }

    return cardDiv;
}

/**
 * Switches screen from Lobby to Game and initializes HTML layout
 */
function switchToGame(data) {
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    if (data.gameState && data.gameState.playerOrder) {
        setupStablesContainers(data.gameState.playerOrder);
        renderBoardState(data.gameState);
    }
}

/**
 * Dynamically builds the HTML Stable boxes for every player in the room
 */
function setupStablesContainers(playerOrder) {
    const stablesContainer = document.getElementById('player-stables');
    if (!stablesContainer) return;

    stablesContainer.innerHTML = ''; // Clear existing layout

    playerOrder.forEach(playerName => {
        const playerBox = document.createElement('div');
        playerBox.className = 'player-stable-box';
        playerBox.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

        playerBox.innerHTML = `
      <div style="background:#2563eb; color:white; display:inline-block; padding:4px 12px; border-radius:12px; font-weight:bold; margin-bottom:12px;">
        ${playerName}'s Stable
      </div>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 2; min-width: 200px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px;">
          <small style="color: #64748b; font-weight: bold;">UNICORNS (MAX 7)</small>
          <div id="unicorns-${playerName}" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; min-height: 100px;"></div>
        </div>
        <div style="flex: 1; min-width: 150px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px;">
          <small style="color: #64748b; font-weight: bold;">UPGRADES / DOWNGRADES</small>
          <div id="upgrades-${playerName}" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; min-height: 100px;"></div>
        </div>
      </div>
    `;

        stablesContainer.appendChild(playerBox);
    });
}

/**
 * Populates cards into the generated stable elements
 */
function renderBoardState(gameState) {
    if (!gameState) return;

    // 1. Update pile counts
    updatePileCounts(
        gameState.nursery ? gameState.nursery.length : 0,
        gameState.drawPile ? gameState.drawPile.length : 0,
        gameState.discardPile ? gameState.discardPile.length : 0
    );

    // 2. Ensure container boxes exist
    const stablesContainer = document.getElementById('player-stables');
    if (stablesContainer && stablesContainer.children.length === 0 && gameState.playerOrder) {
        setupStablesContainers(gameState.playerOrder);
    }

    // 3. Render cards for each player
    gameState.playerOrder.forEach(playerName => {
        const player = gameState.players[playerName];
        if (!player) return;

        const unicornsContainer = document.getElementById(`unicorns-${playerName}`);
        const upgradesContainer = document.getElementById(`upgrades-${playerName}`);

        if (unicornsContainer) {
            unicornsContainer.innerHTML = '';
            if (player.stable && player.stable.length > 0) {
                player.stable.forEach(card => {
                    const cardEl = createCardElement(card.category, card.file, card.name);
                    unicornsContainer.appendChild(cardEl);
                });
            } else {
                unicornsContainer.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem; align-self:center;">Empty Stable</span>';
            }
        }

        if (upgradesContainer) {
            upgradesContainer.innerHTML = '';
            if (player.upgrades && player.upgrades.length > 0) {
                player.upgrades.forEach(card => {
                    const cardEl = createCardElement(card.category, card.file, card.name);
                    upgradesContainer.appendChild(cardEl);
                });
            }
        }
    });
}