// simulate.js
import { startTurnPhase, drawCard, playCardFromHand, getUnicornCount } from './gameActions.js';
import { buildInitialDecks } from './cardsData.js';

const TOTAL_GAMES = 1000;
const MAX_TURNS_PER_GAME = 1000;
const WIN_UNICORN_COUNT = 7;
const VERBOSE = false; // Set to false when running large batches (e.g., 100 games)

let stats = { completed: 0, infiniteLoops: 0, crashes: 0 };

function createMockGameState(playerNames) {
    const decks = typeof buildInitialDecks === 'function' ? buildInitialDecks() : {};
    const drawPile = Array.isArray(decks) ? decks : (decks.drawPile || []);

    const state = {
        players: playerNames.reduce((acc, name) => {
            acc[name] = { hand: [], stable: [], upgrades: [] };
            return acc;
        }, {}),
        playerOrder: playerNames,
        activePlayer: playerNames[0],
        drawPile: drawPile,
        discardPile: decks.discardPile || [],
        nursery: decks.nursery || [],
        phase: 'ACTION',
        pendingChoice: null,
        winner: null,
        turnCount: 0
    };

    // Deal starting hands
    playerNames.forEach(name => {
        drawCard(state, name, 5);
    });

    return state;
}

function resolveRandomChoice(gameState) {
    const choice = gameState.pendingChoice;
    if (!choice) return;

    if (choice.optional && Math.random() < 0.5) {
        gameState.pendingChoice = null;
        gameState.phase = 'ACTION';
        return;
    }

    gameState.pendingChoice = null;
    gameState.phase = 'ACTION';
}

function checkWinCondition(gameState) {
    for (const playerName of gameState.playerOrder) {
        const count = getUnicornCount(gameState, playerName);
        if (count >= WIN_UNICORN_COUNT) {
            gameState.winner = playerName;
            gameState.phase = 'GAME_OVER';
            if (VERBOSE) console.log(`\n🎉 WINNER! ${playerName} won with ${count} Unicorns at turn ${gameState.turnCount}!`);
            return true;
        }
    }
    return false;
}

function declareTieBreakerWinner(gameState) {
    let highestCount = -1;
    let winner = null;

    for (const playerName of gameState.playerOrder) {
        const count = getUnicornCount(gameState, playerName);
        if (count > highestCount) {
            highestCount = count;
            winner = playerName;
        }
    }

    gameState.winner = winner;
    gameState.phase = 'GAME_OVER';
    if (VERBOSE) console.log(`\n🏆 TIME-LIMIT REACHED: ${winner} wins by tie-breaker with ${highestCount} Unicorns at turn ${gameState.turnCount}!`);
}

function runSimulation(gameId) {
    const players = ['Bot_1', 'Bot_2', 'Bot_3'];
    const gameState = createMockGameState(players);

    while (gameState.phase !== 'GAME_OVER' && gameState.turnCount < MAX_TURNS_PER_GAME) {
        gameState.turnCount++;
        const activePlayer = gameState.activePlayer;

        if (VERBOSE) {
            console.log(`[Turn ${gameState.turnCount}] Active: ${activePlayer} | Phase: ${gameState.phase}`);
        }

        // 1. Resolve pending choices
        if (gameState.phase === 'CHOICE') {
            if (VERBOSE && gameState.pendingChoice) {
                console.log(`   -> Resolving pending choice: ${gameState.pendingChoice.actionType || 'CHOICE'}`);
            }
            resolveRandomChoice(gameState);
            continue;
        }

        // 2. Action Phase: Prioritize Magic, then 80% play card / 20% draw card
        const hand = gameState.players[activePlayer].hand;
        if (hand.length > 0) {
            const magicIndex = hand.findIndex(card => {
                const cat = (card.category || card.type || '').toUpperCase();
                return cat.includes('MAGIC');
            });

            if (magicIndex !== -1) {
                playCardFromHand(gameState, activePlayer, magicIndex);
            } else if (Math.random() > 0.2) {
                // 80% chance to play a random card from hand
                const randomIndex = Math.floor(Math.random() * hand.length);
                playCardFromHand(gameState, activePlayer, randomIndex);
            } else {
                // 20% chance to draw a card
                drawCard(gameState, activePlayer);
            }
        } else {
            drawCard(gameState, activePlayer);
        }

        // 3. Check win condition
        if (checkWinCondition(gameState)) {
            break;
        }

        // 4. Cycle turn
        const currentIndex = players.indexOf(activePlayer);
        const nextPlayer = players[(currentIndex + 1) % players.length];
        startTurnPhase(gameState, nextPlayer);
    }

    if (gameState.turnCount >= MAX_TURNS_PER_GAME && !gameState.winner) {
        declareTieBreakerWinner(gameState);
    }

    stats.completed++;
}

// Main execution loop
console.log(`Starting ${TOTAL_GAMES} headless game simulation(s)...\n`);

for (let i = 1; i <= TOTAL_GAMES; i++) {
    try {
        runSimulation(i);
    } catch (err) {
        stats.crashes++;
        console.error(`[Game #${i}] CRASHED!`, err);
    }
}

console.log("\n--- Simulation Results ---");
console.log(`Completed Games: ${stats.completed}`);
console.log(`Crashes: ${stats.crashes}`);
console.log(`Infinite Loops: ${stats.infiniteLoops}`);