/**
 * ai/AIManager.js
 * Controls AI decision-making
 */
import { GAME_PHASES, PLAYERS, GAME_CONFIG, POSITION_CONFIG } from '../constants.js';
import { BattleManager } from '../managers/BattleManager.js';
import { Logger } from '../utils/Logger.js';

export class AIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.battleManager = new BattleManager(this.gameManager);
    this.logger = new Logger();
    
    // Listen for phase changes to trigger AI actions
    this.gameManager.events.on('phaseChanged', (data) => {
      if (data.player === PLAYERS.PLAYER_B) {
        setTimeout(() => this.takeAction(), 1000); // Delay for better player experience
      }
    });
  }
  
  /**
   * Determine and execute AI action based on current phase
   */
  takeAction() {
    const gameState = this.gameManager.getState();
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    
    if (gameState.currentPlayer !== PLAYERS.PLAYER_B) return;
    
    switch (gameState.currentPhase) {
      case GAME_PHASES.DRAW:
        this.handleDrawPhase();
        break;
        
      case GAME_PHASES.MOVEMENT:
        this.handleMovementPhase();
        break;
        
      case GAME_PHASES.PLAY:
        this.handlePlayPhase();
        break;
        
      case GAME_PHASES.ATTACK:
        this.handleAttackPhase();
        break;
        
      case GAME_PHASES.END:
        this.handleEndPhase();
        break;
    }
  }
  
  /**
   * Handle AI actions during draw phase
   */
  handleDrawPhase() {
    // AI always draws a card during draw phase
    this.gameManager.drawCard(PLAYERS.PLAYER_B);
    
    // Advance to next phase
    this.gameManager.advancePhase();
  }
  
  /**
   * Handle AI actions during movement phase
   */
  handleMovementPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    let moveMade = false;
    
    // Try to move creatures to strategically better positions
    aiPlayer.field.forEach((card, index) => {
      // Only move if we haven't made a move yet (to keep AI turns quick)
      if (!moveMade && aiPlayer.coins >= GAME_CONFIG.MOVEMENT_COST) {
        const validPositions = aiPlayer.getValidMovementPositions(index);
        
        if (validPositions.length > 0) {
          // Strategic decisions for movement
          let targetPosition = this.chooseMovementPosition(card, validPositions);
          
          // Execute the move
          const result = aiPlayer.moveCreature(index, targetPosition);
          
          if (result && result.success) {
            this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
            moveMade = true;
          }
        }
      }
    });
    
    // Advance to next phase
    this.gameManager.advancePhase();
  }
  
  /**
   * Choose a strategic position to move to
   * @param {object} card - The card being moved
   * @param {array} validPositions - Valid positions to move to
   * @returns {number} Chosen position
   */
  chooseMovementPosition(card, validPositions) {
    // Simple strategy: 
    // - Melee creatures try to move to front row (0-5)
    // - Ranged creatures try to move to back row (6-8)
    // - If assassin, try to move to back row for backstab ability
    
    if (card.templateId === 'assassin' || card.attackRange > 1) {
      // Ranged/assassin - prefer back row
      const backRowPositions = validPositions.filter(pos => 
        POSITION_CONFIG.BACK_ROW.includes(pos)
      );
      
      if (backRowPositions.length > 0) {
        return backRowPositions[0];
      }
    } else {
      // Melee - prefer front row
      const frontRowPositions = validPositions.filter(pos => 
        POSITION_CONFIG.FRONT_ROW.includes(pos)
      );
      
      if (frontRowPositions.length > 0) {
        return frontRowPositions[0];
      }
    }
    
    // If no strategic positions, take the first valid one
    return validPositions[0];
  }
  
  /**
   * Handle AI actions during play phase
   */
  handlePlayPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    let actionTaken = false;
    
    // First priority: Evolve basic class to advanced class if possible
    if (!actionTaken) {
      actionTaken = this.tryEvolution();
    }
    
    // Second priority: Play a creature from hand
    if (!actionTaken) {
      actionTaken = this.playCreatureFromHand();
    }
    
    // Third priority: Play spell cards
    if (!actionTaken) {
      actionTaken = this.playSpealsFromHand();
    }
    
    // Fourth priority: Summon an apprentice if possible
    if (!actionTaken && !aiPlayer.hasPlayedApprentice) {
      if (aiPlayer.apprenticeDeckCount > 0 && aiPlayer.apprenticeZone.length < GAME_CONFIG.MAX_APPRENTICES) {
        this.gameManager.drawCard(PLAYERS.PLAYER_B, true);
        actionTaken = true;
      }
    }
    
    // Advance to next phase
    this.gameManager.advancePhase();
  }
  
  /**
   * Try to evolve a basic class card to advanced class
   * @returns {boolean} Whether an evolution was performed
   */
  tryEvolution() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    
    // Find basic class cards that can evolve
    for (let i = 0; i < aiPlayer.field.length; i++) {
      const card = aiPlayer.field[i];
      
      if (card.classType === 'basic' && 
          card.possibleEvolutions && 
          card.possibleEvolutions.length > 0) {
        
        // Calculate evolution cost
        const evolutionTargetId = card.possibleEvolutions[0];
        const evolutionTemplate = this.gameManager.deckManager.CARD_DATABASE.find(
          c => c.templateId === evolutionTargetId
        );
        
        if (!evolutionTemplate) continue;
        
        const evolutionCost = Math.max(0, evolutionTemplate.cost - GAME_CONFIG.EVOLUTION_DISCOUNT);
        
        // Check if we have enough coins
        if (aiPlayer.coins >= evolutionCost) {
          // Execute evolution
          const result = this.battleManager.evolveCard(PLAYERS.PLAYER_B, i, evolutionTargetId);
          
          if (result && result.success) {
            this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
            this.gameManager.events.emit('stateChanged');
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Play a creature card from hand
   * @returns {boolean} Whether a card was played
   */
  playCreatureFromHand() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    const gameState = this.gameManager.getState();
    
    // Count creatures on field
    const creatureCount = aiPlayer.field.filter(card => card.type === 'creature').length;
    
    // Don't play more creatures if we've reached the limit
    if (creatureCount >= GAME_CONFIG.MAX_CREATURES) {
      return false;
    }
    
    // Find highest CP creature we can afford
    let bestCreatureIndex = -1;
    let bestCreatureCP = 0;
    
    aiPlayer.hand.forEach((card, index) => {
      if (card.type === 'creature' && aiPlayer.coins >= card.cost) {
        if (bestCreatureIndex === -1 || card.cp > bestCreatureCP) {
          bestCreatureIndex = index;
          bestCreatureCP = card.cp;
        }
      }
    });
    
    // If found a creature, play it
    if (bestCreatureIndex !== -1) {
      // Find best position (first available in front row)
      let bestPosition = -1;
      
      for (let pos = 0; pos < 6; pos++) {
        if (!aiPlayer.field.some(card => card.position === pos)) {
          bestPosition = pos;
          break;
        }
      }
      
      if (bestPosition !== -1) {
        const result = aiPlayer.playCard(bestCreatureIndex, bestPosition);
        
        if (result && result.success) {
          this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
          
          // Handle card effects (e.g., mage drawing a card)
          if (result.effect === 'draw_card') {
            this.gameManager.drawCard(PLAYERS.PLAYER_B);
          }
          
          this.gameManager.events.emit('stateChanged');
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Play spell cards from hand
   * @returns {boolean} Whether a spell was played
   */
  playSpealsFromHand() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    const gameState = this.gameManager.getState();
    const opponentId = PLAYERS.PLAYER_A;
    
    // Find a spell card we can afford
    for (let i = 0; i < aiPlayer.hand.length; i++) {
      const card = aiPlayer.hand[i];
      
      if (card.type === 'spell' && aiPlayer.coins >= card.cost) {
        // Choose target based on spell type
        let targetPlayerId = PLAYERS.PLAYER_B; // Self by default
        
        if (card.templateId === 'fireball') {
          // Offensive spell, target opponent
          targetPlayerId = opponentId;
        }
        
        const targetPlayer = this.gameManager.players[targetPlayerId];
        
        // Make sure there are valid targets
        if (targetPlayer.field.length > 0) {
          // For Fireball, target highest CP creature
          // For Healing, target lowest CP creature
          let targetIndex = 0;
          
          if (card.templateId === 'fireball') {
            // Find highest CP target
            let highestCP = targetPlayer.field[0].cp;
            
            targetPlayer.field.forEach((target, idx) => {
              if (target.cp > highestCP) {
                highestCP = target.cp;
                targetIndex = idx;
              }
            });
          } else if (card.templateId === 'healing') {
            // Find lowest CP target
            let lowestCP = targetPlayer.field[0].cp;
            
            targetPlayer.field.forEach((target, idx) => {
              if (target.cp < lowestCP) {
                lowestCP = target.cp;
                targetIndex = idx;
              }
            });
          }
          
          // Execute the spell
          const result = this.battleManager.executeSpell(
            PLAYERS.PLAYER_B, i, targetPlayerId, targetIndex
          );
          
          if (result && result.success) {
            // Log messages
            result.messages.forEach(message => {
              this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
            });
            
            this.gameManager.events.emit('stateChanged');
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Handle AI actions during attack phase
   */
  handleAttackPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    
    // Try to attack with every available creature
    aiPlayer.field.forEach((card, index) => {
      if (card.type === 'creature' && !card.hasAttacked && card.canAttack) {
        this.executeAttack(index);
      }
    });
    
    // Advance to next phase
    this.gameManager.advancePhase();
  }
  
  /**
   * Execute an attack with a creature
   * @param {number} attackerIndex - Index of the attacker in field
   */
  executeAttack(attackerIndex) {
    const { validTargets, canAttackDirectly } = this.battleManager.getValidTargets(
      PLAYERS.PLAYER_B, attackerIndex
    );
    
    // If we have valid targets, attack the highest CP one
    if (validTargets.length > 0) {
      let bestTargetIndex = 0;
      let highestCP = validTargets[0].cp;
      
      validTargets.forEach((target, index) => {
        if (target.cp > highestCP) {
          highestCP = target.cp;
          bestTargetIndex = index;
        }
      });
      
      // Find the target's index in opponent's field
      const targetCard = validTargets[bestTargetIndex];
      const opponentField = this.gameManager.players[PLAYERS.PLAYER_A].field;
      const targetIndex = opponentField.findIndex(card => card.id === targetCard.id);
      
      // Execute the attack
      const result = this.battleManager.attackCreature(
        PLAYERS.PLAYER_B, attackerIndex, PLAYERS.PLAYER_A, targetIndex
      );
      
      if (result && result.success) {
        // Log messages
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
      }
    } 
    // If no valid targets but can attack directly, do so
    else if (canAttackDirectly) {
      const result = this.battleManager.attackSecurityDirectly(PLAYERS.PLAYER_B, attackerIndex);
      
      if (result && result.success) {
        // Log messages
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
        
        // Check for game over
        if (result.gameOver) {
          this.gameManager.endGame(result.winner, 'security');
        }
      }
    }
  }
  
  /**
   * Handle AI actions during end phase
   */
  handleEndPhase() {
    // Nothing special to do in end phase, just advance
    this.gameManager.advancePhase();
  }
}