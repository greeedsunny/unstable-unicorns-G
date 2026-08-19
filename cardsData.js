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

/**
 * Universal helper to verify if a card counts as any type of Unicorn
 */
export const isUnicorn = (card) => {
    if (!card) return false;
    const cat = (card.category || card.type || '').toLowerCase();
    return cat.includes('unicorn') ||
        cat === CARD_TYPES.BABY ||
        cat === CARD_TYPES.BASIC ||
        cat === CARD_TYPES.MAGICAL;
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
    },
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
    {
        id: "TWO_FOR_ONE",
        name: "Two-for-one",
        category: CARD_TYPES.MAGIC,
        file: "twoforone.jpg",
        effect: "SACRIFICE a card, then DESTROY 2 cards.",
        quantity: 1,
        onPlay: {
            action: "TWO_FOR_ONE"
        }
    },
    {
        id: "UNFAIR_BARGAIN",
        name: "Unfair Bargain",
        category: CARD_TYPES.MAGIC,
        file: "unfairbargain.jpg",
        effect: "Trade hands with any other player.",
        quantity: 1
    },
    {
        id: "unicorn_poison",
        name: "Unicorn Poison",
        category: CARD_TYPES.MAGIC,
        file: "unicornpoison.jpg",
        effect: "DESTROY a Unicorn card.",
        quantity: 1,
        onPlay: {
            action: "UNICORN_POISON"
        }
    },
    {
        id: "unicorn_shrinkray",
        name: "Unicorn Shrinkray",
        category: CARD_TYPES.MAGIC,
        file: "unicornshrinkray.jpg",
        effect: "Choose any player. Move all of that player's Unicorn cards to the discard pile without triggering any of their effects, then bring the same number of Baby Unicorn cards from the Nursery directly into that player's Stable.",
        quantity: 1,
        onPlay: {
            action: "UNICORN_SHRINKRAY"
        }
    },
    {
        id: "unicorn_swap",
        name: "Unicorn Swap",
        category: CARD_TYPES.MAGIC,
        file: "unicornswap.jpg",
        effect: "Move a Unicorn card in your Stable to any other player's Stable, then STEAL a Unicorn card from that player's Stable.",
        quantity: 1,
        onPlay: {
            action: "UNICORN_SWAP"
        }
    },
    {
        id: "BLATANT_THIEVERY",
        name: "Blatant Thievery",
        category: CARD_TYPES.MAGIC,
        file: "blatantthievery.jpg",
        effect: "Choose any player and look at that player's hand. Choose a card from that player's hand and add it to your hand.",
        quantity: 1,
        onPlay: {
            action: "BLATANT_THIEVERY"
        }
    },
    {
        id: "CHANGE_OF_LUCK",
        name: "Change Of Luck",
        category: CARD_TYPES.MAGIC,
        file: "changeofluck.jpg",
        effect: "DRAW 2 cards and DISCARD 3 cards, then take another turn.",
        quantity: 1,
        onPlay: {
            action: "CHANGE_OF_LUCK"
        }
    },
    {
        id: "ALLURING_NARWHAL",
        name: "Alluring Narwhal",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "alluring.png",
        effect: "When this card enters your Stable, you may STEAL an Upgrade card.",
        quantity: 1,
        onEnter: {
            action: "ALLURING_NARWHAL"
        }
    },
    {
        id: "ANNOYING_FLYING_UNICORN",
        name: "Annoying Flying Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "annoying.png",
        effect: "When this card enters your Stable, you may choose any player. That player must DISCARD a card. If this card would be sacrificed or destroyed, return it to your hand instead.",
        quantity: 1,
        returnToHandOnDestroy: true, // 👈 Generic flag for replacement effects!
        onEnter: {
            action: "ANNOYING_FLYING_UNICORN"
        }
    },
    {
        id: "americorn",
        name: "Americorn",
        category: CARD_TYPES.MAGICAL_UNICORN, // or "Magical Unicorn" based on your enum
        file: "americorn.png",
        effect: "When this card enters your Stable, choose any player. Pull a card from that player's hand.",
        quantity: 1,
        onEnter: {
            action: "AMERICORN"
        }
    },
    {
        id: "chainsaw_unicorn",
        name: "Chainsaw Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "chainsaw.jpg",
        effect: "When this card enters your Stable, you may SACRIFICE or DESTROY an Upgrade or Downgrade card.",
        quantity: 1,
        onEnter: {
            action: "CHAINSAW_UNICORN"
        }
    },
    {
        id: "classy_narwhal",
        name: "Classy Narwhal",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "classynarwhal.jpg",
        effect: "When this card enters your Stable, you may search the deck for an Upgrade card and add it to your hand. Shuffle the deck.",
        quantity: 1,
        onEnter: {
            action: "CLASSY_NARWHAL"
        }
    },
    {
        id: "shabby_the_narwhal",
        name: "Shabby The Narwhal",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "shabby.jpg",
        effect: "When this card enters your Stable, you may search the deck for a Downgrade card and add it to your hand. Shuffle the deck.",
        quantity: 1,
        onEnter: {
            action: "SHABBY_THE_NARWHAL"
        }
    },
    {
        id: "the_great_narwhal",
        name: "The Great Narwhal",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "thegreatnarwhal.jpg",
        effect: "When this card enters your Stable, you may search the deck for a card with \"Narwhal\" in its name and add it to your hand. Shuffle the deck.",
        quantity: 1,
        onEnter: {
            action: "THE_GREAT_NARWHAL"
        }
    },
    {
        id: "greedy_flying_unicorn",
        name: "Greedy Flying Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "greedyflying.jpg",
        effect: "When this card enters your Stable, DRAW a card. If this card would be sacrificed or destroyed, return it to your hand instead.",
        quantity: 1,
        returnToHandOnDestroy: true,
        onEnter: {
            action: "GREEDY_FLYING_UNICORN"
        }
    },
    {
        id: "magical_flying_unicorn",
        name: "Magical Flying Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "magicalflying.jpg",
        effect: "When this card enters your Stable, you may choose a Magic card from the discard pile and add it to your hand. If this card would be sacrificed or destroyed, return it to your hand instead.",
        quantity: 1,
        returnToHandOnDestroy: true,
        onEnter: {
            action: "MAGICAL_FLYING_UNICORN"
        }
    },
    {
        id: "majestic_flying_unicorn",
        name: "Majestic Flying Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "majesticflying.jpg",
        effect: "When this card enters your Stable, you may choose a Unicorn card from the discard pile and add it to your hand. If this card would be sacrificed or destroyed, return it to your hand instead.",
        quantity: 1,
        returnToHandOnDestroy: true,
        onEnter: {
            action: "MAJESTIC_FLYING_UNICORN"
        }
    },
    {
        id: "mermaid_unicorn",
        name: "Mermaid Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "mermaid.jpg",
        effect: "When this card enters your Stable, you may choose any player. Return a card in that player's Stable to their hand.",
        quantity: 1,
        onEnter: {
            action: "MERMAID_UNICORN"
        }
    },
    {
        id: "narwhal_torpedo",
        name: "Narwhal Torpedo",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "narwhaltorpedo.jpg",
        effect: "When this card enters your Stable, SACRIFICE all Downgrade cards.",
        quantity: 1,
        onEnter: {
            action: "NARWHAL_TORPEDO"
        }
    },
    {
        id: "rainbow_unicorn",
        name: "Rainbow Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "rainbow.jpg",
        effect: "When this card enters your Stable, you may bring a Basic Unicorn card from your hand directly into your Stable.",
        quantity: 1,
        onEnter: {
            action: "RAINBOW_UNICORN"
        }
    },
    {
        id: "seductive_unicorn",
        name: "Seductive Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "seductive.jpg",
        effect: "When this card enters your Stable, STEAL a Unicorn card. If this card leaves your Stable, return that Unicorn card to the Stable from which you stole it.",
        quantity: 1,
        onEnter: { action: "SEDUCTIVE_UNICORN" },
        onLeave: { action: "SEDUCTIVE_UNICORN_LEAVE" }
    },
    {
        id: "swift_flying_unicorn",
        name: "Swift Flying Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "swiftflying.jpg",
        effect: "When this card enters your Stable, you may choose an Instant card from the discard pile and add it to your hand. If this card would be sacrificed or destroyed, return it to your hand instead.",
        quantity: 1,
        returnToHandOnDestroy: true,
        onEnter: {
            action: "SWIFT_FLYING_UNICORN"
        }
    },
    {
        id: "unicorn_on_the_cob",
        name: "Unicorn On The Cob",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "unicornonthecob.jpg",
        effect: "When this card enters your Stable, DRAW 2 cards and DISCARD a card.",
        quantity: 1,
        onEnter: {
            action: "UNICORN_ON_THE_COB"
        }
    },
    {
        id: "black_knight_unicorn",
        name: "Black Knight Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN,
        file: "blackknight.jpg",
        effect: "If 1 of your Unicorn cards would be destroyed, you may SACRIFICE this card instead.",
        quantity: 1,
        protectsUnicorns: true
    },
    {
        id: "neigh",
        name: "Neigh",
        category: CARD_TYPES.INSTANT,
        file: "neigh.jpg",
        effect: "Play this card when any other player tries to play a card. Stop that player's card from being played and send it to the discard pile.",
        quantity: 1,
        onPlay: {
            action: "NEIGH"
        }
    },
    {
        id: "super_neigh",
        name: "Super Neigh",
        category: CARD_TYPES.INSTANT,
        image: "/image/Instant Card/UU-ChCo-001.png",
        effect: "Play this card when any other player tries to play a card. Stop that player's card from being played and send it to the discard pile. This card cannot be Neigh'd.",
        quantity: 1,
        onPlay: {
            action: "SUPER_NEIGH"
        }
    },
    {
        id: "double_dutch",
        name: "Double Dutch",
        category: CARD_TYPES.UPGRADE,
        file: "doubledutch.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, you may play 2 cards during your Action phase.",
        quantity: 1,
        onTurnStart: {
            action: "DOUBLE_DUTCH"
        }
    },
    {
        id: "extra_tail",
        name: "Extra Tail",
        category: CARD_TYPES.UPGRADE,
        file: "extratail.jpg",
        effect: "This card can only enter a Stable if there is a Basic Unicorn card in that Stable. If this card is in your Stable at the beginning of your turn, you may DRAW an extra card.",
        quantity: 1,
        requiresBasicUnicorn: true,
        onTurnStart: {
            action: "EXTRA_TAIL"
        }
    },
    {
        id: "glitter_bomb",
        name: "Glitter Bomb",
        category: CARD_TYPES.UPGRADE,
        file: "glitterbomb.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, you may SACRIFICE a card. If you do, DESTROY a card.",
        quantity: 1,
        onTurnStart: {
            action: "GLITTER_BOMB"
        }
    },
    {
        id: "yay",
        name: "Yay",
        category: CARD_TYPES.UPGRADE,
        file: "yay.jpg",
        effect: "Cards you play cannot be Neigh'd.",
        quantity: 1,
        isContinuous: true
    },
    {
        id: "rainbow_aura",
        name: "Rainbow Aura",
        category: CARD_TYPES.UPGRADE,
        file: "rainbowaura.jpg",
        effect: "Your Unicorn cards cannot be destroyed.",
        quantity: 1,
        isContinuous: true
    },
    {
        id: "rainbow_mane",
        name: "Rainbow Mane",
        category: CARD_TYPES.UPGRADE,
        file: "rainbowmane.jpg",
        effect: "This card can only enter a Stable if there is a Basic Unicorn card in that Stable. If this card is in your Stable at the beginning of your turn, you may bring a Basic Unicorn card from your hand directly into your Stable.",
        quantity: 1
    },
    {
        id: "summoning_ritual",
        name: "Summoning Ritual",
        category: CARD_TYPES.UPGRADE,
        file: "summoningritual.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, you may DISCARD 2 Unicorn cards. If you do, bring a Unicorn card directly from the discard pile into your Stable.",
        quantity: 1,
        onBeginningOfTurn: {
            action: "SUMMONING_RITUAL"
        }
    },
    {
        id: "unicorn_lasso",
        name: "Unicorn Lasso",
        category: CARD_TYPES.UPGRADE,
        file: "unicornlasso.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, you may STEAL a Unicorn card. At the end of your turn, return that Unicorn card to the Stable from which you stole it.",
        quantity: 1,
        onBeginningOfTurn: {
            action: "UNICORN_LASSO"
        }
    },
    {
        id: "barbed_wire",
        name: "Barbed Wire",
        category: CARD_TYPES.DOWNGRADE,
        file: "barbedwire.jpg",
        effect: "Each time a Unicorn card enters or leaves your stable, DISCARD a card.",
        quantity: 1
    },
    {
        id: "blinding_light",
        name: "Blinding Light",
        category: CARD_TYPES.DOWNGRADE,
        file: "blindinglight.jpg",
        effect: "Triggered effects of your Unicorn cards do not activate.",
        quantity: 1
    },
    {
        id: "broken_stable",
        name: "Broken Stable",
        category: CARD_TYPES.DOWNGRADE,
        file: "brokenstable.jpg",
        effect: "You cannot play Upgrade cards.",
        quantity: 1
    },
    {
        id: "nanny_cam",
        name: "Nanny Cam",
        category: CARD_TYPES.DOWNGRADE,
        file: "nannycam.jpg",
        effect: "Your hand must be visible to all players at all times.",
        quantity: 1
    },
    {
        id: "pandamonium",
        name: "Pandamonium",
        category: CARD_TYPES.DOWNGRADE,
        file: "pandamonium.jpg",
        effect: "All of your Unicorns are considered Pandas. Cards that affect Unicorn cards do not affect your Pandas.",
        quantity: 1
    },
    {
        id: "sadistic_ritual",
        name: "Sadistic Ritual",
        category: CARD_TYPES.DOWNGRADE,
        file: "sadisticritual.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, SACRIFICE a Unicorn card, then DRAW a card.",
        quantity: 1
    },
    {
        id: "slowdown",
        name: "Slowdown",
        category: CARD_TYPES.DOWNGRADE,
        file: "slowdown.jpg",
        effect: "You cannot play Instant cards.",
        quantity: 1
    },
    {
        id: "tiny_stable",
        name: "Tiny Stable",
        category: CARD_TYPES.DOWNGRADE,
        file: "tinystable.jpg",
        effect: "If at any time you have more than 5 Unicorns in your Stable, SACRIFICE a Unicorn card.",
        quantity: 1
    },
    {
        id: "ginormous_unicorn",
        name: "Ginormous Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN, // Changed from CARD_TYPES.MAGICAL_UNICORN
        file: "ginormous.jpg",
        effect: "This card counts for 2 Unicorns. You cannot play any Instant cards.",
        quantity: 1
    },
    {
        id: "re_target",
        name: "Re-target",
        category: CARD_TYPES.MAGIC,
        file: "retarget.jpg",
        effect: "Move an Upgrade or Downgrade card from any player's Stable to any other player's Stable.",
        quantity: 1,
        onPlay: {
            action: "RE_TARGET"
        }
    },
    {
        id: "rhinocorn",
        name: "Rhinocorn",
        category: CARD_TYPES.MAGICAL_UNICORN, // Changed from CARD_TYPES.MAGICAL_UNICORN
        file: "rhinocorn.jpg",
        effect: "If this card is in your Stable at the beginning of your turn, you may DESTROY a Unicorn card. If you do, immediately skip to your End of Turn phase.",
        quantity: 1
    },
    {
        id: "queen_bee_unicorn",
        name: "Queen Bee Unicorn",
        category: CARD_TYPES.MAGICAL_UNICORN, // Changed from CARD_TYPES.MAGICAL_UNICORN
        file: "queenbee.jpg",
        effect: "Basic Unicorn cards cannot enter any player's Stable except yours.",
        quantity: 1
    }
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
        // Fallback check to support both .category or .type properties
        const cardCategory = cardTemplate.category || cardTemplate.type;

        for (let i = 1; i <= cardTemplate.quantity; i++) {
            fullDeck.push({
                ...cardTemplate, // Preserves onTurnStart, onBeginningOfTurn, isContinuous, etc.
                id: `${cardTemplate.id}_${i}`,
                category: cardCategory,
                file: cardTemplate.file || cardTemplate.image
            });
        }
    });

    // 1. Separate Baby Unicorns (for Nursery)
    const nursery = fullDeck.filter(isBabyCard);

    // 2. Main Deck gets everything that is NOT a Baby Unicorn
    const mainDeck = fullDeck.filter(card => !isBabyCard(card));

    // 3. Shuffle the main deck
    const shuffledDrawPile = shuffle([...mainDeck]);

    return {
        nursery: nursery,
        drawPile: shuffledDrawPile,
        discardPile: []
    };
}

