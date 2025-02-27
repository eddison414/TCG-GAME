// Define the game constants
const CARD_TYPES = {
    CREATURE: 'creature',
    SPELL: 'spell',
    APPRENTICE: 'apprentice'  // New card type for apprentice cards
};

// Game phases
const GAME_PHASES = {
    DRAW: 'draw',
    PLAY: 'play',
    ATTACK: 'attack',
    END: 'end'
};

// Field limits
const MAX_CREATURES = 6;
const MAX_APPRENTICES = 3;
const STARTING_COINS = 10;

// Initialize the game state with new apprentice deck
const gameState = {
    currentPhase: GAME_PHASES.DRAW,
    currentPlayer: 'playerA',
    turn: 1,
    gameLog: [],
    players: {
        playerA: {
            name: 'Player A',
            coins: STARTING_COINS,
            deck: [],
            hand: [],
            field: [],
            security: [],
            trashPile: [],
            apprenticeDeck: [],  // New deck for apprentice cards
            apprenticeZone: [],   // New zone to place active apprentice cards
            hasPlayedApprentice: false // Track if player has summoned an apprentice this turn
        },
        playerB: {
            name: 'Player B (AI)',
            coins: STARTING_COINS,
            deck: [],
            hand: [],
            field: [],
            security: [],
            trashPile: [],
            apprenticeDeck: [],  // New deck for apprentice cards
            apprenticeZone: [],   // New zone to place active apprentice cards
            hasPlayedApprentice: false // Track if player has summoned an apprentice this turn
        }
    },
    evolution: {
        isEvolutionMode: false,
        sourceCard: null,
        targetZone: null
    }
};

// Deck builder object extended with apprentice cards
const deckBuilder = {
    playerDeck: [],
    playerApprenticeDeck: [],  // New array for apprentice deck
    minDeckSize: 30,
    maxDeckSize: 50,
    maxApprenticeDeckSize: 5,  // Limit for apprentice cards
    cardDatabase: [], // Will be populated with available cards
    apprenticeDatabase: [], // Will be populated with apprentice cards

    initialize: function () {
        // Use the exact filenames from the images folder
        const imagePath = 'images/';

        // Populate card database with available templates
        this.cardDatabase = [
            { templateId: 'warrior', name: 'Warrior', type: CARD_TYPES.CREATURE, cost: 3, cp: 5000, stats: { STR: 5, DEX: 3, VIT: 4, INT: 2 }, image: imagePath + 'warrior_grunt.png' },
            { templateId: 'mage', name: 'Mage Apprentice', type: CARD_TYPES.CREATURE, cost: 2, cp: 3000, stats: { STR: 2, DEX: 3, VIT: 2, INT: 5 }, image: imagePath + 'mage_apprentice.png', effect: 'Draw 1 card when played' },
            { templateId: 'rogue', name: 'Rogue Scout', type: CARD_TYPES.CREATURE, cost: 2, cp: 4000, stats: { STR: 3, DEX: 5, VIT: 2, INT: 3 }, image: imagePath + 'rogue_scout.png', ability: 'Stealth' },
            { templateId: 'paladin', name: 'Paladin Guard', type: CARD_TYPES.CREATURE, cost: 4, cp: 4000, stats: { STR: 4, DEX: 2, VIT: 5, INT: 3 }, image: imagePath + 'paladin_guard.png', ability: '+1000 CP when blocking' },
            { templateId: 'fireball', name: 'Fireball', type: CARD_TYPES.SPELL, cost: 3, stats: { STR: 0, DEX: 0, VIT: 0, INT: 5 }, image: imagePath + 'card_back.png', effect: 'Deal 3000 damage to target creature', securityEffect: 'Deal 2000 damage to the attacking creature' },
            { templateId: 'healing', name: 'Healing Wave', type: CARD_TYPES.SPELL, cost: 2, stats: { STR: 0, DEX: 0, VIT: 5, INT: 3 }, image: imagePath + 'card_back.png', effect: 'Restore 2000 CP to target creature', securityEffect: 'Add this card to your hand' }
        ];

        // Initialize apprentice cards (with Anastasia as the first one)
        this.apprenticeDatabase = [
            { 
                templateId: 'anastasia', 
                name: 'Apprentice Anastasia', 
                type: CARD_TYPES.APPRENTICE, 
                cost: 1, 
                stats: { STR: 1, DEX: 1, VIT: 1, INT: 3 }, 
                image: imagePath + 'apprentice_anastasia.png',
                passive: { stat: 'INT', value: 30 },
                effect: 'Grants +30 INT to evolved form'
            },
            {
                templateId: 'brendan', 
                name: 'Apprentice Brendan', 
                type: CARD_TYPES.APPRENTICE, 
                cost: 1, 
                stats: { STR: 2, DEX: 3, VIT: 1, INT: 4 }, 
                image: imagePath + 'apprentice_brendan.png',
                passive: { stat: 'DEX', value: 25 },
                effect: 'Grants +25 DEX to evolved form'
            }
        ];

        // Start with a default deck for Player A
        this.playerDeck = this.generateDefaultDeck();

        // Start with a default apprentice deck
        this.playerApprenticeDeck = this.generateDefaultApprenticeDeck();

        console.log("Deck builder initialized with", this.playerDeck.length, "cards and",
            this.playerApprenticeDeck.length, "apprentice cards");
    },

    generateDefaultDeck: function () {
        // Create a simple default deck
        const defaultDeck = [];

        // Add some of each card type
        for (let i = 0; i < 8; i++) {
            defaultDeck.push(this.cardDatabase[0]); // Warriors
        }
        for (let i = 0; i < 8; i++) {
            defaultDeck.push(this.cardDatabase[1]); // Mages
        }
        for (let i = 0; i < 6; i++) {
            defaultDeck.push(this.cardDatabase[2]); // Rogues
        }
        for (let i = 0; i < 6; i++) {
            defaultDeck.push(this.cardDatabase[3]); // Paladins
        }
        for (let i = 0; i < 4; i++) {
            defaultDeck.push(this.cardDatabase[4]); // Fireballs
        }
        for (let i = 0; i < 4; i++) {
            defaultDeck.push(this.cardDatabase[5]); // Healing Waves
        }

        return defaultDeck;
    },

    generateDefaultApprenticeDeck: function () {
        // Create a simple default apprentice deck
        const defaultApprenticeDeck = [];

        // Add 3 Anastasia cards for now
        for (let i = 0; i < 3; i++) {
            defaultApprenticeDeck.push(this.apprenticeDatabase[0]);
        }

        // Add 2 Brendan cards
        for (let i = 0; i < 2; i++) {
            defaultApprenticeDeck.push(this.apprenticeDatabase[1]);
        }

        return defaultApprenticeDeck;
    }
};

// DOM Elements reference
const domElements = {};

// Initialize DOM elements after the document is loaded
function initializeDomElements() {
    domElements.coinDisplay = document.getElementById('coinDisplay');
    domElements.playerAHand = document.getElementById('playerAHand');
    domElements.playerAField = document.getElementById('playerAField');
    domElements.playerASecurity = document.getElementById('playerASecurity');
    domElements.playerBHand = document.getElementById('playerBHand');
    domElements.playerBField = document.getElementById('playerBField');
    domElements.playerBSecurity = document.getElementById('playerBSecurity');
    domElements.chatHistory = document.getElementById('chatHistory');

    // New elements for apprentice zones
    domElements.playerAApprentice = document.getElementById('playerAApprentice');
    domElements.playerBApprentice = document.getElementById('playerBApprentice');
}

