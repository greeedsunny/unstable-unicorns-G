// public/gameBoard.js

// Local state for game board items
let discardPileData = ["Panda Unicorn", "Stabby Unicorn", "Glitched Baby"];

/**
 * Transition from the Lobby screen to the Game Board screen
 */
function switchToGame(data) {
    document.getElementById('lobby-screen').style.display = "none";
    document.getElementById('game-screen').style.display = "flex";
    generateStables(data.players);
}

/**
 * Dynamically builds horizontal stables for each connected player
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
          <div class="card-row">
            <div class="card-placeholder">1</div>
            <div class="card-placeholder">2</div>
          </div>
        </div>
        <div class="stable-section">
          <div class="row-label">Upgrades / Downgrades</div>
          <div class="card-row">
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
 * Discard Pile Modal Controls
 */
function showDiscardPile() {
    document.getElementById('discard-modal').style.display = "flex";
    const list = document.getElementById('modal-card-list');
    list.innerHTML = "";

    discardPileData.forEach((cardName, index) => {
        const li = document.createElement('li');
        li.className = 'modal-card';
        li.style.borderTopColor = `hsl(${index * 50}, 70%, 55%)`;
        li.innerHTML = `<strong>#${index + 1}</strong> <span>${cardName}</span>`;
        list.appendChild(li);
    });
}

function closeModal() {
    document.getElementById('discard-modal').style.display = "none";
}

/**
 * Helper to dynamically update central pile counts
 */
function updatePileCounts(nursery, draw, discard) {
    if (nursery !== undefined) document.getElementById('nursery-count').innerText = nursery;
    if (draw !== undefined) document.getElementById('draw-count').innerText = draw;
    if (discard !== undefined) document.getElementById('discard-count').innerText = discard;
}