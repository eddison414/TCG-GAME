/**
 * managers/DeckManager.js
 * Manages deck building and card generation
 */
import { 
  CARD_DATABASE, 
  APPRENTICE_DATABASE, 
  GAME_CONFIG, 
  CLASS_TYPES
} from '../constants.js';
import { Card } from '../models/Card.js';
import { CreatureCard } from '../models/CreatureCard.js';
import { SpellCard } from '../models/SpellCard.js';
import { ApprenticeCard } from '../models/ApprenticeCard.js';
import { StatCalculator } from '../utils/StatCalculator.js';

export class DeckManager {
  constructor() {
    this.statCalculator = new StatCalculator();
    this.playerDecks = {};
    this.playerApprenticeDecks = {};
  }
  
  /**
   * Initialize with default decks
   */
  initialize() {
    // Generate default decks
    this.generateDefaultDecks();
  }
  
  /**
   * Create a new card instance from a template
   * @param {string} templateId - ID of the card template
   * @param {boolean} isApprentice - Whether to create an apprentice card
   * @returns {Card} - The created card instance
   */
  createCard(templateId, isApprentice = false) {
    const database = isApprentice ? APPRENTICE_DATABASE : CARD_DATABASE;
    const template = database.find(card => card.templateId === templateId);
    
    if (!template) {
      console.error(`Template with ID ${templateId} not found in ${isApprentice ? 'apprentice' : 'main'} database!`);
      return null;
    }
    
    // Create appropriate card type
    let card;
    
    switch (template.type) {
      case 'creature':
        card = new CreatureCard(template);
        break;
      case 'spell':
        card = new SpellCard(template);
        break;
      case 'apprentice':
        card = new ApprenticeCard(template);
        break;
      default:
        card = new Card(template);
    }
    
    return card;
  }
  
  /**
   * Set a custom deck for a player
   * @param {string} playerId - ID of the player
   * @param {array} mainDeck - Main deck card template IDs
   * @param {array} apprenticeDeck - Apprentice deck card template IDs
   * @returns {boolean} Success status
   */
  setCustomDeck(playerId, mainDeck = [], apprenticeDeck = []) {
    // Validate deck sizes
    if (mainDeck.length < GAME_CONFIG.MIN_DECK_SIZE || 
        mainDeck.length > GAME_CONFIG.MAX_DECK_SIZE) {
      console.error(`Invalid main deck size: ${mainDeck.length}. Must be between ${GAME_CONFIG.MIN_DECK_SIZE} and ${GAME_CONFIG.MAX_DECK_SIZE}`);
      return false;
    }
    
    if (apprenticeDeck.length > GAME_CONFIG.MAX_APPRENTICE_DECK_SIZE) {
      console.error(`Invalid apprentice deck size: ${apprenticeDeck.length}. Maximum is ${GAME_CONFIG.MAX_APPRENTICE_DECK_SIZE}`);
      return false;
    }
    
    // Store deck templates
    this.playerDecks[playerId] = mainDeck;
    this.playerApprenticeDecks[playerId] = apprenticeDeck;
    
    return true;
  }
  
  /**
   * Generate default deck template lists
   */
  generateDefaultDecks() {
    // Simple default main deck with 36 cards
    const defaultDeck = [];
    
    // Add some of each card type
    CARD_DATABASE.forEach(template => {
      // Skip advanced class cards for initial deck
      if (template.classType === CLASS_TYPES.ADVANCED) return;
      
      // Add 6 of each card type
      for (let i = 0; i < 6; i++) {
        defaultDeck.push(template.templateId);
      }
    });
    
    // Generate default apprentice deck
    const defaultApprenticeDeck = [];
    
    // Add 3 copies of each apprentice card
    APPRENTICE_DATABASE.forEach(template => {
      for (let i = 0; i < 3; i++) {
        defaultApprenticeDeck.push(template.templateId);
      }
    });
    
    // Set as default for both players
    this.playerDecks['playerA'] = defaultDeck;
    this.playerDecks['playerB'] = defaultDeck.slice(); // Copy the array
    this.playerApprenticeDecks['playerA'] = defaultApprenticeDeck;
    this.playerApprenticeDecks['playerB'] = defaultApprenticeDeck.slice(); // Copy the array
  }
  