/**
 * REPLACEMENT EFFECT / PROTECTOR LOGIC:
 * Called when 1 of player's Unicorn cards is targeted for destruction.
 */
export function BlackKnightUnicorn(gameState, playerName, targetData = {}) {
    const player = gameState.players ? gameState.players[playerName] : null;
    if (!player || !Array.isArray(player.stable)) {
        return { success: false, reason: "Player or stable not found." };
    }

    const bkIndex = player.stable.findIndex(c =>
        c && (c.id === 'black_knight_unicorn' || c.name === 'Black Knight Unicorn')
    );

    if (bkIndex === -1) {
        return { success: false, reason: "Black Knight Unicorn is not in player's stable." };
    }

    if (targetData.skipped) {
        return { success: true, protected: false };
    }

    const sacResult = sacrificeCard(gameState, playerName, bkIndex);

    if (sacResult.success) {
        return {
            success: true,
            protected: true,
            sacrificedCard: sacResult.card,
            message: `${playerName} sacrificed Black Knight Unicorn to save their Unicorn!`
        };
    }

    return sacResult;
}

export function createDeck() {
    const decks = buildInitialDecks();
    return Array.isArray(decks) ? decks : (decks.drawPile || []);
}

export function isUnicornCard(card, gameState = null, ownerName = null) {
    if (!card) return false;
    const cat = (card.category || card.type || card.cardType || '').toString().toUpperCase();

    // Must contain UNICORN, BASIC, or BABY (Excludes MAGIC, UPGRADE, DOWNGRADE)
    const isUnicorn = cat.includes('UNICORN') || cat.includes('BASIC') || cat.includes('BABY');
    if (!isUnicorn) return false;

    // Check if transformed to Panda via Pandamonium
    if (gameState && ownerName && typeof Pandamonium === 'function' && Pandamonium(gameState, ownerName)) {
        return false;
    }

    return true;
}

export function isBabyCard(card, gameState = null, ownerName = null) {
    if (!card) return false;
    if (!isUnicornCard(card, gameState, ownerName)) return false;

    const cat = (card.category || card.type || '').toString().toUpperCase();
    return cat.includes('BABY') || card.isBaby === true;
}

export function isBasicUnicorn(card, gameState = null, ownerName = null) {
    if (!card) return false;
    if (!isUnicornCard(card, gameState, ownerName)) return false;

    const cat = (card.category || card.type || '').toString().toUpperCase();
    return cat.includes('BASIC');
}