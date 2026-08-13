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
]

/**
 * Returns a full shuffled main deck
 */
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

export function buildInitialDecks() {
    const nursery = INITIAL_DECK.filter(c => c.isBaby);
    const mainDeck = shuffle(INITIAL_DECK.filter(c => !c.isBaby));

    return { nursery, drawPile: mainDeck, discardPile: [] };
}

export function buildInitialDecks() {
    const fullDeck = [];

    CARD_DEFINITIONS.forEach((cardTemplate) => {
        // Loop for the specified quantity (e.g. 3 times)
        for (let i = 1; i <= cardTemplate.quantity; i++) {
            fullDeck.push({
                // Give each copy a unique instance ID (e.g. 'basic_unicorn_blue_1', 'basic_unicorn_blue_2')
                id: `${cardTemplate.id}_${i}`,
                name: cardTemplate.name,
                category: cardTemplate.category,
                file: cardTemplate.file,
                effect: cardTemplate.effect,
                onPlay: cardTemplate.onPlay || null // Basic unicorns won't have an onPlay function
            });
        }
    });

    // Separate Baby Unicorns (for Nursery) from Main Draw Deck
    const nursery = fullDeck.filter(c => c.category === 'Baby Unicorn');
    const mainDeck = fullDeck.filter(c => c.category !== 'Baby Unicorn');

    // Shuffle the main draw deck
    const shuffledDrawPile = mainDeck.sort(() => Math.random() - 0.5);

    return {
        nursery: nursery,
        drawPile: shuffledDrawPile,
        discardPile: []
    };
}