  /**
   * Build the main deck for a player
   * @param {string} playerId - ID of the player
   * @returns {array} Array of card instances
   */
  buildMainDeck(playerId) {
    const deckTemplates = this.playerDecks[playerId] || [];
    const deck = [];
    
    if (deckTemplates.length >= GAME_CONFIG.MIN_DECK_SIZE) {
      // Create cards from templates
      deckTemplates.forEach(templateId => {
        const card = this.createCard(templateId);
        if (card) {
          // For creature cards, distribute stats
          if (card instanceof CreatureCard) {
            this.statCalculator.distributeStats(card);
          }
          deck.push(card);
        }
      });
    } else {
      console.warn(`No valid deck found for player ${playerId}. Using default deck.`);
      
      // Use default deck
      const defaultDeck = [];
      
      // Add some of each card type
      CARD_DATABASE.forEach(template => {
        // Skip advanced class cards for initial deck
        if (template.classType === CLASS_TYPES.ADVANCED) return;
        
        // Add 6 of each card type
        for (let i = 0; i < 6; i++) {
          const card = this.createCard(template.templateId);
          if (card) {
            // For creature cards, distribute stats
            if (card instanceof CreatureCard) {
              this.statCalculator.distributeStats(card);
            }
            defaultDeck.push(card);
          }
        }
      });
      
      return this.shuffle(defaultDeck);
    }
    
    return this.shuffle(deck);
  }
  
  /**
   * Build the apprentice deck for a player
   * @param {string} playerId - ID of the player
   * @returns {array} Array of apprentice card instances
   */
  buildApprenticeDeck(playerId) {
    const deckTemplates = this.playerApprenticeDecks[playerId] || [];
    const deck = [];
    
    if (deckTemplates.length > 0) {
      // Create cards from templates
      deckTemplates.forEach(templateId => {
        const card = this.createCard(templateId, true);
        if (card) {
          deck.push(card);
        }
      });
    } else {
      console.warn(`No valid apprentice deck found for player ${playerId}. Using default.`);
      
      // Use default deck
      APPRENTICE_DATABASE.forEach(template => {
        for (let i = 0; i < 3; i++) {
          const card = this.createCard(template.templateId, true);
          if (card) {
            deck.push(card);
          }
        }
      });
    }
    
    return this.shuffle(deck);
  }
  
  /**
   * Create a creature card with distributed stats
   * @param {string} className - Class template ID
   * @param {boolean} isAdvanced - Whether this is an advanced class
   * @returns {CreatureCard} The created creature card
   */
  createCreatureWithStats(className, isAdvanced = false) {
    const card = this.createCard(className);
    
    if (card && card instanceof CreatureCard) {
      this.statCalculator.distributeStats(card, isAdvanced);
      return card;
    }
    
    return null;
  }
  
  /**
   * Shuffle an array (Fisher-Yates algorithm)
   * @param {array} array - Array to shuffle
   * @returns {array} Shuffled array
   */
  shuffle(array) {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    return newArray;
  }
}

/**
 * managers/BattleManager.js
 * Handles combat and card interactions
 */
import { GAME_CONFIG, POSITION_CONFIG } from '../constants.js';
import { Logger } from '../utils/Logger.js';

