// public/gameboard.js

let latestGameState = null;

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
 * Helper to construct the correct image path considering category subfolders
 */
function getCardImagePath(category, fileName) {
    if (!fileName) return '';

    let cleanFile = fileName.replace(/^\/?(images?\/)?/, '');
    if (cleanFile.includes('/')) {
        return `image/${cleanFile}`;
    }

    const folderMap = {
        'BABY': 'Baby Unicorn',
        'Baby Unicorns': 'Baby Unicorn',
        'Baby Unicorn': 'Baby Unicorn',
        'BASIC': 'Basic Unicorn',
        'Basic Unicorns': 'Basic Unicorn',
        'Basic Unicorn': 'Basic Unicorn',
        'MAGICAL': 'Magical Unicorn',
        'Magical Unicorns': 'Magical Unicorn',
        'Magical Unicorn': 'Magical Unicorn',
        'MAGIC': 'Magic Card',
        'Magic Cards': 'Magic Card',
        'Magic Card': 'Magic Card',
        'UPGRADE': 'Upgrade Card',
        'Upgrade Cards': 'Upgrade Card',
        'Upgrade Card': 'Upgrade Card',
        'DOWNGRADE': 'Downgrade Card',
        'Downgrade Cards': 'Downgrade Card',
        'Downgrade Card': 'Downgrade Card',
        'INSTANT': 'Instant Card',
        'Instant Cards': 'Instant Card',
        'Instant Card': 'Instant Card'
    };

    const folderName = folderMap[category] || category || '';
    return folderName
        ? `image/${encodeURIComponent(folderName)}/${cleanFile}`
        : `image/${cleanFile}`;
}

/**
 * Helper to build visual card elements
 */
function createCardElement(card, isSelectable = false, onClickHandler = null) {
    const cardDiv = document.createElement('div');
    const category = card ? (card.category || card.type || '') : '';
    const fileName = card ? (card.file || card.fileName || card.image || '') : '';
    const cardName = card ? card.name : '';

    cardDiv.className = `card-item ${isSelectable ? 'selectable-target' : ''}`;
    cardDiv.style.cssText = `
        width: 70px;
        height: 100px;
        border-radius: 8px;
        border: ${isSelectable ? '3px solid #ef4444' : '1px solid #cbd5e1'};
        background-color: #ffffff;
        box-shadow: ${isSelectable ? '0 0 12px rgba(239, 68, 68, 0.8)' : '0 2px 4px rgba(0,0,0,0.1)'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        font-size: 0.75rem;
        text-align: center;
        cursor: ${isSelectable ? 'pointer' : 'default'};
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    if (isSelectable && onClickHandler) {
        cardDiv.onclick = (e) => {
            e.stopPropagation(); // Stop event propagation to player box
            onClickHandler(e);
        };
    }

    cardDiv.onmouseenter = (e) => showCardTooltip(e, card);
    cardDiv.onmousemove = (e) => moveCardTooltip(e);
    cardDiv.onmouseleave = () => hideCardTooltip();

    if (fileName) {
        const img = document.createElement('img');
        img.src = getCardImagePath(category, fileName);
        img.alt = cardName || 'Card';
        img.style.cssText = "width:100%; height:100%; object-fit:cover; border-radius:6px; pointer-events:none;";
        cardDiv.appendChild(img);
    } else {
        cardDiv.innerText = cardName || 'Unknown Card';
    }

    return cardDiv;
}

/**
 * Sends chosen target card selection back to server
 */
function selectTargetCard(targetPlayerName, targetCardId) {
    if (typeof socket !== 'undefined' && socket) {
        socket.send(JSON.stringify({
            type: 'resolve_choice',
            targetPlayerName: targetPlayerName,
            targetCardId: targetCardId
        }));
    }
}

/**
 * 🎯 Sends chosen target PLAYER selection back to server
 */
function selectTargetPlayer(targetPlayerName) {
    if (typeof socket !== 'undefined' && socket) {
        socket.send(JSON.stringify({
            type: 'resolve_choice',
            targetPlayerName: targetPlayerName
        }));
    }
}

/**
 * ⏭️ Sends skip action for optional triggers back to server
 */
function skipChoice() {
    if (typeof socket !== 'undefined' && socket) {
        socket.send(JSON.stringify({
            type: 'resolve_choice',
            skipped: true
        }));
    }
}

/**
 * Switches screen from Lobby to Game and initializes HTML layout
 */
function switchToGame(data) {
    const lobbyEl = document.getElementById('lobby-screen');
    const gameEl = document.getElementById('game-screen');

    if (lobbyEl) lobbyEl.style.display = 'none';
    if (gameEl) gameEl.style.display = 'block';

    if (data && data.gameState && data.gameState.playerOrder) {
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

    stablesContainer.innerHTML = '';

    playerOrder.forEach(playerName => {
        const playerBox = document.createElement('div');
        playerBox.className = 'player-stable-box';
        playerBox.id = `player-box-${playerName}`;
        playerBox.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 16px;
        margin-top: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease-in-out;
    `;

        playerBox.innerHTML = `
        <div id="player-header-${playerName}" style="background:#2563eb; color:white; display:inline-block; padding:4px 12px; border-radius:12px; font-weight:bold; margin-bottom:12px; transition: all 0.2s;">
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
        <div id="exposed-hand-container-${playerName}" style="display: none; margin-top: 12px; background: #fff7ed; border: 1px dashed #ea580c; border-radius: 8px; padding: 12px;">
            <small style="color: #c2410c; font-weight: bold;">📷 REVEALED HAND (NANNY CAM)</small>
            <div id="exposed-hand-${playerName}" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; min-height: 60px;"></div>
        </div>
    `;

        stablesContainer.appendChild(playerBox);
    });
}

