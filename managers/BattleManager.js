import { GAME_CONFIG, POSITION_CONFIG } from '../constants.js';
import { Logger } from '../utils/Logger.js';

export class BattleManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.logger = new Logger();
  }
  
  canAttackTarget(attacker, defender) {
    if (attacker.position === -1 || defender.position === -1) return false;
    
    const attackerRow = Math.floor(attacker.position / 3);
    const attackerCol = attacker.position % 3;
    const defenderRow = Math.floor(defender.position / 3);
    const defenderCol = defender.position % 3;
    
    const distance = Math.abs(attackerRow - defenderRow) + Math.abs(attackerCol - defenderCol);
    
    return distance <= attacker.attackRange;
  }
  
  getValidTargets(attackerPlayerId, attackerIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayerId = attackerPlayerId === 'playerA' ? 'playerB' : 'playerA';
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
    if (attackerIndex < 0 || attackerIndex >= attackerPlayer.field.length) {
      return { validTargets: [], canAttackDirectly: false };
    }
    
    const attacker = attackerPlayer.field[attackerIndex];
    
    if (!attacker.canAttack || attacker.hasAttacked) {
      return { validTargets: [], canAttackDirectly: false };
    }
    
    const validTargets = defenderPlayer.field.filter(card => 
      this.canAttackTarget(attacker, card)
    );
    
    const hasStealth = attacker.templateId === 'rogue' && 
                      attacker.ability === 'Stealth' &&
                      !attacker.hasAttackedBefore;
                      
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
  
  hasBackstabAbility(creature) {
    return creature.templateId === 'assassin' && 
           POSITION_CONFIG.BACK_ROW.includes(creature.position);
  }
  
  attackCreature(attackerPlayerId, attackerIndex, defenderPlayerId, defenderIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
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
    
    if (!attacker.canAttack || attacker.hasAttacked) {
      return {
        success: false,
        reason: 'cannot_attack',
        message: `${attacker.name} cannot attack right now!`
      };
    }
    
    if (!this.canAttackTarget(attacker, defender)) {
      return {
        success: false,
        reason: 'out_of_range',
        message: `${defender.name} is out of range for ${attacker.name}`
      };
    }
    
    if (attackerPlayer.coins >= GAME_CONFIG.ATTACK_COST) {
      attackerPlayer.coins -= GAME_CONFIG.ATTACK_COST;
      this.logger.log(`${attackerPlayer.name} spent ${GAME_CONFIG.ATTACK_COST} coin for attack action`);
    }
    
    attacker.hasAttacked = true;
    attacker.hasAttackedBefore = true;
    
    let attackerBonus = 0;
    let defenderBonus = 0;
    
    if (defender.templateId === 'paladin') {
      defenderBonus = 1000;
      this.logger.log(`${defender.name}'s ability reduces damage by 1000!`);
    }
    
    const hasFirstStrike = attacker.templateId === 'knight' && 
                          attacker.ability === 'First Strike';
    
    if (this.hasBackstabAbility(attacker)) {
      attackerBonus = 2000;
      this.logger.log(`${attacker.name}'s Backstab ability adds 2000 damage when attacking from back row!`);
    }
    
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
    
    if (attacker.cp + attackerBonus > defender.cp + defenderBonus) {
      battleResult.messages.push(`${defender.name} was defeated in battle!`);
      battleResult.defenderDefeated = true;
      
      defenderPlayer.trashPile.push(defender);
      defenderPlayer.field = defenderPlayer.field.filter(card => card.id !== defender.id);
      
      if (!hasFirstStrike && attacker.cp <= defender.cp + defenderBonus) {
        battleResult.messages.push(`${attacker.name} was also defeated in battle!`);
        battleResult.attackerDefeated = true;
        
        attackerPlayer.trashPile.push(attacker);
        attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
      }
    } else {
      battleResult.messages.push(`${attacker.name}'s attack was blocked!`);
      
      if (attacker.cp + attackerBonus < defender.cp + defenderBonus) {
        battleResult.messages.push(`${attacker.name} was defeated in battle!`);
        battleResult.attackerDefeated = true;
        
        attackerPlayer.trashPile.push(attacker);
        attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
      } else {
        battleResult.messages.push("Both creatures survived the battle!");
      }
    }
    
    return battleResult;
  }
  
  attackSecurityDirectly(attackerPlayerId, attackerIndex) {
    const attackerPlayer = this.gameManager.players[attackerPlayerId];
    const defenderPlayerId = attackerPlayerId === 'playerA' ? 'playerB' : 'playerA';
    const defenderPlayer = this.gameManager.players[defenderPlayerId];
    
    if (attackerIndex < 0 || attackerIndex >= attackerPlayer.field.length) {
      return {
        success: false,
        reason: 'invalid_index',
        message: 'Invalid attacker index'
      };
    }
    
    const attacker = attackerPlayer.field[attackerIndex];
    
    if (!attacker.canAttack || attacker.hasAttacked) {
      return {
        success: false,
        reason: 'cannot_attack',
        message: `${attacker.name} cannot attack right now!`
      };
    }
    
    const { canAttackDirectly } = this.getValidTargets(attackerPlayerId, attackerIndex);
    
    if (!canAttackDirectly) {
      return {
        success: false,
        reason: 'creatures_blocking',
        message: `Cannot attack security directly while opponent has creatures on the field.`
      };
    }
    
    if (attackerPlayer.coins >= GAME_CONFIG.ATTACK_COST) {
      attackerPlayer.coins -= GAME_CONFIG.ATTACK_COST;
      this.logger.log(`${attackerPlayer.name} spent ${GAME_CONFIG.ATTACK_COST} coin for attack action`);
    }
    
    attacker.hasAttacked = true;
    attacker.hasAttackedBefore = true;
    
    const result = {
      success: true,
      attacker: {
        name: attacker.name,
        cp: attacker.cp
      },
      messages: []
    };
    
    result.messages.push(`${attackerPlayer.name}'s ${attacker.name} attacks security directly!`);
    
    if (defenderPlayer.security.length > 0) {
      const securityCard = defenderPlayer.security.pop();
      result.securityCard = securityCard;
      result.messages.push(`Security card revealed: ${securityCard.name}!`);
      
      if (securityCard.type === 'creature') {
        result.messages.push(`Security creature ${securityCard.name} (${securityCard.cp} CP) defends!`);
        
        if (attacker.cp > securityCard.cp) {
          result.messages.push(`${securityCard.name} was defeated!`);
          defenderPlayer.trashPile.push(securityCard);
        } else {
          result.messages.push(`${attacker.name} was defeated by security!`);
          result.attackerDefeated = true;
          
          attackerPlayer.trashPile.push(attacker);
          attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
          defenderPlayer.hand.push(securityCard);
        }
      } 
      else if (securityCard.type === 'spell') {
        const effect = securityCard.securityEffect || securityCard.effect;
        result.messages.push(`Security effect: ${effect}`);
        
        if (securityCard.templateId === 'fireball') {
          result.messages.push(`Fireball deals 2000 damage to ${attacker.name}!`);
          
          if (attacker.cp <= 2000) {
            result.messages.push(`${attacker.name} was destroyed!`);
            result.attackerDefeated = true;
            
            attackerPlayer.trashPile.push(attacker);
            attackerPlayer.field = attackerPlayer.field.filter(card => card.id !== attacker.id);
          } else {
            result.messages.push(`${attacker.name} survived with ${attacker.cp - 2000} CP!`);
          }
          
          defenderPlayer.trashPile.push(securityCard);
        } 
        else if (securityCard.templateId === 'healing') {
          result.messages.push(`${securityCard.securityEffect || securityCard.effect}`);
          defenderPlayer.hand.push(securityCard);
        } 
        else {
          defenderPlayer.trashPile.push(securityCard);
        }
      }
      
      if (defenderPlayer.security.length === 0) {
        result.gameOver = true;
        result.winner = attackerPlayerId;
        result.messages.push(`${attackerPlayer.name} wins! ${defenderPlayer.name} has no security left!`);
      }
    } else {
      result.gameOver = true;
      result.winner = attackerPlayerId;
      result.messages.push(`${attackerPlayer.name} wins! ${defenderPlayer.name} has no security left!`);
    }
    
    return result;
  }
  
  executeSpell(casterPlayerId, spellIndex, targetPlayerId, targetCardIndex) {
    const casterPlayer = this.gameManager.players[casterPlayerId];
    const targetPlayer = this.gameManager.players[targetPlayerId];
    
    if (spellIndex < 0 || spellIndex >= casterPlayer.hand.length) {
      return {
        success: false,
        reason: 'invalid_spell_index',
        message: 'Invalid spell index'
      };
    }
    
    const spellCard = casterPlayer.hand[spellIndex];
    
    if (spellCard.type !== 'spell') {
      return {
        success: false,
        reason: 'not_a_spell',
        message: `${spellCard.name} is not a spell card`
      };
    }
    
    if (!targetPlayer || targetCardIndex < 0 || targetCardIndex >= targetPlayer.field.length) {
      return {
        success: false,
        reason: 'invalid_target',
        message: 'Invalid target'
      };
    }
    
    const targetCard = targetPlayer.field[targetCardIndex];
    
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
    
    if (spellCard.templateId === 'fireball') {
      result.messages.push(`${spellCard.name} deals 3000 damage to ${targetCard.name}!`);
      
      if (targetCard.cp <= 3000) {
        result.messages.push(`${targetCard.name} was destroyed!`);
        result.targetDestroyed = true;
        
        targetPlayer.trashPile.push(targetCard);
        targetPlayer.field = targetPlayer.field.filter(card => card.id !== targetCard.id);
      } else {
        result.messages.push(`${targetCard.name} survived with ${targetCard.cp - 3000} CP remaining!`);
      }
    } 
    else if (spellCard.templateId === 'healing') {
      result.messages.push(`${spellCard.name} restores 2000 CP to ${targetCard.name}!`);
    }
    
    casterPlayer.trashPile.push(spellCard);
    casterPlayer.hand.splice(spellIndex, 1);
    
    return result;
  }
  
  evolveCard(playerId, basicCardIndex, targetEvolution) {
    const player = this.gameManager.players[playerId];
    
    if (basicCardIndex < 0 || basicCardIndex >= player.field.length) {
      return {
        success: false,
        reason: 'invalid_card_index',
        message: 'Invalid card index'
      };
    }
    
    const basicCard = player.field[basicCardIndex];
    
    if (!basicCard || basicCard.classType !== 'basic') {
      return {
        success: false,
        reason: 'not_basic_class',
        message: `${basicCard?.name || 'Card'} cannot evolve - not a basic class!`
      };
    }
    
    if (!basicCard.possibleEvolutions || !basicCard.possibleEvolutions.includes(targetEvolution)) {
      return {
        success: false,
        reason: 'invalid_evolution_path',
        message: `${basicCard.name} cannot evolve into ${targetEvolution}`
      };
    }
    
    const advancedCard = this.gameManager.deckManager.createCreatureWithStats(targetEvolution, true);
    
    if (!advancedCard) {
      return {
        success: false,
        reason: 'failed_to_create_card',
        message: `Failed to create evolved card: ${targetEvolution}`
      };
    }
    
    advancedCard.isEvolved = true;
    advancedCard.evolvedFrom = basicCard.templateId;
    advancedCard.classType = 'advanced';
    
    advancedCard.position = basicCard.position;
    
    player.trashPile.push(basicCard);
    player.field[basicCardIndex] = advancedCard;
    
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