// Helper function to create a card from a template
function createCardFromTemplate(templateId, isApprentice = false) {
    const database = isApprentice ? deckBuilder.apprenticeDatabase : deckBuilder.cardDatabase;
    const template = database.find(card => card.templateId === templateId);

    if (!template) {
        console.error(`Template with ID ${templateId} not found in ${isApprentice ? 'apprentice' : 'main'} database!`);
        return null;
    }

    // Create a deep copy of the template with a unique ID
    const card = JSON.parse(JSON.stringify(template));
    card.id = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Set default values for card state
    card.hasAttacked = false;
    card.canAttack = false;
    card.hasAttackedBefore = false;
    card.isEvolved = false;
    card.appliedPassives = [];  // To track which passives have been applied

    return card;
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Log game events to the chat history
function logGameEvent(message) {
    // Add to game log array
    gameState.gameLog.push({ turn: gameState.turn, message: message });

    // Update UI if DOM is ready
    if (domElements.chatHistory) {
        const entry = document.createElement('div');
        entry.className = 'chat-entry';
        entry.textContent = `Turn ${gameState.turn}: ${message}`;
        domElements.chatHistory.appendChild(entry);

        // Auto-scroll to the latest message
        domElements.chatHistory.scrollTop = domElements.chatHistory.scrollHeight;
    }

    // Also log to console for debugging
    console.log(`[Turn ${gameState.turn}] ${message}`);
}

// Initialize a default deck
function initializeDeck() {
    const deck = [];

    // Create a simple default deck with 36 cards
    deckBuilder.cardDatabase.forEach(template => {
        // Add 6 of each card type
        for (let i = 0; i < 6; i++) {
            deck.push(createCardFromTemplate(template.templateId));
        }
    });

    return deck;
}

// Initialize a default apprentice deck
function initializeApprenticeDeck() {
    const deck = [];

    // Create 3 copies of each apprentice card
    deckBuilder.apprenticeDatabase.forEach(template => {
        for (let i = 0; i < 3; i++) {
            deck.push(createCardFromTemplate(template.templateId, true));
        }
    });

    return deck;
}

// Draw a card for the specified player
function drawCard(playerKey, count = 1, isApprentice = false) {
    const player = gameState.players[playerKey];
    const deckSource = isApprentice ? 'apprenticeDeck' : 'deck';
    const handTarget = isApprentice ? 'apprenticeDeck' : 'hand'; // Apprentice cards go back to apprentice deck

    for (let i = 0; i < count; i++) {
        if (player[deckSource].length === 0) {
            logGameEvent(`${player.name} has no ${isApprentice ? 'apprentice ' : ''}cards left to draw!`);

            if (!isApprentice) {
                // Implement deck out loss condition for main deck only
                const opponent = playerKey === 'playerA' ? 'playerB' : 'playerA';
                logGameEvent(`${gameState.players[opponent].name} wins by deck out!`);

                setTimeout(() => {
                    alert(`${gameState.players[opponent].name} wins by deck out!`);
                    initializeGame();
                }, 1000);
            }

            return;
        }

        // Draw the top card of the deck
        const drawnCard = player[deckSource].shift();

        if (isApprentice) {
            // Check if player has already summoned an apprentice this turn
            if (player.hasPlayedApprentice && gameState.currentPhase === GAME_PHASES.PLAY) {
                logGameEvent(`${player.name} can't summon more than one apprentice per turn!`);
                player[deckSource].push(drawnCard); // Put the card back
                return;
            }

            // Apprentice cards go directly to apprentice zone, if there's room
            if (player.apprenticeZone.length < MAX_APPRENTICES) { // Maximum 3 apprentices at a time
                player.apprenticeZone.push(drawnCard);
                player.hasPlayedApprentice = true; // Mark that player has summoned an apprentice this turn
                logGameEvent(`${player.name} summons ${drawnCard.name} to the apprentice zone`);
            } else {
                // If apprentice zone is full, card goes back to the bottom of the deck
                player[deckSource].push(drawnCard);
                logGameEvent(`${player.name} can't summon ${drawnCard.name} - apprentice zone is full`);
            }
        } else {
            // Regular cards go to hand
            player.hand.push(drawnCard);
            logGameEvent(`${player.name} draws a card (${drawnCard.name})`);
        }
    }

    // Update the UI
    updateUI();
}

// Function for optional card draw during play phase (costs 1 coin)
function optionalCardDraw(playerKey) {
    const player = gameState.players[playerKey];
    
    // Check if player has enough coins
    if (player.coins < 1) {
        logGameEvent(`${player.name} doesn't have enough coins to draw a card.`);
        return;
    }
    
    // Deduct coin and draw a card
    player.coins--;
    drawCard(playerKey, 1);
    logGameEvent(`${player.name} spent 1 coin to draw an additional card.`);
    
    updateUI();
}

// Function to initialize the player's deck using the deck builder
function initializePlayerDeck(playerKey) {
    const player = gameState.players[playerKey];

    // Clear existing deck
    player.deck = [];

    // Use deck builder's player deck if available
    if (deckBuilder.playerDeck.length >= deckBuilder.minDeckSize) {
        deckBuilder.playerDeck.forEach(item => {
            player.deck.push(createCardFromTemplate(item.templateId));
        });

        logGameEvent(`${player.name} is using a custom deck (${player.deck.length} cards)`);
    } else {
        // Fallback to default deck initialization
        player.deck = initializeDeck();
        logGameEvent(`${player.name} is using a default deck (${player.deck.length} cards)`);
    }

    // Shuffle the deck
    shuffle(player.deck);

    return player.deck;
}

// Function to initialize the player's apprentice deck
function initializePlayerApprenticeDeck(playerKey) {
    const player = gameState.players[playerKey];

    // Clear existing apprentice deck
    player.apprenticeDeck = [];

    // Use deck builder's apprentice deck if available
    if (deckBuilder.playerApprenticeDeck.length > 0) {
        deckBuilder.playerApprenticeDeck.forEach(item => {
            player.apprenticeDeck.push(createCardFromTemplate(item.templateId, true));
        });

        logGameEvent(`${player.name} is using a custom apprentice deck (${player.apprenticeDeck.length} cards)`);
    } else {
        // Fallback to default apprentice deck initialization
        player.apprenticeDeck = initializeApprenticeDeck();
        logGameEvent(`${player.name} is using a default apprentice deck (${player.apprenticeDeck.length} cards)`);
    }

    // Shuffle the apprentice deck
    shuffle(player.apprenticeDeck);

    return player.apprenticeDeck;
}

// Update UI
function updateUI() {
    const currentPlayerObj = gameState.players[gameState.currentPlayer];

    // Update coin display and turn info
    domElements.coinDisplay.textContent = `${currentPlayerObj.name}'s Coins: ${currentPlayerObj.coins} | Turn: ${gameState.turn} | Phase: ${gameState.currentPhase}`;

    // Update security counts
    domElements.playerASecurity.textContent = `Security: ${gameState.players.playerA.security.length}`;
    domElements.playerBSecurity.textContent = `Security: ${gameState.players.playerB.security.length}`;

    // Render Player A's Field
    renderPlayerField('playerA');

    // Render Player B's Field
    renderPlayerField('playerB');

    // Render Player A's Hand
    renderPlayerHand('playerA');

    // Render Player B's Hand (face down)
    renderPlayerHand('playerB', true);

    // Render apprentice zones
    renderApprenticeZone('playerA');
    renderApprenticeZone('playerB');

    // Update phase button states
    updatePhaseButtons();

    // Update optional draw button
    updateOptionalDrawButton();

    // AI turn handling
    if (gameState.currentPlayer === 'playerB') {
        setTimeout(aiTakeAction, 1000); // AI acts after a 1-second delay
    }
}

// Update phase button states based on current phase
function updatePhaseButtons() {
    // Safety check if buttons exist
    if (!document.getElementById('draw-phase-btn')) return;

    const buttons = {
        draw: document.getElementById('draw-phase-btn'),
        play: document.getElementById('play-phase-btn'),
        attack: document.getElementById('attack-phase-btn'),
        end: document.getElementById('end-phase-btn')
    };

    // Reset all buttons
    Object.values(buttons).forEach(btn => {
        btn.classList.remove('active');
        btn.disabled = gameState.currentPlayer !== 'playerA';
    });

    // Highlight current phase
    switch (gameState.currentPhase) {
        case GAME_PHASES.DRAW:
            buttons.draw.classList.add('active');
            break;
        case GAME_PHASES.PLAY:
            buttons.play.classList.add('active');
            break;
        case GAME_PHASES.ATTACK:
            buttons.attack.classList.add('active');
            break;
        case GAME_PHASES.END:
            buttons.end.classList.add('active');
            break;
    }
}

// Update optional draw button visibility
function updateOptionalDrawButton() {
    const optionalDrawBtn = document.getElementById('optional-draw-btn');
    if (!optionalDrawBtn) return;

    // Only show during play phase and if player has at least 1 coin
    if (gameState.currentPhase === GAME_PHASES.PLAY && 
        gameState.currentPlayer === 'playerA' && 
        gameState.players.playerA.coins >= 1) {
        optionalDrawBtn.style.display = 'inline-block';
    } else {
        optionalDrawBtn.style.display = 'none';
    }
}

// Count creatures on field
function countCreatures(playerKey) {
    return gameState.players[playerKey].field.filter(card => card.type === CARD_TYPES.CREATURE).length;
}

// Render a player's field
function renderPlayerField(playerKey) {
    const player = gameState.players[playerKey];
    const fieldElement = domElements[`${playerKey}Field`];
    fieldElement.innerHTML = '';

    // Add field limit indicator
    const fieldLimitIndicator = document.createElement('div');
    fieldLimitIndicator.className = 'field-limit';
    fieldLimitIndicator.textContent = `Creatures: ${countCreatures(playerKey)}/${MAX_CREATURES}`;
    fieldElement.appendChild(fieldLimitIndicator);
    
    // Create battlefield grid container
    const battlefieldGrid = document.createElement('div');
    battlefieldGrid.className = 'battlefield-grid';
    fieldElement.appendChild(battlefieldGrid);
    
    // Create front row
    const frontRow = document.createElement('div');
    frontRow.className = 'battlefield-row front-row';
    
    // Create front row label
    const frontRowLabel = document.createElement('div');
    frontRowLabel.className = 'row-label';
    frontRowLabel.textContent = 'Front';
    frontRow.appendChild(frontRowLabel);
    
    // Create front row card container
    const frontRowCards = document.createElement('div');
    frontRowCards.className = 'row-cards';
    frontRow.appendChild(frontRowCards);
    
    // Create back row
    const backRow = document.createElement('div');
    backRow.className = 'battlefield-row back-row';
    
    // Create back row label
    const backRowLabel = document.createElement('div');
    backRowLabel.className = 'row-label';
    backRowLabel.textContent = 'Back';
    backRow.appendChild(backRowLabel);
    
    // Create back row card container
    const backRowCards = document.createElement('div');
    backRowCards.className = 'row-cards';
    backRow.appendChild(backRowCards);
    
    // Append rows to battlefield grid
    battlefieldGrid.appendChild(frontRow);
    battlefieldGrid.appendChild(backRow);
    
    // Separate cards into front and back rows (first 3 in front, rest in back)
    const frontRowIndices = [];
    const backRowIndices = [];
    
    player.field.forEach((card, index) => {
        if (index < 3) {
            frontRowIndices.push(index);
        } else if (index < 6) {
            backRowIndices.push(index);
        }
    });
    
    // Create slots for front row (3 slots)
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        
        // If we have a card for this slot
        if (i < frontRowIndices.length) {
            const cardIndex = frontRowIndices[i];
            const card = player.field[cardIndex];
            const cardElement = createCardElement(card);
            
            // Add active/exhausted visual state
            if (card.hasAttacked) {
                cardElement.classList.add('exhausted');
                cardElement.style.transform = 'rotate(90deg)';
            }
            
            // Add card ability text if present
            if (card.ability) {
                const abilityElement = document.createElement('div');
                abilityElement.className = 'passive';
                abilityElement.textContent = card.ability;
                cardElement.appendChild(abilityElement);
            }
            
            // Show evolved status if applicable
            if (card.isEvolved) {
                const evolvedElement = document.createElement('div');
                evolvedElement.className = 'evolved-indicator';
                evolvedElement.textContent = '★ Evolved';
                evolvedElement.style.position = 'absolute';
                evolvedElement.style.top = '20px';
                evolvedElement.style.width = '100%';
                evolvedElement.style.textAlign = 'center';
                evolvedElement.style.color = 'gold';
                evolvedElement.style.textShadow = '1px 1px 2px black';
                evolvedElement.style.fontWeight = 'bold';
                cardElement.appendChild(evolvedElement);
            }
            
            // Add attack functionality only for current player's cards that can attack
            if (playerKey === gameState.currentPlayer &&
                gameState.currentPhase === GAME_PHASES.ATTACK &&
                card.type === CARD_TYPES.CREATURE &&
                !card.hasAttacked &&
                card.canAttack) {
                cardElement.onclick = () => attackWithCreature(playerKey, cardIndex);
                cardElement.classList.add('attackable');
            } else {
                cardElement.classList.add('disabled');
            }
            
            slot.appendChild(cardElement);
        }
        
        frontRowCards.appendChild(slot);
    }
    
    // Create slots for back row (3 slots)
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        
        // If we have a card for this slot
        if (i < backRowIndices.length) {
            const cardIndex = backRowIndices[i];
            const card = player.field[cardIndex];
            const cardElement = createCardElement(card);
            
            // Add active/exhausted visual state
            if (card.hasAttacked) {
                cardElement.classList.add('exhausted');
                cardElement.style.transform = 'rotate(90deg)';
            }
            
            // Add card ability text if present
            if (card.ability) {
                const abilityElement = document.createElement('div');
                abilityElement.className = 'passive';
                abilityElement.textContent = card.ability;
                cardElement.appendChild(abilityElement);
            }
            
            // Show evolved status if applicable
            if (card.isEvolved) {
                const evolvedElement = document.createElement('div');
                evolvedElement.className = 'evolved-indicator';
                evolvedElement.textContent = '★ Evolved';
                evolvedElement.style.position = 'absolute';
                evolvedElement.style.top = '20px';
                evolvedElement.style.width = '100%';
                evolvedElement.style.textAlign = 'center';
                evolvedElement.style.color = 'gold';
                evolvedElement.style.textShadow = '1px 1px 2px black';
                evolvedElement.style.fontWeight = 'bold';
                cardElement.appendChild(evolvedElement);
            }
            
            // Add attack functionality only for current player's cards that can attack
            if (playerKey === gameState.currentPlayer &&
                gameState.currentPhase === GAME_PHASES.ATTACK &&
                card.type === CARD_TYPES.CREATURE &&
                !card.hasAttacked &&
                card.canAttack) {
                cardElement.onclick = () => attackWithCreature(playerKey, cardIndex);
                cardElement.classList.add('attackable');
            } else {
                cardElement.classList.add('disabled');
            }
            
            slot.appendChild(cardElement);
        }
        
        backRowCards.appendChild(slot);
    }
    
    // Add placeholder text if field is empty
    if (player.field.length === 0) {
        const placeholderText = document.createElement('div');
        placeholderText.textContent = 'No cards in play';
        placeholderText.className = 'placeholder-text';
        battlefieldGrid.innerHTML = '';
        battlefieldGrid.appendChild(placeholderText);
    }
}

