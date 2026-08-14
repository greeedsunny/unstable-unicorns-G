// cardsData.js

export const CARD_TYPES = {
    BABY: 'Baby Unicorn',
    BASIC: 'Basic Unicorn',
    MAGICAL: 'Magical Unicorn',
    MAGIC: 'Magic Card',
    UPGRADE: 'Upgrade Card',
    DOWNGRADE: 'Downgrade Card',
    INSTANT: 'Instant Card'
};

export const CARD_DEFINITIONS = [

    // --- BABY UNICORNS (For Nursery & Starting Stables) ---
    {
        id: "baby_narwhal",
        name: "Baby Narwhal",
        category: CARD_TYPES.BABY,
        file: "babynarwhal.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_black",
        name: "Baby Unicorn (Black)",
        category: CARD_TYPES.BABY,
        file: "babyblack.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_brown",
        name: "Baby Unicorn (Brown)",
        category: CARD_TYPES.BABY,
        file: "babybrown.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_death",
        name: "Baby Unicorn (Death)",
        category: CARD_TYPES.BABY,
        file: "babydeath.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_orange",
        name: "Baby Unicorn (Orange)",
        category: CARD_TYPES.BABY,
        file: "babyorange.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_pink",
        name: "Baby Unicorn (Pink)",
        category: CARD_TYPES.BABY,
        file: "babypink.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_purple",
        name: "Baby Unicorn (Purple)",
        category: CARD_TYPES.BABY,
        file: "babypurple.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_rainbow",
        name: "Baby Unicorn (Rainbow)",
        category: CARD_TYPES.BABY,
        file: "babyrainbow.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_white",
        name: "Baby Unicorn (White)",
        category: CARD_TYPES.BABY,
        file: "babywhite.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "baby_yellow",
        name: "Baby Unicorn (Yellow)",
        category: CARD_TYPES.BABY,
        file: "babyyellow.jpg",
        effect: "If this card would be sacrificed, destroyed, or returned to your hand, return it to the Nursery instead.",
        quantity: 1
    },
    {
        id: "basic_unicorn_blue",
        name: "Basic Unicorn (Blue)",
        category: CARD_TYPES.BASIC,
        file: "basicblue.jpg",
        effect: "No effect",
        quantity: 3
    }, 
    {
        id: "basic_unicorn_green",
        name: "Basic Unicorn (Green)",
        category: CARD_TYPES.BASIC,
        file: "basicgreen.jpg",
        effect: "No effect",
        quantity: 3
    },
    {
        id: "basic_unicorn_indigo",
        name: "Basic Unicorn (Indigo)",
        category: CARD_TYPES.BASIC,
        file: "basicindigo.jpg",
        effect: "No effect",
        quantity: 3
    },
    {
        id: "basic_unicorn_narwhal",
        name: "Basic Unicorn (Narwhal)",
        category: CARD_TYPES.BASIC,
        file: "basicnarwhal.jpg",
        effect: "No effect",
        quantity: 1
    },
    {
        id: "basic_unicorn_orange",
        name: "Basic Unicorn (Orange)",
        category: CARD_TYPES.BASIC,
        file: "basicorange.jpg",
        effect: "No effect",
        quantity: 3
    },
    {
        id: "basic_unicorn_purple",
        name: "Basic Unicorn (Purple)",
        category: CARD_TYPES.BASIC,
        file: "basicpurple.jpg",
        effect: "No effect",
        quantity: 3
    },
    {
        id: "basic_unicorn_red",
        name: "Basic Unicorn (Red)",
        category: CARD_TYPES.BASIC,
        file: "basicred.jpg",
        effect: "No effect",
        quantity: 3
    },
    {
        id: "basic_unicorn_yellow",
        name: "Basic Unicorn (Yellow)",
        category: CARD_TYPES.BASIC,
        file: "basicyellow.jpg",
        effect: "No effect",
        quantity: 3
    }
    // --- MAGIC CARDS ---
  {
        id: "back_kick",
        name: "Back Kick",
        category: CARD_TYPES.MAGIC,
        file: "backkick.jpg",
        effect: "Choose any player. Return a card in that player's Stable to their hand. That player must DISCARD a card.",
        quantity: 1,
        onPlay: {
            action: "BACK_KICK"
        }
    },
    {
        id: "glitter_tornado",
        name: "Glitter Tornado",
        category: CARD_TYPES.MAGIC,
        file: "glittertornado.jpg",
        effect: "Return a card in each player's Stable to that player's hand.",
        quantity: 1,
        onPlay: {
            action: "GLITTER_TORNADO"
        }
    },
    {
        id: "good_deal",
        name: "Good Deal",
        category: CARD_TYPES.MAGIC,
        file: "gooddeal.jpg",
        effect: "DRAW 3 cards and DISCARD a card.",
        quantity: 1,
        onPlay: {
            action: "GOOD_DEAL"
        }
    },
    {
        id: "mystical_vortex",
        name: "Mystical Vortex",
        category: CARD_TYPES.MAGIC,
        file: "mysticalvortex.jpg",
        effect: "Each player must DISCARD a card. Shuffle the discard pile into the deck.",
        quantity: 1,
        onPlay: {
            action: "MYSTICAL_VORTEX"
        }
    },
    {
        id: "reset_button",
        name: "Reset Button",
        category: CARD_TYPES.MAGIC,
        file: "resetbutton.jpg",
        effect: "Each player must SACRIFICE all Upgrade and Downgrade cards. Shuffle the discard pile into the deck.",
        quantity: 1,
        onPlay: {
            action: "RESET_BUTTON"
        }
    },
    {
        id: "shake_up",
        name: "Shake Up",
        category: CARD_TYPES.MAGIC,
        file: "shakeup.jpg",
        effect: "Shuffle this card, your hand, and the discard pile into the deck. DRAW 5 cards.",
        quantity: 1,
        onPlay: {
            action: "SHAKE_UP"
        }
    },
    {
        id: "targeted_destruction",
        name: "Targeted Destruction",
        category: CARD_TYPES.MAGIC,
        file: "targeteddestruction.jpg",
        effect: "SACRIFICE or DESTROY an Upgrade or Downgrade card.",
        quantity: 1,
        onPlay: {
            action: "TARGETED_DESTRUCTION"
        }
    },
]

// cardsData.js

/**
 * Utility: Fisher-Yates or standard shuffle array helper
 */
export function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

/**
 * Builds and returns the initial Nursery, Draw Pile, and Discard Pile
 */
export function buildInitialDecks() {
    const fullDeck = [];

    CARD_DEFINITIONS.forEach((cardTemplate) => {
        // Loop for the specified quantity (e.g., 3 copies)
        for (let i = 1; i <= cardTemplate.quantity; i++) {
            fullDeck.push({
                id: `${cardTemplate.id}_${i}`, // Unique instance ID
                name: cardTemplate.name,
                category: cardTemplate.category,
                file: cardTemplate.file,
                effect: cardTemplate.effect,
                onPlay: cardTemplate.onPlay || null
            });
        }
    });

    // 1. Separate Baby Unicorns (for Nursery) using CARD_TYPES constant
    const nursery = fullDeck.filter(c => c.category === CARD_TYPES.BABY);
    const mainDeck = fullDeck.filter(c => c.category !== CARD_TYPES.BABY);

    // 2. Shuffle the main deck using our shuffle helper
    const shuffledDrawPile = shuffle([...mainDeck]);

    return {
        nursery: nursery,
        drawPile: shuffledDrawPile,
        discardPile: []
    };
}