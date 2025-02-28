/**
 * app.js
 * Main application entry point
 */
import { PLAYERS } from './constants.js';
import { GameManager } from './managers/GameManager.js';
import { PlayerManager } from './managers/PlayerManager.js';
import { DeckManager } from './managers/DeckManager.js';
import { UIManager } from './ui/UIManager.js';
import { AIManager } from './ai/AIManager.js';

// Application class to tie everything together
class TCGGame {
  constructor() {
    // Initialize managers
    this.gameManager = new GameManager();
    this.deckManager = new DeckManager();
    this.uiManager = new UIManager(this.gameManager);
    
    // Create players
    this.playerA = new PlayerManager(PLAYERS.PLAYER_A, 'Player A', false);
    this.playerB = new PlayerManager(PLAYERS.PLAYER_B, 'Player B (AI)', true);
    
    // Initialize AI
    this.aiManager = new AIManager(this.gameManager);
    
    // Set up the game
    this.initialize();
  }
  
  /**
   * Initialize the game
   */
  initialize() {
    console.log('Initializing TCG Game...');
    
    // Initialize deck manager
    this.deckManager.initialize();
    
    // Make deck manager available to the game manager
    this.gameManager.deckManager = this.deckManager;
    
    // Initialize UI
    if (!this.uiManager.initializeDomElements()) {
      console.error('Failed to initialize UI. DOM elements missing.');
      return;
    }
    
    // Add custom styles
    this.uiManager.addStyles();
    
    // Set event listeners for UI elements
    this.setupEventListeners();
    
    // Initialize players with decks
    this.playerA.initialize(this.deckManager);
    this.playerB.initialize(this.deckManager);
    
    // Start the game
    this.gameManager.initGame(this.playerA, this.playerB);
    
    console.log('Game initialized successfully!');
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add event listeners for any global UI elements
    document.addEventListener('keydown', (e) => {
      // Add keyboard shortcuts
      if (e.key === 'n' && e.ctrlKey) {
        // Ctrl+N: New Game
        this.restartGame();
      }
    });
    
    // Add event listener for new game button if it exists
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.restartGame());
    }
  }
  
  /**
   * Restart the game
   */
  restartGame() {
    // Reset players
    this.playerA.initialize(this.deckManager);
    this.playerB.initialize(this.deckManager);
    
    // Start a new game
    this.gameManager.initGame(this.playerA, this.playerB);
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the game
  window.tcgGame = new TCGGame();
});