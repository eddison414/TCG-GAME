/**
 * managers/GameManager.js
 * Central manager for game state and flow
 */
import { GAME_PHASES, PLAYERS, GAME_CONFIG } from '../constants.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { Logger } from '../utils/Logger.js';

export class GameManager {
  constructor() {
    this.events = new EventEmitter();
    this.logger = new Logger();
    
    this.state = {
      currentPhase: GAME_PHASES.DRAW,
      currentPlayer: PLAYERS.PLAYER_A,
      turn: 1,
      gameOver: false,
      winner: null,
      evolution: {
        isEvolutionMode: false,
        sourceCard: null,
        targetZone: null
      }
    };
    
    this.players = {}; // Will be populated with PlayerManager instances
  }
  
  /**
   * Initialize a new game
   * @param {PlayerManager} playerA - Player A manager
   * @param {PlayerManager} playerB - Player B manager
   */
  initGame(playerA, playerB) {
    this.players[PLAYERS.PLAYER_A] = playerA;
    this.players[PLAYERS.PLAYER_B] = playerB;
    
    // Reset game state
    this.state.currentPhase = GAME_PHASES.DRAW;
    this.state.currentPlayer = PLAYERS.PLAYER_A;
    this.state.turn = 1;
    this.state.gameOver = false;
    this.state.winner = null;
    this.state.evolution.isEvolutionMode = false;
    this.state.evolution.sourceCard = null;
    this.state.evolution.targetZone = null;
    
    // Initialize both players
    Object.values(this.players).forEach(player => {
      player.initialize();
      
      // Draw initial hand
      for (let i = 0; i < GAME_CONFIG.INITIAL_HAND_SIZE; i++) {
        this.drawCard(player.id);
      }
      
      // Set up security stack
      for (let i = 0; i < GAME_CONFIG.SECURITY_COUNT; i++) {
        if (player.deck.length > 0) {
          const securityCard = player.deck.shift();
          player.security.push(securityCard);
        }
      }
    });
    
    this.logger.log('Game initialized', { turn: this.state.turn });
    this.events.emit('gameInitialized');
    this.events.emit('stateChanged');
  }
  
  /**
   * Draw a card for the specified player
   * @param {string} playerId - The player drawing a card
   * @param {boolean} isApprentice - Whether to draw from apprentice deck
   * @param {boolean} isOptional - Whether this is an optional draw (costs coins)
   * @returns {boolean} Success of the draw operation
   */
  drawCard(playerId, isApprentice = false, isOptional = false) {
    const player = this.players[playerId];
    
    // Check if this is an optional draw that costs coins
    if (isOptional) {
      if (player.coins < GAME_CONFIG.OPTIONAL_DRAW_COST) {
        this.logger.log(`${player.name} doesn't have enough coins for optional draw`, 
                        { turn: this.state.turn });
        return false;
      }
      
      player.coins -= GAME_CONFIG.OPTIONAL_DRAW_COST;
      this.logger.log(`${player.name} spent ${GAME_CONFIG.OPTIONAL_DRAW_COST} coin(s) to draw a card`, 
                      { turn: this.state.turn });
    }
    
    // Determine source and destination
    const deckSource = isApprentice ? 'apprenticeDeck' : 'deck';
    
    // Check if deck is empty
    if (player[deckSource].length === 0) {
      this.logger.log(`${player.name} has no ${isApprentice ? 'apprentice ' : ''}cards left to draw!`, 
                      { turn: this.state.turn });
      
      // Handle deck out loss condition for main deck only
      if (!isApprentice) {
        const opponentId = playerId === PLAYERS.PLAYER_A ? PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
        this.endGame(opponentId, 'deck out');
      }
      
      return false;
    }
    
    // Draw the card
    const drawnCard = player[deckSource].shift();
    
    if (isApprentice) {
      // For apprentice cards, handle special summoning rules
      if (player.hasPlayedApprentice && this.state.currentPhase === GAME_PHASES.PLAY) {
        this.logger.log(`${player.name} can't summon more than one apprentice per turn!`, 
                        { turn: this.state.turn });
        player[deckSource].push(drawnCard); // Put the card back
        return false;
      }
      
      // Check if apprentice zone has room
      if (player.apprenticeZone.length < GAME_CONFIG.MAX_APPRENTICES) {
        player.apprenticeZone.push(drawnCard);
        player.hasPlayedApprentice = true;
        this.logger.log(`${player.name} summons ${drawnCard.name} to the apprentice zone`, 
                        { turn: this.state.turn });
      } else {
        // If apprentice zone is full, card goes back to the bottom of the deck
        player[deckSource].push(drawnCard);
        this.logger.log(`${player.name} can't summon ${drawnCard.name} - apprentice zone is full`, 
                        { turn: this.state.turn });
        return false;
      }
    } else {
      // Regular cards go to hand
      player.hand.push(drawnCard);
      this.logger.log(`${player.name} draws a card (${drawnCard.name})`, 
                      { turn: this.state.turn });
    }
    
    this.events.emit('cardDrawn', { playerId, card: drawnCard, isApprentice });
    this.events.emit('stateChanged');
    return true;
  }
  
