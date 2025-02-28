import { GAME_PHASES, PLAYERS, GAME_CONFIG, POSITION_CONFIG } from '../constants.js';
import { BattleManager } from '../managers/BattleManager.js';
import { Logger } from '../utils/Logger.js';

export class AIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.battleManager = new BattleManager(this.gameManager);
    this.logger = new Logger();
    
    this.gameManager.events.on('phaseChanged', (data) => {
      if (data.player === PLAYERS.PLAYER_B) {
        setTimeout(() => this.takeAction(), 1000);
      }
    });
  }
  
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
  
  handleDrawPhase() {
    this.gameManager.drawCard(PLAYERS.PLAYER_B);
    this.gameManager.advancePhase();
  }
  
  handleMovementPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    let moveMade = false;
    
    aiPlayer.field.forEach((card, index) => {
      if (!moveMade && aiPlayer.coins >= GAME_CONFIG.MOVEMENT_COST) {
        const validPositions = aiPlayer.getValidMovementPositions(index);
        
        if (validPositions.length > 0) {
          let targetPosition = this.chooseMovementPosition(card, validPositions);
          
          const result = aiPlayer.moveCreature(index, targetPosition);
          
          if (result && result.success) {
            this.gameManager.logger.log(result.message, { turn: this.gameManager.state.turn });
            moveMade = true;
          }
        }
      }
    });
    
    this.gameManager.advancePhase();
  }
  
  chooseMovementPosition(card, validPositions) {
    if (card.templateId === 'assassin' || card.attackRange > 1) {
      const backRowPositions = validPositions.filter(pos => 
        POSITION_CONFIG.BACK_ROW.includes(pos)
      );
      
      if (backRowPositions.length > 0) {
        return backRowPositions[0];
      }
    } else {
      const frontRowPositions = validPositions.filter(pos => 
        POSITION_CONFIG.FRONT_ROW.includes(pos)
      );
      
      if (frontRowPositions.length > 0) {
        return frontRowPositions[0];
      }
    }
    
    return validPositions[0];
  }
  
  handlePlayPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    let actionTaken = false;
    
    if (!actionTaken) {
      actionTaken = this.tryEvolution();
    }
    
    if (!actionTaken) {
      actionTaken = this.playCreatureFromHand();
    }
    
    if (!actionTaken) {
      actionTaken = this.playSpealsFromHand();
    }
    
    if (!actionTaken && !aiPlayer.hasPlayedApprentice) {
      if (aiPlayer.apprenticeDeckCount > 0 && aiPlayer.apprenticeZone.length < GAME_CONFIG.MAX_APPRENTICES) {
        this.gameManager.drawCard(PLAYERS.PLAYER_B, true);
        actionTaken = true;
      }
    }
    
    this.gameManager.advancePhase();
  }
  
  tryEvolution() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    
    for (let i = 0; i < aiPlayer.field.length; i++) {
      const card = aiPlayer.field[i];
      
      if (card.classType === 'basic' && 
          card.possibleEvolutions && 
          card.possibleEvolutions.length > 0) {
        
        const evolutionTargetId = card.possibleEvolutions[0];
        const evolutionTemplate = this.gameManager.deckManager.CARD_DATABASE.find(
          c => c.templateId === evolutionTargetId
        );
        
        if (!evolutionTemplate) continue;
        
        const evolutionCost = Math.max(0, evolutionTemplate.cost - GAME_CONFIG.EVOLUTION_DISCOUNT);
        
        if (aiPlayer.coins >= evolutionCost) {
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
  
  playCreatureFromHand() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    const gameState = this.gameManager.getState();
    
    const creatureCount = aiPlayer.field.filter(card => card.type === 'creature').length;
    
    if (creatureCount >= GAME_CONFIG.MAX_CREATURES) {
      return false;
    }
    
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
    
    if (bestCreatureIndex !== -1) {
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
  
  playSpealsFromHand() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    const gameState = this.gameManager.getState();
    const opponentId = PLAYERS.PLAYER_A;
    
    for (let i = 0; i < aiPlayer.hand.length; i++) {
      const card = aiPlayer.hand[i];
      
      if (card.type === 'spell' && aiPlayer.coins >= card.cost) {
        let targetPlayerId = PLAYERS.PLAYER_B;
        
        if (card.templateId === 'fireball') {
          targetPlayerId = opponentId;
        }
        
        const targetPlayer = this.gameManager.players[targetPlayerId];
        
        if (targetPlayer.field.length > 0) {
          let targetIndex = 0;
          
          if (card.templateId === 'fireball') {
            let highestCP = targetPlayer.field[0].cp;
            
            targetPlayer.field.forEach((target, idx) => {
              if (target.cp > highestCP) {
                highestCP = target.cp;
                targetIndex = idx;
              }
            });
          } else if (card.templateId === 'healing') {
            let lowestCP = targetPlayer.field[0].cp;
            
            targetPlayer.field.forEach((target, idx) => {
              if (target.cp < lowestCP) {
                lowestCP = target.cp;
                targetIndex = idx;
              }
            });
          }
          
          const result = this.battleManager.executeSpell(
            PLAYERS.PLAYER_B, i, targetPlayerId, targetIndex
          );
          
          if (result && result.success) {
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
  
  handleAttackPhase() {
    const aiPlayer = this.gameManager.players[PLAYERS.PLAYER_B];
    
    aiPlayer.field.forEach((card, index) => {
      if (card.type === 'creature' && !card.hasAttacked && card.canAttack) {
        this.executeAttack(index);
      }
    });
    
    this.gameManager.advancePhase();
  }
  
  executeAttack(attackerIndex) {
    const { validTargets, canAttackDirectly } = this.battleManager.getValidTargets(
      PLAYERS.PLAYER_B, attackerIndex
    );
    
    if (validTargets.length > 0) {
      let bestTargetIndex = 0;
      let highestCP = validTargets[0].cp;
      
      validTargets.forEach((target, index) => {
        if (target.cp > highestCP) {
          highestCP = target.cp;
          bestTargetIndex = index;
        }
      });
      
      const targetCard = validTargets[bestTargetIndex];
      const opponentField = this.gameManager.players[PLAYERS.PLAYER_A].field;
      const targetIndex = opponentField.findIndex(card => card.id === targetCard.id);
      
      const result = this.battleManager.attackCreature(
        PLAYERS.PLAYER_B, attackerIndex, PLAYERS.PLAYER_A, targetIndex
      );
      
      if (result && result.success) {
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
      }
    } 
    else if (canAttackDirectly) {
      const result = this.battleManager.attackSecurityDirectly(PLAYERS.PLAYER_B, attackerIndex);
      
      if (result && result.success) {
        result.messages.forEach(message => {
          this.gameManager.logger.log(message, { turn: this.gameManager.state.turn });
        });
        
        if (result.gameOver) {
          this.gameManager.endGame(result.winner, 'security');
        }
      }
    }
  }
  
  handleEndPhase() {
    this.gameManager.advancePhase();
  }
}