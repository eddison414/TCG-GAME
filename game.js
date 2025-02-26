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

// Initialize game
function initializeGame() {
    // Reset game state
    gameState.memoryGauge = 0;
    gameState.currentPhase = GAME_PHASES.DRAW;
    gameState.turn = 1;
    gameState.gameLog = [];
    
    // Initialize player decks
    gameState.players.playerA.deck = initializeDeck();
    gameState.players.playerB.deck = initializeDeck();
    
    // Shuffle decks
    shuffle(gameState.players.playerA.deck);
    shuffle(gameState.players.playerB.deck);
    
    // Clear player states
    for (const player of Object.values(gameState.players)) {
        player.hand = [];
        player.field = [];
        player.security = [];
        player.trashPile = [];
    }
    
    // Set up security cards
    gameState.players.playerA.security = gameState.players.playerA.deck.splice(0, 5);
    gameState.players.playerB.security = gameState.players.playerB.deck.splice(0, 5);
    
    // Draw initial hands
    gameState.players.playerA.hand = gameState.players.playerA.deck.splice(0, 5);
    gameState.players.playerB.hand = gameState.players.playerB.deck.splice(0, 5);
    
    // Set first player
    gameState.currentPlayer = 'playerA';
    
    logGameEvent("Game initialized! Player A goes first.");
    updateUI();
}

// Update UI
function updateUI() {
    const currentPlayerObj = gameState.players[gameState.currentPlayer];
    
    // Update memory gauge and turn info
    domElements.memoryGauge.textContent = `Memory Gauge: ${gameState.memoryGauge} | Turn: ${gameState.turn} | Phase: ${gameState.currentPhase} | Current Player: ${currentPlayerObj.name}`;
    
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
    
    // AI turn handling
    if (gameState.currentPlayer === 'playerB') {
        setTimeout(aiTakeAction, 1000); // AI acts after a 1-second delay
    }
}

