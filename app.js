import { PLAYERS } from './constants.js';
import { GameManager } from './managers/GameManager.js';
import { PlayerManager } from './managers/PlayerManager.js';
import { DeckManager } from './managers/DeckManager.js';
import { UIManager } from './ui/UIManager.js';
import { AIManager } from './ai/AIManager.js';

class TCGGame {
  constructor() {
    this.gameManager = new GameManager();
    this.deckManager = new DeckManager();
    this.uiManager = new UIManager(this.gameManager);
    
    this.playerA = new PlayerManager(PLAYERS.PLAYER_A, 'Player A', false);
    this.playerB = new PlayerManager(PLAYERS.PLAYER_B, 'Player B (AI)', true);
    
    this.aiManager = new AIManager(this.gameManager);
    
    this.initialize();
  }
  
  initialize() {
    try {
      console.log('Initializing TCG Game...');
      
      this.deckManager.initialize();
      this.gameManager.deckManager = this.deckManager;
      
      if (!this.uiManager.initializeDomElements()) {
        console.error('Failed to initialize UI. DOM elements missing.');
        document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Failed to initialize UI. DOM elements missing.</div>';
        return;
      }
      
      // Rest of initialization...
      
      console.log('Game initialized successfully!');
    } catch (error) {
      console.error('Critical initialization error:', error);
      document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: ' + error.message + '</div>';
    }
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'n' && e.ctrlKey) {
        this.restartGame();
      }
    });
    
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.restartGame());
    }
  }
  
  restartGame() {
    this.playerA.initialize(this.deckManager);
    this.playerB.initialize(this.deckManager);
    
    this.gameManager.initGame(this.playerA, this.playerB);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tcgGame = new TCGGame();
});