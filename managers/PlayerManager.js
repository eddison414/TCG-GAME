import { GAME_CONFIG, CARD_TYPES } from '../constants.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export class PlayerManager {
  constructor(id, name, isAI = false) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.events = new EventEmitter();
    
    this.coins = GAME_CONFIG.STARTING_COINS;
    this.deck = [];
    this.hand = [];
    this.field = [];
    this.security = [];
    this.trashPile = [];
    this.apprenticeDeck = [];
    this.apprenticeZone = [];
    
    this.hasPlayedApprentice = false;
    this.hasMoved = [];
  }
  
  initialize(deckManager) {
    this.coins = GAME_CONFIG.STARTING_COINS;
    this.deck = [];
    this.hand = [];
    this.field = [];
    this.security = [];
    this.trashPile = [];
    this.apprenticeDeck = [];
    this.apprenticeZone = [];
    this.hasPlayedApprentice = false;
    this.hasMoved = [];
    
    if (deckManager) {
      this.deck = deckManager.buildMainDeck(this.id);
      this.apprenticeDeck = deckManager.buildApprenticeDeck(this.id);
    }
    
    this.events.emit('playerInitialized', { playerId: this.id });
  }
  
  resetForNewTurn() {
    this.hasPlayedApprentice = false;
    this.hasMoved = [];
    
    this.field.forEach(card => {
      if (card.resetForNewTurn) {
        card.resetForNewTurn();
      }
    });
  }
  
  playCard(handIndex, position = null, isEvolution = false, apprentice = null) {
    if (handIndex < 0 || handIndex >= this.hand.length) {
      return null;
    }
    
    const card = this.hand[handIndex];
    const cost = isEvolution ? Math.max(0, card.cost - GAME_CONFIG.EVOLUTION_DISCOUNT) : card.cost;
    
    if (!isEvolution && this.coins < cost) {
      return {
        success: false,
        reason: 'not_enough_coins',
        message: `Not enough coins to play ${card.name} (cost: ${cost}, available: ${this.coins})`
      };
    }
    
    if (card.type === CARD_TYPES.CREATURE && 
        this.field.filter(c => c.type === CARD_TYPES.CREATURE).length >= GAME_CONFIG.MAX_CREATURES) {
      return {
        success: false,
        reason: 'field_full',
        message: `Cannot play ${card.name} - field is full (max ${GAME_CONFIG.MAX_CREATURES} creatures)`
      };
    }
    
    if (!isEvolution) {
      this.coins -= cost;
    } else if (apprentice) {
      const apprenticeIndex = this.apprenticeZone.findIndex(c => c.id === apprentice.id);
      if (apprenticeIndex !== -1) {
        this.apprenticeZone.splice(apprenticeIndex, 1);
        this.trashPile.push(apprentice);
      }
    }
    
    if (card.type === CARD_TYPES.CREATURE) {
      if (position !== null && position >= 0) {
        const existingCardIndex = this.field.findIndex(c => c.position === position);
        if (existingCardIndex !== -1) {
          const existingCard = this.field[existingCardIndex];
          this.trashPile.push(existingCard);
          this.field.splice(existingCardIndex, 1);
        }
        
        card.position = position;
      } else {
        let availablePosition = -1;
        for (let i = 0; i < GAME_CONFIG.MAX_FIELD_SLOTS; i++) {
          if (!this.field.some(c => c.position === i)) {
            availablePosition = i;
            break;
          }
        }
        
        card.position = availablePosition;
      }
      
      this.field.push(card);
      this.hand.splice(handIndex, 1);
      
      if (card.templateId === 'mage') {
        return {
          success: true,
          card,
          effect: 'draw_card',
          message: `${card.name} was played to position ${card.position}. Effect: Draw 1 card`
        };
      }
      
      return {
        success: true,
        card,
        message: `${card.name} was played to position ${card.position}`
      };
    } 
    else if (card.type === CARD_TYPES.SPELL) {
      return {
        success: true,
        card,
        handIndex,
        message: `${card.name} was played. Effect: ${card.effect}`
      };
    }
    
    return {
      success: false,
      reason: 'invalid_card_type',
      message: `Invalid card type: ${card.type}`
    };
  }
  
  moveCreature(cardIndex, newPosition) {
    if (cardIndex < 0 || cardIndex >= this.field.length) {
      return {
        success: false,
        reason: 'invalid_card_index',
        message: 'Invalid card index'
      };
    }
    
    const card = this.field[cardIndex];
    
    if (this.coins < GAME_CONFIG.MOVEMENT_COST) {
      return {
        success: false,
        reason: 'not_enough_coins',
        message: `Not enough coins to move. Movement costs ${GAME_CONFIG.MOVEMENT_COST} coins.`
      };
    }
    
    if (this.hasMoved.includes(card.id)) {
      return {
        success: false,
        reason: 'already_moved',
        message: `${card.name} has already moved this turn.`
      };
    }
    
    if (this.field.some(c => c.position === newPosition)) {
      return {
        success: false,
        reason: 'position_occupied',
        message: 'The target position is already occupied.'
      };
    }
    
    if (!this.arePositionsAdjacent(card.position, newPosition)) {
      return {
        success: false,
        reason: 'not_adjacent',
        message: 'Creatures can only move to adjacent positions.'
      };
    }
    
    const oldPosition = card.position;
    card.position = newPosition;
    this.coins -= GAME_CONFIG.MOVEMENT_COST;
    this.hasMoved.push(card.id);
    
    return {
      success: true,
      card,
      oldPosition,
      newPosition,
      message: `${card.name} moved from position ${oldPosition} to position ${newPosition}`
    };
  }
  
  getValidMovementPositions(cardIndex) {
    if (cardIndex < 0 || cardIndex >= this.field.length) {
      return [];
    }
    
    const card = this.field[cardIndex];
    const validPositions = [];
    
    for (let pos = 0; pos < GAME_CONFIG.MAX_FIELD_SLOTS; pos++) {
      if (this.field.some(c => c.position === pos)) {
        continue;
      }
      
      if (this.arePositionsAdjacent(card.position, pos)) {
        validPositions.push(pos);
      }
    }
    
    return validPositions;
  }
  
  arePositionsAdjacent(pos1, pos2) {
    const row1 = Math.floor(pos1 / 3);
    const col1 = pos1 % 3;
    const row2 = Math.floor(pos2 / 3);
    const col2 = pos2 % 3;
    
    const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
    
    return distance === 1;
  }
  
  countCreatures() {
    return this.field.filter(card => card.type === CARD_TYPES.CREATURE).length;
  }
  
  getState() {
    return {
      id: this.id,
      name: this.name,
      isAI: this.isAI,
      coins: this.coins,
      deckCount: this.deck.length,
      handCount: this.hand.length,
      hand: this.hand,
      fieldCount: this.field.length,
      field: this.field,
      securityCount: this.security.length,
      apprenticeDeckCount: this.apprenticeDeck.length,
      apprenticeZone: this.apprenticeZone,
      hasPlayedApprentice: this.hasPlayedApprentice,
      hasMoved: this.hasMoved
    };
  }
}