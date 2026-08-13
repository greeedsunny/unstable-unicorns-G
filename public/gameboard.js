// public/gameboard.js

let discardPileData = [];

/**
 * Helper function to create HTML for a card image
 * Example folder categories: 'Baby Unicorn', 'Basic Unicorn', 'Upgrade Card', etc.
 */
function createCardElement(category, filename, title = "") {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-item';

    // URL encoded path for folder names with spaces
    const imagePath = `image/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;

    cardDiv.innerHTML = `
    <img src="${imagePath}" alt="${title || filename}" onerror="this.src='https://via.placeholder.com/60x84?text=Card';" />
  `;
    return cardDiv;
}

/**
 * Transition from Lobby to Game Board
 */
function switchToGame(data) {
    document.getElementById('lobby-screen').style.display = "none";
    document.getElementById('game-screen').style.display = "flex";
    generateStables(data.players);
}

/**
 * Dynamically builds horizontal stables for connected players
 */
function generateStables(playersArray) {
    const stablesContainer = document.getElementById('player-stables');
    stablesContainer.innerHTML = "";

    playersArray.forEach((name) => {
        const stableDiv = document.createElement('div');
        stableDiv.className = 'stable';
        stableDiv.innerHTML = `
      <div class="stable-header">
        <h4>${name}'s Stable</h4>
      </div>
      <div class="stable-contents">
        <div class="stable-section">
          <div class="row-label">Unicorns (Max 7)</div>
          <div class="card-row" id="unicorns-${name}">
            <div class="card-placeholder">1</div>
            <div class="card-placeholder">2</div>
          </div>
        </div>
        <div class="stable-section">
          <div class="row-label">Upgrades / Downgrades</div>
          <div class="card-row" id="upgrades-${name}">
            <div class="card-placeholder">UP</div>
            <div class="card-placeholder">DOWN</div>
          </div>
        </div>
      </div>
    `;
        stablesContainer.appendChild(stableDiv);
    });
}

/**
 * Trash Can / Discard Modal Controls
 */
function showDiscardPile() {
    document.getElementById('discard-modal').style.display = "flex";
    const list = document.getElementById('modal-card-list');
    list.innerHTML = "";

    if (discardPileData.length === 0) {
        list.innerHTML = "<p style='color:#888;'>The discard pile is empty!</p>";
        return;
    }

    discardPileData.forEach((card, index) => {
        const li = document.createElement('li');
        li.className = 'modal-card';
        li.style.borderTopColor = `hsl(${index * 50}, 70%, 55%)`;
        li.innerHTML = `<strong>#${index + 1}</strong> <span>${card.name}</span>`;
        list.appendChild(li);
    });
}

function closeModal() {
    document.getElementById('discard-modal').style.display = "none";
}

/**
 * Updates central deck counts dynamically
 */
function updatePileCounts(nursery = 0, draw = 0, discard = 0) {
    document.getElementById('nursery-count').innerText = nursery;
    document.getElementById('draw-count').innerText = draw;
    document.getElementById('discard-count').innerText = discard;
}