// Render a player's hand
function renderPlayerHand(playerKey, faceDown = false) {
    const player = gameState.players[playerKey];
    const handElement = domElements[`${playerKey}Hand`];
    handElement.innerHTML = '';

    if (faceDown) {
        // Render face-down cards for opponent
        for (let i = 0; i < player.hand.length; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = 'url(/Game/TCG-GAME/images/card_back.png)';
            handElement.appendChild(cardElement);
        }
    } else {
        // Render actual cards for player
        player.hand.forEach((card, index) => {
            const cardElement = createCardElement(card);

            // Add play functionality only for current player and play phase
            if (playerKey === gameState.currentPlayer &&
                gameState.currentPhase === GAME_PHASES.PLAY) {

                if (gameState.evolution.isEvolutionMode) {
                    // If we're in evolution mode and this is a class card, add evolution functionality
                    if (card.type === CARD_TYPES.CREATURE) {
                        cardElement.onclick = () => evolveApprentice(playerKey, index);
                        cardElement.classList.add('playable');
                    } else {
                        cardElement.classList.add('disabled');
                    }
                } else if (canPlayCard(playerKey, card)) {
                    // Check if it's a creature and if field limit is reached
                    if (card.type === CARD_TYPES.CREATURE && countCreatures(playerKey) >= MAX_CREATURES) {
                        cardElement.classList.add('disabled');
                        cardElement.title = "Field is full! Maximum 6 creatures allowed.";
                    } else {
                        cardElement.onclick = () => playCard(playerKey, index);
                        cardElement.classList.add('playable');
                    }
                } else {
                    cardElement.classList.add('disabled');
                    if (player.coins < card.cost) {
                        cardElement.title = "Not enough coins to play this card.";
                    }
                }
            } else {
                cardElement.classList.add('disabled');
            }

            handElement.appendChild(cardElement);
        });
    }

    // Add placeholder text if hand is empty
    if (player.hand.length === 0) {
        const placeholderText = document.createElement('div');
        placeholderText.textContent = 'No cards in hand';
        placeholderText.className = 'placeholder-text';
        handElement.appendChild(placeholderText);
    }
}

