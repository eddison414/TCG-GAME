import { Card } from './Card.js';

export class SpellCard extends Card {
  constructor(template) {
    super(template);
  }
  
  executeEffect(gameManager, casterPlayerId, targetPlayerId, targetCard) {
    return {
      spellName: this.name,
      effect: this.effect,
      targetCard: targetCard?.name || 'none'
    };
  }
}