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
    console.log('Initializing TCG Game...');
    
    this.deckManager.initialize();
    
    this.gameManager.deckManager = this.deckManager;
    
    if (!this.uiManager.initializeDomElements()) {
      console.error('Failed to initialize UI. DOM elements missing.');
      return;
    }
    
    this.uiManager.addStyles();
    
    this.setupEventListeners();
    
    this.playerA.initialize(this.deckManager);
    this.playerB.initialize(this.deckManager);
    
    this.gameManager.initGame(this.playerA, this.playerB);
    
    console.log('Game initialized successfully!');
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