// Render a player's apprentice zone
function renderApprenticeZone(playerKey) {
    const player = gameState.players[playerKey];
    const apprenticeElement = domElements[`${playerKey}Apprentice`];
    apprenticeElement.innerHTML = '';

    player.apprenticeZone.forEach((card, index) => {
        const cardElement = createCardElement(card);

        // Add evolution functionality for current player during play phase
        if (playerKey === gameState.currentPlayer &&
            gameState.currentPhase === GAME_PHASES.PLAY &&
            !gameState.evolution.isEvolutionMode) {
            cardElement.onclick = () => startEvolution(playerKey, index);
            cardElement.classList.add('evolution-ready');
        } else {
            cardElement.classList.add('disabled');
        }

        apprenticeElement.appendChild(cardElement);
    });

    // Add "Draw Apprentice" button if apprentice zone isn't full and it's player's turn
    if (player.apprenticeZone.length < MAX_APPRENTICES &&
        player.apprenticeDeck.length > 0 &&
        playerKey === gameState.currentPlayer &&
        gameState.currentPhase === GAME_PHASES.PLAY &&
        !player.hasPlayedApprentice) {  // Check if player has already summoned an apprentice

        const drawButton = document.createElement('button');
        drawButton.className = 'apprentice-draw-btn';
        drawButton.textContent = 'Summon Apprentice';
        drawButton.onclick = () => drawCard(playerKey, 1, true);
        apprenticeElement.appendChild(drawButton);
    } else if (player.hasPlayedApprentice && 
               playerKey === gameState.currentPlayer && 
               gameState.currentPhase === GAME_PHASES.PLAY) {
        // Show indicator that apprentice has been summoned this turn
        const limitIndicator = document.createElement('div');
        limitIndicator.className = 'apprentice-limit';
        limitIndicator.textContent = 'Apprentice limit reached for this turn';
        limitIndicator.style.color = '#f44336';
        limitIndicator.style.fontStyle = 'italic';
        apprenticeElement.appendChild(limitIndicator);
    }

    // Add placeholder text if apprentice zone is empty
    if (player.apprenticeZone.length === 0 && apprenticeElement.childElementCount === 0) {
        const placeholderText = document.createElement('div');
        placeholderText.textContent = 'No apprentices in play';
        placeholderText.className = 'placeholder-text';
        apprenticeElement.appendChild(placeholderText);
    }
}

// Start the evolution process
function startEvolution(playerKey, apprenticeIndex) {
    const player = gameState.players[playerKey];
    const apprentice = player.apprenticeZone[apprenticeIndex];

    // Can only evolve during play phase
    if (gameState.currentPhase !== GAME_PHASES.PLAY) {
        logGameEvent("Can only evolve during play phase");
        return;
    }

    // Can only evolve your own apprentices
    if (playerKey !== gameState.currentPlayer) {
        logGameEvent("Can only evolve your own apprentices");
        return;
    }

    // Enter evolution mode
    gameState.evolution.isEvolutionMode = true;
    gameState.evolution.sourceCard = apprentice;
    gameState.evolution.targetZone = playerKey;

    logGameEvent(`${player.name} prepares to evolve ${apprentice.name}. Select a class card from your hand.`);

    // Show cancel evolution button
    if (domElements.cancelEvolutionBtn) {
        domElements.cancelEvolutionBtn.style.display = 'inline-block';
    }

    // Update UI to show selectable cards in hand
    updateUI();
}

// Cancel evolution mode
function cancelEvolution() {
    gameState.evolution.isEvolutionMode = false;
    gameState.evolution.sourceCard = null;
    gameState.evolution.targetZone = null;

    // Hide cancel evolution button
    if (domElements.cancelEvolutionBtn) {
        domElements.cancelEvolutionBtn.style.display = 'none';
    }

    logGameEvent("Evolution cancelled");
    updateUI();
}

// Evolve an apprentice into a class card
function evolveApprentice(playerKey, handIndex) {
    const player = gameState.players[playerKey];
    const classCard = player.hand[handIndex];

    // Must be a creature card to evolve
    if (classCard.type !== CARD_TYPES.CREATURE) {
        logGameEvent("Can only evolve into creature class cards");
        cancelEvolution();
        return;
    }

    // Check field limit before evolution
    if (countCreatures(playerKey) >= MAX_CREATURES) {
        logGameEvent(`Cannot evolve - field is full (max ${MAX_CREATURES} creatures)`);
        cancelEvolution();
        return;
    }

    const apprentice = gameState.evolution.sourceCard;

    // Apply passive effects from the apprentice to the class card
    if (apprentice.passive) {
        const originalStats = JSON.parse(JSON.stringify(classCard.stats));

        // Apply stat boost
        if (apprentice.passive.stat && apprentice.passive.value) {
            const stat = apprentice.passive.stat;
            const value = apprentice.passive.value;

            if (classCard.stats[stat] !== undefined) {
                classCard.stats[stat] += value;

                // Track the applied passive
                classCard.appliedPassives.push({
                    sourceCard: apprentice.name,
                    effect: `+${value} ${stat}`,
                    originalValue: originalStats[stat]
                });

                logGameEvent(`${apprentice.name}'s passive grants +${value} ${stat} to ${classCard.name}`);
            }
        }

        // Mark card as evolved
        classCard.isEvolved = true;
        classCard.evolvedFrom = apprentice.name;

        // Move class card to field
        player.field.push(classCard);

        // Remove class card from hand
        player.hand.splice(handIndex, 1);

        // Remove apprentice from apprentice zone
        const apprenticeIndex = player.apprenticeZone.findIndex(card => card.id === apprentice.id);
        if (apprenticeIndex !== -1) {
            player.apprenticeZone.splice(apprenticeIndex, 1);
        }

        // Move apprentice to trash pile
        player.trashPile.push(apprentice);

        logGameEvent(`${apprentice.name} evolved into ${classCard.name}!`);

        // Set card as unable to attack this turn
        classCard.canAttack = false;

        // Deduct coins (with a discount of 1 for evolution)
        const evolveCost = Math.max(0, classCard.cost - 1); // Ensure cost doesn't go negative
        player.coins -= evolveCost;
        logGameEvent(`Evolution cost: ${evolveCost} coins (discounted)`);
    }

    // Exit evolution mode
    gameState.evolution.isEvolutionMode = false;
    gameState.evolution.sourceCard = null;
    gameState.evolution.targetZone = null;

    // Hide cancel evolution button
    if (domElements.cancelEvolutionBtn) {
        domElements.cancelEvolutionBtn.style.display = 'none';
    }

    updateUI();
}

