/**
 * models/Card.js
 * Base Card class that all card types extend from
 */
import { CP_WEIGHTS } from '../constants.js';

export class Card {
  constructor(template) {
    this.id = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.templateId = template.templateId;
    this.name = template.name;
    this.type = template.type;
    this.cost = template.cost;
    this.image = template.image;
    this.effect = template.effect || null;
    this.securityEffect = template.securityEffect || null;
    this.stats = { ...template.stats };
    this.position = -1; // Not on field by default
  }

  /**
   * Calculate the CP (Combat Power) of this card based on its stats
   * @returns {number} The calculated CP value
   */
  calculateCP() {
    return Object.entries(this.stats).reduce((total, [stat, value]) => {
      return total + (value * (CP_WEIGHTS[stat] || 0));
    }, 0);
  }

  /**
   * Get a string representation of the card's stats
   * @returns {string} Stats as a formatted string
   */
  getStatsString() {
    return Object.entries(this.stats)
      .map(([stat, value]) => `${stat.toUpperCase()}: ${value}`)
      .join(' | ');
  }
  
  /**
   * Create a copy of this card
   * @returns {Card} A new instance with the same properties
   */
  clone() {
    const clonedCard = new this.constructor({
      templateId: this.templateId,
      name: this.name,
      type: this.type,
      cost: this.cost,
      image: this.image,
      effect: this.effect,
      securityEffect: this.securityEffect,
      stats: { ...this.stats }
    });
    
    // Copy any additional properties
    clonedCard.position = this.position;
    
    return clonedCard;
  }
}

/**
 * models/CreatureCard.js
 * Specialized card class for creature cards
 */
import { ATTACK_RANGES, CLASS_TYPES } from '../constants.js';

export class CreatureCard extends Card {
  constructor(template) {
    super(template);
    this.cp = this.calculateCP();
    this.classType = template.classType || CLASS_TYPES.BASIC;
    this.ability = template.ability || null;
    this.possibleEvolutions = template.possibleEvolutions || [];
    this.evolvedFrom = template.evolvedFrom || null;
    this.isEvolved = !!template.isEvolved;
    this.appliedPassives = template.appliedPassives || [];
    
    // Creature state
    this.hasAttacked = false;
    this.canAttack = false;
    this.hasAttackedBefore = false;
    this.hasMoved = false;
    
    // Set attack range based on class
    this.setAttackRange();
  }
  
  /**
   * Determine the attack range based on class/name
   */
  setAttackRange() {
    if (this.templateId === 'archer') {
      this.attackRange = ATTACK_RANGES.archer;
    } else if (this.templateId === 'wizard' || this.name.toLowerCase().includes('mage')) {
      this.attackRange = ATTACK_RANGES.mage;
    } else {
      this.attackRange = ATTACK_RANGES.default;
    }
  }
  
  /**
   * Reset the creature for a new turn
   */
  resetForNewTurn() {
    this.hasAttacked = false;
    this.canAttack = true;
    this.hasMoved = false;
  }
  
  /**
   * Apply a passive effect to this creature
   * @param {string} sourceCard - Name of the card providing the passive
   * @param {string} stat - The stat being modified
   * @param {number} value - The stat modification value
   */
  applyPassive(sourceCard, stat, value) {
    const originalValue = this.stats[stat];
    
    if (this.stats[stat] !== undefined) {
      this.stats[stat] += value;
      
      this.appliedPassives.push({
        sourceCard,
        effect: `+${value} ${stat}`,
        originalValue
      });
      
      // Recalculate CP after stat change
      this.cp = this.calculateCP();
    }
  }
  
  /**
   * Clone a creature card with all its state
   * @returns {CreatureCard} A cloned instance
   */
  clone() {
    const clonedCard = super.clone();
    
    // Copy creature-specific properties
    clonedCard.cp = this.cp;
    clonedCard.classType = this.classType;
    clonedCard.ability = this.ability;
    clonedCard.possibleEvolutions = [...this.possibleEvolutions];
    clonedCard.evolvedFrom = this.evolvedFrom;
    clonedCard.isEvolved = this.isEvolved;
    clonedCard.appliedPassives = [...this.appliedPassives];
    clonedCard.hasAttacked = this.hasAttacked;
    clonedCard.canAttack = this.canAttack;
    clonedCard.hasAttackedBefore = this.hasAttackedBefore;
    clonedCard.hasMoved = this.hasMoved;
    clonedCard.attackRange = this.attackRange;
    
    return clonedCard;
  }
}

/**
 * models/SpellCard.js
 * Specialized card class for spell cards
 */
export class SpellCard extends Card {
  constructor(template) {
    super(template);
  }
  
  /**
   * Execute the spell effect
   * @param {object} gameManager - Game manager instance
   * @param {string} casterPlayerId - ID of the player casting the spell
   * @param {string} targetPlayerId - ID of the targeted player
   * @param {CreatureCard} targetCard - The targeted creature card
   */
  executeEffect(gameManager, casterPlayerId, targetPlayerId, targetCard) {
    // Specific spell implementation will be handled by the BattleManager
    return {
      spellName: this.name,
      effect: this.effect,
      targetCard: targetCard?.name || 'none'
    };
  }
}

/**
 * models/ApprenticeCard.js
 * Specialized card class for apprentice cards
 */
export class ApprenticeCard extends Card {
  constructor(template) {
    super(template);
    this.passive = template.passive || null;
  }
  
  /**
   * Apply this apprentice's passive effect to a card
   * @param {CreatureCard} creatureCard - The creature card to enhance
   */
  applyPassiveToCreature(creatureCard) {
    if (this.passive && this.passive.stat && this.passive.value) {
      creatureCard.applyPassive(
        this.name,
        this.passive.stat,
        this.passive.value
      );
      
      // Mark the creature as evolved
      creatureCard.isEvolved = true;
      creatureCard.evolvedFrom = this.name;
    }
    
    return creatureCard;
  }
}