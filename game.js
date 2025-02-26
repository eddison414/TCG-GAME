// Card types and creature types
const CARD_TYPES = { CREATURE: 'creature', SPELL: 'spell' };
const CREATURE_TYPES = { WARRIOR: 'Warrior', PALADIN: 'Paladin', MAGE: 'Mage', ROGUE: 'Rogue' };

// Game phases for more structured gameplay
const GAME_PHASES = { 
    DRAW: 'draw', 
    PLAY: 'play', 
    ATTACK: 'attack', 
    END: 'end' 
};

// Stat profiles for dynamic stats
const classStatProfiles = {
    'Warrior': {
        STR: { base: 10, variance: 5 },  // 10-14 STR
        DEX: { base: 5, variance: 3 },   // 5-7 DEX
        VIT: { base: 8, variance: 4 },   // 8-11 VIT
        INT: { base: 2, variance: 2 }    // 2-3 INT
    },
    'Mage': {
        STR: { base: 2, variance: 2 },   // 2-3 STR
        DEX: { base: 5, variance: 3 },   // 5-7 DEX
        VIT: { base: 3, variance: 2 },   // 3-4 VIT
        INT: { base: 10, variance: 5 }   // 10-14 INT
    },
    'Rogue': {
        STR: { base: 6, variance: 3 },   // 6-8 STR
        DEX: { base: 10, variance: 5 },  // 10-14 DEX
        VIT: { base: 4, variance: 2 },   // 4-5 VIT
        INT: { base: 4, variance: 2 }    // 4-5 INT
    },
    'Paladin': {
        STR: { base: 8, variance: 4 },   // 8-11 STR
        DEX: { base: 3, variance: 2 },   // 3-4 DEX
        VIT: { base: 10, variance: 5 },  // 10-14 VIT
        INT: { base: 5, variance: 3 }    // 5-7 INT
    }
};

// Game state object
const gameState = {
    memoryGauge: 0,
    currentPhase: GAME_PHASES.DRAW,
    currentPlayer: 'playerA',
    turn: 1,
    gameLog: [],
    players: {
        playerA: {
            name: 'Player A',
            deck: [],
            hand: [],
            field: [],
            security: [],
            trashPile: []
        },
        playerB: {
            name: 'Player B (AI)',
            deck: [],
            hand: [],
            field: [],
            security: [],
            trashPile: []
        }
    }
};

// DOM elements cache - match IDs from HTML file
const domElements = {
    memoryGauge: document.getElementById('memoryGauge'),
    playerASecurity: document.getElementById('playerASecurity'),
    playerAField: document.getElementById('playerAField'),
    playerAHand: document.getElementById('playerAHand'),
    playerBSecurity: document.getElementById('playerBSecurity'),
    playerBField: document.getElementById('playerBField'),
    playerBHand: document.getElementById('playerBHand'),
    chatHistory: document.getElementById('chatHistory')
};

// Generate dynamic stats based on class
function generateStats(cardClass) {
    const profile = classStatProfiles[cardClass];
    if (!profile) {
        console.error(`No stat profile for class: ${cardClass}`);
        return { STR: 0, DEX: 0, VIT: 0, INT: 0 };
    }
    return {
        STR: profile.STR.base + Math.floor(Math.random() * profile.STR.variance),
        DEX: profile.DEX.base + Math.floor(Math.random() * profile.DEX.variance),
        VIT: profile.VIT.base + Math.floor(Math.random() * profile.VIT.variance),
        INT: profile.INT.base + Math.floor(Math.random() * profile.INT.variance)
    };
}

// Card creation function using a safer unique ID generator
function createCard(name, type, creatureType, stage, cost, cp, evolvesFrom, ability, effect, securityEffect, image) {
    const stats = type === CARD_TYPES.CREATURE ? generateStats(creatureType) : { STR: 0, DEX: 0, VIT: 0, INT: 0 };
    // Use a safer way to generate unique IDs
    const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    return {
        id,
        name,
        type,
        creatureType,
        stage,
        cost,
        cp,
        evolvesFrom,
        ability,
        effect,
        securityEffect,
        image,
        stats,
        canAttack: false,
        hasAttacked: false
    };
}