// Create a card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    
    // Check if image path exists, display fallback if missing
    if (card.image) {
        cardElement.style.backgroundImage = `url(${card.image})`;
    } else {
        console.warn(`No image found for card: ${card.name}`);
        // Create a fallback visual for the card
        cardElement.style.background = `linear-gradient(135deg, #444, #666)`;
    }
    
    // Adjust for new card ratio 600x800
    cardElement.style.backgroundSize = 'contain';
    cardElement.style.backgroundPosition = 'center';
    cardElement.style.backgroundRepeat = 'no-repeat';

    const nameElement = document.createElement('div');
    nameElement.className = 'name';
    nameElement.textContent = card.name;
    
    const costElement = document.createElement('div');
    costElement.className = 'cost';
    costElement.textContent = card.cost;

    if (card.cp) {
        const cpElement = document.createElement('div');
        cpElement.className = 'cp';
        cpElement.textContent = card.cp;
        cardElement.appendChild(cpElement);
    }

    const statsElement = document.createElement('div');
    statsElement.className = 'stats';
    statsElement.textContent = `STR: ${card.stats.STR} | DEX: ${card.stats.DEX} | VIT: ${card.stats.VIT} | INT: ${card.stats.INT}`;

    cardElement.appendChild(nameElement);
    cardElement.appendChild(costElement);
    cardElement.appendChild(statsElement);
    
    // Add card effect tooltip
    if (card.effect) {
        cardElement.title = card.effect;
    }
    
    // Add passive effect indicator for apprentice cards
    if (card.type === CARD_TYPES.APPRENTICE && card.passive) {
        const passiveElement = document.createElement('div');
        passiveElement.className = 'passive';
        passiveElement.textContent = `Passive: +${card.passive.value} ${card.passive.stat}`;
        cardElement.appendChild(passiveElement);
    }
    
    // Add applied passive effects for evolved cards
    if (card.appliedPassives && card.appliedPassives.length > 0) {
        card.appliedPassives.forEach(passive => {
            const passiveElement = document.createElement('div');
            passiveElement.className = 'applied-passive';
            passiveElement.textContent = passive.effect;
            passiveElement.style.position = 'absolute';
            passiveElement.style.bottom = '15px';
            passiveElement.style.width = '100%';
            passiveElement.style.textAlign = 'center';
            passiveElement.style.color = '#00aaff';
            passiveElement.style.fontWeight = 'bold';
            passiveElement.style.fontSize = '10px';
            cardElement.appendChild(passiveElement);
        });
    }
    
    // Add evolved indicator if card is evolved
    if (card.isEvolved) {
        const evolvedElement = document.createElement('div');
        evolvedElement.className = 'evolved-indicator';
        evolvedElement.textContent = '★ Evolved';
        evolvedElement.style.position = 'absolute';
        evolvedElement.style.top = '20px';
        evolvedElement.style.width = '100%';
        evolvedElement.style.textAlign = 'center';
        evolvedElement.style.color = 'gold';
        evolvedElement.style.textShadow = '1px 1px 2px black';
        evolvedElement.style.fontWeight = 'bold';
        cardElement.appendChild(evolvedElement);
    }

    return cardElement;
}

// Check if a card can be played
function canPlayCard(playerKey, card) {
    const player = gameState.players[playerKey];
    // Check if player has enough coins
    return player.coins >= card.cost;
}

// Play a card
function playCard(playerKey, handIndex) {
    const player = gameState.players[playerKey];
    if (playerKey !== gameState.currentPlayer || gameState.currentPhase !== GAME_PHASES.PLAY) {
        logGameEvent("Can't play card - not your turn or wrong phase!");
        return;
    }

    const card = player.hand[handIndex];
    const cost = card.cost;

    // Check if player has enough coins
    if (player.coins < cost) {
        logGameEvent(`Not enough coins to play ${card.name} (cost: ${cost}, available: ${player.coins})`);
        return;
    }

    // Check field limit for creatures
    if (card.type === CARD_TYPES.CREATURE && countCreatures(playerKey) >= MAX_CREATURES) {
        logGameEvent(`Cannot play ${card.name} - field is full (max ${MAX_CREATURES} creatures)`);
        return;
    }

    // Deduct coins
    player.coins -= cost;
    logGameEvent(`${player.name} spent ${cost} coins to play ${card.name}`);

    // Handle card type specific actions
    if (card.type === CARD_TYPES.CREATURE) {
        player.field.push(card);
        player.hand.splice(handIndex, 1);
        logGameEvent(`${player.name} played ${card.name} (${card.cp} CP)`);

        // Implement card effects
        if (card.name === 'Mage Apprentice') {
            drawCard(playerKey, 1);
            logGameEvent(`${card.name}'s effect: Draw 1 card`);
        }
    } else if (card.type === CARD_TYPES.SPELL) {
        // Implement spell effects
        logGameEvent(`${player.name} played ${card.name}. Effect: ${card.effect}`);

        if (card.name === 'Fireball') {
            const opponent = playerKey === 'playerA' ? 'playerB' : 'playerA';
            const opponentField = gameState.players[opponent].field;

            if (opponentField.length > 0) {
                // For AI, choose strongest enemy creature
                // For player, prompt to choose target
                let targetIndex;

                if (playerKey === 'playerA') {
                    // For simplicity, target first creature (in full game, add targeting UI)
                    targetIndex = 0;
                    // Ideally, add a function here to let player select a target
                } else {
                    // AI targets strongest enemy
                    targetIndex = opponentField.reduce((maxIndex, card, currentIndex, array) =>
                        card.cp > array[maxIndex].cp ? currentIndex : maxIndex, 0);
                }

                const targetCard = opponentField[targetIndex];
                logGameEvent(`${card.name} deals 3000 damage to ${targetCard.name}!`);

                // Check if creature is destroyed
                if (targetCard.cp <= 3000) {
                    logGameEvent(`${targetCard.name} was destroyed!`);
                    gameState.players[opponent].trashPile.push(targetCard);
                    opponentField.splice(targetIndex, 1);
                } else {
                    logGameEvent(`${targetCard.name} survived with ${targetCard.cp - 3000} CP remaining!`);
                    // In a full implementation, reduce CP temporarily or permanently
                }
            } else {
                logGameEvent("No target available for Fireball!");
            }
        } else if (card.name === 'Healing Wave') {
            const friendlyField = player.field;

            if (friendlyField.length > 0) {
                // For simplicity, heal first creature
                // In a full game, add targeting UI
                const targetIndex = 0;
                const targetCard = friendlyField[targetIndex];

                logGameEvent(`${card.name} restores 2000 CP to ${targetCard.name}!`);
                // In a full implementation, increase CP temporarily or permanently
            } else {
                logGameEvent("No target available for Healing Wave!");
            }
        }

        // Move spell to trash pile after use
        player.trashPile.push(card);
        player.hand.splice(handIndex, 1);
    }

    updateUI();
}

// Show a blocking UI prompt for the player instead of using confirm()
function showBlockingPrompt(opponent, attacker, callback) {
    // Create a modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    // Create the prompt container
    const promptContainer = document.createElement('div');
    promptContainer.className = 'block-prompt';
    promptContainer.style.backgroundColor = 'white';
    promptContainer.style.padding = '20px';
    promptContainer.style.borderRadius = '8px';
    promptContainer.style.maxWidth = '400px';
    promptContainer.style.textAlign = 'center';

    // Add prompt text
    const promptText = document.createElement('p');
    promptText.textContent = `${gameState.players[opponent].name}, do you want to block ${attacker.name}'s attack with a creature?`;
    promptContainer.appendChild(promptText);

    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';

    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes, Block';
    yesButton.className = 'phase-btn';
    yesButton.style.padding = '10px 20px';

    const noButton = document.createElement('button');
    noButton.textContent = 'No, Allow Attack';
    noButton.className = 'phase-btn';
    noButton.style.padding = '10px 20px';

    // Add click event listeners
    yesButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        callback(true);
    });

    noButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        callback(false);
    });

    // Append buttons to container
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    promptContainer.appendChild(buttonContainer);

    // Append prompt to overlay
    modalOverlay.appendChild(promptContainer);

    // Add to document
    document.body.appendChild(modalOverlay);
}

