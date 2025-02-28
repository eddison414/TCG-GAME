import { 
  CARD_DATABASE, 
  APPRENTICE_DATABASE, 
  GAME_CONFIG, 
  CLASS_TYPES
} from '../constants.js';
import { Card } from '../models/Card.js';
import { CreatureCard } from '../models/CreatureCard.js';
import { SpellCard } from '../models/SpellCard.js';
import { ApprenticeCard } from '../models/ApprenticeCard.js';
import { StatCalculator } from '../utils/StatCalculator.js';

export class DeckManager {
  constructor() {
    this.statCalculator = new StatCalculator();
    this.playerDecks = {};
    this.playerApprenticeDecks = {};
  }
  
  initialize() {
    this.generateDefaultDecks();
  }
  
  createCard(templateId, isApprentice = false) {
    const database = isApprentice ? APPRENTICE_DATABASE : CARD_DATABASE;
    const template = database.find(card => card.templateId === templateId);
    
    if (!template) {
      console.error(`Template with ID ${templateId} not found in ${isApprentice ? 'apprentice' : 'main'} database!`);
      return null;
    }
    
    let card;
    
    switch (template.type) {
      case 'creature':
        card = new CreatureCard(template);
        break;
      case 'spell':
        card = new SpellCard(template);
        break;
      case 'apprentice':
        card = new ApprenticeCard(template);
        break;
      default:
        card = new Card(template);
    }
    
    return card;
  }
  
  setCustomDeck(playerId, mainDeck = [], apprenticeDeck = []) {
    if (mainDeck.length < GAME_CONFIG.MIN_DECK_SIZE || 
        mainDeck.length > GAME_CONFIG.MAX_DECK_SIZE) {
      console.error(`Invalid main deck size: ${mainDeck.length}. Must be between ${GAME_CONFIG.MIN_DECK_SIZE} and ${GAME_CONFIG.MAX_DECK_SIZE}`);
      return false;
    }
    
    if (apprenticeDeck.length > GAME_CONFIG.MAX_APPRENTICE_DECK_SIZE) {
      console.error(`Invalid apprentice deck size: ${apprenticeDeck.length}. Maximum is ${GAME_CONFIG.MAX_APPRENTICE_DECK_SIZE}`);
      return false;
    }
    
    this.playerDecks[playerId] = mainDeck;
    this.playerApprenticeDecks[playerId] = apprenticeDeck;
    
    return true;
  }
  
  generateDefaultDecks() {
    const defaultDeck = [];
    
    CARD_DATABASE.forEach(template => {
      if (template.classType === CLASS_TYPES.ADVANCED) return;
      
      for (let i = 0; i < 6; i++) {
        defaultDeck.push(template.templateId);
      }
    });
    
    const defaultApprenticeDeck = [];
    
    APPRENTICE_DATABASE.forEach(template => {
      for (let i = 0; i < 3; i++) {
        defaultApprenticeDeck.push(template.templateId);
      }
    });
    
    this.playerDecks['playerA'] = defaultDeck;
    this.playerDecks['playerB'] = defaultDeck.slice();
    this.playerApprenticeDecks['playerA'] = defaultApprenticeDeck;
    this.playerApprenticeDecks['playerB'] = defaultApprenticeDeck.slice();
  }
  
  buildMainDeck(playerId) {
    const deckTemplates = this.playerDecks[playerId] || [];
    const deck = [];
    
    if (deckTemplates.length >= GAME_CONFIG.MIN_DECK_SIZE) {
      deckTemplates.forEach(templateId => {
        const card = this.createCard(templateId);
        if (card) {
          if (card instanceof CreatureCard) {
            this.statCalculator.distributeStats(card);
          }
          deck.push(card);
        }
      });
    } else {
      console.warn(`No valid deck found for player ${playerId}. Using default deck.`);
      
      const defaultDeck = [];
      
      CARD_DATABASE.forEach(template => {
        if (template.classType === CLASS_TYPES.ADVANCED) return;
        
        for (let i = 0; i < 6; i++) {
          const card = this.createCard(template.templateId);
          if (card) {
            if (card instanceof CreatureCard) {
              this.statCalculator.distributeStats(card);
            }
            defaultDeck.push(card);
          }
        }
      });
      
      return this.shuffle(defaultDeck);
    }
    
    return this.shuffle(deck);
  }
  
  buildApprenticeDeck(playerId) {
    const deckTemplates = this.playerApprenticeDecks[playerId] || [];
    const deck = [];
    
    if (deckTemplates.length > 0) {
      deckTemplates.forEach(templateId => {
        const card = this.createCard(templateId, true);
        if (card) {
          deck.push(card);
        }
      });
    } else {
      console.warn(`No valid apprentice deck found for player ${playerId}. Using default.`);
      
      APPRENTICE_DATABASE.forEach(template => {
        for (let i = 0; i < 3; i++) {
          const card = this.createCard(template.templateId, true);
          if (card) {
            deck.push(card);
          }
        }
      });
    }
    
    return this.shuffle(deck);
  }
  
  createCreatureWithStats(className, isAdvanced = false) {
    const card = this.createCard(className);
    
    if (card && card instanceof CreatureCard) {
      this.statCalculator.distributeStats(card, isAdvanced);
      return card;
    }
    
    return null;
  }
  
  shuffle(array) {
    const newArray = [...array];
    
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    return newArray;
  }
}