// Render a player's field
function renderPlayerField(playerKey) {
    const player = gameState.players[playerKey];
    const fieldElement = domElements[`${playerKey}Field`];
    fieldElement.innerHTML = '';
    
    player.field.forEach((card, index) => {
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
        
        // Add attack functionality only for current player's cards that can attack
        if (playerKey === gameState.currentPlayer && 
            gameState.currentPhase === GAME_PHASES.ATTACK && 
            card.type === CARD_TYPES.CREATURE && 
            !card.hasAttacked && 
            card.canAttack) {
            cardElement.onclick = () => attackWithCreature(playerKey, index);
            cardElement.classList.add('attackable');
        } else {
            cardElement.classList.add('disabled');
        }
        
        fieldElement.appendChild(cardElement);
    });
    
    // Add placeholder text if field is empty
    if (player.field.length === 0) {
        const placeholderText = document.createElement('div');
        placeholderText.textContent = 'No cards in play';
        placeholderText.className = 'placeholder-text';
        fieldElement.appendChild(placeholderText);
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
            cardElement.style.backgroundImage = 'url(images/card_back.png)';
            handElement.appendChild(cardElement);
        }
    } else {
        // Render actual cards for player
        player.hand.forEach((card, index) => {
            const cardElement = createCardElement(card);
            
            // Add play functionality only for current player and play phase
            if (playerKey === gameState.currentPlayer && 
                gameState.currentPhase === GAME_PHASES.PLAY && 
                canPlayCard(playerKey, card)) {
                cardElement.onclick = () => playCard(playerKey, index);
                cardElement.classList.add('playable');
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

// Create a card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    cardElement.style.backgroundImage = `url(${card.image})`;
    cardElement.style.backgroundSize = 'cover';

    const nameElement = document.createElement('div');
    nameElement.className = 'name';
    nameElement.textContent = card.name;
    
    const costElement = document.createElement('div');
    costElement.className = 'cost';
    costElement.textContent = card.cost;

    const cpElement = document.createElement('div');
    cpElement.className = 'cp';
    cpElement.textContent = card.cp;

    const statsElement = document.createElement('div');
    statsElement.className = 'stats';
    statsElement.textContent = `STR: ${card.stats.STR} | DEX: ${card.stats.DEX} | VIT: ${card.stats.VIT} | INT: ${card.stats.INT}`;

    cardElement.appendChild(nameElement);
    cardElement.appendChild(costElement);
    if (card.cp) cardElement.appendChild(cpElement);
    cardElement.appendChild(statsElement);
    
    // Add card effect tooltip
    if (card.effect) {
        cardElement.title = card.effect;
    }

    return cardElement;
}

// Check if a card can be played
function canPlayCard(playerKey, card) {
    const cost = card.cost;
    if (playerKey === 'playerA') {
        return gameState.memoryGauge - cost >= -10; // Prevent memory gauge from going too negative
    } else {
        return gameState.memoryGauge + cost <= 10; // Prevent memory gauge from going too positive
    }
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
    
    // Adjust memory gauge based on which player played the card
    if (playerKey === 'playerA') {
        gameState.memoryGauge -= cost;
    } else {
        gameState.memoryGauge += cost;
    }
    
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
    
    // Adjust memory gauge
    if (playerKey === 'playerA') {
        gameState.memoryGauge -= 1;
    } else {
        gameState.memoryGauge += 1;
    }
    
    logGameEvent(`${player.name}'s ${attacker.name} (${attacker.cp} CP) is attacking!`);
    
    // Check if opponent will block
    let block = false;
    let blockerIndex = -1;
    
    if (gameState.players[opponent].field.length > 0) {
        if (opponent === 'playerA') {
            // For human player, ask if they want to block
            // In a real implementation, use a more sophisticated UI
            block = confirm(`${gameState.players[opponent].name}, do you want to block the attack with a creature?`);
            if (block) {
                // For simplicity, use first creature. In real game, let player choose.
                blockerIndex = 0;
            }
        } else {
            // AI decides whether to block
            const blockDecision = aiDecideToBlock(opponent, attacker);
            if (blockDecision.block) {
                block = true;
                blockerIndex = blockDecision.blockerIndex;
            }
        }
    }
    
    // Check if Rogue Scout's Stealth ability applies
    const hasStealth = attacker.name === 'Rogue Scout' && 
                      attacker.ability === 'Stealth' && 
                      !attacker.hasAttackedBefore;
                      
    if (hasStealth) {
        logGameEvent(`${attacker.name}'s Stealth ability prevents blocking!`);
        attacker.hasAttackedBefore = true;
        block = false;
    }
    
    // Handle blocking
    if (block && blockerIndex >= 0) {
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
                player.field.splice(fieldIndex, 1);
            } else {
                logGameEvent("Both creatures survived the battle!");
            }
        }
    } else {
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
                logGameEvent(`Security effect: ${securityCard.securityEffect}`);
                
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
                    logGameEvent(`${securityCard.securityEffect}`);
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
            
            // Move to Play phase
            gameState.currentPhase = GAME_PHASES.PLAY;
            logGameEvent("AI enters play phase");
            updateUI();
            setTimeout(aiTakeAction, 1000);
            break;
            
        case GAME_PHASES.PLAY:
            // Try to play cards
            let cardPlayed = false;
            
            // First try to play creatures (highest CP first)
            const playableCreatures = gameState.players.playerB.hand.filter(card => 
                card.type === CARD_TYPES.CREATURE && canPlayCard('playerB', card)
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
                        !card.hasAttacked
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
    logGameEvent(`${gameState.players[gameState.currentPlayer].name}'s turn ends.`);
    
    // Switch current player
    gameState.currentPlayer = gameState.currentPlayer === 'playerA' ? 'playerB' : 'playerA';
    
    // If starting a new turn, increment turn counter
    if (gameState.currentPlayer === 'playerA') {
        gameState.turn++;
    }
    
    // Reset to Draw phase
    gameState.currentPhase = GAME_PHASES.DRAW;
    
    logGameEvent(`${gameState.players[gameState.currentPlayer].name}'s turn begins.`);
    
    updateUI();
}

// Add phase control buttons to UI since they don't exist in the HTML
function createPhaseControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'phase-controls';
    controlsDiv.style.margin = '10px 0';
    controlsDiv.style.textAlign = 'center';
    
    const drawButton = document.createElement('button');
    drawButton.textContent = 'Draw Phase';
    drawButton.id = 'draw-phase-btn';
    drawButton.className = 'phase-btn';
    drawButton.style.margin = '0 5px';
    
    const playButton = document.createElement('button');
    playButton.textContent = 'Play Phase';
    playButton.id = 'play-phase-btn';
    playButton.className = 'phase-btn';
    playButton.style.margin = '0 5px';
    
    const attackButton = document.createElement('button');
    attackButton.textContent = 'Attack Phase';
    attackButton.id = 'attack-phase-btn';
    attackButton.className = 'phase-btn';
    attackButton.style.margin = '0 5px';
    
    const endButton = document.createElement('button');
    endButton.textContent = 'End Turn';
    endButton.id = 'end-phase-btn';
    endButton.className = 'phase-btn';
    endButton.style.margin = '0 5px';
    
    controlsDiv.appendChild(drawButton);
    controlsDiv.appendChild(playButton);
    controlsDiv.appendChild(attackButton);
    controlsDiv.appendChild(endButton);
    
    // Find playerA area to insert controls
    const playerArea = document.getElementById('playerA');
    playerArea.insertBefore(controlsDiv, playerArea.firstChild);
    
    // Add event listeners
    drawButton.addEventListener('click', () => {
        if (gameState.currentPlayer === 'playerA') {
            gameState.currentPhase = GAME_PHASES.DRAW;
            drawCard('playerA');
            
            // Reset all creatures' attack eligibility
            gameState.players.playerA.field.forEach(card => {
                card.canAttack = true;
                card.hasAttacked = false;
            });
            
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
            endTurn();
        }
    });
}

// Add CSS styles for cards and gameplay elements
function addGameStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .card .name {
            position: absolute;
            top: 0;
            width: 100%;
            padding: 2px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 12px;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        
        .placeholder-text {
            color: #999;
            font-style: italic;
        }
        
        .card.playable {
            border: 2px solid green;
            cursor: pointer;
        }
        
        .card.attackable {
            border: 2px solid red;
            cursor: pointer;
        }
        
        .passive {
            position: absolute;
            top: 50%;
            width: 100%;
            text-align: center;
            font-weight: bold;
            text-shadow: 1px 1px 2px black;
        }
    `;
    document.head.appendChild(style);
}

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', () => {
    createPhaseControls();
    addGameStyles();
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
        CARD_TYPES
    };
}