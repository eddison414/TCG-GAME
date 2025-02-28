import { BattleManager } from '../managers/BattleManager.js';
import { GAME_PHASES, PLAYERS, GAME_CONFIG } from '../constants.js';

export class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.domElements = {};
    
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
        alert(`${data.winnerName} wins by ${data.reason}!`);
        this.gameManager.initGame(
          this.gameManager.players[PLAYERS.PLAYER_A],
          this.gameManager.players[PLAYERS.PLAYER_B]
        );
      }, 1000);
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
    
    this.domElements.playerASecurity.textContent = 
      `Security: ${gameState.players[PLAYERS.PLAYER_A].securityCount}`;
    this.domElements.playerBSecurity.textContent = 
      `Security: ${gameState.players[PLAYERS.PLAYER_B].securityCount}`;
    
    this.renderPlayerField(PLAYERS.PLAYER_A);
    this.renderPlayerField(PLAYERS.PLAYER_B);
    
    this.renderPlayerHand(PLAYERS.PLAYER_A);
    this.renderPlayerHand(PLAYERS.PLAYER_B, true);
    
    this.renderApprenticeZone(PLAYERS.PLAYER_A);
    this.renderApprenticeZone(PLAYERS.PLAYER_B);
    
    this.updatePhaseButtons();
    
    this.updateOptionalDrawButton();
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
    
    buttons[gameState.currentPhase]?.classList.add('active');
    
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
        
        this.addCardInteractivity(cardElement, playerKey, card, 'field');
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
    
    if (faceDown) {
      for (let i = 0; i < player.handCount; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = 'url(/Game/TCG-GAME/images/card_back.png)';
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
    
    apprenticeElement.innerHTML = '';
    
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
    
    if (player.apprenticeZone.length === 0 && apprenticeElement.childElementCount === 0) {
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
      console.warn(`No image found for card: ${card.name}`);
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
      cpElement.textContent = card.cp;
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
    alert(`Position selection UI would show here for ${isEvolution ? 'evolution' : 'playing a creature'}`);
    
    const player = this.gameManager.players[playerKey];
    let position = 0;
    
    for (let i = 0; i < 6; i++) {
      if (!player.field.some(card => card.position === i)) {
        position = i;
        break;
      }
    }
    
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
      alert(result.message);
    }
  }
  
  showSpellTargetSelectionUI(playerKey, handIndex) {
    alert("Spell target selection UI would show here");
    
    const gameState = this.gameManager.getState();
    const spellCard = gameState.players[playerKey].hand[handIndex];
    
    let targetPlayerId = playerKey;
    if (spellCard.templateId === 'fireball') {
      targetPlayerId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    }
    
    const targetPlayer = this.gameManager.players[targetPlayerId];
    
    if (targetPlayer.field.length === 0) {
      alert(`No valid targets for ${spellCard.name}`);
      return;
    }
    
    const battleManager = new BattleManager(this.gameManager);
    const result = battleManager.executeSpell(playerKey, handIndex, targetPlayerId, 0);
    
    if (result && result.success) {
      result.messages.forEach(message => {
        this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
      });
      
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  showMovementSelectionUI(playerKey, cardIndex) {
    alert("Movement selection UI would show here");
    
    const player = this.gameManager.players[playerKey];
    const validPositions = player.getValidMovementPositions(cardIndex);
    
    if (validPositions.length === 0) {
      alert("No valid movement positions available");
      return;
    }
    
    const result = player.moveCreature(cardIndex, validPositions[0]);
    
    if (result && result.success) {
      this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  showTargetSelectionUI(playerKey, attackerIndex, validTargets, canAttackDirectly) {
    alert("Attack target selection UI would show here");
    
    const battleManager = new BattleManager(this.gameManager);
    const opponentId = playerKey === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
    
    if (validTargets.length > 0) {
      const targetCard = validTargets[0];
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
    } else if (canAttackDirectly) {
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
    } else {
      alert("No valid targets for attack");
    }
  }
  
  showEvolutionUI(playerKey, cardIndex) {
    alert("Evolution selection UI would show here");
    
    const player = this.gameManager.players[playerKey];
    const card = player.field[cardIndex];
    
    if (!card.possibleEvolutions || card.possibleEvolutions.length === 0) {
      alert("No evolution paths available");
      return;
    }
    
    const battleManager = new BattleManager(this.gameManager);
    const result = battleManager.evolveCard(playerKey, cardIndex, card.possibleEvolutions[0]);
    
    if (result && result.success) {
      this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
      this.gameManager.events.emit('stateChanged');
    } else if (result) {
      alert(result.message);
    }
  }
  
  triggerAIAction() {
    this.gameManager.advancePhase();
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
