/**
 * utils/StatCalculator.js
 * Handles stat calculations and distributions
 */
import { DEFAULT_STATS, CP_WEIGHTS } from '../constants.js';

export class StatCalculator {
  /**
   * Distribute stats for a creature card
   * @param {CreatureCard} card - The card to distribute stats for
   * @param {boolean} isAdvanced - Whether this is an advanced class card
   * @returns {object} The updated stats
   */
  distributeStats(card, isAdvanced = false) {
    // Clone the base stats
    const stats = { ...card.stats };
    
    // Determine total points based on class level
    const totalPoints = isAdvanced ? 200 : 100;
    
    // Calculate remaining random points (50% of total)
    let remainingPoints = totalPoints / 2;
    
    // Track the total base stats for verification
    const totalBaseStats = Object.values(stats).reduce((sum, value) => sum + value, 0);
    
    // If base stats don't match expected total, adjust them
    if (totalBaseStats !== totalPoints / 2) {
      const adjustFactor = (totalPoints / 2) / totalBaseStats;
      Object.keys(stats).forEach(stat => {
        stats[stat] = Math.round(stats[stat] * adjustFactor);
      });
    }
    
    // Distribute remaining points randomly
    while (remainingPoints > 0) {
      // Choose a random stat
      const statKeys = Object.keys(stats).filter(key => key !== 'EXP'); // Don't modify EXP
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      
      // Calculate random points to add (between 5 and 15)
      let pointsToAdd = Math.min(5 + Math.floor(Math.random() * 11), remainingPoints);
      
      // Round to nearest 5
      pointsToAdd = Math.round(pointsToAdd / 5) * 5;
      if (pointsToAdd < 5) pointsToAdd = 5;
      
      // Add points to the stat if there are enough remaining
      if (remainingPoints >= pointsToAdd) {
        stats[randomStat] += pointsToAdd;
        remainingPoints -= pointsToAdd;
      } else {
        // Add remaining points
        stats[randomStat] += remainingPoints;
        remainingPoints = 0;
      }
    }
    
    // Ensure all stats end in 0 or 5
    Object.keys(stats).forEach(stat => {
      stats[stat] = Math.round(stats[stat] / 5) * 5;
    });
    
    // Update the card's stats
    card.stats = stats;
    
    // Calculate CP based on stats
    card.cp = this.calculateCP(stats);
    
    return stats;
  }
  
  /**
   * Calculate CP from stats
   * @param {object} stats - The stats object
   * @returns {number} The calculated CP
   */
  calculateCP(stats) {
    return Object.entries(stats).reduce((total, [stat, value]) => {
      return total + (value * (CP_WEIGHTS[stat] || 0));
    }, 0);
  }
}

/**
 * utils/EventEmitter.js
 * Simple event system for decoupled communication
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} listener - Callback function
   * @returns {function} Unsubscribe function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(l => l !== listener);
    };
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

/**
 * utils/Logger.js
 * Game event logging
 */
export class Logger {
  constructor() {
    this.logs = [];
  }
  
  /**
   * Log a game event
   * @param {string} message - Message to log
   * @param {object} metadata - Additional metadata
   */
  log(message, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      message,
      ...metadata
    };
    
    this.logs.push(logEntry);
    console.log(`[Game] ${message}`, metadata);
    
    return logEntry;
  }
  
  /**
   * Get all logs
   * @returns {array} Array of log entries
   */
  getLog() {
    return this.logs;
  }
  
  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }
}

/**
 * ui/UIManager.js
 * Manages all UI rendering and interaction
 */
import { GAME_PHASES, PLAYERS, GAME_CONFIG } from '../constants.js';

