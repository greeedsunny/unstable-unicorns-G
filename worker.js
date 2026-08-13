< !DOCTYPE html >
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <title>Unstable Unicorns - Live Game</title>
                <style>
    /* --- Modern, Colorful Theme Variables --- */
                    :root {
                        --primary: #ff4757;
                    --secondary: #eccc68;
                    --accent-1: #2ed573;
                    --accent-2: #1e90ff;
                    --unicorn: #ff9ff3;
                    --bg: #ffe0f5;
                    --card-bg: rgba(255, 255, 255, 0.95);
                    --text: #2f3542;
                    --shadow: 0 4px 10px rgba(0,0,0,0.15);
    }

                    body {font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: var(--bg); color: var(--text); }

                    input, button {font - size: 1rem; border-radius: 8px; border: none; outline: none; }
                    button {cursor: pointer; font-weight: bold; transition: 0.2s ease; }

                    /* --- Lobby Styles --- */
                    #lobby-screen {background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); text-align: center; width: 320px; }
                    input {width: 90%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; background: #fff; }
                    #lobby-screen h2 {color: var(--primary); margin-top: 0; }
                    #join-btn {width: 98%; padding: 12px; background-color: var(--primary); color: white; }
                    #join-btn:hover {background - color: var(--accent-2); }

                    /* Start Game Button */
                    #start-game-btn {width: 100%; padding: 12px; background-color: var(--accent-1); color: white; margin-top: 15px; font-size: 1.1rem; }
                    #start-game-btn:hover {background - color: #26af5f; }

                    #status, #error {margin - top: 15px; font-weight: bold; }
                    #status {color: var(--accent-1); }
                    #error {color: var(--primary); }
                    .player-list {text - align: left; background: rgba(0,0,0,0.03); padding: 10px 15px; border-radius: 6px; margin-top: 15px; border: 1px solid rgba(0,0,0,0.06); }
                    .player-list ul {padding - left: 20px; margin: 5px 0 0 0; }

                    /* --- Fixed Game Screen CSS --- */
                    #game-screen {display: none; width: 95vw; height: 95vh; flex-direction: column; overflow: hidden; }

                    /* Central Board Areas */
                    #central-board {display: flex; justify-content: center; align-items: center; gap: 20px; padding: 15px; background: rgba(255, 255, 255, 0.4); border-radius: 10px; box-shadow: var(--shadow); margin-bottom: 20px; }
                    .game-pile {background: #fff; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.08); width: 120px; position: relative; }
                    .game-pile h3 {margin: 0 0 10px 0; font-size: 1.1rem; color: #57606f; }
                    .pile-count {font - size: 2.2rem; font-weight: 800; color: var(--primary); }
                    .draw-pile-icon {color: var(--accent-2); font-size: 2rem; }
                    .nursery-icon {color: var(--secondary); font-size: 2rem; }

                    /* Discard Pile Button */
                    #discard-pile {background: #ced4da; border: 2px solid #a4b0be; cursor: pointer; color: var(--text); }
                    #discard-pile:hover {background: #a4b0be; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
                    #discard-pile:hover h3 {color: #fff; }

                    /* --- Player Stables Container --- */
                    #player-stables {flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; padding: 10px; overflow-y: auto; }

                    .stable {background: var(--unicorn); border-radius: 10px; border: 2px solid var(--accent-2); box-shadow: var(--shadow); padding: 10px; position: relative; display: flex; flex-direction: column; }
                    .stable h4 {margin: 0 0 10px 0; color: #fff; background: var(--accent-2); display: inline-block; padding: 4px 10px; border-radius: 5px; font-size: 0.9rem; }
                    .row-label {font - weight: bold; font-size: 0.8rem; color: rgba(0,0,0,0.5); margin-top: 5px; }

                    .stable-row {min - height: 90px; background: rgba(255,255,255,0.7); border-radius: 8px; margin-bottom: 10px; padding: 8px; display: flex; gap: 5px; flex-wrap: wrap; align-items: center; border: 1px dashed rgba(0,0,0,0.1); }
                    .stable-row:last-child {margin - bottom: 0; }

                    .card-placeholder {width: 50px; height: 75px; background: #fff; border: 1px solid #ccc; border-radius: 4px; color: #aaa; display: flex; justify-content: center; align-items: center; font-size: 0.7rem; }

                    /* --- Discard Modal --- */
                    .modal {display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); justify-content: center; align-items: center; z-index: 1000; }
                    .modal-content {background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.3); width: 80%; max-height: 80%; overflow-y: auto; position: relative; }
                    #close-modal {position: absolute; top: 15px; right: 20px; font-size: 1.5rem; color: #aaa; cursor: pointer; border: none; background: none; }
                    #close-modal:hover {color: var(--primary); }
                    #modal-card-list {display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; padding-left: 0; list-style: none; }
                    .modal-card {width: 70px; height: 100px; background: var(--card-bg); border: 1px solid #ddd; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 5px; font-size: 0.8rem; border-top: 5px solid; }

                </style>
        </head>
        <body>

            <!-- --- 1. LOBBY SCREEN --- -->
            <div id="lobby-screen">
                <h2>🦄 Game Lobby</h2>

                <div id="join-form">
                    <input type="text" id="playerName" placeholder="Your Name (e.g. Alex)" />
                    <input type="text" id="roomPassword" placeholder="Room Password (e.g. 123)" />
                    <button id="join-btn" onclick="joinRoom()">Join Game Room</button>
                </div>

                <div id="error"></div>
                <div id="status">Connecting to Cloudflare...</div>

                <div id="lobby-info" class="player-list" style="display: none;">
                    <strong>Connected Players (<span id="count">0</span>/<span id="max">5</span>):</strong>
                    <ul id="players-ul"></ul>

                    <!-- Start Game Button -->
                    <button id="start-game-btn" style="display: none;" onclick="requestStartGame()">Start Game 🚀</button>
                </div>
            </div>

            <!-- --- 2. GAME SCREEN --- -->
            <div id="game-screen">
                <div id="central-board">
                    <div id="nursery" class="game-pile">
                        <h3>Nursery</h3>
                        <span class="nursery-icon">👶</span>
                        <div class="pile-count" id="nursery-count">10</div>
                    </div>

                    <div id="draw-pile" class="game-pile">
                        <h3>Draw</h3>
                        <span class="draw-pile-icon">🃏</span>
                        <div class="pile-count" id="draw-count">54</div>
                    </div>

                    <button id="discard-pile" class="game-pile" onclick="showDiscardPile()">
                        <h3>Discard</h3>
                        <span>🚮</span>
                        <div class="pile-count" id="discard-count">0</div>
                    </button>
                </div>

                <div id="player-stables"></div>
            </div>

            <!-- --- 3. DISCARD PILE MODAL --- -->
            <div id="discard-modal" class="modal">
                <div class="modal-content">
                    <button id="close-modal" onclick="closeModal()">×</button>
                    <h2>Trash Can</h2>
                    <p>All discarded cards, in order.</p>
                    <ul id="modal-card-list"></ul>
                </div>
            </div>

            <script>
                const WORKER_URL = "wss://unstable-unicorns-g.greeedsunny.workers.dev";

                const socket = new WebSocket(WORKER_URL);
                let myPlayerName = "";
                let currentRoomCode = "";

    socket.onopen = () => {
                    document.getElementById('status').innerText = "Ready to join!";
    };

                function joinRoom() {
      const roomCode = document.getElementById('roomPassword').value.trim();
                const playerName = document.getElementById('playerName').value.trim();

                if (!roomCode) {
                    alert("Please enter a room password!");
                return;
      }
                myPlayerName = playerName || "You";
                currentRoomCode = roomCode;

                document.getElementById('error').innerText = "";

                socket.send(JSON.stringify({
                    type: 'join_room',
                roomCode,
                playerName: myPlayerName
      }));
    }

                function requestStartGame() {
      if (!currentRoomCode) return;
                socket.send(JSON.stringify({
                    type: 'start_game',
                roomCode: currentRoomCode
      }));
    }

    // --- Message Receiver ---
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

                // Real-time room list update for ALL connected clients
                if (data.type === 'room_status') {
                    updateLobbyUI(data);
      }

                // Synchronized transition to board for ALL clients
                if (data.type === 'game_started') {
                    switchToGame(data);
      }

                if (data.type === 'room_error') {
                    document.getElementById('error').innerText = data.message;
      }
    };

                function updateLobbyUI(data) {
                    document.getElementById('join-form').style.display = 'none';
                document.getElementById('status').innerText = `Room: "${data.roomCode}"`;
                document.getElementById('lobby-info').style.display = 'block';

                document.getElementById('count').innerText = data.playerCount;
                document.getElementById('max').innerText = data.maxPlayers;

                const ul = document.getElementById('players-ul');
                ul.innerHTML = "";
      data.players.forEach(name => {
        const li = document.createElement('li');
                li.innerText = name;
                ul.appendChild(li);
      });

                // Show "Start Game" button only when 2 or more players have joined
                const startBtn = document.getElementById('start-game-btn');
      if (data.playerCount >= 2) {
                    startBtn.style.display = 'block';
      } else {
                    startBtn.style.display = 'none';
      }
    }

                function switchToGame(data) {
                    document.getElementById('lobby-screen').style.display = "none";
                document.getElementById('game-screen').style.display = "flex";

                generateStables(data.players);
    }

                function generateStables(playersArray) {
        const stablesContainer = document.getElementById('player-stables');
                stablesContainer.innerHTML = "";

        playersArray.forEach(name => {
            const stableDiv = document.createElement('div');
                stableDiv.className = 'stable';
                stableDiv.innerHTML = `
                <h4>${name}'s Stable</h4>
                <div class="row-label">Unicorns (Max 7)</div>
                <div class="stable-row unicorns-row">
                    <div class="card-placeholder">1</div>
                    <div class="card-placeholder">2</div>
                </div>
                <div class="row-label">Upgrades / Downgrades</div>
                <div class="stable-row mods-row">
                    <div class="card-placeholder">UP</div>
                    <div class="card-placeholder">DOWN</div>
                </div>
                `;
                stablesContainer.appendChild(stableDiv);
        });
    }

                let discardPileData = [ "Panda Unicorn", "Stabby Unicorn", "Glitched Baby" ];

                function showDiscardPile() {
                    document.getElementById('discard-modal').style.display = "flex";
                const list = document.getElementById('modal-card-list');
                list.innerHTML = "";

        discardPileData.forEach((cardName, index) => {
            const li = document.createElement('li');
                li.className = 'modal-card';
                li.style.borderTopColor = `hsl(${index * 40}, 70%, 60%)`;
                li.innerHTML = `<strong>#${index + 1}</strong> <span>${cardName}</span>`;
                list.appendChild(li);
        });
    }

                function closeModal() {
                    document.getElementById('discard-modal').style.display = "none";
    }

            </script>
        </body>
    </html>