/**
 * Populates cards and active turn status into generated DOM elements
 */
/**
 * Populates cards and active turn status into generated DOM elements
 */
function renderBoardState(gameState) {
    if (!gameState) return;

    latestGameState = gameState;

    const localPlayer = window.myPlayerName || (typeof myPlayerName !== 'undefined' ? myPlayerName : '');

    // 1. Update pile counts
    updatePileCounts(
        gameState.nursery ? gameState.nursery.length : 0,
        gameState.drawPile ? gameState.drawPile.length : 0,
        gameState.discardPile ? gameState.discardPile.length : 0
    );

    // 2. Turn / Pending Choice banner resolution
    const activePlayer =
        gameState.currentTurn ||
        gameState.currentPlayer ||
        gameState.currentTurnPlayer ||
        (gameState.playerOrder && gameState.currentTurnIndex !== undefined ? gameState.playerOrder[gameState.currentTurnIndex] : null) ||
        "Player 1";

    const turnElement = document.getElementById('turn-display') || document.getElementById('current-turn-text');
    const pendingChoice = gameState.pendingChoice;

    if (turnElement) {
        if (pendingChoice) {
            const isMyChoice = pendingChoice.chooser === localPlayer ||
                (Array.isArray(pendingChoice.choosers) && pendingChoice.choosers.includes(localPlayer));

            if (isMyChoice) {
                const skipBtnHtml = pendingChoice.optional
                    ? `<button onclick="skipChoice()" style="margin-left:12px; padding:6px 14px; background:#ef4444; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Skip Trigger ⏭️</button>`
                    : '';

                if (pendingChoice.actionType === 'NEIGH_INTERRUPT' && pendingChoice.cardPlayed) {
                    const card = pendingChoice.cardPlayed;
                    const origPlayer = pendingChoice.originalPlayer || 'A player';
                    const cardLinkHtml = `<span onmouseenter="showCardTooltip(event, latestGameState.pendingChoice.cardPlayed)" onmousemove="moveCardTooltip(event)" onmouseleave="hideCardTooltip()" style="color: #7c3aed; text-decoration: underline; font-weight: bold; cursor: pointer; padding: 0 2px;">${card.name}</span>`;

                    if (pendingChoice.lastNeighPlayer) {
                        turnElement.innerHTML = `<span style="color:#dc2626; font-weight:bold;">🎯 YOUR CHOICE: ${pendingChoice.lastNeighPlayer} played NEIGH on ${cardLinkHtml}! Do you want to play NEIGH to stop it?</span>${skipBtnHtml}`;
                    } else {
                        turnElement.innerHTML = `<span style="color:#dc2626; font-weight:bold;">🎯 YOUR CHOICE: ${origPlayer} is playing ${cardLinkHtml}! Do you want to play NEIGH to stop it?</span>${skipBtnHtml}`;
                    }
                } else {
                    turnElement.innerHTML = `<span style="color:#dc2626; font-weight:bold;">🎯 YOUR CHOICE: ${pendingChoice.prompt || 'Select a target'}</span>${skipBtnHtml}`;
                }
            } else if (pendingChoice.actionType === 'NEIGH_INTERRUPT' && pendingChoice.responses && pendingChoice.responses[localPlayer]) {
                turnElement.innerText = `⏳ Responded. Waiting for other players with Neigh...`;
            } else {
                const waitingFor = pendingChoice.chooser || (pendingChoice.choosers ? pendingChoice.choosers.join(', ') : 'other players');
                turnElement.innerText = `⏳ Waiting for ${waitingFor} to make a choice...`;
            }
        } else {
            turnElement.innerText = `⏳ ${activePlayer}'s Turn`;
        }
    }

    // 3. Ensure container boxes exist
    const stablesContainer = document.getElementById('player-stables');
    if (stablesContainer && stablesContainer.children.length === 0 && gameState.playerOrder) {
        setupStablesContainers(gameState.playerOrder);
    }

    // 4. Render players & handle player target selection
    if (gameState.playerOrder) {
        gameState.playerOrder.forEach(playerName => {
            const player = gameState.players ? gameState.players[playerName] : null;
            if (!player) return;

            const playerHeader = document.getElementById(`player-header-${playerName}`);
            const playerBox = document.getElementById(`player-box-${playerName}`);

            const isPlayerSelectable = pendingChoice &&
                pendingChoice.chooser === localPlayer &&
                (
                    pendingChoice.targetScope === 'ANY_PLAYER' ||
                    pendingChoice.targetScope === 'TARGET_PLAYER' ||
                    pendingChoice.targetScope === 'OTHER_PLAYER' ||
                    (pendingChoice.targetScope === 'OPPONENT_PLAYER' && playerName !== localPlayer) ||
                    (pendingChoice.targetScope === 'OPPONENT' && playerName !== localPlayer)
                );

            if (playerHeader && playerBox) {
                if (isPlayerSelectable) {
                    playerHeader.style.background = '#ef4444';
                    playerHeader.style.cursor = 'pointer';
                    playerHeader.innerText = `🎯 Select ${playerName}`;
                    playerBox.style.border = '3px solid #ef4444';
                    playerBox.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.6)';

                    playerHeader.onclick = (e) => {
                        e.stopPropagation();
                        selectTargetPlayer(playerName);
                    };
                    playerBox.onclick = (e) => {
                        if (e.target.closest('.card-item')) return;
                        selectTargetPlayer(playerName);
                    };
                } else {
                    playerHeader.style.background = '#2563eb';
                    playerHeader.style.cursor = 'default';
                    playerHeader.innerText = `${playerName}'s Stable`;
                    playerBox.style.border = 'none';
                    playerBox.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    playerHeader.onclick = null;
                    playerBox.onclick = null;
                }
            }

            const unicornsContainer = document.getElementById(`unicorns-${playerName}`);
            const upgradesContainer = document.getElementById(`upgrades-${playerName}`);

            if (unicornsContainer) unicornsContainer.innerHTML = '';
            if (upgradesContainer) upgradesContainer.innerHTML = '';

            const allStableCards = [...(player.stable || []), ...(player.upgrades || [])];

            if (allStableCards.length === 0) {
                if (unicornsContainer) {
                    unicornsContainer.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem; align-self:center;">Empty Stable</span>';
                }
                return;
            }

            const hasNannyCam = allStableCards.some(c => c && (c.id === 'nanny_cam' || c.name === 'Nanny Cam'));
            const exposedHandContainer = document.getElementById(`exposed-hand-container-${playerName}`);
            const exposedHandList = document.getElementById(`exposed-hand-${playerName}`);

            if (hasNannyCam && exposedHandContainer && exposedHandList) {
                exposedHandContainer.style.display = 'block';
                exposedHandList.innerHTML = '';

                const handCards = player.hand || [];
                if (handCards.length === 0) {
                    exposedHandList.innerHTML = '<span style="color:#94a3b8; font-size:0.8rem; font-style:italic;">Hand is empty</span>';
                } else {
                    handCards.forEach(card => {
                        const cardEl = createCardElement(card, false, null);
                        exposedHandList.appendChild(cardEl);
                    });
                }
            } else if (exposedHandContainer) {
                exposedHandContainer.style.display = 'none';
            }

            // Inside renderBoardState(), update card selectable evaluation:
            allStableCards.forEach(card => {
                let isSelectable = false;

                const cardCategory = (card.category || card.type || '').toString().toUpperCase();
                const isUpgradeCard = cardCategory.includes('UPGRADE') && !cardCategory.includes('DOWNGRADE');
                const isDowngradeCard = cardCategory.includes('DOWNGRADE');

                if (pendingChoice && pendingChoice.chooser === localPlayer) {
                    const scope = pendingChoice.targetScope;
                    const isMyStable = (playerName === localPlayer);

                    // Highlight Black Knight Unicorn when protection prompt is active
                    if ((pendingChoice.actionType === 'BLACK_KNIGHT_UNICORN_PROTECT' || scope === 'PROTECTION_CHOICE') && isMyStable) {
                        if (card.id === 'black_knight_unicorn' || card.name === 'Black Knight Unicorn') {
                            isSelectable = true;
                        }
                    } else {
                        const scopeMatch =
                            (scope === 'ANY_STABLE') ||
                            (scope === 'MY_STABLE' && isMyStable) ||
                            (scope === 'OPPONENT_STABLE' && !isMyStable) ||
                            (scope === 'OPPONENT_UPGRADE' && !isMyStable) ||
                            (scope === 'STABLE_SWAP') ||
                            (scope === 'SWAP_STABLE') ||
                            (scope === 'UPGRADE_OR_DOWNGRADE');

                        let categoryMatch = true;

                        if (scope === 'OPPONENT_UPGRADE' || scope === 'UPGRADE') {
                            categoryMatch = isUpgradeCard;
                        } else if (scope === 'OPPONENT_DOWNGRADE' || scope === 'DOWNGRADE') {
                            categoryMatch = isDowngradeCard;
                        } else if (scope === 'UPGRADE_OR_DOWNGRADE') {
                            categoryMatch = isUpgradeCard || isDowngradeCard;
                        } else if (scope === 'STABLE_SWAP' || scope === 'SWAP_STABLE') {
                            categoryMatch = !isUpgradeCard && !isDowngradeCard;
                        } else if (pendingChoice.allowedCategories && pendingChoice.allowedCategories.length > 0) {
                            categoryMatch = pendingChoice.allowedCategories.some(cat =>
                                cat.toString().toUpperCase() === cardCategory ||
                                cardCategory.includes(cat.toString().toUpperCase())
                            );
                        }

                        isSelectable = scopeMatch && categoryMatch;
                    }
                }

                const cardEl = createCardElement(
                    card,
                    isSelectable,
                    isSelectable ? () => selectTargetCard(playerName, card.id) : null
                );

                if ((isUpgradeCard || isDowngradeCard) && upgradesContainer) {
                    upgradesContainer.appendChild(cardEl);
                } else if (unicornsContainer) {
                    unicornsContainer.appendChild(cardEl);
                }
            });
        });
    }

    // 5. Trigger search modals for Deck / Discard searches
    if (typeof renderSearchModal === 'function') {
        renderSearchModal(gameState, localPlayer, typeof socket !== 'undefined' ? socket : null);
    }
}