// Attack with a creature
function attackWithCreature(playerKey, fieldIndex) {
    const player = gameState.players[playerKey];
    const opponent = playerKey === 'playerA' ? 'playerB' : 'playerA';

    if (playerKey !== gameState.currentPlayer || gameState.currentPhase !== GAME_PHASES.ATTACK) {
        logGameEvent("Can't attack - not your turn or wrong phase!");
        return;
    }

    const attacker = player.field[fieldIndex];

    // Check if card can attack
    if (!attacker.canAttack || attacker.hasAttacked) {
        logGameEvent(`${attacker.name} cannot attack right now!`);
        return;
    }

    // Mark card as having attacked
    attacker.hasAttacked = true;

    // Deduct 1 coin for attacking (if player has coins)
    if (player.coins >= 1) {
        player.coins -= 1;
        logGameEvent(`${player.name} spent 1 coin for attack action`);
    } else {
        logGameEvent(`${player.name} has no coins left but can still attack`);
    }

    logGameEvent(`${player.name}'s ${attacker.name} (${attacker.cp} CP) is attacking!`);

    // Check if Rogue Scout's Stealth ability applies
    const hasStealth = attacker.name === 'Rogue Scout' &&
        attacker.ability === 'Stealth' &&
        !attacker.hasAttackedBefore;

    if (hasStealth) {
        logGameEvent(`${attacker.name}'s Stealth ability prevents blocking!`);
        attacker.hasAttackedBefore = true;
        processAttackWithoutBlock(playerKey, fieldIndex, attacker, opponent);
        return;
    }

    // Check if opponent will block
    if (gameState.players[opponent].field.length > 0) {
        if (opponent === 'playerA') {
            // For human player, use UI to ask for block
            showBlockingPrompt(opponent, attacker, (wantsToBlock) => {
                if (wantsToBlock) {
                    // For simplicity, use first creature. In a real game, allow player to choose.
                    const blockerIndex = 0;
                    processBlock(playerKey, fieldIndex, opponent, blockerIndex);
                } else {
                    processAttackWithoutBlock(playerKey, fieldIndex, attacker, opponent);
                }
            });
        } else {
            // AI decides whether to block
            const blockDecision = aiDecideToBlock(opponent, attacker);
            if (blockDecision.block) {
                processBlock(playerKey, fieldIndex, opponent, blockDecision.blockerIndex);
            } else {
                processAttackWithoutBlock(playerKey, fieldIndex, attacker, opponent);
            }
        }
    } else {
        // No creatures to block with
        processAttackWithoutBlock(playerKey, fieldIndex, attacker, opponent);
    }
}

// Process a block
function processBlock(playerKey, attackerIndex, opponent, blockerIndex) {
    const player = gameState.players[playerKey];
    const attacker = player.field[attackerIndex];
    const blocker = gameState.players[opponent].field[blockerIndex];

    logGameEvent(`${gameState.players[opponent].name} blocks with ${blocker.name} (${blocker.cp} CP)`);

    // Apply Paladin Guard special ability if applicable
    let blockerBonus = 0;
    if (blocker.name === 'Paladin Guard') {
        blockerBonus = 1000;
        logGameEvent(`${blocker.name}'s ability reduces damage by 1000!`);
    }

    // Compare CP to determine winner
    if (attacker.cp > blocker.cp + blockerBonus) {
        logGameEvent(`${blocker.name} was defeated in battle!`);
        gameState.players[opponent].trashPile.push(blocker);
        gameState.players[opponent].field.splice(blockerIndex, 1);
    } else {
        logGameEvent(`${attacker.name}'s attack was blocked!`);
        if (attacker.cp < blocker.cp) {
            logGameEvent(`${attacker.name} was defeated in battle!`);
            player.trashPile.push(attacker);
            player.field.splice(attackerIndex, 1);
        } else {
            logGameEvent("Both creatures survived the battle!");
        }
    }

    updateUI();
}

// Process an attack that wasn't blocked
function processAttackWithoutBlock(playerKey, fieldIndex, attacker, opponent) {
    const player = gameState.players[playerKey];

    // Attack goes through to security stack
    if (gameState.players[opponent].security.length > 0) {
        const securityCard = gameState.players[opponent].security.pop();
        logGameEvent(`Security card revealed: ${securityCard.name}!`);

        // Handle security card effects
        if (securityCard.type === CARD_TYPES.CREATURE) {
            logGameEvent(`Security creature ${securityCard.name} (${securityCard.cp} CP) defends!`);
            if (attacker.cp > securityCard.cp) {
                logGameEvent(`${securityCard.name} was defeated!`);
                gameState.players[opponent].trashPile.push(securityCard);
            } else {
                logGameEvent(`${attacker.name} was defeated by security!`);
                player.trashPile.push(attacker);
                player.field.splice(fieldIndex, 1);
                gameState.players[opponent].hand.push(securityCard);
            }
        } else if (securityCard.type === CARD_TYPES.SPELL) {
            logGameEvent(`Security effect: ${securityCard.securityEffect || securityCard.effect}`);

            // Implement security effects
            if (securityCard.name === 'Fireball') {
                logGameEvent(`Fireball deals 2000 damage to ${attacker.name}!`);
                if (attacker.cp <= 2000) {
                    logGameEvent(`${attacker.name} was destroyed!`);
                    player.trashPile.push(attacker);
                    player.field.splice(fieldIndex, 1);
                } else {
                    logGameEvent(`${attacker.name} survived with ${attacker.cp - 2000} CP!`);
                }
            } else if (securityCard.name === 'Healing Wave') {
                logGameEvent(`${securityCard.securityEffect || securityCard.effect}`);
                gameState.players[opponent].hand.push(securityCard);
            }

            if (securityCard.name !== 'Healing Wave') {
                gameState.players[opponent].trashPile.push(securityCard);
            }
        }
    } else {
        logGameEvent(`${player.name} wins! ${gameState.players[opponent].name} has no security left!`);
        setTimeout(() => {
            alert(`${player.name} wins!`);
            initializeGame();
        }, 1000);
        return;
    }

    updateUI();
}

// AI decides whether to block and which card to use
function aiDecideToBlock(playerKey, attacker) {
    const player = gameState.players[playerKey];
    let bestBlockerIndex = -1;
    let bestBlockerValue = -Infinity;

    // Go through potential blockers and find the best one
    for (let i = 0; i < player.field.length; i++) {
        const blocker = player.field[i];
        if (blocker.type !== CARD_TYPES.CREATURE) continue;

        // Calculate blocker's value (CP + any special abilities)
        let blockerValue = blocker.cp;

        // Paladin Guard gets bonus for blocking
        if (blocker.name === 'Paladin Guard') {
            blockerValue += 1000;
        }

        // If blocker can defeat attacker, consider it
        if (blockerValue >= attacker.cp) {
            // Choose the blocker with the lowest CP that can still win
            // (to preserve stronger creatures for attacking)
            if (bestBlockerIndex === -1 || blockerValue < bestBlockerValue) {
                bestBlockerIndex = i;
                bestBlockerValue = blockerValue;
            }
        }
    }

    // Decide whether to block based on best blocker
    if (bestBlockerIndex !== -1) {
        return { block: true, blockerIndex: bestBlockerIndex };
    }

    return { block: false, blockerIndex: -1 };
}

