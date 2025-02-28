import { DEFAULT_STATS, CP_WEIGHTS } from '../constants.js';

export class StatCalculator {
  distributeStats(card, isAdvanced = false) {
    const stats = { ...card.stats };
    
    const totalPoints = isAdvanced ? 200 : 100;
    
    let remainingPoints = totalPoints / 2;
    
    const totalBaseStats = Object.values(stats).reduce((sum, value) => sum + value, 0);
    
    if (totalBaseStats !== totalPoints / 2) {
      const adjustFactor = (totalPoints / 2) / totalBaseStats;
      Object.keys(stats).forEach(stat => {
        stats[stat] = Math.round(stats[stat] * adjustFactor);
      });
    }
    
    while (remainingPoints > 0) {
      const statKeys = Object.keys(stats).filter(key => key !== 'EXP');
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      
      let pointsToAdd = Math.min(5 + Math.floor(Math.random() * 11), remainingPoints);
      
      pointsToAdd = Math.round(pointsToAdd / 5) * 5;
      if (pointsToAdd < 5) pointsToAdd = 5;
      
      if (remainingPoints >= pointsToAdd) {
        stats[randomStat] += pointsToAdd;
        remainingPoints -= pointsToAdd;
      } else {
        stats[randomStat] += remainingPoints;
        remainingPoints = 0;
      }
    }
    
    Object.keys(stats).forEach(stat => {
      stats[stat] = Math.round(stats[stat] / 5) * 5;
    });
    
    card.stats = stats;
    
    card.cp = this.calculateCP(stats);
    
    return stats;
  }
  
  calculateCP(stats) {
    return Object.entries(stats).reduce((total, [stat, value]) => {
      return total + (value * (CP_WEIGHTS[stat] || 0));
    }, 0);
  }
}