/**
 * 🗑️ DISCARD PILE MODAL HANDLERS
 */
function showDiscardPile() {
    const modal = document.getElementById('discard-modal');
    const cardList = document.getElementById('modal-card-list');
    if (!modal || !cardList) return;

    cardList.innerHTML = '';
    const discardPile = (latestGameState && Array.isArray(latestGameState.discardPile)) ? latestGameState.discardPile : [];

    if (discardPile.length === 0) {
        cardList.innerHTML = '<li style="color: #94a3b8; font-style: italic; list-style: none; text-align: center; padding: 20px 0;">Discard pile is empty</li>';
    } else {
        [...discardPile].reverse().forEach((card) => {
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; list-style: none;';

            const category = card ? card.category : '';
            const fileName = card ? (card.file || card.fileName) : '';
            const imagePath = getCardImagePath(category, fileName);

            li.innerHTML = `
                <img src="${imagePath}" alt="${card.name || 'Card'}" style="width: 45px; height: 63px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" onerror="this.onerror=null; this.src='https://via.placeholder.com/45x63?text=Card';" />
                <div style="flex: 1;">
                    <strong style="display: block; color: #1e293b; font-size: 0.95rem;">${card.name || 'Unknown Card'}</strong>
                    <span style="display: block; color: #64748b; font-size: 0.8rem; margin-top: 2px;">${card.effect || card.description || 'No description'}</span>
                </div>
            `;
            cardList.appendChild(li);
        });
    }

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('discard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.addEventListener('click', (event) => {
    const modal = document.getElementById('discard-modal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
});

/**
 * Global Tooltip Helpers for Card Effects
 */
function getOrCreateTooltip() {
    let tooltip = document.getElementById('card-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'card-tooltip';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function showCardTooltip(e, card) {
    if (!card) return;
    const tooltip = getOrCreateTooltip();
    const name = card.name || 'Unknown Card';
    const category = card.category || 'Card';
    const effect = card.effect || card.description || 'No special effect description.';

    tooltip.innerHTML = `
        <div class="tooltip-title">${name}</div>
        <div class="tooltip-category">${category}</div>
        <div class="tooltip-effect">${effect}</div>
    `;
    tooltip.style.display = 'block';
    moveCardTooltip(e);
}

function moveCardTooltip(e) {
    const tooltip = getOrCreateTooltip();
    if (tooltip && tooltip.style.display === 'block') {
        const padding = 15;
        let left = e.clientX + padding;
        let top = e.clientY + padding;

        if (left + 250 > window.innerWidth) {
            left = e.clientX - 260;
        }
        if (top + 150 > window.innerHeight) {
            top = e.clientY - 160;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

function hideCardTooltip() {
    const tooltip = document.getElementById('card-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * Renders a popup modal for deck or discard pile searches.
 */
/**
 * Renders a popup modal for deck or discard pile searches.
 */
function renderSearchModal(gameState, myPlayerName, socket) {
    // 1. Remove any existing search modal first
    const existingModal = document.getElementById('search-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const pendingChoice = gameState ? gameState.pendingChoice : null;

    // 2. Check if there is a pending choice meant for THIS player
    if (
        pendingChoice &&
        pendingChoice.chooser === myPlayerName &&
        (
            pendingChoice.targetScope === 'SEARCH_DECK' ||
            pendingChoice.targetScope === 'SEARCH_DISCARD' ||
            pendingChoice.targetScope === 'TARGET_HAND' // 👈 ADD THIS: Displays popup when stealing target player's hand card
        )
    ) {
        // Overlay background
        const overlay = document.createElement('div');
        overlay.id = 'search-modal-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 10000;';

        // Modal content container
        const modal = document.createElement('div');
        modal.style.cssText = 'background: white; border-radius: 12px; padding: 20px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3);';

        // Title / Prompt Text
        const title = document.createElement('h3');
        title.style.cssText = 'margin-bottom: 16px; color: #1e293b; font-size: 1.1rem;';
        title.innerText = pendingChoice.prompt || "Select a card:";
        modal.appendChild(title);

        // Container for card options
        const cardsGrid = document.createElement('div');
        cardsGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 20px;';

        const options = pendingChoice.options || [];
        options.forEach(card => {
            const cardItem = document.createElement('div');
            cardItem.style.cssText = 'width: 80px; cursor: pointer; transition: transform 0.2s; border: 2px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff;';
            cardItem.onmouseenter = () => cardItem.style.transform = 'scale(1.08)';
            cardItem.onmouseleave = () => cardItem.style.transform = 'scale(1)';

            const fileName = card ? (card.file || card.fileName || '') : '';
            const category = card ? card.category : '';
            const imagePath = getCardImagePath(category, fileName);

            cardItem.innerHTML = `
                <img src="${imagePath}" alt="${card.name || 'Card'}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; pointer-events: none;" onerror="this.onerror=null; this.src='https://via.placeholder.com/80x110?text=Card';" />
                <p style="font-size: 0.7rem; margin-top: 4px; color: #1e293b; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${card.name || 'Card'}</p>
            `;

            // Send choice back via WebSocket
            cardItem.onclick = () => {
                if (typeof socket !== 'undefined' && socket) {
                    socket.send(JSON.stringify({
                        type: 'resolve_choice',
                        targetCardId: card.id
                    }));
                }
                overlay.remove();
            };

            cardsGrid.appendChild(cardItem);
        });

        modal.appendChild(cardsGrid);

        // Optional "Skip / Pass" Button
        if (pendingChoice.optional) {
            const skipButton = document.createElement('button');
            skipButton.style.cssText = 'padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;';
            skipButton.innerText = 'Skip (Do Not Choose)';
            skipButton.onclick = () => {
                if (typeof socket !== 'undefined' && socket) {
                    socket.send(JSON.stringify({
                        type: 'resolve_choice',
                        skipped: true
                    }));
                }
                overlay.remove();
            };
            modal.appendChild(skipButton);
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
}