// AI takes an action
function aiTakeAction() {
    if (gameState.currentPlayer !== 'playerB') return;

    // Handle different game phases
    switch (gameState.currentPhase) {
        case GAME_PHASES.DRAW:
            // Draw a card at start of turn
            drawCard('playerB');

            // Reset all creatures' attack eligibility
            gameState.players.playerB.field.forEach(card => {
                card.canAttack = true;
                card.hasAttacked = false;
            });

            // Reset coins to 10 at the start of turn
            gameState.players.playerB.coins = STARTING_COINS;
            logGameEvent(`AI receives ${STARTING_COINS} coins for this turn`);

            // Reset apprentice summon flag
            gameState.players.playerB.hasPlayedApprentice = false;

            // Move to Play phase
            gameState.currentPhase = GAME_PHASES.PLAY;
            logGameEvent("AI enters play phase");
            updateUI();
            setTimeout(aiTakeAction, 1000);
            break;

        case GAME_PHASES.PLAY:
            // Try to play cards
            let cardPlayed = false;

            // First check if we should summon an apprentice
            if (gameState.players.playerB.apprenticeZone.length < MAX_APPRENTICES &&
                gameState.players.playerB.apprenticeDeck.length > 0 &&
                !gameState.players.playerB.hasPlayedApprentice &&
                Math.random() > 0.3) { // 70% chance to summon apprentice if possible
                drawCard('playerB', 1, true);
                cardPlayed = true;
                setTimeout(aiTakeAction, 1000);
                return;
            }

            // Try to evolve an apprentice if we have one and a class card
            if (gameState.players.playerB.apprenticeZone.length > 0 &&
                !cardPlayed &&
                Math.random() > 0.2) { // 80% chance to try evolution

                // Find a class card in hand
                const classCards = gameState.players.playerB.hand.filter(card =>
                    card.type === CARD_TYPES.CREATURE && 
                    canPlayCard('playerB', card) &&
                    countCreatures('playerB') < MAX_CREATURES
                );

                if (classCards.length > 0) {
                    // Choose first apprentice and random class card
                    const apprenticeIndex = 0;
                    const classCard = classCards[Math.floor(Math.random() * classCards.length)];
                    const handIndex = gameState.players.playerB.hand.findIndex(card => card.id === classCard.id);

                    // Start evolution
                    startEvolution('playerB', apprenticeIndex);

                    // Complete evolution
                    evolveApprentice('playerB', handIndex);

                    cardPlayed = true;
                    setTimeout(aiTakeAction, 1500);
                    return;
                }
            }

            // Decide whether to use the optional card draw (50% chance if affordable)
            if (gameState.players.playerB.coins >= 1 && Math.random() > 0.5) {
                optionalCardDraw('playerB');
                setTimeout(aiTakeAction, 1000);
                return;
            }

            // If no evolution, try to play creatures (highest CP first)
            if (!cardPlayed) {
                const playableCreatures = gameState.players.playerB.hand.filter(card =>
                    card.type === CARD_TYPES.CREATURE && 
                    canPlayCard('playerB', card) &&
                    countCreatures('playerB') < MAX_CREATURES
                );

                if (playableCreatures.length > 0) {
                    // Sort by highest CP
                    playableCreatures.sort((a, b) => b.cp - a.cp);
                    const cardToPlay = playableCreatures[0];
                    const handIndex = gameState.players.playerB.hand.findIndex(card => card.id === cardToPlay.id);

                    if (handIndex !== -1) {
                        playCard('playerB', handIndex);
                        cardPlayed = true;

                        // Give the player a chance to see what happened before AI's next action
                        setTimeout(aiTakeAction, 1000);
                        return;
                    }
                }
            }

            // If no creatures to play, consider spells
            if (!cardPlayed) {
                const playableSpells = gameState.players.playerB.hand.filter(card =>
                    card.type === CARD_TYPES.SPELL && canPlayCard('playerB', card)
                );

                if (playableSpells.length > 0) {
                    // Sort by cost (highest first, for more impactful spells)
                    playableSpells.sort((a, b) => b.cost - a.cost);
                    const cardToPlay = playableSpells[0];
                    const handIndex = gameState.players.playerB.hand.findIndex(card => card.id === cardToPlay.id);

                    if (handIndex !== -1) {
                        playCard('playerB', handIndex);
                        cardPlayed = true;

                        // Give the player a chance to see what happened before AI's next action
                        setTimeout(aiTakeAction, 1000);
                        return;
                    }
                }
            }

            // If no cards played, move to attack phase
            if (!cardPlayed) {
                gameState.currentPhase = GAME_PHASES.ATTACK;
                logGameEvent("AI enters attack phase");
                updateUI();
                setTimeout(aiTakeAction, 1000);
            }
            break;

        case GAME_PHASES.ATTACK:
            // Try to attack with creatures
            let attackMade = false;

            // Get all attackable creatures (highest CP first)
            const attackers = gameState.players.playerB.field
                .map((card, index) => ({ card, index }))
                .filter(item =>
                    item.card.type === CARD_TYPES.CREATURE &&
                    item.card.canAttack &&
                    !item.card.hasAttacked
                )
                .sort((a, b) => b.card.cp - a.card.cp);

            if (attackers.length > 0) {
                // Attack with strongest creature first
                const attacker = attackers[0];
                attackWithCreature('playerB', attacker.index);
                attackMade = true;

                // Check if there are more creatures to attack with
                const remainingAttackers = gameState.players.playerB.field
                    .filter(card =>
                        card.type === CARD_TYPES.CREATURE &&
                        card.canAttack &&
                        !card.card.hasAttacked
                    );

                if (remainingAttackers.length > 0) {
                    // Continue attack phase
                    setTimeout(aiTakeAction, 1500);
                    return;
                }
            }

            // If no attacks made or no more attackers, move to end phase
            if (!attackMade || attackers.length === 0) {
                gameState.currentPhase = GAME_PHASES.END;
                logGameEvent("AI enters end phase");
                updateUI();
                setTimeout(aiTakeAction, 1000);
            }
            break;

        case GAME_PHASES.END:
            // End turn
            endTurn();
            break;
    }
}

// End the current turn
function endTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    logGameEvent(`${currentPlayer.name}'s turn ends. Unspent coins: ${currentPlayer.coins}`);

    // Unused coins are lost at end of turn
    currentPlayer.coins = 0;

    // Switch current player
    gameState.currentPlayer = gameState.currentPlayer === 'playerA' ? 'playerB' : 'playerA';

    // If starting a new turn, increment turn counter
    if (gameState.currentPlayer === 'playerA') {
        gameState.turn++;
    }

    // Reset to Draw phase
    gameState.currentPhase = GAME_PHASES.DRAW;

    // Cancel evolution mode if active
    if (gameState.evolution.isEvolutionMode) {
        cancelEvolution();
    }

    // Reset player state for new turn
    const nextPlayer = gameState.players[gameState.currentPlayer];
    nextPlayer.coins = STARTING_COINS;
    nextPlayer.hasPlayedApprentice = false;

    logGameEvent(`${nextPlayer.name}'s turn begins with ${STARTING_COINS} coins`);

    // For player A, draw a card automatically at the start of turn
    if (gameState.currentPlayer === 'playerA') {
        drawCard('playerA');
        
        // Reset all creatures' attack eligibility
        gameState.players.playerA.field.forEach(card => {
            card.canAttack = true;
            card.hasAttacked = false;
        });
    }

    updateUI();
}