export class BattleManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.logger = new Logger();
  }
  
  /**
   * Check if a creature can attack a target
   * @param {CreatureCard} attacker - The attacking creature
   * @param {CreatureCard} defender - The defending creature
   * @returns {boolean} Whether attack is valid
   */
  canAttackTarget(attacker, defender) {
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
  
  /**
   * Get valid attack targets for a creature
   * @param {string} attackerPlayerId - ID of the attacking player
   * @param {number} attackerIndex - Index of the attacking creature
   * @returns {object} Object with valid targets and direct attack possibility
   */
  getValidTargets(attackerPlayerId, attackerIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayerId = attackerPlayerId === 'playerA' ? 'playerB' : 'playerA';
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
    // Validate attacker
    if (attackerIndex < 0 || attackerIndex >= attackerPlayer.field.length) {
      return { validTargets: [], canAttackDirectly: false };
    }
    
    const attacker = attackerPlayer.field[attackerIndex];
    
    // Check if the attacker can attack
    if (!attacker.canAttack || attacker.hasAttacked) {
      return { validTargets: [], canAttackDirectly: false };
    }
    
    // Find valid targets
    const validTargets = defenderPlayer.field.filter(card => 
      this.canAttackTarget(attacker, card)
    );
    
    // Check for special abilities
    // Rogue Scout's Stealth ability
    const hasStealth = attacker.templateId === 'rogue' && 
                      attacker.ability === 'Stealth' &&
                      !attacker.hasAttackedBefore;
                      
    // Can attack directly if there are no creatures or has stealth
    const canAttackDirectly = hasStealth || defenderPlayer.field.length === 0;
    
    return { 
      validTargets, 
      canAttackDirectly,
      hasSpecialAbilities: {
        stealth: hasStealth,
        backstab: this.hasBackstabAbility(attacker)
      }
    };
  }
  
  /**
   * Check if a creature has the backstab ability
   * @param {CreatureCard} creature - The creature to check
   * @returns {boolean} Whether the creature has backstab
   */
  hasBackstabAbility(creature) {
    return creature.templateId === 'assassin' && 
           POSITION_CONFIG.BACK_ROW.includes(creature.position);
  }
  
  /**
   * Attack a creature with another creature
   * @param {string} attackerPlayerId - ID of the attacking player
   * @param {number} attackerIndex - Index of the attacking creature
   * @param {string} defenderPlayerId - ID of the defending player
   * @param {number} defenderIndex - Index of the defending creature
   * @returns {object} Result of the battle
   */
  attackCreature(attackerPlayerId, attackerIndex, defenderPlayerId, defenderIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
    // Validate indexes
    if (attackerIndex < 0 || attackerIndex >= attackerPlayer.field.length ||
        defenderIndex < 0 || defenderIndex >= defenderPlayer.field.length) {
      return {
        success: false,
        reason: 'invalid_index',
        message: 'Invalid attacker or defender index'
      };
    }
    
    const attacker = attackerPlayer.field[attackerIndex];
    const defender = defenderPlayer.field[defenderIndex];
    
    // Check if attacker can attack
    if (!attacker.canAttack || attacker.hasAttacked) {
      return {
        success: false,
        reason: 'cannot_attack',
        message: `${attacker.name} cannot attack right now!`
      };
    }
    
    // Check range
    if (!this.canAttackTarget(attacker, defender)) {
      return {
        success: false,
        reason: 'out_of_range',
        message: `${defender.name} is out of range for ${attacker.name}`
      };
    }
    
    // Deduct attack cost if player has coins
    if (attackerPlayer.coins >= GAME_CONFIG.ATTACK_COST) {
      attackerPlayer.coins -= GAME_CONFIG.ATTACK_COST;
      this.logger.log(`${attackerPlayer.name} spent ${GAME_CONFIG.ATTACK_COST} coin for attack action`);
    }
    
    // Mark attacker as having attacked
    attacker.hasAttacked = true;
    attacker.hasAttackedBefore = true;
    
    // Calculate battle bonuses
    let attackerBonus = 0;
    let defenderBonus = 0;
    
    // Apply special abilities
    
    // Paladin Guard ability
    if (defender.templateId === 'paladin') {
      defenderBonus = 1000;
      this.logger.log(`${defender.name}'s ability reduces damage by 1000!`);
    }
    
    // Knight First Strike ability
    const hasFirstStrike = attacker.templateId === 'knight' && 
                          attacker.ability === 'First Strike';
    
    // Assassin Backstab ability
    if (this.hasBackstabAbility(attacker)) {
      attackerBonus = 2000;
      this.logger.log(`${attacker.name}'s Backstab ability adds 2000 damage when attacking from back row!`);
    }
    
    // Determine battle outcome
    const battleResult = {
      success: true,
      attacker: {
        name: attacker.name,
        cp: attacker.cp,
        bonus: attackerBonus,
        totalPower: attacker.cp + attackerBonus
      },
      defender: {
        name: defender.name,
        cp: defender.cp,
        bonus: defenderBonus,
        totalPower: defender.cp + defenderBonus
      },
      hasFirstStrike,
      messages: []
    };
    
    battleResult.messages.push(
      `${attackerPlayer.name}'s ${attacker.name} (${attacker.cp + attackerBonus} CP) attacks ${defenderPlayer.name}'s ${defender.name} (${defender.cp + defenderBonus} CP)!`
    );
    
    // Determine winner
    if (attacker.cp + attackerBonus > defender.cp + defenderBonus) {
      // Attacker wins
      battleResult.messages.push(`${defender.name} was defeated in battle!`);
      battleResult.defenderDefeated = true;
      
      // Move defender to trash
      defenderPlayer.trashPile.push(defender);
      defenderPlayer.field = defenderPlayer.field.filter(card => card.id !== defender.id);
      
      // First Strike prevents damage to the attacker
      if (!hasFirstStrike && attacker.cp <= defender.cp + defenderBonus) {
        battleResult.messages.push(`${attacker.name} was also defeated in battle!`);
        battleResult.attackerDefeated = true;
        
        // Move attacker to trash
        attackerPlayer.trashPile.push(attacker);
        attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
      }
    } else {
      // Defender wins or tie
      battleResult.messages.push(`${attacker.name}'s attack was blocked!`);
      
      if (attacker.cp + attackerBonus < defender.cp + defenderBonus) {
        battleResult.messages.push(`${attacker.name} was defeated in battle!`);
        battleResult.attackerDefeated = true;
        
        // Move attacker to trash
        attackerPlayer.trashPile.push(attacker);
        attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
      } else {
        battleResult.messages.push("Both creatures survived the battle!");
      }
    }
    
    return battleResult;
  }
  
  /**
   * Attack the opponent's security directly
   * @param {string} attackerPlayerId - ID of the attacking player
   * @param {number} attackerIndex - Index of the attacking creature
   * @returns {object} Result of the attack
   */
  attackSecurityDirectly(attackerPlayerId, attackerIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayerId = attackerPlayerId === 'playerA' ? 'playerB' : 'playerA';
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
    // Validate attacker
    if (attackerIndex < 0 || attackerIndex >= attackerPlayer.field.length) {
      return {
        success: false,
        reason: 'invalid_index',
        message: 'Invalid attacker index'
      };
    }
    
    const attacker = attackerPlayer.field[attackerIndex];
    
    // Check if attacker can attack
    if (!attacker.canAttack || attacker.hasAttacked) {
      return {
        success: false,
        reason: 'cannot_attack',
        message: `${attacker.name} cannot attack right now!`
      };
    }
    
    // Determine if direct attack is allowed
    const { canAttackDirectly } = this.getValidTargets(attackerPlayerId, attackerIndex);
    
    if (!canAttackDirectly) {
      return {
        success: false,
        reason: 'creatures_blocking',
        message: `Cannot attack security directly while opponent has creatures on the field.`
      };
    }
    
    // Deduct attack cost if player has coins
    if (attackerPlayer.coins >= GAME_CONFIG.ATTACK_COST) {
      attackerPlayer.coins -= GAME_CONFIG.ATTACK_COST;
      this.logger.log(`${attackerPlayer.name} spent ${GAME_CONFIG.ATTACK_COST} coin for attack action`);
    }
    
    // Mark attacker as having attacked
    attacker.hasAttacked = true;
    attacker.hasAttackedBefore = true;
    
    // Create result object
    const result = {
      success: true,
      attacker: {
        name: attacker.name,
        cp: attacker.cp
      },
      messages: []
    };
    
    result.messages.push(`${attackerPlayer.name}'s ${attacker.name} attacks security directly!`);
    
    // Check if defender has security cards
    if (defenderPlayer.security.length > 0) {
      const securityCard = defenderPlayer.security.pop();
      result.securityCard = securityCard;
      result.messages.push(`Security card revealed: ${securityCard.name}!`);
      
      // Handle security card effects
      if (securityCard.type === 'creature') {
        result.messages.push(`Security creature ${securityCard.name} (${securityCard.cp} CP) defends!`);
        
        if (attacker.cp > securityCard.cp) {
          result.messages.push(`${securityCard.name} was defeated!`);
          defenderPlayer.trashPile.push(securityCard);
        } else {
          result.messages.push(`${attacker.name} was defeated by security!`);
          result.attackerDefeated = true;
          
          // Move attacker to trash and security card to hand
          attackerPlayer.trashPile.push(attacker);
          attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
          defenderPlayer.hand.push(securityCard);
        }
      } 
      else if (securityCard.type === 'spell') {
        const effect = securityCard.securityEffect || securityCard.effect;
        result.messages.push(`Security effect: ${effect}`);
        
        // Implement specific security effects
        if (securityCard.templateId === 'fireball') {
          result.messages.push(`Fireball deals 2000 damage to ${attacker.name}!`);
          
          if (attacker.cp <= 2000) {
            result.messages.push(`${attacker.name} was destroyed!`);
            result.attackerDefeated = true;
            
            // Move attacker to trash
            attackerPlayer.trashPile.push(attacker);
            attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
          } else {
            result.messages.push(`${attacker.name} survived with ${attacker.cp - 2000} CP!`);
          }
          
          // Move spell to trash
          defenderPlayer.trashPile.push(securityCard);
        } 
        else if (securityCard.templateId === 'healing') {
          result.messages.push(`${securityCard.securityEffect || securityCard.effect}`);
          // Add to hand instead of trash
          defenderPlayer.hand.push(securityCard);
        } 
        else {
          // Generic spell handling
          defenderPlayer.trashPile.push(securityCard);
        }
      }
      
      // Check if that was the last security card
      if (defenderPlayer.security.length === 0) {
        result.gameOver = true;
        result.winner = attackerPlayerId;
        result.messages.push(`${attackerPlayer.name} wins! ${defenderPlayer.name} has no security left!`);
      }
    } else {
      // No security cards left, game over
      result.gameOver = true;
      result.winner = attackerPlayerId;
      result.messages.push(`${attackerPlayer.name} wins! ${defenderPlayer.name} has no security left!`);
    }
    
    return result;
  }
  
  /**
   * Execute a spell effect
   * @param {string} casterPlayerId - ID of the player casting the spell
   * @param {number} spellIndex - Index of the spell in the player's hand
   * @param {string} targetPlayerId - ID of the targeted player
   * @param {number} targetCardIndex - Index of the targeted card
   * @returns {object} Result of the spell cast
   */
  executeSpell(casterPlayerId, spellIndex, targetPlayerId, targetCardIndex) {
    const casterPlayer = this.gameManager.players[casterPlayerId];
    const targetPlayer = this.gameManager.players[targetPlayerId];
    
    // Validate spell index
    if (spellIndex < 0 || spellIndex >= casterPlayer.hand.length) {
      return {
        success: false,
        reason: 'invalid_spell_index',
        message: 'Invalid spell index'
      };
    }
    
    const spellCard = casterPlayer.hand[spellIndex];
    
    // Check if it's a spell
    if (spellCard.type !== 'spell') {
      return {
        success: false,
        reason: 'not_a_spell',
        message: `${spellCard.name} is not a spell card`
      };
    }
    
    // Check if target player and card are valid
    if (!targetPlayer || targetCardIndex < 0 || targetCardIndex >= targetPlayer.field.length) {
      return {
        success: false,
        reason: 'invalid_target',
        message: 'Invalid target'
      };
    }
    
    const targetCard = targetPlayer.field[targetCardIndex];
    
    // Implement spell effects
    const result = {
      success: true,
      spell: {
        name: spellCard.name,
        effect: spellCard.effect
      },
      target: {
        name: targetCard.name,
        cp: targetCard.cp
      },
      messages: []
    };
    
    result.messages.push(`${casterPlayer.name} casts ${spellCard.name} on ${targetCard.name}!`);
    
    // Handle specific spells
    if (spellCard.templateId === 'fireball') {
      result.messages.push(`${spellCard.name} deals 3000 damage to ${targetCard.name}!`);
      
      if (targetCard.cp <= 3000) {
        result.messages.push(`${targetCard.name} was destroyed!`);
        result.targetDestroyed = true;
        
        // Move target to trash
        targetPlayer.trashPile.push(targetCard);
        targetPlayer.field = targetPlayer.field.filter(card => card.id !== targetCard.id);
      } else {
        result.messages.push(`${targetCard.name} survived with ${targetCard.cp - 3000} CP remaining!`);
      }
    } 
    else if (spellCard.templateId === 'healing') {
      result.messages.push(`${spellCard.name} restores 2000 CP to ${targetCard.name}!`);
      // In a full implementation, we would increase CP temporarily or permanently
    }
    
    // Move spell to trash after use
    casterPlayer.trashPile.push(spellCard);
    casterPlayer.hand.splice(spellIndex, 1);
    
    return result;
  }
  
  /**
   * Evolve a basic class card to an advanced class
   * @param {string} playerId - ID of the player
   * @param {number} basicCardIndex - Index of the basic class card
   * @param {string} targetEvolution - Template ID of the target evolution
   * @returns {object} Result of the evolution
   */
  evolveCard(playerId, basicCardIndex, targetEvolution) {
    const player = this.gameManager.players[playerId];
    
    // Validate card index
    if (basicCardIndex < 0 || basicCardIndex >= player.field.length) {
      return {
        success: false,
        reason: 'invalid_card_index',
        message: 'Invalid card index'
      };
    }
    
    const basicCard = player.field[basicCardIndex];
    
    // Check if this card can evolve
    if (!basicCard || basicCard.classType !== 'basic') {
      return {
        success: false,
        reason: 'not_basic_class',
        message: `${basicCard?.name || 'Card'} cannot evolve - not a basic class!`
      };
    }
    
    // Check if the target evolution is valid for this card
    if (!basicCard.possibleEvolutions || !basicCard.possibleEvolutions.includes(targetEvolution)) {
      return {
        success: false,
        reason: 'invalid_evolution_path',
        message: `${basicCard.name} cannot evolve into ${targetEvolution}`
      };
    }
    
    // Create the advanced class card
    const deckManager = new DeckManager();
    const advancedCard = deckManager.createCreatureWithStats(targetEvolution, true);
    
    if (!advancedCard) {
      return {
        success: false,
        reason: 'failed_to_create_card',
        message: `Failed to create evolved card: ${targetEvolution}`
      };
    }
    
    // Set evolution properties
    advancedCard.isEvolved = true;
    advancedCard.evolvedFrom = basicCard.templateId;
    advancedCard.classType = 'advanced';
    
    // Keep the same position on the field
    advancedCard.position = basicCard.position;
    
    // Remove the basic card from the field
    player.trashPile.push(basicCard);
    player.field[basicCardIndex] = advancedCard;
    
    // Evolution costs coins (discounted by 1 from the normal cost)
    const evolutionCost = Math.max(0, advancedCard.cost - GAME_CONFIG.EVOLUTION_DISCOUNT);
    player.coins -= evolutionCost;
    
    return {
      success: true,
      basicCard: {
        name: basicCard.name,
        templateId: basicCard.templateId
      },
      advancedCard: {
        name: advancedCard.name,
        templateId: advancedCard.templateId,
        cost: evolutionCost
      },
      message: `${player.name}'s ${basicCard.name} evolved into ${advancedCard.name}! (Cost: ${evolutionCost} coins)`
    };
  }
}