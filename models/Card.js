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
    this.position = -1;
  }

  calculateCP() {
    return Object.entries(this.stats).reduce((total, [stat, value]) => {
      return total + (value * (CP_WEIGHTS[stat] || 0));
    }, 0);
  }

  getStatsString() {
    return Object.entries(this.stats)
      .map(([stat, value]) => `${stat.toUpperCase()}: ${value}`)
      .join(' | ');
  }
  
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
    
    clonedCard.position = this.position;
    
    return clonedCard;
  }
}