export class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.domElements = {};
    
    // Listen for game events
    this.setupEventListeners();
  }
  
  /**
   * Initialize DOM references
   */
  initializeDomElements() {
    // Reference essential DOM elements
    this.domElements = {
      coinDisplay: document.getElementById('coinDisplay'),
      playerAHand: document.getElementById('playerAHand'),
      playerAField: document.getElementById('playerAField'),
      playerASecurity: document.getElementById('playerASecurity'),
      playerBHand: document.getElementById('playerBHand'),
      playerBField: document.getElementById('playerBField'),
      playerBSecurity: document.getElementById('playerBSecurity'),
      chatHistory: document.getElementById('chatHistory'),
      playerAApprentice: document.getElementById('playerAApprentice'),
      playerBApprentice: document.getElementById('playerBApprentice')
    };
    
    // Ensure all required elements exist
    if (!this.domElements.coinDisplay || 
        !this.domElements.playerAHand || 
        !this.domElements.playerAField) {
      console.error('Critical DOM elements missing. UI cannot be initialized.');
      return false;
    }
    
    return true;
  }
  
  /**
   * Setup event listeners for game events
   */
  setupEventListeners() {
    // React to game state changes
    this.gameManager.events.on('stateChanged', () => {
      this.updateUI();
    });
    
    // Handle phase changes
    this.gameManager.events.on('phaseChanged', (data) => {
      this.updatePhaseButtons();
      
      // If AI's turn, trigger AI action
      if (data.player === PLAYERS.PLAYER_B) {
        setTimeout(() => {
          this.triggerAIAction();
        }, 1000);
      }
    });
    
    // Handle game initialization
    this.gameManager.events.on('gameInitialized', () => {
      this.setupGameControls();
      this.updateUI();
    });
    
    // Handle game over
    this.gameManager.events.on('gameOver', (data) => {
      setTimeout(() => {
        alert(`${data.winnerName} wins by ${data.reason}!`);
        this.gameManager.initGame(
          this.gameManager.players[PLAYERS.PLAYER_A],
          this.gameManager.players[PLAYERS.PLAYER_B]
        );
      }, 1000);
    });
  }
  
  /**
   * Setup game control buttons
   */
  setupGameControls() {
    // Create phase buttons if they don't exist yet
    const phaseContainer = document.querySelector('.phase-controls');
    if (!phaseContainer) {
      // Create phase controls container
      const controlContainer = document.createElement('div');
      controlContainer.className = 'phase-controls';
      controlContainer.style.display = 'flex';
      controlContainer.style.justifyContent = 'center';
      controlContainer.style.margin = '15px 0';
      
      // Create buttons for each phase
      const phases = Object.values(GAME_PHASES);
      phases.forEach(phase => {
        const btn = document.createElement('button');
        btn.id = `${phase}-phase-btn`;
        btn.className = 'phase-btn';
        btn.textContent = phase.charAt(0).toUpperCase() + phase.slice(1);
        btn.addEventListener('click', () => {
          if (this.gameManager.state.currentPlayer === PLAYERS.PLAYER_A) {
            this.gameManager.advancePhase();
          }
        });
        controlContainer.appendChild(btn);
      });
      
      // Add optional draw button
      const optionalDrawBtn = document.createElement('button');
      optionalDrawBtn.id = 'optional-draw-btn';
      optionalDrawBtn.className = 'phase-btn optional-draw';
      optionalDrawBtn.textContent = 'Draw Card (1 Coin)';
      optionalDrawBtn.style.display = 'none';
      optionalDrawBtn.addEventListener('click', () => {
        this.gameManager.drawCard(PLAYERS.PLAYER_A, false, true);
      });
      controlContainer.appendChild(optionalDrawBtn);
      
      // Add cancel evolution button
      const cancelEvolutionBtn = document.createElement('button');
      cancelEvolutionBtn.id = 'cancel-evolution-btn';
      cancelEvolutionBtn.className = 'phase-btn';
      cancelEvolutionBtn.textContent = 'Cancel Evolution';
      cancelEvolutionBtn.style.display = 'none';
      cancelEvolutionBtn.style.backgroundColor = '#f44336';
      cancelEvolutionBtn.addEventListener('click', () => {
        this.gameManager.cancelEvolution();
      });
      controlContainer.appendChild(cancelEvolutionBtn);
      
      // Add the controls to the game board
      this.domElements.coinDisplay.parentNode.insertBefore(
        controlContainer, 
        this.domElements.coinDisplay.nextSibling
      );
    }
    
    // Add apprentice zones if they don't exist yet
    [PLAYERS.PLAYER_A, PLAYERS.PLAYER_B].forEach(playerKey => {
      const playerArea = document.getElementById(playerKey);
      if (!document.getElementById(`${playerKey}Apprentice`)) {
        const apprenticeZone = document.createElement('div');
        apprenticeZone.id = `${playerKey}Apprentice`;
        apprenticeZone.className = 'apprentice-zone';
        
        // Position after security for player A, before field for player B
        if (playerKey === PLAYERS.PLAYER_A) {
          playerArea.insertBefore(apprenticeZone, document.getElementById(`${playerKey}Field`));
        } else {
          playerArea.insertBefore(apprenticeZone, document.getElementById(`${playerKey}Security`).nextSibling);
        }
        
        // Update DOM elements reference
        this.domElements[`${playerKey}Apprentice`] = apprenticeZone;
      }
    });
  }
  
  /**
   * Update the entire UI based on current game state
   */
  updateUI() {
    const gameState = this.gameManager.getState();
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Update coin display and turn info
    this.domElements.coinDisplay.textContent = 
      `${currentPlayer.name}'s Coins: ${currentPlayer.coins} | Turn: ${gameState.turn} | Phase: ${gameState.currentPhase}`;
    
    // Update security counts
    this.domElements.playerASecurity.textContent = 
      `Security: ${gameState.players[PLAYERS.PLAYER_A].securityCount}`;
    this.domElements.playerBSecurity.textContent = 
      `Security: ${gameState.players[PLAYERS.PLAYER_B].securityCount}`;
    
    // Render player fields
    this.renderPlayerField(PLAYERS.PLAYER_A);
    this.renderPlayerField(PLAYERS.PLAYER_B);
    
    // Render player hands
    this.renderPlayerHand(PLAYERS.PLAYER_A);
    this.renderPlayerHand(PLAYERS.PLAYER_B, true); // true for face down
    
    // Render apprentice zones
    this.renderApprenticeZone(PLAYERS.PLAYER_A);
    this.renderApprenticeZone(PLAYERS.PLAYER_B);
    
    // Update phase button states
    this.updatePhaseButtons();
    
    // Update optional draw button
    this.updateOptionalDrawButton();
  }
  
  /**
   * Update phase button states based on current phase
   */
  updatePhaseButtons() {
    // Get the current game state
    const gameState = this.gameManager.getState();
    
    // Safety check if buttons exist
    if (!document.getElementById('draw-phase-btn')) return;
    
    const buttons = {
      draw: document.getElementById('draw-phase-btn'),
      movement: document.getElementById('movement-phase-btn'),
      play: document.getElementById('play-phase-btn'),
      attack: document.getElementById('attack-phase-btn'),
      end: document.getElementById('end-phase-btn')
    };
    
    // Reset all buttons
    Object.values(buttons).forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.disabled = gameState.currentPlayer !== PLAYERS.PLAYER_A;
      }
    });
    
    // Highlight current phase
    buttons[gameState.currentPhase]?.classList.add('active');
    
    // Update cancel evolution button
    const cancelEvolutionBtn = document.getElementById('cancel-evolution-btn');
    if (cancelEvolutionBtn) {
      cancelEvolutionBtn.style.display = 
        gameState.evolution.isEvolutionMode ? 'inline-block' : 'none';
    }
  }
  
  /**
   * Update optional draw button visibility
   */
  updateOptionalDrawButton() {
    const gameState = this.gameManager.getState();
    const optionalDrawBtn = document.getElementById('optional-draw-btn');
    
    if (!optionalDrawBtn) return;
    
    // Only show during play phase and if player has at least 1 coin
    if (gameState.currentPhase === GAME_PHASES.PLAY &&
        gameState.currentPlayer === PLAYERS.PLAYER_A &&
        gameState.players[PLAYERS.PLAYER_A].coins >= GAME_CONFIG.OPTIONAL_DRAW_COST) {
      optionalDrawBtn.style.display = 'inline-block';
    } else {
      optionalDrawBtn.style.display = 'none';
    }
  }
  
  /**
   * Render a player's field with the 3x3 grid layout
   * @param {string} playerKey - ID of the player
   */
  renderPlayerField(playerKey) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const fieldElement = this.domElements[`${playerKey}Field`];
    
    if (!fieldElement) return;
    
    fieldElement.innerHTML = '';
    
    // Add field limit indicator
    const fieldLimitIndicator = document.createElement('div');
    fieldLimitIndicator.className = 'field-limit';
    fieldLimitIndicator.textContent = 
      `Creatures: ${player.field.filter(card => card.type === 'creature').length}/${GAME_CONFIG.MAX_CREATURES}`;
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
    for (let position = 0; position < GAME_CONFIG.MAX_FIELD_SLOTS; position++) {
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
      const cardsAtPosition = player.field.filter(card => card.position === position);
      
      if (cardsAtPosition.length > 0) {
        const card = cardsAtPosition[0];
        const cardElement = this.createCardElement(card);
        
        this.addCardInteractivity(cardElement, playerKey, card, 'field');
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
  
  /**
   * Render a player's hand
   * @param {string} playerKey - ID of the player
   * @param {boolean} faceDown - Whether to render cards face down
   */
  renderPlayerHand(playerKey, faceDown = false) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const handElement = this.domElements[`${playerKey}Hand`];
    
    if (!handElement) return;
    
    handElement.innerHTML = '';
    
    if (faceDown) {
      // Render face-down cards for opponent
      for (let i = 0; i < player.handCount; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = 'url(/Game/TCG-GAME/images/card_back.png)';
        handElement.appendChild(cardElement);
      }
    } else {
      // Render actual cards for player
      player.hand.forEach((card, index) => {
        const cardElement = this.createCardElement(card);
        
        this.addCardInteractivity(cardElement, playerKey, card, 'hand', index);
        handElement.appendChild(cardElement);
      });
    }
    
    // Add placeholder text if hand is empty
    if (player.handCount === 0) {
      const placeholderText = document.createElement('div');
      placeholderText.textContent = 'No cards in hand';
      placeholderText.className = 'placeholder-text';
      handElement.appendChild(placeholderText);
    }
  }
  
  /**
   * Render a player's apprentice zone
   * @param {string} playerKey - ID of the player
   */
  renderApprenticeZone(playerKey) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const apprenticeElement = this.domElements[`${playerKey}Apprentice`];
    
    if (!apprenticeElement) return;
    
    apprenticeElement.innerHTML = '';
    
    player.apprenticeZone.forEach((card, index) => {
      const cardElement = this.createCardElement(card);
      
      this.addCardInteractivity(cardElement, playerKey, card, 'apprentice', index);
      apprenticeElement.appendChild(cardElement);
    });
    
    // Add "Draw Apprentice" button if appropriate
    if (player.apprenticeZone.length < GAME_CONFIG.MAX_APPRENTICES &&
        player.apprenticeDeckCount > 0 &&
        playerKey === gameState.currentPlayer &&
        gameState.currentPhase === GAME_PHASES.PLAY &&
        !player.hasPlayedApprentice) {
      
      const drawButton = document.createElement('button');
      drawButton.className = 'apprentice-draw-btn';
      drawButton.textContent = 'Summon Apprentice';
      drawButton.onclick = () => {
        this.gameManager.drawCard(playerKey, true);
      };
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
  
  /**
   * Create a card element for display
   * @param {object} card - Card data
   * @returns {HTMLElement} Card element
   */
  createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    
    // Add advanced class styling if applicable
    if (card.classType === 'advanced') {
      cardElement.classList.add('advanced');
    }
    
    // Set background image
    if (card.image) {
      cardElement.style.backgroundImage = `url(${card.image})`;
    } else {
      console.warn(`No image found for card: ${card.name}`);
      // Create a fallback visual for the card
      cardElement.style.background = `linear-gradient(135deg, #444, #666)`;
    }
    
    // Add card name
    const nameElement = document.createElement('div');
    nameElement.className = 'name';
    nameElement.textContent = card.name;
    
    // Add card cost
    const costElement = document.createElement('div');
    costElement.className = 'cost';
    costElement.textContent = card.cost;
    
    // Add CP for creature cards
    if (card.cp) {
      const cpElement = document.createElement('div');
      cpElement.className = 'cp';
      cpElement.textContent = card.cp;
      cardElement.appendChild(cpElement);
    }
    
    // Add stats if available
    if (card.stats) {
      const statsElement = document.createElement('div');
      statsElement.className = 'stats';
      
      // Basic stats
      statsElement.textContent = 
        `STR: ${card.stats.STR} | DEX: ${card.stats.DEX} | VIT: ${card.stats.VIT} | INT: ${card.stats.INT}`;
      
      // Add EXP with special styling
      if (card.stats.EXP !== undefined) {
        const expSpan = document.createElement('span');
        expSpan.className = 'exp';
        expSpan.textContent = ` | EXP: ${card.stats.EXP}`;
        expSpan.style.color = '#ffcc00';
        statsElement.appendChild(expSpan);
      }
      
      cardElement.appendChild(statsElement);
    }
    
    cardElement.appendChild(nameElement);
    cardElement.appendChild(costElement);
    
    // Add card effect tooltip
    if (card.effect) {
      cardElement.title = card.effect;
    }
    
    // Add passive effect indicator for apprentice cards
    if (card.type === 'apprentice' && card.passive) {
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
  
  /**
   * Add appropriate interactivity to card elements
   * @param {HTMLElement} cardElement - The card element
   * @param {string} playerKey - ID of the player
   * @param {object} card - Card data
   * @param {string} zone - Card location ('hand', 'field', 'apprentice')
   * @param {number} index - Index in the zone
   */
  addCardInteractivity(cardElement, playerKey, card, zone, index) {
    const gameState = this.gameManager.getState();
    const isCurrentPlayer = playerKey === gameState.currentPlayer;
    
    // Add zone-specific interactivity
    switch (zone) {
      case 'hand':
        if (isCurrentPlayer && 
            gameState.currentPhase === GAME_PHASES.PLAY) {
          
          if (gameState.evolution.isEvolutionMode) {
            // Evolution mode - only class cards can be selected
            if (card.type === 'creature') {
              cardElement.onclick = () => this.handleCardEvolution(playerKey, index);
              cardElement.classList.add('playable');
            } else {
              cardElement.classList.add('disabled');
            }
          } else if (this.canPlayCard(playerKey, card)) {
            // Check if it's a creature and if field limit is reached
            if (card.type === 'creature' && 
                gameState.players[playerKey].field.filter(c => c.type === 'creature').length >= GAME_CONFIG.MAX_CREATURES) {
              cardElement.classList.add('disabled');
              cardElement.title = "Field is full! Maximum 6 creatures allowed.";
            } else {
              cardElement.onclick = () => this.handleCardPlay(playerKey, index);
              cardElement.classList.add('playable');
            }
          } else {
            cardElement.classList.add('disabled');
            if (gameState.players[playerKey].coins < card.cost) {
              cardElement.title = "Not enough coins to play this card.";
            }
          }
        } else {
          cardElement.classList.add('disabled');
        }
        break;
      
      case 'field':
        // Movement phase interactions
        if (isCurrentPlayer && 
            gameState.currentPhase === GAME_PHASES.MOVEMENT &&
            !gameState.players[playerKey].hasMoved.includes(card.id) &&
            gameState.players[playerKey].coins >= GAME_CONFIG.MOVEMENT_COST) {
          
          const validPositions = this.gameManager.players[playerKey].getValidMovementPositions(index);
          if (validPositions.length > 0) {
            cardElement.classList.add('movable');
            cardElement.style.border = '2px solid #2196f3';
            cardElement.onclick = () => this.showMovementSelectionUI(playerKey, index);
            
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
        }
        // Attack phase interactions
        else if (isCurrentPlayer && 
                gameState.currentPhase === GAME_PHASES.ATTACK &&
                card.type === 'creature' &&
                !card.hasAttacked &&
                card.canAttack) {
          
          cardElement.onclick = () => this.handleCardAttack(playerKey, index);
          cardElement.classList.add('attackable');
          
          // Add attackable indicator
          const attackableIndicator = document.createElement('div');
          attackableIndicator.className = 'attackable-indicator';
          attackableIndicator.textContent = 'Can Attack';
          attackableIndicator.style.position = 'absolute';
          attackableIndicator.style.bottom = '40px';
          attackableIndicator.style.left = '5px';
          attackableIndicator.style.backgroundColor = 'rgba(244, 67, 54, 0.8)';
          attackableIndicator.style.color = 'white';
          attackableIndicator.style.padding = '2px 4px';
          attackableIndicator.style.fontSize = '10px';
          attackableIndicator.style.borderRadius = '3px';
          cardElement.appendChild(attackableIndicator);
        }
        // Play phase for evolution
        else if (isCurrentPlayer &&
                gameState.currentPhase === GAME_PHASES.PLAY &&
                card.type === 'creature' &&
                card.classType === 'basic' &&
                card.possibleEvolutions && 
                card.possibleEvolutions.length > 0) {
          
          // Add evolve button for basic class cards
          const evolveButton = document.createElement('div');
          evolveButton.className = 'evolve-button';
          evolveButton.textContent = '⬆ Evolve';
          evolveButton.style.position = 'absolute';
          evolveButton.style.bottom = '15px';
          evolveButton.style.left = '50%';
          evolveButton.style.transform = 'translateX(-50%)';
          evolveButton.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
          evolveButton.style.color = 'black';
          evolveButton.style.padding = '2px 5px';
          evolveButton.style.borderRadius = '3px';
          evolveButton.style.fontSize = '10px';
          evolveButton.style.cursor = 'pointer';
          
          evolveButton.onclick = (e) => {
            e.stopPropagation(); // Prevent card click event
            this.showEvolutionUI(playerKey, index);
          };
          
          cardElement.appendChild(evolveButton);
          cardElement.classList.add('evolution-ready');
          cardElement.style.border = '2px solid gold';
        }
        else {
          cardElement.classList.add('disabled');
        }
        
        // Add active/exhausted visual state
        if (card.hasAttacked) {
          cardElement.classList.add('exhausted');
          cardElement.style.transform = 'rotate(90deg)';
        }
        
        // Add card ability text if present
        if (card.ability) {
          const abilityElement = document.createElement('div');
          abilityElement.className = 'ability';
          abilityElement.textContent = card.ability;
          abilityElement.style.position = 'absolute';
          abilityElement.style.bottom = '25px';
          abilityElement.style.width = '100%';
          abilityElement.style.textAlign = 'center';
          abilityElement.style.color = 'purple';
          abilityElement.style.fontSize = '10px';
          cardElement.appendChild(abilityElement);
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
        if (gameState.players[playerKey].hasMoved.includes(card.id)) {
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
        break;
      
      case 'apprentice':
        // Add evolution functionality during play phase
        if (isCurrentPlayer &&
            gameState.currentPhase === GAME_PHASES.PLAY &&
            !gameState.evolution.isEvolutionMode) {
          
          cardElement.onclick = () => this.gameManager.startEvolution(playerKey, index);
          cardElement.classList.add('evolution-ready');
        } else {
          cardElement.classList.add('disabled');
        }
        break;
    }
  }
  
  /**
   * Check if a card can be played
   * @param {string} playerKey - ID of the player
   * @param {object} card - Card data
   * @returns {boolean} Whether the card can be played
   */
  canPlayCard(playerKey, card) {
    const player = this.gameManager.getState().players[playerKey];
    // Check if player has enough coins
    return player.coins >= card.cost;
  }
  
  /**
   * Handle card play logic
   * @param {string} playerKey - ID of the player
   * @param {number} handIndex - Index in hand
   */
  handleCardPlay(playerKey, handIndex) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const card = player.hand[handIndex];
    
    // Creature cards need position selection
    if (card.type === 'creature') {
      this.showPositionSelectionUI(playerKey, handIndex);
    } 
    // Spell cards need target selection
    else if (card.type === 'spell') {
      this.showSpellTargetSelectionUI(playerKey, handIndex);
    }
  }
  
  /**
   * Handle card evolution (apprentice + class card)
   * @param {string} playerKey - ID of the player
   * @param {number} handIndex - Index in hand
   */
  handleCardEvolution(playerKey, handIndex) {
    // Delegate to the appropriate evolution UI
    const apprentice = this.gameManager.state.evolution.sourceCard;
    this.showPositionSelectionUI(playerKey, handIndex, true, apprentice);
  }
  
  /**
   * Handle card attack
   * @param {string} playerKey - ID of the player
   * @param {number} fieldIndex - Index in field
   */
  handleCardAttack(playerKey, fieldIndex) {
    const battleManager = new BattleManager(this.gameManager);
    const opponentId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    
    // Get valid targets
    const { validTargets, canAttackDirectly } = battleManager.getValidTargets(playerKey, fieldIndex);
    
    // Show attack target selection UI
    this.showTargetSelectionUI(playerKey, fieldIndex, validTargets, canAttackDirectly);
  }
  
  /**
   * Show UI for selecting a position when playing a creature
   * @param {string} playerKey - ID of the player
   * @param {number} handIndex - Index in hand
   * @param {boolean} isEvolution - Whether this is an evolution
   * @param {object} apprentice - Apprentice card for evolution
   */
  showPositionSelectionUI(playerKey, handIndex, isEvolution = false, apprentice = null) {
    // Implementation of position selection UI dialog
    // This would show a modal allowing the player to choose a position
    
    // For now, we'll use a simplified version
    alert(`Position selection UI would show here for ${isEvolution ? 'evolution' : 'playing a creature'}`);
    
    // For testing, just choose the first available position
    const player = this.gameManager.players[playerKey];
    let position = 0;
    
    // Find first available position in 0-5 range
    for (let i = 0; i < 6; i++) {
      if (!player.field.some(card => card.position === i)) {
        position = i;
        break;
      }
    }
    
    // Play the card
    const result = player.playCard(handIndex, position, isEvolution, apprentice);
    
    if (result && result.success) {
      if (result.effect === 'draw_card') {
        // Handle card draw effect
        this.gameManager.drawCard(playerKey);
      }
      
      if (isEvolution) {
        // Reset evolution mode
        this.gameManager.state.evolution.isEvolutionMode = false;
        this.gameManager.state.evolution.sourceCard = null;
        this.gameManager.state.evolution.targetZone = null;
      }
      
      // Log the action
      this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
      
      // Update UI
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  /**
   * Show UI for selecting a target for spell effects
   * @param {string} playerKey - ID of the player
   * @param {number} handIndex - Index in hand
   */
  showSpellTargetSelectionUI(playerKey, handIndex) {
    // Implementation of spell target selection UI dialog
    alert("Spell target selection UI would show here");
    
    // For testing, auto-target first creature
    const gameState = this.gameManager.getState();
    const spellCard = gameState.players[playerKey].hand[handIndex];
    
    // Determine target based on spell type
    let targetPlayerId = playerKey;
    if (spellCard.templateId === 'fireball') {
      // Offensive spell, target opponent
      targetPlayerId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    }
    
    const targetPlayer = this.gameManager.players[targetPlayerId];
    
    // Check if there are valid targets
    if (targetPlayer.field.length === 0) {
      alert(`No valid targets for ${spellCard.name}`);
      return;
    }
    
    // Execute the spell
    const battleManager = new BattleManager(this.gameManager);
    const result = battleManager.executeSpell(playerKey, handIndex, targetPlayerId, 0);
    
    if (result && result.success) {
      // Log messages
      result.messages.forEach(message => {
        this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
      });
      
      // Update UI
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  /**
   * Show UI for selecting movement destination
   * @param {string} playerKey - ID of the player
   * @param {number} cardIndex - Index in field
   */
  showMovementSelectionUI(playerKey, cardIndex) {
    // Implementation of movement selection UI dialog
    alert("Movement selection UI would show here");
    
    // For testing, move to the first valid position
    const player = this.gameManager.players[playerKey];
    const validPositions = player.getValidMovementPositions(cardIndex);
    
    if (validPositions.length === 0) {
      alert("No valid movement positions available");
      return;
    }
    
    // Execute movement
    const result = player.moveCreature(cardIndex, validPositions[0]);
    
    if (result && result.success) {
      this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  /**
   * Show UI for selecting a target when attacking
   * @param {string} playerKey - ID of the player
   * @param {number} attackerIndex - Index of attacker in field
   * @param {array} validTargets - Valid target cards
   * @param {boolean} canAttackDirectly - Whether direct attack is allowed
   */
  showTargetSelectionUI(playerKey, attackerIndex, validTargets, canAttackDirectly) {
    // Implementation of attack target selection UI dialog
    alert("Attack target selection UI would show here");
    
    const battleManager = new BattleManager(this.gameManager);
    const opponentId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    
    // For testing, either attack first valid target or security directly
    if (validTargets.length > 0) {
      // Attack first creature
      const targetCard = validTargets[0];
      const targetIndex = this.gameManager.players[opponentId].field.findIndex(
        card => card.id === targetCard.id
      );
      
      const result = battleManager.attackCreature(playerKey, attackerIndex, opponentId, targetIndex);
      
      if (result && result.success) {
        // Log messages
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
        
        // Update UI
        this.gameManager.events.emit('stateChanged');
      }
    } else if (canAttackDirectly) {
      // Attack security
      const result = battleManager.attackSecurityDirectly(playerKey, attackerIndex);
      
      if (result && result.success) {
        // Log messages
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
        
        // Check for game over
        if (result.gameOver) {
          this.gameManager.endGame(result.winner, 'security');
        }
        
        // Update UI
        this.gameManager.events.emit('stateChanged');
      }
    } else {
      alert("No valid targets for attack");
    }
  }
  
  /**
   * Show UI for class evolution selection
   * @param {string} playerKey - ID of the player
   * @param {number} cardIndex - Index in field
   */
  showEvolutionUI(playerKey, cardIndex) {
    // Implementation of evolution UI dialog
    alert("Evolution selection UI would show here");
    
    // For testing, evolve to the first available evolution
    const player = this.gameManager.players[playerKey];
    const card = player.field[cardIndex];
    
    if (!card.possibleEvolutions || card.possibleEvolutions.length === 0) {
      alert("No evolution paths available");
      return;
    }
    
    // Execute evolution
    const battleManager = new BattleManager(this.gameManager);
    const result = battleManager.evolveCard(playerKey, cardIndex, card.possibleEvolutions[0]);
    
    if (result && result.success) {
      this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  /**
   * Trigger AI to take its action
   */
  triggerAIAction() {
    // This would be handled by the AIManager in a full implementation
    // For now, we'll just have a simplified AI that advances phases
    this.gameManager.advancePhase();
  }
  
  /**
   * Add CSS styles for the game
   */
  addStyles() {
    // Add CSS styles if not already added
    if (document.getElementById('tcg-game-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'tcg-game-styles';
    
    // Add styles here - this could be extensive so we'll add just a few key styles
    styleElement.textContent = `
      /* Card state classes */
      .card.playable {
        border: 2px solid #4caf50;
        cursor: pointer;
      }
      
      .card.attackable {
        border: 2px solid #f44336;
        cursor: pointer;
      }
      
      .card.movable {
        border: 2px solid #2196f3;
        cursor: pointer;
      }
      
      .card.exhausted {
        opacity: 0.7;
      }
      
      /* Phase button active state */
      .phase-btn.active {
        background-color: #2c3e50;
        font-weight: bold;
      }
      
      /* Card hover effect */
      .card:not(.disabled):hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
    `;
    
    document.head.appendChild(styleElement);
  }
}