// Create card templates
const cardTemplates = {
    warriorGrunt: {
        name: 'Warrior Grunt', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.WARRIOR, 
        stage: 1, cost: 4, cp: 4000, evolvesFrom: null, 
        ability: null, 
        effect: null, 
        securityEffect: null, 
        image: 'images/warrior_grunt.png'
    },
    paladinGuard: {
        name: 'Paladin Guard', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.PALADIN, 
        stage: 1, cost: 3, cp: 3000, evolvesFrom: null, 
        ability: 'Defender', 
        effect: 'When this card blocks, reduce damage by 1000', 
        securityEffect: null, 
        image: 'images/paladin_guard.png'
    },
    mageApprentice: {
        name: 'Mage Apprentice', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.MAGE, 
        stage: 1, cost: 2, cp: 2000, evolvesFrom: null, 
        ability: null, 
        effect: 'When played, draw 1 card', 
        securityEffect: null, 
        image: 'images/mage_apprentice.png'
    },
    rogueScout: {
        name: 'Rogue Scout', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.ROGUE, 
        stage: 1, cost: 2, cp: 2500, evolvesFrom: null, 
        ability: 'Stealth', 
        effect: 'Cannot be blocked on its first attack', 
        securityEffect: null, 
        image: 'images/rogue_scout.png'
    },
    fireball: {
        name: 'Fireball', type: CARD_TYPES.SPELL, creatureType: null, 
        stage: null, cost: 3, cp: null, evolvesFrom: null, 
        ability: null, 
        effect: 'Deal 3000 damage to a creature', 
        securityEffect: 'Deal 2000 damage to the attacking creature', 
        image: 'images/fireball.png'
    },
    healingWave: {
        name: 'Healing Wave', type: CARD_TYPES.SPELL, creatureType: null, 
        stage: null, cost: 2, cp: null, evolvesFrom: null, 
        ability: null, 
        effect: 'Restore 2000 CP to one friendly creature', 
        securityEffect: 'Add this card to your hand', 
        image: 'images/heal.png'
    }
};

// Function to create a card instance from template
function createCardFromTemplate(templateName) {
    const template = cardTemplates[templateName];
    if (!template) {
        console.error(`No template found for: ${templateName}`);
        return null;
    }
    return createCard(
        template.name, template.type, template.creatureType, template.stage,
        template.cost, template.cp, template.evolvesFrom, template.ability,
        template.effect, template.securityEffect, template.image
    );
}

// Log game events
function logGameEvent(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    gameState.gameLog.push(logEntry);
    
    // Update chat history UI
    const chatEntry = document.createElement('div');
    chatEntry.className = 'chat-entry';
    chatEntry.textContent = logEntry;
    domElements.chatHistory.appendChild(chatEntry);
    
    // Auto-scroll to bottom
    domElements.chatHistory.scrollTop = domElements.chatHistory.scrollHeight;
}

// Shuffle array function
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array; // Return the shuffled array for chaining
}

// Initialize deck with card templates
function initializeDeck() {
    const deck = [];
    // Add varied quantities of each card type
    for (let i = 0; i < 10; i++) {
        deck.push(createCardFromTemplate('warriorGrunt'));
    }
    for (let i = 0; i < 8; i++) {
        deck.push(createCardFromTemplate('paladinGuard'));
    }
    for (let i = 0; i < 8; i++) {
        deck.push(createCardFromTemplate('mageApprentice'));
    }
    for (let i = 0; i < 8; i++) {
        deck.push(createCardFromTemplate('rogueScout'));
    }
    for (let i = 0; i < 6; i++) {
        deck.push(createCardFromTemplate('fireball'));
    }
    for (let i = 0; i < 6; i++) {
        deck.push(createCardFromTemplate('healingWave'));
    }
    return deck;
}

// Draw card function
function drawCard(player, count = 1) {
    const playerObj = gameState.players[player];
    if (!playerObj) return;
    
    for (let i = 0; i < count; i++) {
        if (playerObj.deck.length === 0) {
            logGameEvent(`${playerObj.name} has no cards left to draw!`);
            
            // Check if losing by deck out
            if (playerObj.security.length === 0) {
                const opponent = player === 'playerA' ? 'playerB' : 'playerA';
                logGameEvent(`${gameState.players[opponent].name} wins by deck out!`);
                setTimeout(() => {
                    alert(`${gameState.players[opponent].name} wins by deck out!`);
                    initializeGame();
                }, 1000);
            }
            
            return;
        }
        const drawnCard = playerObj.deck.shift();
        playerObj.hand.push(drawnCard);
        
        // Only log the specific card for the current player
        if (player === gameState.currentPlayer) {
            logGameEvent(`${playerObj.name} drew ${drawnCard.name}.`);
        } else {
            logGameEvent(`${playerObj.name} drew a card.`);
        }
    }
    
    updateUI();
}