// Add phase control buttons to UI since they don't exist in the HTML
function createPhaseControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'phase-controls';

    const drawButton = document.createElement('button');
    drawButton.textContent = 'Draw Phase';
    drawButton.id = 'draw-phase-btn';
    drawButton.className = 'phase-btn';

    const playButton = document.createElement('button');
    playButton.textContent = 'Play Phase';
    playButton.id = 'play-phase-btn';
    playButton.className = 'phase-btn';

    const attackButton = document.createElement('button');
    attackButton.textContent = 'Attack Phase';
    attackButton.id = 'attack-phase-btn';
    attackButton.className = 'phase-btn';

    const endButton = document.createElement('button');
    endButton.textContent = 'End Turn';
    endButton.id = 'end-phase-btn';
    endButton.className = 'phase-btn';

    // Add optional draw button
    const optionalDrawButton = document.createElement('button');
    optionalDrawButton.textContent = 'Draw Card (1 coin)';
    optionalDrawButton.id = 'optional-draw-btn';
    optionalDrawButton.className = 'phase-btn optional-draw';
    optionalDrawButton.style.backgroundColor = '#673ab7';
    optionalDrawButton.style.display = 'none'; // Hidden by default
    optionalDrawButton.addEventListener('click', () => optionalCardDraw('playerA'));

    // Evolution cancel button (hidden by default)
    const cancelEvolutionButton = document.createElement('button');
    cancelEvolutionButton.textContent = 'Cancel Evolution';
    cancelEvolutionButton.id = 'cancel-evolution-btn';
    cancelEvolutionButton.className = 'phase-btn evolution-btn';
    cancelEvolutionButton.style.display = 'none';
    cancelEvolutionButton.style.backgroundColor = '#f44336';
    cancelEvolutionButton.addEventListener('click', cancelEvolution);

    controlsDiv.appendChild(drawButton);
    controlsDiv.appendChild(playButton);
    controlsDiv.appendChild(attackButton);
    controlsDiv.appendChild(endButton);
    controlsDiv.appendChild(optionalDrawButton);
    controlsDiv.appendChild(cancelEvolutionButton);

    // Find playerA area to insert controls
    const playerArea = document.getElementById('playerA');
    playerArea.insertBefore(controlsDiv, playerArea.firstChild);

    // Add event listeners
    drawButton.addEventListener('click', () => {
        if (gameState.currentPlayer === 'playerA') {
            gameState.currentPhase = GAME_PHASES.DRAW;
            updateUI();
        }
    });

    playButton.addEventListener('click', () => {
        if (gameState.currentPlayer === 'playerA') {
            gameState.currentPhase = GAME_PHASES.PLAY;
            updateUI();
        }
    });

    attackButton.addEventListener('click', () => {
        if (gameState.currentPlayer === 'playerA') {
            gameState.currentPhase = GAME_PHASES.ATTACK;
            updateUI();
        }
    });

    endButton.addEventListener('click', () => {
        if (gameState.currentPlayer === 'playerA') {
            // If in evolution mode, cancel it
            if (gameState.evolution.isEvolutionMode) {
                cancelEvolution();
            }
            endTurn();
        }
    });

    // Store the buttons in domElements
    domElements.cancelEvolutionBtn = cancelEvolutionButton;
    domElements.optionalDrawBtn = optionalDrawButton;
}

// Add CSS styles for specific game elements
function addGameStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Modal styles for blocking prompt */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .block-prompt {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            text-align: center;
        }
        
        /* Active phase button */
        .phase-btn.active {
            background-color: #2a609c;
            font-weight: bold;
        }
        
        /* Apprentice zone styling */
        .apprentice-zone {
            background-color: rgba(255, 215, 0, 0.1);
            border: 1px dashed gold;
            padding: 10px;
            margin: 10px 0;
            min-height: 60px;
            border-radius: 4px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        }
        
        .apprentice-draw-btn {
            padding: 8px 15px;
            background-color: #673ab7;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
            margin: 5px;
        }
        
        .apprentice-draw-btn:hover {
            background-color: #5e35b1;
        }
        
        .card.evolution-ready {
            border: 2px solid gold;
            box-shadow: 0 0 10px gold;
            cursor: pointer;
        }
        
        /* Field limit indicator */
        .field-limit {
            margin-bottom: 5px;
            color: #666;
            font-size: 12px;
        }
        
        /* Optional draw button */
        .optional-draw {
            background-color: #673ab7;
            margin-left: 20px;
        }
        
        .optional-draw:hover {
            background-color: #5e35b1;
        }
        
        /* Make cards more responsive */
        @media (max-width: 768px) {
            .card {
                width: 120px;
                height: 77px;
            }
            
            .card .stats {
                font-size: 8px;
            }
            
            .card .name, .card .cost, .card .cp {
                font-size: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Create apprentice zones
function createApprenticeZones() {
    // Create Player A's apprentice zone
    const playerAApprenticeZone = document.createElement('div');
    playerAApprenticeZone.id = 'playerAApprentice';
    playerAApprenticeZone.className = 'apprentice-zone';
    playerAApprenticeZone.innerHTML = '<h3>Apprentice Zone</h3>';

    // Create Player B's apprentice zone
    const playerBApprenticeZone = document.createElement('div');
    playerBApprenticeZone.id = 'playerBApprentice';
    playerBApprenticeZone.className = 'apprentice-zone';
    playerBApprenticeZone.innerHTML = '<h3>Apprentice Zone</h3>';

    // Add to player areas
    const playerAArea = document.getElementById('playerA');
    const playerBArea = document.getElementById('playerB');

    // Insert after security for player A
    const playerASecurity = document.getElementById('playerASecurity');
    playerAArea.insertBefore(playerAApprenticeZone, playerASecurity.nextSibling);

    // Insert before field for player B
    const playerBField = document.getElementById('playerBField');
    playerBArea.insertBefore(playerBApprenticeZone, playerBField);
}

// Replace memory gauge with coin display
function createCoinDisplay() {
    // Create coin display element
    const coinDisplay = document.createElement('div');
    coinDisplay.id = 'coinDisplay';
    coinDisplay.className = 'coin-display';
    coinDisplay.style.fontSize = '18px';
    coinDisplay.style.margin = '20px 0';
    coinDisplay.style.fontWeight = 'bold';
    coinDisplay.style.padding = '10px 20px';
    coinDisplay.style.backgroundColor = '#333';
    coinDisplay.style.color = 'white';
    coinDisplay.style.borderRadius = '8px';
    coinDisplay.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    coinDisplay.textContent = 'Player A\'s Coins: 10 | Turn: 1 | Phase: draw';

    // Replace memory gauge
    const memoryGauge = document.getElementById('memoryGauge');
    if (memoryGauge) {
        memoryGauge.parentNode.replaceChild(coinDisplay, memoryGauge);
    } else {
        // If memory gauge doesn't exist yet, add to game board
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            const playerBArea = document.getElementById('playerB');
            gameBoard.insertBefore(coinDisplay, playerBArea.nextSibling);
        }
    }

    // Update domElements reference
    domElements.coinDisplay = coinDisplay;
}

// Initialize game
function initializeGame() {
    // Reset game state
    gameState.currentPhase = GAME_PHASES.DRAW;
    gameState.turn = 1;
    gameState.gameLog = [];
    gameState.evolution.isEvolutionMode = false;
    gameState.evolution.sourceCard = null;
    gameState.evolution.targetZone = null;

    // Initialize player decks using deck builder
    initializePlayerDeck('playerA');
    initializePlayerApprenticeDeck('playerA');

    // AI always uses default decks for now
    gameState.players.playerB.deck = initializeDeck();
    shuffle(gameState.players.playerB.deck);

    gameState.players.playerB.apprenticeDeck = initializeApprenticeDeck();
    shuffle(gameState.players.playerB.apprenticeDeck);

    // Clear player states
    for (const playerKey in gameState.players) {
        const player = gameState.players[playerKey];
        player.hand = [];
        player.field = [];
        player.security = [];
        player.trashPile = [];
        player.apprenticeZone = [];
        player.coins = STARTING_COINS;
        player.hasPlayedApprentice = false;
    }

    // Set up security cards
    gameState.players.playerA.security = gameState.players.playerA.deck.splice(0, 5);
    gameState.players.playerB.security = gameState.players.playerB.deck.splice(0, 5);

    // Draw initial hands
    gameState.players.playerA.hand = gameState.players.playerA.deck.splice(0, 5);
    gameState.players.playerB.hand = gameState.players.playerB.deck.splice(0, 5);

    // Set first player
    gameState.currentPlayer = 'playerA';

    logGameEvent(`Game initialized! Player A goes first with ${STARTING_COINS} coins.`);
    updateUI();
}

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', () => {
    // Create apprentice zones
    createApprenticeZones();

    // Replace memory gauge with coin display
    createCoinDisplay();

    // Initialize DOM elements references
    initializeDomElements();

    // Create phase controls and add styles
    createPhaseControls();
    addGameStyles();

    // Initialize deck builder
    deckBuilder.initialize();

    // Initialize game
    initializeGame();
});

// Export game functions for testing (only in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeGame,
        updateUI,
        drawCard,
        playCard,
        attackWithCreature,
        endTurn,
        aiTakeAction,
        gameState,
        GAME_PHASES,
        CARD_TYPES,
        deckBuilder,
        initializePlayerDeck,
        initializePlayerApprenticeDeck,
        optionalCardDraw,
        countCreatures,
        MAX_CREATURES,
        MAX_APPRENTICES,
        STARTING_COINS
    };
}