// Define the game constants
const CARD_TYPES = {
    CREATURE: 'creature',
    SPELL: 'spell',
    APPRENTICE: 'apprentice'  // Card type for apprentice cards
};

// Updated game phases to include movement
const GAME_PHASES = {
    DRAW: 'draw',
    MOVEMENT: 'movement', // New phase
    PLAY: 'play',
    ATTACK: 'attack',
    END: 'end'
};

// Field limits - expanded to 9 slots in a 3x3 grid
const MAX_CREATURES = 6; // Still only allows 6 creatures max
const MAX_FIELD_SLOTS = 9; // Total slots in the field (3x3 grid)
const MAX_APPRENTICES = 3;
const STARTING_COINS = 10;
const MOVEMENT_COST = 2; // Cost to move a creature

// Initialize the game state with new field layout
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
            apprenticeDeck: [],  // Deck for apprentice cards
            apprenticeZone: [],   // Zone to place active apprentice cards
            hasPlayedApprentice: false, // Track if player has summoned an apprentice this turn
            hasMoved: [] // Track which creatures have moved this turn
        },
        playerB: {
            name: 'Player B (AI)',
            coins: STARTING_COINS,
            deck: [],
            hand: [],
            field: [],
            security: [],
            trashPile: [],
            apprenticeDeck: [],  // Deck for apprentice cards
            apprenticeZone: [],   // Zone to place active apprentice cards
            hasPlayedApprentice: false, // Track if player has summoned an apprentice this turn
            hasMoved: [] // Track which creatures have moved this turn
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
    card.position = -1;  // Position on the field (-1 means not on field)
    
    // Determine attack range based on card type
    if (card.type === CARD_TYPES.CREATURE) {
        // Mages have range 2, all other creatures have range 1
        card.attackRange = card.name.toLowerCase().includes('mage') ? 2 : 1;
    }

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

// Helper function to check if two positions are adjacent in the 3x3 grid
function arePositionsAdjacent(pos1, pos2) {
    // Convert positions to 2D coordinates in a 3x3 grid
    const row1 = Math.floor(pos1 / 3);
    const col1 = pos1 % 3;
    const row2 = Math.floor(pos2 / 3);
    const col2 = pos2 % 3;
    
    // Calculate Manhattan distance
    const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    
    // Positions are adjacent if they're 1 unit apart
    return distance === 1;
}

// Get all valid adjacent empty positions for a card
function getValidMovementPositions(playerKey, cardIndex) {
    const player = gameState.players[playerKey];
    const card = player.field[cardIndex];
    const validPositions = [];
    
    // Check all positions 0-8 (3x3 grid)
    for (let pos = 0; pos < MAX_FIELD_SLOTS; pos++) {
        // Skip if the position is already occupied
        if (player.field.some(c => c.position === pos)) {
            continue;
        }
        
        // Check if this position is adjacent to the card's current position
        if (arePositionsAdjacent(card.position, pos)) {
            validPositions.push(pos);
        }
    }
    
    return validPositions;
}

// Function to move a creature
function moveCreature(playerKey, cardIndex, newPosition) {
    const player = gameState.players[playerKey];
    const card = player.field[cardIndex];
    
    // Check if it's the movement phase
    if (gameState.currentPhase !== GAME_PHASES.MOVEMENT) {
        logGameEvent("Can only move creatures during movement phase");
        return false;
    }
    
    // Check if the player has enough coins
    if (player.coins < MOVEMENT_COST) {
        logGameEvent(`Not enough coins to move. Movement costs ${MOVEMENT_COST} coins.`);
        return false;
    }
    
    // Check if the card has already moved this turn
    if (player.hasMoved.includes(card.id)) {
        logGameEvent(`${card.name} has already moved this turn.`);
        return false;
    }
    
    // Check if the new position is valid
    const validPositions = getValidMovementPositions(playerKey, cardIndex);
    if (!validPositions.includes(newPosition)) {
        logGameEvent(`Invalid movement target. Creatures can only move to adjacent empty spaces.`);
        return false;
    }
    
    // Move the creature
    const oldPosition = card.position;
    card.position = newPosition;
    player.coins -= MOVEMENT_COST;
    player.hasMoved.push(card.id);
    
    logGameEvent(`${card.name} moved from position ${oldPosition} to position ${newPosition} (cost: ${MOVEMENT_COST} coins)`);
    updateUI();
    return true;
}

// Show UI for selecting movement destination
function showMovementSelectionUI(playerKey, cardIndex) {
    const player = gameState.players[playerKey];
    const card = player.field[cardIndex];
    const validPositions = getValidMovementPositions(playerKey, cardIndex);
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    // Create the movement selection container
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'movement-selection';
    selectionContainer.style.backgroundColor = 'white';
    selectionContainer.style.padding = '20px';
    selectionContainer.style.borderRadius = '8px';
    selectionContainer.style.maxWidth = '600px';
    selectionContainer.style.textAlign = 'center';
    
    // Add selection title
    const title = document.createElement('h3');
    title.textContent = `Select movement destination for ${card.name}`;
    selectionContainer.appendChild(title);
    
    // Add cost info
    const costInfo = document.createElement('p');
    costInfo.textContent = `Movement cost: ${MOVEMENT_COST} coins`;
    costInfo.style.color = player.coins >= MOVEMENT_COST ? '#4caf50' : '#f44336';
    costInfo.style.fontWeight = 'bold';
    selectionContainer.appendChild(costInfo);
    
    // Create the grid visualization
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    gridContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
    gridContainer.style.gap = '10px';
    gridContainer.style.margin = '20px auto';
    gridContainer.style.width = '300px';
    gridContainer.style.height = '300px';
    
    // Create cells for each position
    for (let pos = 0; pos < MAX_FIELD_SLOTS; pos++) {
        const cell = document.createElement('div');
        cell.style.border = '1px solid #ccc';
        cell.style.borderRadius = '8px';
        cell.style.display = 'flex';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.position = 'relative';
        
        // Highlight current position
        if (pos === card.position) {
            cell.style.backgroundColor = '#f0f0f0';
            cell.style.border = '2px solid #333';
            
            const cardIndicator = document.createElement('div');
            cardIndicator.textContent = card.name;
            cardIndicator.style.fontSize = '12px';
            cardIndicator.style.fontWeight = 'bold';
            cardIndicator.style.padding = '5px';
            
            cell.appendChild(cardIndicator);
        } 
        // Highlight valid movement targets
        else if (validPositions.includes(pos)) {
            cell.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            cell.style.border = '2px dashed #4caf50';
            cell.style.cursor = 'pointer';
            
            const moveLabel = document.createElement('div');
            moveLabel.textContent = 'Move here';
            moveLabel.style.fontSize = '12px';
            moveLabel.style.color = '#4caf50';
            
            cell.appendChild(moveLabel);
            
            // Add click event
            cell.onclick = () => {
                document.body.removeChild(modalOverlay);
                moveCreature(playerKey, cardIndex, pos);
            };
        }
        // Check if another creature is at this position
        else {
            const occupyingCard = player.field.find(c => c.position === pos);
            if (occupyingCard) {
                cell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                
                const occupiedLabel = document.createElement('div');
                occupiedLabel.textContent = occupyingCard.name;
                occupiedLabel.style.fontSize = '12px';
                occupiedLabel.style.color = '#666';
                
                cell.appendChild(occupiedLabel);
            } else {
                cell.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                cell.textContent = 'Empty';
                cell.style.color = '#999';
                cell.style.fontSize = '12px';
            }
        }
        
        // Add position label
        const posLabel = document.createElement('div');
        posLabel.textContent = `Pos ${pos}`;
        posLabel.style.position = 'absolute';
        posLabel.style.top = '5px';
        posLabel.style.right = '5px';
        posLabel.style.fontSize = '10px';
        posLabel.style.color = '#666';
        
        cell.appendChild(posLabel);
        gridContainer.appendChild(cell);
    }
    
    selectionContainer.appendChild(gridContainer);
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'phase-btn';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.marginTop = '10px';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    selectionContainer.appendChild(cancelButton);
    modalOverlay.appendChild(selectionContainer);
    document.body.appendChild(modalOverlay);
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
        movement: document.getElementById('movement-phase-btn'), // New movement phase button
        play: document.getElementById('play-phase-btn'),
        attack: document.getElementById('attack-phase-btn'),
        end: document.getElementById('end-phase-btn')
    };

    // Reset all buttons
    Object.values(buttons).forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
            btn.disabled = gameState.currentPlayer !== 'playerA';
        }
    });

    // Highlight current phase
    switch (gameState.currentPhase) {
        case GAME_PHASES.DRAW:
            buttons.draw.classList.add('active');
            break;
        case GAME_PHASES.MOVEMENT:
            buttons.movement.classList.add('active');
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

// Render a player's field with the new 3x3 grid layout
function renderPlayerField(playerKey) {
    const player = gameState.players[playerKey];
    const fieldElement = domElements[`${playerKey}Field`];
    fieldElement.innerHTML = '';

    // Add field limit indicator
    const fieldLimitIndicator = document.createElement('div');
    fieldLimitIndicator.className = 'field-limit';
    fieldLimitIndicator.textContent = `Creatures: ${countCreatures(playerKey)}/${MAX_CREATURES}`;
    fieldElement.appendChild(fieldLimitIndicator);
    
    // Create battlefield grid container for 3x3 layout
    const battlefieldGrid = document.createElement('div');
    battlefieldGrid.className = 'battlefield-grid';
    battlefieldGrid.style.display = 'grid';
    battlefieldGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    battlefieldGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
    battlefieldGrid.style.gap = '10px';
    battlefieldGrid.style.margin = '10px auto';
    battlefieldGrid.style.maxWidth = '600px';
    fieldElement.appendChild(battlefieldGrid);
    
    // Create slots for each position (0-8)
    for (let position = 0; position < MAX_FIELD_SLOTS; position++) {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        
        // Add position label
        const posLabel = document.createElement('div');
        posLabel.className = 'position-label';
        posLabel.textContent = `Pos ${position}`;
        posLabel.style.position = 'absolute';
        posLabel.style.top = '2px';
        posLabel.style.left = '2px';
        posLabel.style.fontSize = '10px';
        posLabel.style.color = '#666';
        slot.appendChild(posLabel);
        
        // Check if there's a card at this position
        const cardIndex = player.field.findIndex(card => card.position === position);
        
        if (cardIndex !== -1) {
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
            
            // Add range indicator
            if (card.attackRange) {
                const rangeElement = document.createElement('div');
                rangeElement.className = 'range-indicator';
                rangeElement.textContent = `Range: ${card.attackRange}`;
                rangeElement.style.position = 'absolute';
                rangeElement.style.bottom = '25px';
                rangeElement.style.right = '5px';
                rangeElement.style.fontSize = '10px';
                rangeElement.style.backgroundColor = card.attackRange > 1 ? 'rgba(0, 128, 255, 0.8)' : 'rgba(255, 99, 71, 0.8)';
                rangeElement.style.color = 'white';
                rangeElement.style.padding = '2px 4px';
                rangeElement.style.borderRadius = '3px';
                cardElement.appendChild(rangeElement);
            }
            
            // Add moved indicator if it has moved this turn
            if (player.hasMoved.includes(card.id)) {
                const movedIndicator = document.createElement('div');
                movedIndicator.className = 'moved-indicator';
                movedIndicator.textContent = 'Moved';
                movedIndicator.style.position = 'absolute';
                movedIndicator.style.bottom = '40px';
                movedIndicator.style.right = '5px';
                movedIndicator.style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
                movedIndicator.style.color = 'white';
                movedIndicator.style.padding = '2px 4px';
                movedIndicator.style.fontSize = '10px';
                movedIndicator.style.borderRadius = '3px';
                cardElement.appendChild(movedIndicator);
            }
            
            // Add movement functionality during movement phase
            if (playerKey === gameState.currentPlayer && 
                gameState.currentPhase === GAME_PHASES.MOVEMENT &&
                !player.hasMoved.includes(card.id) &&
                player.coins >= MOVEMENT_COST &&
                getValidMovementPositions(playerKey, cardIndex).length > 0) {
                
                cardElement.classList.add('movable');
                cardElement.style.border = '2px solid #2196f3';
                cardElement.onclick = () => showMovementSelectionUI(playerKey, cardIndex);
                
                // Add movable indicator
                const movableIndicator = document.createElement('div');
                movableIndicator.className = 'movable-indicator';
                movableIndicator.textContent = 'Can Move';
                movableIndicator.style.position = 'absolute';
                movableIndicator.style.bottom = '40px';
                movableIndicator.style.left = '5px';
                movableIndicator.style.backgroundColor = 'rgba(33, 150, 243, 0.8)';
                movableIndicator.style.color = 'white';
                movableIndicator.style.padding = '2px 4px';
                movableIndicator.style.fontSize = '10px';
                movableIndicator.style.borderRadius = '3px';
                cardElement.appendChild(movableIndicator);
            } 
            // Add attack functionality during attack phase
            else if (playerKey === gameState.currentPlayer &&
                gameState.currentPhase === GAME_PHASES.ATTACK &&
                card.type === CARD_TYPES.CREATURE &&
                !card.hasAttacked &&
                card.canAttack) {
                
                cardElement.onclick = () => attackWithCreature(playerKey, cardIndex);
                cardElement.classList.add('attackable');
            } 
            else {
                cardElement.classList.add('disabled');
            }
            
            slot.appendChild(cardElement);
        }
        
        battlefieldGrid.appendChild(slot);
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

        // When evolving, we'll prompt for position selection for human player
        if (playerKey === 'playerA') {
            showPositionSelectionUI(playerKey, handIndex, true, apprentice);
            
            // Exit evolution mode
            gameState.evolution.isEvolutionMode = false;
            gameState.evolution.sourceCard = null;
            gameState.evolution.targetZone = null;
            
            // Hide cancel evolution button
            if (domElements.cancelEvolutionBtn) {
                domElements.cancelEvolutionBtn.style.display = 'none';
            }
            
            return;
        } else {
            // For AI, choose a position automatically (first available position)
            let position = -1;
            for (let i = 0; i < 6; i++) {  // Only consider first 6 positions for initial placement
                if (!player.field.some(card => card.position === i)) {
                    position = i;
                    break;
                }
            }
            
            // Set the position
            classCard.position = position;
            
            // Move class card to field
            player.field.push(classCard);
            
            // Remove class card from hand
            player.hand.splice(handIndex, 1);
        }

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
    
    // Add position info for cards on the field
    if (card.position !== undefined && card.position >= 0) {
        const positionElement = document.createElement('div');
        positionElement.className = 'position-indicator';
        positionElement.textContent = `Pos ${card.position}`;
        positionElement.style.position = 'absolute';
        positionElement.style.top = '5px';
        positionElement.style.right = '5px';
        positionElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        positionElement.style.color = 'white';
        positionElement.style.padding = '2px 5px';
        positionElement.style.fontSize = '10px';
        positionElement.style.borderRadius = '3px';
        cardElement.appendChild(positionElement);
    }

    return cardElement;
}

// Check if a card can be played
function canPlayCard(playerKey, card) {
    const player = gameState.players[playerKey];
    // Check if player has enough coins
    return player.coins >= card.cost;
}

// Updated canAttackTarget function for the 3x3 grid layout
function canAttackTarget(attacker, defender) {
    // If attacker or defender doesn't have a position, they can't engage
    if (attacker.position === -1 || defender.position === -1) return false;
    
    // Convert positions to 2D coordinates in a 3x3 grid
    const attackerRow = Math.floor(attacker.position / 3);
    const attackerCol = attacker.position % 3;
    const defenderRow = Math.floor(defender.position / 3);
    const defenderCol = defender.position % 3;
    
    // Calculate Manhattan distance
    const distance = Math.abs(attackerRow - defenderRow) + Math.abs(attackerCol - defenderCol);
    
    // Check if the distance is within the attacker's range
    return distance <= attacker.attackRange;
}

// Play a card with position selection
function playCard(playerKey, handIndex, position = null, isEvolution = false, apprentice = null) {
    const player = gameState.players[playerKey];
    if (playerKey !== gameState.currentPlayer || gameState.currentPhase !== GAME_PHASES.PLAY) {
        logGameEvent("Can't play card - not your turn or wrong phase!");
        return;
    }

    const card = player.hand[handIndex];
    const cost = card.cost;

    // Check if player has enough coins
    if (player.coins < cost && !isEvolution) {
        logGameEvent(`Not enough coins to play ${card.name} (cost: ${cost}, available: ${player.coins})`);
        return;
    }

    // Check field limit for creatures
    if (card.type === CARD_TYPES.CREATURE && countCreatures(playerKey) >= MAX_CREATURES) {
        logGameEvent(`Cannot play ${card.name} - field is full (max ${MAX_CREATURES} creatures)`);
        return;
    }

    // For creature cards, if no position is provided and player is human, show position selection UI
    if (card.type === CARD_TYPES.CREATURE && position === null && playerKey === 'playerA') {
        showPositionSelectionUI(playerKey, handIndex, isEvolution, apprentice);
        return;
    }

    // For AI or if position is already selected, proceed with playing the card
    // Deduct coins
    if (!isEvolution) {
        player.coins -= cost;
        logGameEvent(`${player.name} spent ${cost} coins to play ${card.name}`);
    } else {
        // For evolution, cost was already deducted
        // If this is an evolution, remove the apprentice from its zone and add to trash
        if (apprentice) {
            const apprenticeIndex = player.apprenticeZone.findIndex(c => c.id === apprentice.id);
            if (apprenticeIndex !== -1) {
                player.apprenticeZone.splice(apprenticeIndex, 1);
                player.trashPile.push(apprentice);
            }
        }
    }

    // Handle card type specific actions
    if (card.type === CARD_TYPES.CREATURE) {
        // For new game, creatures can only be initially placed in positions 0-5
        if (position !== null && position >= 0 && position < 6) {
            // Check if the position is already occupied
            const existingCardIndex = player.field.findIndex(c => c.position === position);
            if (existingCardIndex !== -1) {
                // Move existing card to trash pile
                const existingCard = player.field[existingCardIndex];
                logGameEvent(`${existingCard.name} was removed from the field to make room for ${card.name}`);
                player.trashPile.push(existingCard);
                player.field.splice(existingCardIndex, 1);
            }
            
            // Set the card's position
            card.position = position;
        } else {
            // For AI or fallback, find the first available position in positions 0-5
            let availablePosition = -1;
            for (let i = 0; i < 6; i++) { // Only consider first 6 positions for initial placement
                if (!player.field.some(c => c.position === i)) {
                    availablePosition = i;
                    break;
                }
            }
            
            // If all positions 0-5 are filled but we have less than 6 creatures (shouldn't happen, but just in case)
            if (availablePosition === -1 && player.field.length < 6) {
                // Remove the oldest card (first in the array)
                const oldestCard = player.field[0];
                logGameEvent(`${oldestCard.name} was removed from the field to make room for ${card.name}`);
                player.trashPile.push(oldestCard);
                player.field.shift();
                availablePosition = 0;
            }
            
            card.position = availablePosition;
        }
        
        // Add card to the field
        player.field.push(card);
        player.hand.splice(handIndex, 1);
        
        // Log the specific position
        logGameEvent(`${player.name} played ${card.name} (${card.cp} CP) at position ${card.position}`);

        // Implement card effects
        if (card.name === 'Mage Apprentice') {
            drawCard(playerKey, 1);
            logGameEvent(`${card.name}'s effect: Draw 1 card`);
        }
    } else if (card.type === CARD_TYPES.SPELL) {
        // Implement spell effects
        logGameEvent(`${player.name} played ${card.name}. Effect: ${card.effect}`);

        if (card.name === 'Fireball') {
            // For spells like Fireball, we would need to implement positional targeting as well
            // This would be an enhancement for later
            const opponent = playerKey === 'playerA' ? 'playerB' : 'playerA';
            const opponentField = gameState.players[opponent].field;

            if (opponentField.length > 0) {
                // For human player, show targeting UI
                if (playerKey === 'playerA') {
                    showSpellTargetSelectionUI(playerKey, handIndex, card, opponent);
                    return; // Early return to wait for target selection
                } else {
                    // For AI, use the original targeting logic
                    // AI targets strongest enemy
                    const targetIndex = opponentField.reduce((maxIndex, card, currentIndex, array) =>
                        card.cp > array[maxIndex].cp ? currentIndex : maxIndex, 0);

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
                }
            } else {
                logGameEvent("No target available for Fireball!");
            }
        } else if (card.name === 'Healing Wave') {
            const friendlyField = player.field;

            if (friendlyField.length > 0) {
                // For human player, show targeting UI
                if (playerKey === 'playerA') {
                    showSpellTargetSelectionUI(playerKey, handIndex, card, playerKey);
                    return; // Early return to wait for target selection
                } else {
                    // For AI, use the original targeting logic (first creature)
                    const targetIndex = 0;
                    const targetCard = friendlyField[targetIndex];

                    logGameEvent(`${card.name} restores 2000 CP to ${targetCard.name}!`);
                    // In a full implementation, increase CP temporarily or permanently
                }
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

// Show UI for selecting a target for spell effects
function showSpellTargetSelectionUI(playerKey, handIndex, spell, targetPlayerKey) {
    const player = gameState.players[playerKey];
    const targetPlayer = gameState.players[targetPlayerKey];
    
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
    
    // Create the spell target selection container
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'spell-target-selection';
    selectionContainer.style.backgroundColor = 'white';
    selectionContainer.style.padding = '20px';
    selectionContainer.style.borderRadius = '8px';
    selectionContainer.style.maxWidth = '600px';
    selectionContainer.style.textAlign = 'center';
    
    // Add spell info and prompt
    const spellInfo = document.createElement('div');
    spellInfo.innerHTML = `<h3>Select a target for ${spell.name}</h3>`;
    spellInfo.innerHTML += `<p>${spell.effect}</p>`;
    selectionContainer.appendChild(spellInfo);
    
    // Create target options
    const targetsGrid = document.createElement('div');
    targetsGrid.style.display = 'flex';
    targetsGrid.style.flexWrap = 'wrap';
    targetsGrid.style.justifyContent = 'center';
    targetsGrid.style.gap = '10px';
    targetsGrid.style.margin = '20px 0';
    
    // Add target cards for selection
    targetPlayer.field.forEach((target, index) => {
        const targetCard = document.createElement('div');
        targetCard.className = 'target-card';
        targetCard.style.width = '120px';
        targetCard.style.height = '150px';
        targetCard.style.border = '2px solid #ccc';
        targetCard.style.borderRadius = '8px';
        targetCard.style.cursor = 'pointer';
        targetCard.style.position = 'relative';
        targetCard.style.overflow = 'hidden';
        
        // Card image
        const cardImage = document.createElement('div');
        cardImage.style.height = '100px';
        cardImage.style.backgroundSize = 'contain';
        cardImage.style.backgroundPosition = 'center';
        cardImage.style.backgroundRepeat = 'no-repeat';
        
        if (target.image) {
            cardImage.style.backgroundImage = `url(${target.image})`;
        } else {
            cardImage.style.background = 'linear-gradient(135deg, #444, #666)';
        }
        
        targetCard.appendChild(cardImage);
        
        // Card info
        const cardInfo = document.createElement('div');
        cardInfo.style.padding = '5px';
        cardInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        cardInfo.style.color = 'white';
        cardInfo.style.fontSize = '12px';
        cardInfo.innerHTML = `<div>${target.name}</div>`;
        
        if (target.cp) {
            cardInfo.innerHTML += `<div>CP: ${target.cp}</div>`;
        }
        
        targetCard.appendChild(cardInfo);
        
        // Position indicator
        if (target.position !== undefined && target.position >= 0) {
            const positionLabel = document.createElement('div');
            positionLabel.textContent = `Position ${target.position}`;
            positionLabel.style.position = 'absolute';
            positionLabel.style.top = '5px';
            positionLabel.style.right = '5px';
            positionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            positionLabel.style.color = 'white';
            positionLabel.style.padding = '2px 5px';
            positionLabel.style.fontSize = '10px';
            positionLabel.style.borderRadius = '3px';
            targetCard.appendChild(positionLabel);
        }
        
        // When this target is selected, apply the spell effect
        targetCard.onclick = () => {
            document.body.removeChild(modalOverlay);
            
            // Apply spell effect based on the spell type
            if (spell.name === 'Fireball') {
                logGameEvent(`${spell.name} deals 3000 damage to ${target.name}!`);
                
                // Check if creature is destroyed
                if (target.cp <= 3000) {
                    logGameEvent(`${target.name} was destroyed!`);
                    targetPlayer.trashPile.push(target);
                    const targetIndex = targetPlayer.field.findIndex(card => card.id === target.id);
                    if (targetIndex !== -1) {
                        targetPlayer.field.splice(targetIndex, 1);
                    }
                } else {
                    logGameEvent(`${target.name} survived with ${target.cp - 3000} CP remaining!`);
                    // In a full implementation, reduce CP temporarily or permanently
                }
            } else if (spell.name === 'Healing Wave') {
                logGameEvent(`${spell.name} restores 2000 CP to ${target.name}!`);
                // In a full implementation, increase CP temporarily or permanently
            }
            
            // Move spell to trash pile after use
            player.trashPile.push(spell);
            player.hand.splice(handIndex, 1);
            
            updateUI();
        };
        
        // Highlight on hover
        targetCard.onmouseover = () => {
            targetCard.style.borderColor = spell.name === 'Fireball' ? '#f44336' : '#4caf50';
            targetCard.style.boxShadow = spell.name === 'Fireball' ? 
                '0 0 10px rgba(244, 67, 54, 0.5)' : 
                '0 0 10px rgba(76, 175, 80, 0.5)';
        };
        
        targetCard.onmouseout = () => {
            targetCard.style.borderColor = '#ccc';
            targetCard.style.boxShadow = '';
        };
        
        targetsGrid.appendChild(targetCard);
    });
    
    selectionContainer.appendChild(targetsGrid);
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'phase-btn';
    cancelButton.style.backgroundColor = '#9e9e9e';
    cancelButton.style.padding = '10px 20px';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    selectionContainer.appendChild(cancelButton);
    
    // Display error message if no targets available
    if (targetPlayer.field.length === 0) {
        const noTargetsMsg = document.createElement('div');
        noTargetsMsg.textContent = 'No valid targets available!';
        noTargetsMsg.style.color = '#f44336';
        noTargetsMsg.style.margin = '20px 0';
        noTargetsMsg.style.fontWeight = 'bold';
        selectionContainer.appendChild(noTargetsMsg);
    }
    
    // Append to modal
    modalOverlay.appendChild(selectionContainer);
    
    // Add to document
    document.body.appendChild(modalOverlay);
}

// Show UI for selecting card position when playing a creature
function showPositionSelectionUI(playerKey, handIndex, isEvolution = false, apprentice = null) {
    const player = gameState.players[playerKey];
    const card = player.hand[handIndex];
    
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
    
    // Create the position selection container
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'position-selection';
    selectionContainer.style.backgroundColor = 'white';
    selectionContainer.style.padding = '20px';
    selectionContainer.style.borderRadius = '8px';
    selectionContainer.style.maxWidth = '600px';
    selectionContainer.style.textAlign = 'center';
    
    // Add selection prompt
    const promptText = document.createElement('h3');
    promptText.textContent = isEvolution ?
        `Select a position for evolved ${card.name}` :
        `Select a position for ${card.name}`;
    selectionContainer.appendChild(promptText);
    
    // Add note about position limitations (can only summon in first 6 positions)
    const positionNote = document.createElement('p');
    positionNote.textContent = 'Creatures can only be summoned in positions 0-5. Positions 6-8 can only be reached by movement.';
    positionNote.style.color = '#1976d2';
    positionNote.style.fontStyle = 'italic';
    positionNote.style.marginBottom = '15px';
    selectionContainer.appendChild(positionNote);
    
    // Create battlefield grid visualization in 3x3 format
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    gridContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
    gridContainer.style.gap = '10px';
    gridContainer.style.margin = '20px auto';
    gridContainer.style.width = '300px';
    gridContainer.style.height = '300px';
    
    // Create cells for each position (0-8)
    for (let pos = 0; pos < MAX_FIELD_SLOTS; pos++) {
        const cell = document.createElement('div');
        cell.style.border = '1px solid #ccc';
        cell.style.borderRadius = '8px';
        cell.style.display = 'flex';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.position = 'relative';
        
        // Add position label
        const posLabel = document.createElement('div');
        posLabel.textContent = `Pos ${pos}`;
        posLabel.style.position = 'absolute';
        posLabel.style.top = '5px';
        posLabel.style.right = '5px';
        posLabel.style.fontSize = '10px';
        posLabel.style.color = '#666';
        cell.appendChild(posLabel);
        
        // Check if the position is one of the first 6 (valid for summoning)
        if (pos < 6) {
            // Check if there's a card at this position already
            const existingCard = player.field.find(c => c.position === pos);
            
            if (existingCard) {
                // Position is occupied
                cell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                
                const occupiedLabel = document.createElement('div');
                occupiedLabel.textContent = existingCard.name;
                occupiedLabel.style.fontSize = '12px';
                occupiedLabel.style.color = '#666';
                cell.appendChild(occupiedLabel);
                
                const replaceLabel = document.createElement('div');
                replaceLabel.textContent = 'Replace';
                replaceLabel.style.color = '#f44336';
                replaceLabel.style.fontSize = '10px';
                replaceLabel.style.position = 'absolute';
                replaceLabel.style.bottom = '5px';
                replaceLabel.style.width = '100%';
                replaceLabel.style.textAlign = 'center';
                cell.appendChild(replaceLabel);
                
                // Can click to replace
                cell.style.cursor = 'pointer';
                cell.onclick = () => {
                    document.body.removeChild(modalOverlay);
                    playCard(playerKey, handIndex, pos, isEvolution, apprentice);
                };
            } else {
                // Position is open
                cell.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                cell.style.border = '2px dashed #4caf50';
                cell.style.cursor = 'pointer';
                
                const emptyLabel = document.createElement('div');
                emptyLabel.textContent = 'Empty - Place Here';
                emptyLabel.style.fontSize = '12px';
                emptyLabel.style.color = '#4caf50';
                cell.appendChild(emptyLabel);
                
                // Click to place
                cell.onclick = () => {
                    document.body.removeChild(modalOverlay);
                    playCard(playerKey, handIndex, pos, isEvolution, apprentice);
                };
            }
        } else {
            // Positions 6-8 are not valid for initial placement
            cell.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            cell.style.opacity = '0.6';
            
            const invalidLabel = document.createElement('div');
            invalidLabel.textContent = 'Movement Only';
            invalidLabel.style.fontSize = '12px';
            invalidLabel.style.color = '#999';
            cell.appendChild(invalidLabel);
        }
        
        gridContainer.appendChild(cell);
    }
    
    selectionContainer.appendChild(gridContainer);
    
    // Add card info
    const cardInfo = document.createElement('div');
    cardInfo.style.marginTop = '15px';
    cardInfo.style.backgroundColor = '#f5f5f5';
    cardInfo.style.padding = '10px';
    cardInfo.style.borderRadius = '5px';
    cardInfo.style.fontSize = '14px';
    
    // Add attack range info for creatures
    if (card.type === CARD_TYPES.CREATURE) {
        const isMage = card.name.toLowerCase().includes('mage');
        const range = isMage ? 2 : 1;
        card.attackRange = range; // Set the range
        
        cardInfo.innerHTML = `<strong>${card.name}</strong>: ${isMage ? 'Ranged' : 'Melee'} unit (Attack Range: ${range})`;
        cardInfo.innerHTML += `<br>CP: ${card.cp}`;
        
        // Add range tip
        if (isMage) {
            cardInfo.innerHTML += `<br><span style="color:#1976d2;">Tip: Mages can attack targets up to 2 positions away (diagonally counts as 2 moves).</span>`;
        } else {
            cardInfo.innerHTML += `<br><span style="color:#d32f2f;">Tip: Melee units can only attack adjacent positions.</span>`;
        }
    }
    
    selectionContainer.appendChild(cardInfo);
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'phase-btn';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.marginTop = '15px';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
        if (isEvolution) {
            // If canceling an evolution, revert to evolution mode
            gameState.evolution.isEvolutionMode = true;
        }
    };
    selectionContainer.appendChild(cancelButton);
    
    // Append to modal
    modalOverlay.appendChild(selectionContainer);
    
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

    // Get valid targets based on position
    const validTargets = gameState.players[opponent].field.filter(card => 
        canAttackTarget(attacker, card)
    );

    // Check if Rogue Scout's Stealth ability applies
    const hasStealth = attacker.name === 'Rogue Scout' &&
        attacker.ability === 'Stealth' &&
        !attacker.hasAttackedBefore;

    if (hasStealth) {
        logGameEvent(`${attacker.name}'s Stealth ability allows attacking security directly!`);
        attacker.hasAttackedBefore = true;
        directAttack(playerKey, fieldIndex, attacker, opponent);
        return;
    }

    // If no valid targets, check if direct attack is possible
    if (validTargets.length === 0) {
        // Check if the opponent has any creatures at all
        if (gameState.players[opponent].field.length === 0) {
            // If no creatures, allow direct attack
            directAttack(playerKey, fieldIndex, attacker, opponent);
            return;
        } else {
            // If there are creatures but none in range, inform player
            logGameEvent(`${attacker.name} has no valid targets in range (Range: ${attacker.attackRange})`);
            
            // If player is human, show target selection UI with direct attack option
            if (playerKey === 'playerA') {
                showTargetSelectionUI(playerKey, fieldIndex, attacker, validTargets, true);
            }
            return;
        }
    }

    // If player is human, show target selection UI
    if (playerKey === 'playerA') {
        showTargetSelectionUI(playerKey, fieldIndex, attacker, validTargets);
    } else {
        // For AI, choose the best target
        const bestTargetIndex = getBestTargetForAI(attacker, validTargets);
        const targetCard = validTargets[bestTargetIndex];
        const targetIndex = gameState.players[opponent].field.findIndex(card => card.id === targetCard.id);
        
        // Mark card as having attacked
        attacker.hasAttacked = true;
        
        // Deduct 1 coin for attacking (if player has coins)
        if (player.coins >= 1) {
            player.coins -= 1;
            logGameEvent(`${player.name} spent 1 coin for attack action`);
        } else {
            logGameEvent(`${player.name} has no coins left but can still attack`);
        }
        
        // Process the attack
        processCreatureAttack(playerKey, fieldIndex, opponent, targetIndex);
    }
}

// Show UI for selecting a target when attacking
function showTargetSelectionUI(playerKey, attackerIndex, attacker, validTargets, allowDirectAttack = false) {
    const opponent = playerKey === 'playerA' ? 'playerB' : 'playerA';
    
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
    
    // Create the target selection container
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'target-selection';
    selectionContainer.style.backgroundColor = 'white';
    selectionContainer.style.padding = '20px';
    selectionContainer.style.borderRadius = '8px';
    selectionContainer.style.maxWidth = '600px';
    selectionContainer.style.textAlign = 'center';
    
    // Add selection prompt
    const promptText = document.createElement('h3');
    promptText.textContent = `Select a target for ${attacker.name} to attack`;
    selectionContainer.appendChild(promptText);
    
    // Show attacker info
    const attackerInfo = document.createElement('div');
    attackerInfo.style.margin = '10px 0';
    attackerInfo.style.padding = '10px';
    attackerInfo.style.backgroundColor = '#f5f5f5';
    attackerInfo.style.borderRadius = '5px';
    attackerInfo.innerHTML = `<strong>Attacker:</strong> ${attacker.name} (${attacker.cp} CP) | Range: ${attacker.attackRange} | Position: ${attacker.position}`;
    selectionContainer.appendChild(attackerInfo);
    
    // Create targets container
    const targetsGrid = document.createElement('div');
    targetsGrid.style.display = 'flex';
    targetsGrid.style.flexWrap = 'wrap';
    targetsGrid.style.justifyContent = 'center';
    targetsGrid.style.gap = '10px';
    targetsGrid.style.margin = '20px 0';
    
    // Add each valid target
    validTargets.forEach((target, index) => {
        const targetCard = document.createElement('div');
        targetCard.className = 'target-card';
        targetCard.style.width = '120px';
        targetCard.style.height = '150px';
        targetCard.style.border = '2px solid #ccc';
        targetCard.style.borderRadius = '8px';
        targetCard.style.cursor = 'pointer';
        targetCard.style.position = 'relative';
        targetCard.style.display = 'flex';
        targetCard.style.flexDirection = 'column';
        targetCard.style.overflow = 'hidden';
        
        // Card image
        const cardImage = document.createElement('div');
        cardImage.style.flex = '1';
        cardImage.style.backgroundSize = 'contain';
        cardImage.style.backgroundPosition = 'center';
        cardImage.style.backgroundRepeat = 'no-repeat';
        cardImage.style.backgroundColor = '#f5f5f5';
        
        if (target.image) {
            cardImage.style.backgroundImage = `url(${target.image})`;
        }
        
        targetCard.appendChild(cardImage);
        
        // Card info
        const cardInfo = document.createElement('div');
        cardInfo.style.padding = '5px';
        cardInfo.style.backgroundColor = '#333';
        cardInfo.style.color = 'white';
        cardInfo.style.fontSize = '12px';
        cardInfo.innerHTML = `<div>${target.name}</div><div>CP: ${target.cp}</div>`;
        targetCard.appendChild(cardInfo);
        
        // Position indicator
        const positionLabel = document.createElement('div');
        positionLabel.textContent = `Position ${target.position}`;
        positionLabel.style.position = 'absolute';
        positionLabel.style.top = '5px';
        positionLabel.style.right = '5px';
        positionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        positionLabel.style.color = 'white';
        positionLabel.style.padding = '2px 5px';
        positionLabel.style.fontSize = '10px';
        positionLabel.style.borderRadius = '3px';
        targetCard.appendChild(positionLabel);
        
        // When a target is clicked, attack it
        targetCard.onclick = () => {
            document.body.removeChild(modalOverlay);
            
            // Mark attacker as having attacked
            attacker.hasAttacked = true;
            
            // Deduct 1 coin for attacking (if player has coins)
            const player = gameState.players[playerKey];
            if (player.coins >= 1) {
                player.coins -= 1;
                logGameEvent(`${player.name} spent 1 coin for attack action`);
            } else {
                logGameEvent(`${player.name} has no coins left but can still attack`);
            }
            
            // Find the target's index in the opponent's field
            const targetIndex = gameState.players[opponent].field.findIndex(card => card.id === target.id);
            processCreatureAttack(playerKey, attackerIndex, opponent, targetIndex);
        };
        
        // Add highlight on hover
        targetCard.onmouseover = () => {
            targetCard.style.borderColor = '#f44336';
            targetCard.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.5)';
        };
        
        targetCard.onmouseout = () => {
            targetCard.style.borderColor = '#ccc';
            targetCard.style.boxShadow = '';
        };
        
        targetsGrid.appendChild(targetCard);
    });
    
    selectionContainer.appendChild(targetsGrid);
    
    // Add option to attack security directly (if allowed or no targets)
    if (allowDirectAttack || validTargets.length === 0) {
        const directAttackInfo = document.createElement('div');
        directAttackInfo.style.margin = '15px 0';
        directAttackInfo.style.padding = '10px';
        directAttackInfo.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
        directAttackInfo.style.borderRadius = '5px';
        
        if (validTargets.length === 0 && gameState.players[opponent].field.length > 0) {
            directAttackInfo.innerHTML = `<p><strong>No targets in range.</strong> ${attacker.name} can attack security directly.</p>`;
        } else {
            directAttackInfo.innerHTML = `<p>You can choose to attack security directly instead of targeting a creature.</p>`;
        }
        
        selectionContainer.appendChild(directAttackInfo);
        
        const directAttackBtn = document.createElement('button');
        directAttackBtn.textContent = 'Attack Security Directly';
        directAttackBtn.className = 'phase-btn';
        directAttackBtn.style.backgroundColor = '#f44336';
        directAttackBtn.style.margin = '10px 0';
        directAttackBtn.style.padding = '10px 20px';
        directAttackBtn.onclick = () => {
            document.body.removeChild(modalOverlay);
            directAttack(playerKey, attackerIndex, attacker, opponent);
        };
        selectionContainer.appendChild(directAttackBtn);
    }
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'phase-btn';
    cancelButton.style.backgroundColor = '#9e9e9e';
    cancelButton.style.padding = '10px 20px';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    selectionContainer.appendChild(cancelButton);
    
    // Append to modal
    modalOverlay.appendChild(selectionContainer);
    
    // Add to document
    document.body.appendChild(modalOverlay);
}

// Choose the best target for AI
function getBestTargetForAI(attacker, validTargets) {
    // Simple strategy: attack the target with highest CP first
    return validTargets.reduce((maxIndex, target, currentIndex, array) =>
        target.cp > array[maxIndex].cp ? currentIndex : maxIndex, 0);
}

// Process a creature attack (creature vs creature)
function processCreatureAttack(playerKey, attackerIndex, opponent, targetIndex) {
    const player = gameState.players[playerKey];
    const attacker = player.field[attackerIndex];
    const defender = gameState.players[opponent].field[targetIndex];
    
    logGameEvent(`${player.name}'s ${attacker.name} (Position ${attacker.position}) attacks security directly!`);
    
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
                player.field = player.field.filter(card => card.id !== attacker.id);
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
                    player.field = player.field.filter(card => card.id !== attacker.id);
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
    
    updateUI();acker.name} (${attacker.cp} CP) at position ${attacker.position} attacks ${gameState.players[opponent].name}'s ${defender.name} (${defender.cp} CP) at position ${defender.position}!`);
    
    // Apply Paladin Guard special ability if applicable
    let defenderBonus = 0;
    if (defender.name === 'Paladin Guard') {
        defenderBonus = 1000;
        logGameEvent(`${defender.name}'s ability reduces damage by 1000!`);
    }
    
    // Compare CP to determine winner
    if (attacker.cp > defender.cp + defenderBonus) {
        logGameEvent(`${defender.name} was defeated in battle!`);
        gameState.players[opponent].trashPile.push(defender);
        gameState.players[opponent].field = gameState.players[opponent].field.filter(card => card.id !== defender.id);
    } else {
        logGameEvent(`${attacker.name}'s attack was blocked!`);
        if (attacker.cp < defender.cp) {
            logGameEvent(`${attacker.name} was defeated in battle!`);
            player.trashPile.push(attacker);
            player.field = player.field.filter(card => card.id !== attacker.id);
        } else {
            logGameEvent("Both creatures survived the battle!");
        }
    }
    
    updateUI();
}

// Process a direct attack on security
function directAttack(playerKey, fieldIndex, attacker, opponent) {
    const player = gameState.players[playerKey];
    
    // Mark card as having attacked
    attacker.hasAttacked = true;
    
    // Deduct 1 coin for attacking (if player has coins)
    if (player.coins >= 1) {
        player.coins -= 1;
        logGameEvent(`${player.name} spent 1 coin for attack action`);
    } else {
        logGameEvent(`${player.name} has no coins left but can still attack`);
    }
    
    logGameEvent(`${player.name}'s ${attacker.name} (Position ${attacker.position}) attacks security directly!`);
    
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
                player.field = player.field.filter(card => card.id !== attacker.id);
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
                    player.field = player.field.filter(card => card.id !== attacker.id);
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
// AI Turn Decision-Making Function
function aiTakeAction() {
    const aiPlayer = gameState.players.playerB;
    
    switch (gameState.currentPhase) {
        case GAME_PHASES.DRAW:
            // AI always draws a card during draw phase
            drawCard('playerB', 1);
            advancePhase('playerB');
            break;
        
        case GAME_PHASES.MOVEMENT:
            // AI attempts to move creatures strategically
            aiPlayer.field.forEach((card, index) => {
                const validPositions = getValidMovementPositions('playerB', index);
                if (validPositions.length > 0 && aiPlayer.coins >= MOVEMENT_COST) {
                    // Simple strategy: move to first valid position
                    moveCreature('playerB', index, validPositions[0]);
                }
            });
            advancePhase('playerB');
            break;
        
        case GAME_PHASES.PLAY:
            // AI tries to play cards from hand
            aiPlayer.hand.forEach((card, index) => {
                if (canPlayCard('playerB', card)) {
                    // For creatures, find an empty position
                    if (card.type === CARD_TYPES.CREATURE && countCreatures('playerB') < MAX_CREATURES) {
                        let position = -1;
                        for (let i = 0; i < 6; i++) {
                            if (!aiPlayer.field.some(c => c.position === i)) {
                                position = i;
                                break;
                            }
                        }
                        playCard('playerB', index, position);
                    }
                    // TODO: Add more sophisticated spell card play logic
                }
            });
            advancePhase('playerB');
            break;
        
        case GAME_PHASES.ATTACK:
            // AI tries to attack with available creatures
            aiPlayer.field.forEach((card, index) => {
                if (card.type === CARD_TYPES.CREATURE && !card.hasAttacked && card.canAttack) {
                    attackWithCreature('playerB', index);
                }
            });
            advancePhase('playerB');
            break;
        
        case GAME_PHASES.END:
            advancePhase('playerB');
            break;
    }
}

// Advance game phase
function advancePhase(playerKey) {
    const currentPhases = Object.values(GAME_PHASES);
    const currentPhaseIndex = currentPhases.indexOf(gameState.currentPhase);
    
    // Move to next phase
    if (currentPhaseIndex < currentPhases.length - 1) {
        gameState.currentPhase = currentPhases[currentPhaseIndex + 1];
    } else {
        // End of turn, switch players and reset
        gameState.currentPlayer = playerKey === 'playerA' ? 'playerB' : 'playerA';
        gameState.turn++;
        
        // Reset turn-specific flags
        gameState.players.playerA.hasPlayedApprentice = false;
        gameState.players.playerB.hasPlayedApprentice = false;
        gameState.players.playerA.hasMoved = [];
        gameState.players.playerB.hasMoved = [];
        
        // Reset creature attack and movement states
        ['playerA', 'playerB'].forEach(player => {
            gameState.players[player].field.forEach(card => {
                card.hasAttacked = false;
                card.canAttack = true;
            });
        });
        
        // Start next turn with draw phase
        gameState.currentPhase = GAME_PHASES.DRAW;
        
        // Give coins to current player
        gameState.players[gameState.currentPlayer].coins += 1;
    }
    
    updateUI();
}

// Initialize the game
function initializeGame() {
    // Reset game state
    gameState.currentPhase = GAME_PHASES.DRAW;
    gameState.currentPlayer = 'playerA';
    gameState.turn = 1;
    gameState.gameLog = [];
    gameState.evolution = {
        isEvolutionMode: false,
        sourceCard: null,
        targetZone: null
    };

    // Reset both players
    ['playerA', 'playerB'].forEach(playerKey => {
        const player = gameState.players[playerKey];
        
        // Reset player state
        player.coins = STARTING_COINS;
        player.deck = [];
        player.hand = [];
        player.field = [];
        player.security = [];
        player.trashPile = [];
        player.apprenticeDeck = [];
        player.apprenticeZone = [];
        player.hasPlayedApprentice = false;
        player.hasMoved = [];

        // Initialize decks
        initializePlayerDeck(playerKey);
        initializePlayerApprenticeDeck(playerKey);

        // Draw initial hand (typically 5 cards)
        for (let i = 0; i < 5; i++) {
            drawCard(playerKey, 1);
        }

        // Set up initial security stack (5 cards)
        for (let i = 0; i < 5; i++) {
            if (player.deck.length > 0) {
                const securityCard = player.deck.shift();
                player.security.push(securityCard);
            }
        }
    });

    // Update UI to reflect initial game state
    updateUI();
}

// Event listeners for game controls (to be added to HTML)
function setupGameControls() {
    // Phase buttons
    ['draw', 'movement', 'play', 'attack', 'end'].forEach(phase => {
        const btn = document.getElementById(`${phase}-phase-btn`);
        if (btn) {
            btn.addEventListener('click', () => {
                // Validate phase transition for human player
                if (gameState.currentPlayer === 'playerA') {
                    advancePhase('playerA');
                }
            });
        }
    });

    // Optional draw button
    const optionalDrawBtn = document.getElementById('optional-draw-btn');
    if (optionalDrawBtn) {
        optionalDrawBtn.addEventListener('click', () => {
            optionalCardDraw('playerA');
        });
    }

    // Cancel evolution button
    const cancelEvolutionBtn = document.getElementById('cancel-evolution-btn');
    if (cancelEvolutionBtn) {
        cancelEvolutionBtn.addEventListener('click', cancelEvolution);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize deck builder and game state
    deckBuilder.initialize();
    initializeDomElements();
    setupGameControls();
    initializeGame();
});