// Deck builder functionality
const deckBuilder = {
    allCards: {},
    playerDeck: [],
    minDeckSize: 40,
    maxDeckSize: 50,
    maxCopiesPerCard: 4,

    // Initialize the deck builder
    initialize: function() {
        // Create card templates library from existing templates
        this.allCards = { ...cardTemplates };
        
        // Add additional card templates for deck variety
        this.addCardTemplates();
        
        // Create default deck (for new players)
        this.createDefaultDeck();
        
        // Set up the deck builder UI
        this.setupUI();
        
        // Load any saved deck from local storage
        this.loadDeck();
    },
    
    // Add more card templates for variety
    addCardTemplates: function() {
        const newTemplates = {
            warriorChampion: {
                name: 'Warrior Champion', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.WARRIOR, 
                stage: 2, cost: 6, cp: 7000, evolvesFrom: 'Warrior Grunt', 
                ability: 'Guardian', 
                effect: 'Your other Warriors gain +1000 CP', 
                securityEffect: null, 
                image: 'images/warrior_champion.png'
            },
            holyLight: {
                name: 'Holy Light', type: CARD_TYPES.SPELL, creatureType: null, 
                stage: null, cost: 4, cp: null, evolvesFrom: null, 
                ability: null, 
                effect: 'Heal all your creatures for 1000 CP', 
                securityEffect: 'Add this card to your hand and draw 1 card', 
                image: 'images/holy_light.png'
            },
            archmage: {
                name: 'Archmage', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.MAGE, 
                stage: 2, cost: 5, cp: 4000, evolvesFrom: 'Mage Apprentice', 
                ability: 'Spellweaver', 
                effect: 'When played, add a spell from your trash pile to your hand', 
                securityEffect: null, 
                image: 'images/archmage.png'
            },
            shadowAssassin: {
                name: 'Shadow Assassin', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.ROGUE, 
                stage: 2, cost: 5, cp: 5000, evolvesFrom: 'Rogue Scout', 
                ability: 'Ambush', 
                effect: 'When attacking, your opponent cannot block with creatures that have less than 3000 CP', 
                securityEffect: null, 
                image: 'images/shadow_assassin.png'
            },
            templarKnight: {
                name: 'Templar Knight', type: CARD_TYPES.CREATURE, creatureType: CREATURE_TYPES.PALADIN, 
                stage: 2, cost: 7, cp: 6000, evolvesFrom: 'Paladin Guard', 
                ability: 'Divine Shield', 
                effect: 'This creature cannot be destroyed by spell effects', 
                securityEffect: null, 
                image: 'images/templar_knight.png'
            },
            frostbolt: {
                name: 'Frostbolt', type: CARD_TYPES.SPELL, creatureType: null, 
                stage: null, cost: 2, cp: null, evolvesFrom: null, 
                ability: null, 
                effect: 'Freeze an enemy creature (it cannot attack next turn)', 
                securityEffect: 'Freeze the attacking creature', 
                image: 'images/frostbolt.png'
            }
        };
        
        // Add new templates to existing card templates
        Object.assign(this.allCards, newTemplates);
    },
    
    // Create default starter deck
    createDefaultDeck: function() {
        this.playerDeck = [];
        
        // Add starter cards (balanced mix of cards)
        this.addToDeck('warriorGrunt', 4);
        this.addToDeck('paladinGuard', 4);
        this.addToDeck('mageApprentice', 4);
        this.addToDeck('rogueScout', 4);
        this.addToDeck('fireball', 3);
        this.addToDeck('healingWave', 3);
        this.addToDeck('warriorChampion', 2);
        this.addToDeck('templarKnight', 2);
        this.addToDeck('archmage', 2);
        this.addToDeck('shadowAssassin', 2);
        this.addToDeck('holyLight', 2);
        this.addToDeck('frostbolt', 2);
        
        // Save this deck
        this.saveDeck();
    },
    
    // Add multiple copies of a card to deck
    addToDeck: function(templateId, count = 1) {
        for (let i = 0; i < count; i++) {
            // Create a unique card instance
            const card = createCardFromTemplate(templateId);
            if (card) {
                this.playerDeck.push({
                    templateId,
                    card
                });
            }
        }
    },
    
    // Save deck to local storage
    saveDeck: function() {
        try {
            // Create a simplified version of the deck (just template IDs)
            const deckData = this.playerDeck.map(item => item.templateId);
            localStorage.setItem('playerDeck', JSON.stringify(deckData));
            console.log('Deck saved successfully');
        } catch (error) {
            console.error('Error saving deck:', error);
        }
    },
    
    // Load deck from local storage
    loadDeck: function() {
        try {
            const savedDeck = localStorage.getItem('playerDeck');
            if (savedDeck) {
                // Clear current deck
                this.playerDeck = [];
                
                // Recreate deck from template IDs
                const deckData = JSON.parse(savedDeck);
                deckData.forEach(templateId => {
                    this.addToDeck(templateId);
                });
                console.log('Deck loaded successfully');
                
                // Update deck display
                this.updateDeckDisplay();
            }
        } catch (error) {
            console.error('Error loading deck:', error);
        }
    },
    
    // Count cards in deck by template ID
    countCardInDeck: function(templateId) {
        return this.playerDeck.filter(item => item.templateId === templateId).length;
    },
    
    // Remove a card from the deck
    removeFromDeck: function(templateId) {
        // Find index of the first matching card
        const index = this.playerDeck.findIndex(item => item.templateId === templateId);
        if (index !== -1) {
            // Remove the card
            this.playerDeck.splice(index, 1);
            
            // Update UI
            this.updateDeckDisplay();
            this.updateCardLibraryButtons();
            this.saveDeck();
        }
    },
    
    // Set up the deck builder UI
    setupUI: function() {
        // Create deck builder container
        const deckBuilderContainer = document.createElement('div');
        deckBuilderContainer.id = 'deckBuilderContainer';
        deckBuilderContainer.className = 'deck-builder-container';
        
        // Add toggle button to game UI
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggleDeckBuilder';
        toggleButton.textContent = 'Deck Builder';
        toggleButton.className = 'toggle-deck-builder';
        toggleButton.onclick = this.toggleDeckBuilder.bind(this);
        
        // Add toggle button to game UI
        const headerContainer = document.querySelector('.game-board');
        headerContainer.insertBefore(toggleButton, headerContainer.firstChild);
        
        // Create deck builder components
        const deckBuilderHTML = `
            <div class="deck-builder-header">
                <h2>Deck Builder</h2>
                <div class="deck-builder-stats">
                    <span id="deckCount">0</span>/<span id="deckMax">${this.maxDeckSize}</span> cards
                </div>
                <button id="closeDeckBuilder">×</button>
            </div>
            <div class="deck-builder-content">
                <div class="card-library">
                    <h3>Available Cards</h3>
                    <div id="cardLibrary" class="card-grid"></div>
                </div>
                <div class="current-deck">
                    <h3>Your Deck</h3>
                    <div class="deck-actions">
                        <button id="saveDeckBtn">Save Deck</button>
                        <button id="resetDeckBtn">Reset to Default</button>
                    </div>
                    <div id="currentDeck" class="card-list"></div>
                </div>
            </div>
        `;
        
        deckBuilderContainer.innerHTML = deckBuilderHTML;
        document.body.appendChild(deckBuilderContainer);
        
        // Add event listeners
        document.getElementById('closeDeckBuilder').addEventListener('click', this.toggleDeckBuilder.bind(this));
        document.getElementById('saveDeckBtn').addEventListener('click', this.saveDeck.bind(this));
        document.getElementById('resetDeckBtn').addEventListener('click', () => {
            if (confirm('Reset your deck to default? This will delete your current deck.')) {
                this.createDefaultDeck();
                this.updateDeckDisplay();
                this.updateCardLibraryButtons();
            }
        });
        
        // Populate card library
        this.populateCardLibrary();
        
        // Update deck display
        this.updateDeckDisplay();
        
        // Add styles
        this.addStyles();
    },
    
    // Toggle deck builder visibility
    toggleDeckBuilder: function() {
        const deckBuilder = document.getElementById('deckBuilderContainer');
        if (deckBuilder.classList.contains('visible')) {
            deckBuilder.classList.remove('visible');
        } else {
            deckBuilder.classList.add('visible');
            this.updateDeckDisplay();
            this.updateCardLibraryButtons();
        }
    },
    
    // Populate card library with all available cards
    populateCardLibrary: function() {
        const cardLibrary = document.getElementById('cardLibrary');
        cardLibrary.innerHTML = '';
        
        // Group cards by type and creature type
        const groupedCards = {};
        
        // Process each card template
        Object.entries(this.allCards).forEach(([templateId, card]) => {
            // Create category key
            const categoryKey = card.type === CARD_TYPES.CREATURE 
                ? `${card.type}-${card.creatureType}` 
                : card.type;
            
            // Initialize category if needed
            if (!groupedCards[categoryKey]) {
                groupedCards[categoryKey] = {
                    name: card.type === CARD_TYPES.CREATURE 
                        ? `${card.creatureType} ${card.type}s` 
                        : `${card.type}s`,
                    cards: []
                };
            }
            
            // Add card to category
            groupedCards[categoryKey].cards.push({
                templateId,
                card
            });
        });
        
        // Create section for each category
        Object.values(groupedCards).forEach(category => {
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'card-category-header';
            categoryHeader.textContent = category.name;
            cardLibrary.appendChild(categoryHeader);
            
            // Create cards grid for this category
            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'category-grid';
            
            // Add each card in category
            category.cards.forEach(({templateId, card}) => {
                const cardElement = document.createElement('div');
                cardElement.className = 'library-card';
                cardElement.dataset.templateId = templateId;
                
                // Create card preview
                const cardPreview = document.createElement('div');
                cardPreview.className = 'card-preview';
                cardPreview.style.backgroundImage = `url(${card.image})`;
                
                // Create card info
                const cardInfo = document.createElement('div');
                cardInfo.className = 'card-info';
                cardInfo.innerHTML = `
                    <div class="card-name">${card.name}</div>
                    <div class="card-type">${card.type}${card.creatureType ? ` - ${card.creatureType}` : ''}</div>
                    <div class="card-cost">Cost: ${card.cost}</div>
                    ${card.cp ? `<div class="card-cp">CP: ${card.cp}</div>` : ''}
                    ${card.ability ? `<div class="card-ability">${card.ability}</div>` : ''}
                    <div class="card-effect">${card.effect}</div>
                `;
                
                // Create add button
                const addButton = document.createElement('button');
                addButton.className = 'add-card-btn';
                addButton.textContent = 'Add to Deck';
                addButton.onclick = () => this.addCardToDeck(templateId);
                
                // Create counter span to show how many in deck
                const counterSpan = document.createElement('span');
                counterSpan.className = 'card-count';
                counterSpan.id = `count-${templateId}`;
                counterSpan.textContent = this.countCardInDeck(templateId);
                
                // Add elements to card
                cardElement.appendChild(cardPreview);
                cardElement.appendChild(cardInfo);
                cardElement.appendChild(addButton);
                cardElement.appendChild(counterSpan);
                
                // Add card to category grid
                categoryGrid.appendChild(cardElement);
            });
            
            // Add category grid to library
            cardLibrary.appendChild(categoryGrid);
        });
    },
    
    // Add a card to the player's deck
    addCardToDeck: function(templateId) {
        // Check if deck is full
        if (this.playerDeck.length >= this.maxDeckSize) {
            alert(`Your deck is full (maximum ${this.maxDeckSize} cards)`);
            return;
        }
        
        // Check if max copies reached
        const currentCount = this.countCardInDeck(templateId);
        if (currentCount >= this.maxCopiesPerCard) {
            alert(`You can only have ${this.maxCopiesPerCard} copies of each card in your deck`);
            return;
        }
        
        // Add card to deck
        this.addToDeck(templateId);
        
        // Update UI
        this.updateDeckDisplay();
        this.updateCardLibraryButtons();
        
        // Save the updated deck
        this.saveDeck();
    },
    
    // Update the deck display
    updateDeckDisplay: function() {
        const currentDeckElement = document.getElementById('currentDeck');
        const deckCountElement = document.getElementById('deckCount');
        
        if (!currentDeckElement || !deckCountElement) return;
        
        // Clear current display
        currentDeckElement.innerHTML = '';
        
        // Group cards by name for better organization
        const groupedCards = {};
        this.playerDeck.forEach(({templateId, card}) => {
            if (!groupedCards[card.name]) {
                groupedCards[card.name] = {
                    templateId,
                    card,
                    count: 1
                };
            } else {
                groupedCards[card.name].count++;
            }
        });
        
        // Create and add card elements
        Object.values(groupedCards).forEach(item => {
            const cardElement = document.createElement('div');
            cardElement.className = 'deck-card';
            
            cardElement.innerHTML = `
                <div class="deck-card-info">
                    <span class="deck-card-count">${item.count}x</span>
                    <span class="deck-card-name">${item.card.name}</span>
                    <span class="deck-card-type">${item.card.type}${item.card.creatureType ? ` - ${item.card.creatureType}` : ''}</span>
                </div>
                <div class="deck-card-cost">Cost: ${item.card.cost}</div>
            `;
            
            // Add removal button
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-card-btn';
            removeButton.textContent = '−';
            removeButton.onclick = () => this.removeFromDeck(item.templateId);
            
            cardElement.appendChild(removeButton);
            currentDeckElement.appendChild(cardElement);
        });
        
        // Update deck count
        deckCountElement.textContent = this.playerDeck.length;
        
        // Add validation class for deck size
        const deckStats = document.querySelector('.deck-builder-stats');
        if (this.playerDeck.length < this.minDeckSize) {
            deckStats.className = 'deck-builder-stats invalid';
        } else {
            deckStats.className = 'deck-builder-stats valid';
        }
    },
    
    // Update card library buttons based on current deck
    updateCardLibraryButtons: function() {
        Object.keys(this.allCards).forEach(templateId => {
            // Update count display
            const countElement = document.getElementById(`count-${templateId}`);
            if (countElement) {
                const count = this.countCardInDeck(templateId);
                countElement.textContent = count;
                
                // Update button status
                const cardElement = countElement.closest('.library-card');
                const addButton = cardElement.querySelector('.add-card-btn');
                
                if (this.playerDeck.length >= this.maxDeckSize) {
                    // Deck is full
                    addButton.disabled = true;
                    addButton.textContent = 'Deck Full';
                } else if (count >= this.maxCopiesPerCard) {
                    // Max copies reached
                    addButton.disabled = true;
                    addButton.textContent = 'Max Copies';
                } else {
                    // Can add more
                    addButton.disabled = false;
                    addButton.textContent = 'Add to Deck';
                }
            }
        });
    },
    
    // Add CSS styles for deck builder
    addStyles: function() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .toggle-deck-builder {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 10;
                padding: 8px 16px;
                background-color: #4a90e2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .deck-builder-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.95);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            
            .deck-builder-container.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .deck-builder-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 20px;
                background-color: #333;
                color: white;
            }
            
            .deck-builder-header h2 {
                margin: 0;
            }
            
            .deck-builder-stats {
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .deck-builder-stats.valid {
                background-color: #4caf50;
            }
            
            .deck-builder-stats.invalid {
                background-color: #f44336;
            }
            
            #closeDeckBuilder {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
            }
            
            .deck-builder-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .card-library, .current-deck {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                max-height: calc(100vh - 60px);
            }
            
            .card-library {
                border-right: 1px solid #ddd;
            }
            
            .card-grid {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .card-category-header {
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0;
                padding-bottom: 5px;
                border-bottom: 2px solid #333;
            }
            
            .category-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .library-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px;
                background-color: #f9f9f9;
                position: relative;
            }
            
            .card-preview {
                height: 100px;
                background-size: cover;
                background-position: center;
                margin-bottom: 10px;
                border-radius: 4px;
            }
            
            .card-info {
                font-size: 14px;
            }
            
            .card-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .card-type, .card-cost, .card-cp {
                font-size: 12px;
                color: #666;
                margin-bottom: 3px;
            }
            
            .card-ability {
                font-style: italic;
                margin: 5px 0;
            }
            
            .card-effect {
                font-size: 12px;
                margin-top: 5px;
            }
            
            .card-count {
                position: absolute;
                top: 5px;
                right: 5px;
                background-color: #333;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            
            .add-card-btn {
                margin-top: 10px;
                padding: 5px 10px;
                background-color: #4caf50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            }
            
            .add-card-btn:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            
            .deck-actions {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .deck-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #saveDeckBtn {
                background-color: #4a90e2;
                color: white;
            }
            
            #resetDeckBtn {
                background-color: #f44336;
                color: white;
            }
            
            .card-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .deck-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background-color: #f5f5f5;
                border-radius: 4px;
                border-left: 4px solid #4a90e2;
            }
            
            .deck-card-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .deck-card-count {
                font-weight: bold;
                color: #4a90e2;
            }
            
            .deck-card-type {
                font-size: 12px;
                color: #666;
                margin-left: 8px;
            }
            
            .remove-card-btn {
                background-color: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(styleElement);
    }
};