import { BattleManager } from '../managers/BattleManager.js';
import { GAME_PHASES, PLAYERS, GAME_CONFIG } from '../constants.js';
import { DialogRenderer } from './DialogRenderer.js';

export class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.domElements = {};
    this.dialogRenderer = new DialogRenderer(); 
    
    this.setupEventListeners();
  }
  
  initializeDomElements() {
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
    
    if (!this.domElements.coinDisplay || 
        !this.domElements.playerAHand || 
        this.domElements.playerAHand.innerHTML === undefined ||
        !this.domElements.playerAField) {
      console.error('Critical DOM elements missing. UI cannot be initialized.');
      return false;
    }
    
    this.addStyles();
    return true;
  }
  
  setupEventListeners() {
    this.gameManager.events.on('stateChanged', () => {
      this.updateUI();
    });
    
    this.gameManager.events.on('phaseChanged', (data) => {
      this.updatePhaseButtons();
      
      if (data.player === PLAYERS.PLAYER_B) {
        setTimeout(() => {
          this.triggerAIAction();
        }, 1000);
      }
    });
    
    this.gameManager.events.on('gameInitialized', () => {
      this.setupGameControls();
      this.updateUI();
    });
    
    this.gameManager.events.on('gameOver', (data) => {
      setTimeout(() => {
        this.dialogRenderer.showGameOver({
          winner: data.winnerName,
          reason: data.reason,
          gameManager: this.gameManager
        });
      }, 1000);
    });
    
    this.gameManager.events.on('cardDrawn', (data) => {
      this.updateGameLog(`${this.gameManager.players[data.playerId].name} drew ${data.isApprentice ? 'an apprentice' : 'a card'}`);
    });
  }
  
  setupGameControls() {
    const phaseContainer = document.querySelector('.phase-controls');
    if (!phaseContainer) {
      const controlContainer = document.createElement('div');
      controlContainer.className = 'phase-controls';
      controlContainer.style.display = 'flex';
      controlContainer.style.justifyContent = 'center';
      controlContainer.style.margin = '15px 0';
      
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
      
      const optionalDrawBtn = document.createElement('button');
      optionalDrawBtn.id = 'optional-draw-btn';
      optionalDrawBtn.className = 'phase-btn optional-draw';
      optionalDrawBtn.textContent = 'Draw Card (1 Coin)';
      optionalDrawBtn.style.display = 'none';
      optionalDrawBtn.addEventListener('click', () => {
        this.gameManager.drawCard(PLAYERS.PLAYER_A, false, true);
      });
      controlContainer.appendChild(optionalDrawBtn);
      
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
      
      this.domElements.coinDisplay.parentNode.insertBefore(
        controlContainer, 
        this.domElements.coinDisplay.nextSibling
      );
    }
    
    [PLAYERS.PLAYER_A, PLAYERS.PLAYER_B].forEach(playerKey => {
      const playerArea = document.getElementById(playerKey);
      if (!document.getElementById(`${playerKey}Apprentice`)) {
        const apprenticeZone = document.createElement('div');
        apprenticeZone.id = `${playerKey}Apprentice`;
        apprenticeZone.className = 'apprentice-zone';
        const zoneLabel = document.createElement('div');
        zoneLabel.className = 'zone-label';
        zoneLabel.textContent = 'Apprentice Zone';
        apprenticeZone.appendChild(zoneLabel);
        
        if (playerKey === PLAYERS.PLAYER_A) {
          playerArea.insertBefore(apprenticeZone, document.getElementById(`${playerKey}Field`));
        } else {
          playerArea.insertBefore(apprenticeZone, document.getElementById(`${playerKey}Security`).nextSibling);
        }
        
        this.domElements[`${playerKey}Apprentice`] = apprenticeZone;
      }
    });
  }
  
  updateUI() {
    const gameState = this.gameManager.getState();
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    this.domElements.coinDisplay.textContent = 
      `${currentPlayer.name}'s Coins: ${currentPlayer.coins} | Turn: ${gameState.turn} | Phase: ${gameState.currentPhase}`;
    
    this.domElements.playerASecurity.innerHTML = '';
    this.domElements.playerBSecurity.innerHTML = '';
    
    const playerASecurityLabel = document.createElement('div');
    playerASecurityLabel.className = 'zone-label';
    playerASecurityLabel.textContent = 'Security';
    this.domElements.playerASecurity.appendChild(playerASecurityLabel);
    
    const playerBSecurityLabel = document.createElement('div');
    playerBSecurityLabel.className = 'zone-label';
    playerBSecurityLabel.textContent = 'Security';
    this.domElements.playerBSecurity.appendChild(playerBSecurityLabel);
    
    const playerASecurityCount = document.createElement('div');
    playerASecurityCount.textContent = `Security Cards: ${gameState.players[PLAYERS.PLAYER_A].securityCount}`;
    playerASecurityCount.style.textAlign = 'center';
    playerASecurityCount.style.padding = '10px';
    this.domElements.playerASecurity.appendChild(playerASecurityCount);
    
    const playerBSecurityCount = document.createElement('div');
    playerBSecurityCount.textContent = `Security Cards: ${gameState.players[PLAYERS.PLAYER_B].securityCount}`;
    playerBSecurityCount.style.textAlign = 'center';
    playerBSecurityCount.style.padding = '10px';
    this.domElements.playerBSecurity.appendChild(playerBSecurityCount);
    
    this.renderPlayerField(PLAYERS.PLAYER_A);
    this.renderPlayerField(PLAYERS.PLAYER_B);
    
    this.renderPlayerHand(PLAYERS.PLAYER_A);
    this.renderPlayerHand(PLAYERS.PLAYER_B, true);
    
    this.renderApprenticeZone(PLAYERS.PLAYER_A);
    this.renderApprenticeZone(PLAYERS.PLAYER_B);
    
    this.updatePhaseButtons();
    this.updateOptionalDrawButton();
    this.updateGameLog();
  }
  
  updateGameLog() {
    if (!this.domElements.chatHistory) return;
    
    const gameState = this.gameManager.getState();
    const logs = gameState.gameLog.slice(-20).reverse(); // Get last 20 logs, newest first
    
    this.domElements.chatHistory.innerHTML = '';
    
    logs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.style.marginBottom = '5px';
      logEntry.style.borderBottom = '1px solid #eee';
      logEntry.style.paddingBottom = '5px';
      
      const turnLabel = document.createElement('span');
      turnLabel.className = 'turn-label';
      turnLabel.textContent = `[Turn ${log.turn || '?'}] `;
      turnLabel.style.fontWeight = 'bold';
      turnLabel.style.color = '#666';
      
      const logMessage = document.createElement('span');
      logMessage.textContent = log.message;
      
      logEntry.appendChild(turnLabel);
      logEntry.appendChild(logMessage);
      
      this.domElements.chatHistory.appendChild(logEntry);
    });
  }
  
  updatePhaseButtons() {
    const gameState = this.gameManager.getState();
    
    if (!document.getElementById('draw-phase-btn')) return;
    
    const buttons = {
      draw: document.getElementById('draw-phase-btn'),
      movement: document.getElementById('movement-phase-btn'),
      play: document.getElementById('play-phase-btn'),
      attack: document.getElementById('attack-phase-btn'),
      end: document.getElementById('end-phase-btn')
    };
    
    Object.values(buttons).forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.disabled = gameState.currentPlayer !== PLAYERS.PLAYER_A;
      }
    });
    
    const currentPhaseBtn = buttons[gameState.currentPhase];
    if (currentPhaseBtn) {
      currentPhaseBtn.classList.add('active');
    }
    
    const cancelEvolutionBtn = document.getElementById('cancel-evolution-btn');
    if (cancelEvolutionBtn) {
      cancelEvolutionBtn.style.display = 
        gameState.evolution.isEvolutionMode ? 'inline-block' : 'none';
    }
  }
  
  updateOptionalDrawButton() {
    const gameState = this.gameManager.getState();
    const optionalDrawBtn = document.getElementById('optional-draw-btn');
    
    if (!optionalDrawBtn) return;
    
    if (gameState.currentPhase === GAME_PHASES.PLAY &&
        gameState.currentPlayer === PLAYERS.PLAYER_A &&
        gameState.players[PLAYERS.PLAYER_A].coins >= GAME_CONFIG.OPTIONAL_DRAW_COST) {
      optionalDrawBtn.style.display = 'inline-block';
    } else {
      optionalDrawBtn.style.display = 'none';
    }
  }
  
  renderPlayerField(playerKey) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const fieldElement = this.domElements[`${playerKey}Field`];
    
    if (!fieldElement) return;
    
    fieldElement.innerHTML = '';
    
    const fieldLabel = document.createElement('div');
    fieldLabel.className = 'zone-label';
    fieldLabel.textContent = 'Field';
    fieldElement.appendChild(fieldLabel);
    
    const fieldLimitIndicator = document.createElement('div');
    fieldLimitIndicator.className = 'field-limit';
    fieldLimitIndicator.textContent = 
      `Creatures: ${player.field.filter(card => card.type === 'creature').length}/${GAME_CONFIG.MAX_CREATURES}`;
    fieldElement.appendChild(fieldLimitIndicator);
    
    const battlefieldGrid = document.createElement('div');
    battlefieldGrid.className = 'battlefield-grid';
    battlefieldGrid.style.display = 'grid';
    battlefieldGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    battlefieldGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
    battlefieldGrid.style.gap = '10px';
    battlefieldGrid.style.margin = '10px auto';
    battlefieldGrid.style.maxWidth = '600px';
    fieldElement.appendChild(battlefieldGrid);
    
    for (let position = 0; position < GAME_CONFIG.MAX_FIELD_SLOTS; position++) {
      const slot = document.createElement('div');
      slot.className = 'card-slot';
      
      const posLabel = document.createElement('div');
      posLabel.className = 'position-label';
      posLabel.textContent = `Pos ${position}`;
      posLabel.style.position = 'absolute';
      posLabel.style.top = '2px';
      posLabel.style.left = '2px';
      posLabel.style.fontSize = '10px';
      posLabel.style.color = '#666';
      slot.appendChild(posLabel);
      
      const cardsAtPosition = player.field.filter(card => card.position === position);
      
      if (cardsAtPosition.length > 0) {
        const card = cardsAtPosition[0];
        const cardElement = this.createCardElement(card);
        
        this.addCardInteractivity(cardElement, playerKey, card, 'field', player.field.indexOf(card));
        slot.appendChild(cardElement);
      }
      
      battlefieldGrid.appendChild(slot);
    }
    
    if (player.field.length === 0) {
      const placeholderText = document.createElement('div');
      placeholderText.textContent = 'No cards in play';
      placeholderText.className = 'placeholder-text';
      battlefieldGrid.innerHTML = '';
      battlefieldGrid.appendChild(placeholderText);
    }
  }
  
  renderPlayerHand(playerKey, faceDown = false) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const handElement = this.domElements[`${playerKey}Hand`];
    
    if (!handElement) return;
    
    handElement.innerHTML = '';
    
    const handLabel = document.createElement('div');
    handLabel.className = 'zone-label';
    handLabel.textContent = 'Hand';
    handElement.appendChild(handLabel);
    
    if (faceDown) {
      for (let i = 0; i < player.handCount; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundColor = '#888';
        cardElement.style.border = '1px solid #555';
        handElement.appendChild(cardElement);
      }
    } else {
      player.hand.forEach((card, index) => {
        const cardElement = this.createCardElement(card);
        
        this.addCardInteractivity(cardElement, playerKey, card, 'hand', index);
        handElement.appendChild(cardElement);
      });
    }
    
    if (player.handCount === 0) {
      const placeholderText = document.createElement('div');
      placeholderText.textContent = 'No cards in hand';
      placeholderText.className = 'placeholder-text';
      handElement.appendChild(placeholderText);
    }
  }
  
  renderApprenticeZone(playerKey) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const apprenticeElement = this.domElements[`${playerKey}Apprentice`];
    
    if (!apprenticeElement) return;
    
    // Keep the zone label
    const zoneLabel = apprenticeElement.querySelector('.zone-label');
    apprenticeElement.innerHTML = '';
    if (zoneLabel) {
      apprenticeElement.appendChild(zoneLabel);
    } else {
      const newLabel = document.createElement('div');
      newLabel.className = 'zone-label';
      newLabel.textContent = 'Apprentice Zone';
      apprenticeElement.appendChild(newLabel);
    }
    
    player.apprenticeZone.forEach((card, index) => {
      const cardElement = this.createCardElement(card);
      
      this.addCardInteractivity(cardElement, playerKey, card, 'apprentice', index);
      apprenticeElement.appendChild(cardElement);
    });
    
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
      const limitIndicator = document.createElement('div');
      limitIndicator.className = 'apprentice-limit';
      limitIndicator.textContent = 'Apprentice limit reached for this turn';
      limitIndicator.style.color = '#f44336';
      limitIndicator.style.fontStyle = 'italic';
      apprenticeElement.appendChild(limitIndicator);
    }
    
    if (player.apprenticeZone.length === 0 && 
        !apprenticeElement.querySelector('.apprentice-draw-btn') && 
        !apprenticeElement.querySelector('.apprentice-limit')) {
      const placeholderText = document.createElement('div');
      placeholderText.textContent = 'No apprentices in play';
      placeholderText.className = 'placeholder-text';
      apprenticeElement.appendChild(placeholderText);
    }
  }
  
  createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    
    if (card.classType === 'advanced') {
      cardElement.classList.add('advanced');
    }
    
    if (card.image) {
      cardElement.style.backgroundImage = `url(${card.image})`;
    } else {
      cardElement.style.background = `linear-gradient(135deg, #444, #666)`;
    }
    
    const nameElement = document.createElement('div');
    nameElement.className = 'name';
    nameElement.textContent = card.name;
    
    const costElement = document.createElement('div');
    costElement.className = 'cost';
    costElement.textContent = card.cost;
    
    if (card.cp) {
      const cpElement = document.createElement('div');
      cpElement.className = 'cp';
      cpElement.textContent = `CP: ${card.cp}`;
      cardElement.appendChild(cpElement);
    }
    
    if (card.stats) {
      const statsElement = document.createElement('div');
      statsElement.className = 'stats';
      
      statsElement.textContent = 
        `STR: ${card.stats.STR} | DEX: ${card.stats.DEX} | VIT: ${card.stats.VIT} | INT: ${card.stats.INT}`;
      
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
    
    if (card.effect) {
      cardElement.title = card.effect;
    }
    
    if (card.type === 'apprentice' && card.passive) {
      const passiveElement = document.createElement('div');
      passiveElement.className = 'passive';
      passiveElement.textContent = `Passive: +${card.passive.value} ${card.passive.stat}`;
      cardElement.appendChild(passiveElement);
    }
    
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
  
  addCardInteractivity(cardElement, playerKey, card, zone, index) {
    const gameState = this.gameManager.getState();
    const isCurrentPlayer = playerKey === gameState.currentPlayer;
    
    switch (zone) {
      case 'hand':
        if (isCurrentPlayer && 
            gameState.currentPhase === GAME_PHASES.PLAY) {
          
          if (gameState.evolution.isEvolutionMode) {
            if (card.type === 'creature') {
              cardElement.onclick = () => this.handleCardEvolution(playerKey, index);
              cardElement.classList.add('playable');
            } else {
              cardElement.classList.add('disabled');
            }
          } else if (this.canPlayCard(playerKey, card)) {
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
        if (isCurrentPlayer && 
            gameState.currentPhase === GAME_PHASES.MOVEMENT &&
            !gameState.players[playerKey].hasMoved.includes(card.id) &&
            gameState.players[playerKey].coins >= GAME_CONFIG.MOVEMENT_COST) {
          
          const validPositions = this.gameManager.players[playerKey].getValidMovementPositions(index);
          if (validPositions.length > 0) {
            cardElement.classList.add('movable');
            cardElement.style.border = '2px solid #2196f3';
            cardElement.onclick = () => this.showMovementSelectionUI(playerKey, index);
            
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
        else if (isCurrentPlayer && 
                gameState.currentPhase === GAME_PHASES.ATTACK &&
                card.type === 'creature' &&
                !card.hasAttacked &&
                card.canAttack) {
          
          cardElement.onclick = () => this.handleCardAttack(playerKey, index);
          cardElement.classList.add('attackable');
          
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
        else if (isCurrentPlayer &&
                gameState.currentPhase === GAME_PHASES.PLAY &&
                card.type === 'creature' &&
                card.classType === 'basic' &&
                card.possibleEvolutions && 
                card.possibleEvolutions.length > 0) {
          
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
            e.stopPropagation();
            this.showEvolutionUI(playerKey, index);
          };
          
          cardElement.appendChild(evolveButton);
          cardElement.classList.add('evolution-ready');
          cardElement.style.border = '2px solid gold';
        }
        else {
          cardElement.classList.add('disabled');
        }
        
        if (card.hasAttacked) {
          cardElement.classList.add('exhausted');
          cardElement.style.transform = 'rotate(90deg)';
        }
        
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
  
  canPlayCard(playerKey, card) {
    const player = this.gameManager.getState().players[playerKey];
    return player.coins >= card.cost;
  }
  
  handleCardPlay(playerKey, handIndex) {
    const gameState = this.gameManager.getState();
    const player = gameState.players[playerKey];
    const card = player.hand[handIndex];
    
    if (card.type === 'creature') {
      this.showPositionSelectionUI(playerKey, handIndex);
    } 
    else if (card.type === 'spell') {
      this.showSpellTargetSelectionUI(playerKey, handIndex);
    }
  }
  
  handleCardEvolution(playerKey, handIndex) {
    const apprentice = this.gameManager.state.evolution.sourceCard;
    this.showPositionSelectionUI(playerKey, handIndex, true, apprentice);
  }
  
  handleCardAttack(playerKey, fieldIndex) {
    const battleManager = new BattleManager(this.gameManager);
    const opponentId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    
    const { validTargets, canAttackDirectly } = battleManager.getValidTargets(playerKey, fieldIndex);
    
    this.showTargetSelectionUI(playerKey, fieldIndex, validTargets, canAttackDirectly);
  }
  
  showPositionSelectionUI(playerKey, handIndex, isEvolution = false, apprentice = null) {
    const player = this.gameManager.players[playerKey];
    const card = player.hand[handIndex];
    const occupiedPositions = player.field.map(c => c.position);
    
    // Use the Dialog Renderer to show position selection
    this.dialogRenderer.showPositionSelection({
      card: card,
      positions: [0, 1, 2, 3, 4, 5], // Valid summon positions
      occupiedPositions: occupiedPositions,
      isEvolution: isEvolution
    }).then(position => {
      const result = player.playCard(handIndex, position, isEvolution, apprentice);
      
      if (result && result.success) {
        if (result.effect === 'draw_card') {
          this.gameManager.drawCard(playerKey);
        }
        
        if (isEvolution) {
          this.gameManager.state.evolution.isEvolutionMode = false;
          this.gameManager.state.evolution.sourceCard = null;
          this.gameManager.state.evolution.targetZone = null;
        }
        
        this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
        this.gameManager.events.emit('stateChanged');
      } else if (result) {
        this.dialogRenderer.showDialog({
          title: 'Action Failed',
          content: result.message,
          buttons: [{ text: 'OK', primary: true }]
        });
      }
    }).catch(error => {
      console.log('Position selection cancelled:', error);
    });
  }
  
  showSpellTargetSelectionUI(playerKey, handIndex) {
    const gameState = this.gameManager.getState();
    const spellCard = gameState.players[playerKey].hand[handIndex];
    
    let targetPlayerId = playerKey;
    if (spellCard.templateId === 'fireball') {
      targetPlayerId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    }
    
    const targetPlayer = this.gameManager.players[targetPlayerId];
    
    if (targetPlayer.field.length === 0) {
      this.dialogRenderer.showDialog({
        title: 'No Targets',
        content: `No valid targets for ${spellCard.name}`,
        buttons: [{ text: 'OK', primary: true }]
      });
      return;
    }
    
    this.dialogRenderer.showSpellTargetSelection({
      spell: spellCard,
      targets: targetPlayer.field,
      playerName: targetPlayer.name
    }).then(selection => {
      const battleManager = new BattleManager(this.gameManager);
      const result = battleManager.executeSpell(
        playerKey, handIndex, targetPlayerId, selection.index
      );
      
      if (result && result.success) {
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
        
        this.gameManager.events.emit('stateChanged');
      } else if (result) {
        this.dialogRenderer.showDialog({
          title: 'Spell Failed',
          content: result.message,
          buttons: [{ text: 'OK', primary: true }]
        });
      }
    }).catch(error => {
      console.log('Spell target selection cancelled:', error);
    });
  }
  
  showMovementSelectionUI(playerKey, cardIndex) {
    const player = this.gameManager.players[playerKey];
    const card = player.field[cardIndex];
    const validPositions = player.getValidMovementPositions(cardIndex);
    
    if (validPositions.length === 0) {
      this.dialogRenderer.showDialog({
        title: 'Movement Failed',
        content: "No valid movement positions available",
        buttons: [{ text: 'OK', primary: true }]
      });
      return;
    }
    
    this.dialogRenderer.showMovementSelection({
      card: card,
      validPositions: validPositions,
      movementCost: GAME_CONFIG.MOVEMENT_COST
    }).then(position => {
      const result = player.moveCreature(cardIndex, position);
      
      if (result && result.success) {
        this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
        this.gameManager.events.emit('stateChanged');
      } else if (result) {
        this.dialogRenderer.showDialog({
          title: 'Movement Failed',
          content: result.message,
          buttons: [{ text: 'OK', primary: true }]
        });
      }
    }).catch(error => {
      console.log('Movement selection cancelled:', error);
    });
  }
  
  showTargetSelectionUI(playerKey, attackerIndex, validTargets, canAttackDirectly) {
    const player = this.gameManager.players[playerKey];
    const attacker = player.field[attackerIndex];
    
    this.dialogRenderer.showTargetSelection({
      attacker: attacker,
      validTargets: validTargets,
      canAttackDirectly: canAttackDirectly
    }).then(selection => {
      const battleManager = new BattleManager(this.gameManager);
      const opponentId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
      
      if (selection.type === 'creature') {
        const targetCard = selection.target;
        const targetIndex = this.gameManager.players[opponentId].field.findIndex(
          card => card.id === targetCard.id
        );
        
        const result = battleManager.attackCreature(playerKey, attackerIndex, opponentId, targetIndex);
        
        if (result && result.success) {
          result.messages.forEach(message => {
            this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
          });
          
          this.gameManager.events.emit('stateChanged');
        }
      } else if (selection.type === 'security') {
        const result = battleManager.attackSecurityDirectly(playerKey, attackerIndex);
        
        if (result && result.success) {
          result.messages.forEach(message => {
            this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
          });
          
          if (result.gameOver) {
            this.gameManager.endGame(result.winner, 'security');
          }
          
          this.gameManager.events.emit('stateChanged');
        }
      }
    }).catch(error => {
      console.log('Attack target selection cancelled:', error);
    });
  }
  
  showEvolutionUI(playerKey, cardIndex) {
    const player = this.gameManager.players[playerKey];
    const card = player.field[cardIndex];
    
    if (!card.possibleEvolutions || card.possibleEvolutions.length === 0) {
      this.dialogRenderer.showDialog({
        title: 'Evolution Error',
        content: "No evolution paths available",
        buttons: [{ text: 'OK', primary: true }]
      });
      return;
    }
    
    // Fetch the evolution options from the database
    const evolutions = card.possibleEvolutions.map(evolId => {
      return this.gameManager.deckManager.CARD_DATABASE.find(c => c.templateId === evolId);
    }).filter(Boolean);
    
    this.dialogRenderer.showEvolutionSelection({
      card: card,
      evolutions: evolutions,
      playerCoins: player.coins
    }).then(evolutionId => {
      const battleManager = new BattleManager(this.gameManager);
      const result = battleManager.evolveCard(playerKey, cardIndex, evolutionId);
      
      if (result && result.success) {
        this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
        this.gameManager.events.emit('stateChanged');
      } else if (result) {
        this.dialogRenderer.showDialog({
          title: 'Evolution Failed',
          content: result.message,
          buttons: [{ text: 'OK', primary: true }]
        });
      }
    }).catch(error => {
      console.log('Evolution selection cancelled:', error);
    });
  }
  
  triggerAIAction() {
    // AI moves are handled by AIManager
  }
  
  updateGameLog(message) {
    if (message && this.gameManager) {
      this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
    }
    
    if (!this.domElements.chatHistory) return;
    
    const gameState = this.gameManager.getState();
    const logs = gameState.gameLog.slice(-20).reverse(); // Get last 20 logs, newest first
    
    this.domElements.chatHistory.innerHTML = '';
    
    logs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.style.marginBottom = '5px';
      logEntry.style.borderBottom = '1px solid #eee';
      logEntry.style.paddingBottom = '5px';
      
      const turnLabel = document.createElement('span');
      turnLabel.className = 'turn-label';
      turnLabel.textContent = `[Turn ${log.turn || '?'}] `;
      turnLabel.style.fontWeight = 'bold';
      turnLabel.style.color = '#666';
      
      const logMessage = document.createElement('span');
      logMessage.textContent = log.message;
      
      logEntry.appendChild(turnLabel);
      logEntry.appendChild(logMessage);
      
      this.domElements.chatHistory.appendChild(logEntry);
    });
  }
  
  addStyles() {
    if (document.getElementById('tcg-game-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'tcg-game-styles';
    
    styleElement.textContent = `
      /* Card state classes */
      .card.playable {
        border: 2px solid #4caf50;
        cursor: pointer;
      }
      
      .card.playable:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      .card.attackable {
        border: 2px solid #f44336;
        cursor: pointer;
      }
      
      .card.attackable:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
      }
      
      .card.movable {
        border: 2px solid #2196f3;
        cursor: pointer;
      }
      
      .card.movable:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
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
      
      .placeholder-text {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }
      
      .log-entry {
        padding: 5px 0;
        border-bottom: 1px solid #eee;
      }
      
      .zone-label {
        position: absolute;
        top: -10px;
        left: 10px;
        padding: 0 5px;
        background-color: white;
        font-size: 12px;
        color: #666;
        z-index: 1;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
}