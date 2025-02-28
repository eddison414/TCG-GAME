import { Card } from './Card.js';

export class ApprenticeCard extends Card {
  constructor(template) {
    super(template);
    this.passive = template.passive || null;
  }
  
  applyPassiveToCreature(creatureCard) {
    if (this.passive && this.passive.stat && this.passive.value) {
      creatureCard.applyPassive(
        this.name,
        this.passive.stat,
        this.passive.value
      );
      
      creatureCard.isEvolved = true;
      creatureCard.evolvedFrom = this.name;
    }
    
    return creatureCard;
  }
}