  /**
   * Advance to the next game phase
   */
  advancePhase() {
    const currentPhases = Object.values(GAME_PHASES);
    const currentPhaseIndex = currentPhases.indexOf(this.state.currentPhase);
    
    // Move to next phase
    if (currentPhaseIndex < currentPhases.length - 1) {
      this.state.currentPhase = currentPhases[currentPhaseIndex + 1];
      this.logger.log(`Phase changed to ${this.state.currentPhase}`, 
                      { turn: this.state.turn });
    } else {
      // End of turn, switch players and reset
      const nextPlayer = this.state.currentPlayer === PLAYERS.PLAYER_A ? 
                        PLAYERS.PLAYER_B : PLAYERS.PLAYER_A;
      this.state.currentPlayer = nextPlayer;
      this.state.turn++;
      
      // Reset turn-specific flags for both players
      Object.values(this.players).forEach(player => {
        player.hasPlayedApprentice = false;
        player.hasMoved = [];
        
        // Reset creature attack states
        player.field.forEach(card => {
          if (card.resetForNewTurn) {
            card.resetForNewTurn();
          }
        });
      });
      
      // Start next turn with draw phase
      this.state.currentPhase = GAME_PHASES.DRAW;
      
      // Give coins to current player
      this.players[this.state.currentPlayer].coins += 1;
      
      this.logger.log(`Turn ${this.state.turn} begins - ${this.players[this.state.currentPlayer].name}'s turn`, 
                      { turn: this.state.turn });
    }
    
    this.events.emit('phaseChanged', { 
      phase: this.state.currentPhase,
      player: this.state.currentPlayer
    });
    this.events.emit('stateChanged');
  }
  
  /**
   * Enter evolution mode for an apprentice card
   * @param {string} playerId - The player initiating evolution
   * @param {number} apprenticeIndex - Index of the apprentice in the apprentice zone
   * @returns {boolean} Success of entering evolution mode
   */
  startEvolution(playerId, apprenticeIndex) {
    const player = this.players[playerId];
    const apprentice = player.apprenticeZone[apprenticeIndex];
    
    // Can only evolve during play phase
    if (this.state.currentPhase !== GAME_PHASES.PLAY) {
      this.logger.log("Can only evolve during play phase", { turn: this.state.turn });
      return false;
    }
    
    // Can only evolve your own apprentices
    if (playerId !== this.state.currentPlayer) {
      this.logger.log("Can only evolve your own apprentices", { turn: this.state.turn });
      return false;
    }
    
    // Enter evolution mode
    this.state.evolution.isEvolutionMode = true;
    this.state.evolution.sourceCard = apprentice;
    this.state.evolution.targetZone = playerId;
    
    this.logger.log(`${player.name} prepares to evolve ${apprentice.name}. Select a class card from your hand.`, 
                    { turn: this.state.turn });
                    
    this.events.emit('evolutionStarted', {
      playerId,
      apprentice
    });
    this.events.emit('stateChanged');
    
    return true;
  }
  
  /**
   * Cancel the current evolution process
   */
  cancelEvolution() {
    this.state.evolution.isEvolutionMode = false;
    this.state.evolution.sourceCard = null;
    this.state.evolution.targetZone = null;
    
    this.logger.log("Evolution cancelled", { turn: this.state.turn });
    
    this.events.emit('evolutionCancelled');
    this.events.emit('stateChanged');
  }
  
  /**
   * End the game with a winner
   * @param {string} winnerId - ID of the winning player
   * @param {string} reason - Reason for game end
   */
  endGame(winnerId, reason) {
    this.state.gameOver = true;
    this.state.winner = winnerId;
    
    const winnerName = this.players[winnerId].name;
    this.logger.log(`${winnerName} wins by ${reason}!`, { turn: this.state.turn });
    
    this.events.emit('gameOver', {
      winner: winnerId,
      winnerName,
      reason
    });
    this.events.emit('stateChanged');
  }
  
  /**
   * Get the current game state
   * @returns {object} Current game state
   */
  getState() {
    return {
      ...this.state,
      players: {
        [PLAYERS.PLAYER_A]: this.players[PLAYERS.PLAYER_A].getState(),
        [PLAYERS.PLAYER_B]: this.players[PLAYERS.PLAYER_B].getState()
      },
      gameLog: this.logger.getLog()
    };
  }
}