/**
 * managers/PlayerManager.js
 * Manages player state and actions
 */
import { GAME_CONFIG, CARD_TYPES } from '../constants.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export class PlayerManager {
  constructor(id, name, isAI = false) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.events = new EventEmitter();
    
    // Player state
    this.coins = GAME_CONFIG.STARTING_COINS;
    this.deck = [];
    this.hand = [];
    this.field = [];
    this.security = [];
    this.trashPile = [];
    this.apprenticeDeck = [];
    this.apprenticeZone = [];
    
    // Turn flags
    this.hasPlayedApprentice = false;
    this.hasMoved = [];  // Array of card IDs that have moved
  }
  
  /**
   * Initialize the player for a new game
   * @param {DeckManager} deckManager - The deck manager to build decks
   */
  initialize(deckManager) {
    // Reset state
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
    
    // Set up decks
    if (deckManager) {
      this.deck = deckManager.buildMainDeck(this.id);
      this.apprenticeDeck = deckManager.buildApprenticeDeck(this.id);
    }
    
    this.events.emit('playerInitialized', { playerId: this.id });
  }
  
  /**
   * Reset the player's state for a new turn
   */
  resetForNewTurn() {
    this.hasPlayedApprentice = false;
    this.hasMoved = [];
    
    // Reset card states
    this.field.forEach(card => {
      if (card.resetForNewTurn) {
        card.resetForNewTurn();
      }
    });
  }
  
  /**
   * Play a card from hand
   * @param {number} handIndex - Index of the card in hand
   * @param {number} position - Position on the field (for creature cards)
   * @param {boolean} isEvolution - Whether this is part of an evolution
   * @param {object} apprentice - The apprentice card being evolved (if applicable)
   * @returns {object|null} - Information about the played card or null if failed
   */
  playCard(handIndex, position = null, isEvolution = false, apprentice = null) {
    if (handIndex < 0 || handIndex >= this.hand.length) {
      return null; // Invalid hand index
    }
    
    const card = this.hand[handIndex];
    const cost = isEvolution ? Math.max(0, card.cost - GAME_CONFIG.EVOLUTION_DISCOUNT) : card.cost;
    
    // Check if player has enough coins (unless this is an evolution)
    if (!isEvolution && this.coins < cost) {
      return {
        success: false,
        reason: 'not_enough_coins',
        message: `Not enough coins to play ${card.name} (cost: ${cost}, available: ${this.coins})`
      };
    }
    
    // Check field limit for creatures
    if (card.type === CARD_TYPES.CREATURE && 
        this.field.filter(c => c.type === CARD_TYPES.CREATURE).length >= GAME_CONFIG.MAX_CREATURES) {
      return {
        success: false,
        reason: 'field_full',
        message: `Cannot play ${card.name} - field is full (max ${GAME_CONFIG.MAX_CREATURES} creatures)`
      };
    }
    
    // Deduct coins
    if (!isEvolution) {
      this.coins -= cost;
    } else if (apprentice) {
      // For evolution, remove apprentice from zone and add to trash
      const apprenticeIndex = this.apprenticeZone.findIndex(c => c.id === apprentice.id);
      if (apprenticeIndex !== -1) {
        this.apprenticeZone.splice(apprenticeIndex, 1);
        this.trashPile.push(apprentice);
      }
    }
    
    // Process the card based on type
    if (card.type === CARD_TYPES.CREATURE) {
      // Assign position if provided
      if (position !== null && position >= 0) {
        // Check if position is already occupied
        const existingCardIndex = this.field.findIndex(c => c.position === position);
        if (existingCardIndex !== -1) {
          // Move existing card to trash pile
          const existingCard = this.field[existingCardIndex];
          this.trashPile.push(existingCard);
          this.field.splice(existingCardIndex, 1);
        }
        
        card.position = position;
      } else {
        // Find first available position
        let availablePosition = -1;
        for (let i = 0; i < GAME_CONFIG.MAX_FIELD_SLOTS; i++) {
          if (!this.field.some(c => c.position === i)) {
            availablePosition = i;
            break;
          }
        }
        
        card.position = availablePosition;
      }
      
      // Add to field and remove from hand
      this.field.push(card);
      this.hand.splice(handIndex, 1);
      
      // Special creature abilities
      if (card.templateId === 'mage') {
        // Return the draw effect so the game manager can execute it
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
      // For spells, we return the card but don't move it yet
      // The battle manager will handle the spell resolution and card movement
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
  
  /**
   * Move a creature on the field
   * @param {number} cardIndex - Index of the card in the field
   * @param {number} newPosition - New position for the card
   * @returns {object} Result of the movement
   */
  moveCreature(cardIndex, newPosition) {
    if (cardIndex < 0 || cardIndex >= this.field.length) {
      return {
        success: false,
        reason: 'invalid_card_index',
        message: 'Invalid card index'
      };
    }
    
    const card = this.field[cardIndex];
    
    // Check if player has enough coins
    if (this.coins < GAME_CONFIG.MOVEMENT_COST) {
      return {
        success: false,
        reason: 'not_enough_coins',
        message: `Not enough coins to move. Movement costs ${GAME_CONFIG.MOVEMENT_COST} coins.`
      };
    }
    
    // Check if the card has already moved this turn
    if (this.hasMoved.includes(card.id)) {
      return {
        success: false,
        reason: 'already_moved',
        message: `${card.name} has already moved this turn.`
      };
    }
    
    // Check if the new position is already occupied
    if (this.field.some(c => c.position === newPosition)) {
      return {
        success: false,
        reason: 'position_occupied',
        message: 'The target position is already occupied.'
      };
    }
    
    // Check if positions are adjacent
    if (!this.arePositionsAdjacent(card.position, newPosition)) {
      return {
        success: false,
        reason: 'not_adjacent',
        message: 'Creatures can only move to adjacent positions.'
      };
    }
    
    // Move the creature
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
  
  /**
   * Get all valid adjacent empty positions for a card
   * @param {number} cardIndex - Index of the card in the field
   * @returns {number[]} Array of valid position numbers
   */
  getValidMovementPositions(cardIndex) {
    if (cardIndex < 0 || cardIndex >= this.field.length) {
      return [];
    }
    
    const card = this.field[cardIndex];
    const validPositions = [];
    
    // Check all positions 0-8 (3x3 grid)
    for (let pos = 0; pos < GAME_CONFIG.MAX_FIELD_SLOTS; pos++) {
      // Skip if the position is already occupied
      if (this.field.some(c => c.position === pos)) {
        continue;
      }
      
      // Check if this position is adjacent to the card's current position
      if (this.arePositionsAdjacent(card.position, pos)) {
        validPositions.push(pos);
      }
    }
    
    return validPositions;
  }
  
  /**
   * Check if two positions are adjacent in the 3x3 grid
   * @param {number} pos1 - First position
   * @param {number} pos2 - Second position
   * @returns {boolean} True if positions are adjacent
   */
  arePositionsAdjacent(pos1, pos2) {
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
  
  /**
   * Count creatures on the field
   * @returns {number} Number of creatures
   */
  countCreatures() {
    return this.field.filter(card => card.type === CARD_TYPES.CREATURE).length;
  }
  
  /**
   * Get a condensed player state for the UI
   * @returns {object} Player state
   */
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