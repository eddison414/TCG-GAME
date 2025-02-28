import { Card } from './Card.js';
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
    
    this.hasAttacked = false;
    this.canAttack = false;
    this.hasAttackedBefore = false;
    this.hasMoved = false;
    
    this.setAttackRange();
  }
  
  setAttackRange() {
    if (this.templateId === 'archer') {
      this.attackRange = ATTACK_RANGES.archer;
    } else if (this.templateId === 'wizard' || this.name.toLowerCase().includes('mage')) {
      this.attackRange = ATTACK_RANGES.mage;
    } else {
      this.attackRange = ATTACK_RANGES.default;
    }
  }
  
  resetForNewTurn() {
    this.hasAttacked = false;
    this.canAttack = true;
    this.hasMoved = false;
  }
  
  applyPassive(sourceCard, stat, value) {
    const originalValue = this.stats[stat];
    
    if (this.stats[stat] !== undefined) {
      this.stats[stat] += value;
      
      this.appliedPassives.push({
        sourceCard,
        effect: `+${value} ${stat}`,
        originalValue
      });
      
      this.cp = this.calculateCP();
    }
  }
  
  clone() {
    const clonedCard = super.clone();
    
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