/**
 * constants.js
 * Central location for all game constants and configuration
 */

// Card Types
export const CARD_TYPES = {
  CREATURE: 'creature',
  SPELL: 'spell',
  APPRENTICE: 'apprentice'
};

// Class Types
export const CLASS_TYPES = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
};

// Evolution Paths
export const EVOLUTION_PATHS = {
  'warrior': ['paladin', 'knight'],
  'mage': ['wizard', 'priest'],
  'rogue': ['assassin', 'archer']
};

// Game Phases
export const GAME_PHASES = {
  DRAW: 'draw',
  MOVEMENT: 'movement',
  PLAY: 'play',
  ATTACK: 'attack',
  END: 'end'
};

// Game Constants
export const GAME_CONFIG = {
  MAX_CREATURES: 6,          // Maximum creatures per player
  MAX_FIELD_SLOTS: 9,        // Total slots in the field (3x3 grid)
  MAX_APPRENTICES: 3,        // Maximum apprentice cards in play
  STARTING_COINS: 10,        // Starting coins for each player
  MOVEMENT_COST: 2,          // Cost to move a creature
  ATTACK_COST: 1,            // Cost to attack with a creature
  OPTIONAL_DRAW_COST: 1,     // Cost for optional card draw
  EVOLUTION_DISCOUNT: 1,     // Discount on evolution cost
  SECURITY_COUNT: 5,         // Starting security cards
  INITIAL_HAND_SIZE: 5,      // Initial hand size
  MIN_DECK_SIZE: 30,         // Minimum deck size
  MAX_DECK_SIZE: 50,         // Maximum deck size
  MAX_APPRENTICE_DECK_SIZE: 5 // Maximum apprentice deck size
};

// CP Calculation Weights
export const CP_WEIGHTS = {
  STR: 100,
  VIT: 80,
  DEX: 100,
  INT: 120,
  EXP: 20
};

// Player IDs
export const PLAYERS = {
  PLAYER_A: 'playerA',
  PLAYER_B: 'playerB'
};

// Asset Paths
export const ASSETS = {
  IMAGES_PATH: 'images/',
  CARD_BACK: 'images/card_back.png'
};

// Card Position Settings
export const POSITION_CONFIG = {
  SUMMON_POSITIONS: [0, 1, 2, 3, 4, 5], // Positions where creatures can be summoned
  BACK_ROW: [6, 7, 8],                  // Back row positions
  FRONT_ROW: [0, 1, 2, 3, 4, 5]         // Front row positions
};

// Default Stats by Class
export const DEFAULT_STATS = {
  warrior: { STR: 25, VIT: 20, DEX: 15, INT: 10, EXP: 30 },
  mage: { STR: 5, VIT: 10, DEX: 15, INT: 25, EXP: 45 },
  rogue: { STR: 10, VIT: 15, DEX: 25, INT: 20, EXP: 30 },
  // Advanced classes
  paladin: { STR: 35, VIT: 30, DEX: 25, INT: 40, EXP: 70 },
  knight: { STR: 40, VIT: 35, DEX: 35, INT: 20, EXP: 70 },
  wizard: { STR: 10, VIT: 25, DEX: 35, INT: 40, EXP: 90 },
  priest: { STR: 15, VIT: 40, DEX: 20, INT: 35, EXP: 90 },
  assassin: { STR: 25, VIT: 30, DEX: 40, INT: 35, EXP: 70 },
  archer: { STR: 20, VIT: 35, DEX: 35, INT: 40, EXP: 70 }
};

// Attack Ranges by Class
export const ATTACK_RANGES = {
  archer: 3,     // Archer has long range
  wizard: 2,     // Wizard has medium range
  mage: 2,       // Mage has medium range
  default: 1     // All other creatures have melee range
};

// Card Database Configuration
export const CARD_DATABASE = [
  // Basic Classes
  {
    templateId: 'warrior',
    name: 'Warrior',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.BASIC,
    cost: 3,
    cp: 5000,
    stats: { ...DEFAULT_STATS.warrior },
    image: `${ASSETS.IMAGES_PATH}warrior_grunt.png`,
    possibleEvolutions: EVOLUTION_PATHS.warrior
  },
  {
    templateId: 'mage',
    name: 'Mage',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.BASIC,
    cost: 2,
    cp: 3000,
    stats: { ...DEFAULT_STATS.mage },
    image: `${ASSETS.IMAGES_PATH}mage_apprentice.png`,
    effect: 'Draw 1 card when played',
    possibleEvolutions: EVOLUTION_PATHS.mage
  },
  {
    templateId: 'rogue',
    name: 'Rogue Scout',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.BASIC,
    cost: 2,
    cp: 4000,
    stats: { ...DEFAULT_STATS.rogue },
    image: `${ASSETS.IMAGES_PATH}rogue_scout.png`,
    ability: 'Stealth',
    possibleEvolutions: EVOLUTION_PATHS.rogue
  },
  // Advanced Classes
  {
    templateId: 'paladin',
    name: 'Paladin Guard',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 4,
    cp: 8000,
    stats: { ...DEFAULT_STATS.paladin },
    image: `${ASSETS.IMAGES_PATH}paladin_guard.png`,
    ability: '+1000 CP when blocking',
    evolvedFrom: 'warrior'
  },
  {
    templateId: 'knight',
    name: 'Knight',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 5,
    cp: 8500,
    stats: { ...DEFAULT_STATS.knight },
    image: `${ASSETS.IMAGES_PATH}knight.png`,
    ability: 'First Strike',
    evolvedFrom: 'warrior'
  },
  {
    templateId: 'wizard',
    name: 'Wizard',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 4,
    cp: 7000,
    stats: { ...DEFAULT_STATS.wizard },
    image: `${ASSETS.IMAGES_PATH}wizard.png`,
    ability: 'Spell Mastery: Spells cost 1 less',
    evolvedFrom: 'mage'
  },
  {
    templateId: 'priest',
    name: 'Priest',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 4,
    cp: 6500,
    stats: { ...DEFAULT_STATS.priest },
    image: `${ASSETS.IMAGES_PATH}priest.png`,
    ability: 'Healing: Restore 1000 CP to a creature each turn',
    evolvedFrom: 'mage'
  },
  {
    templateId: 'assassin',
    name: 'Assassin',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 4,
    cp: 7500,
    stats: { ...DEFAULT_STATS.assassin },
    image: `${ASSETS.IMAGES_PATH}assassin.png`,
    ability: 'Backstab: Deal +2000 damage when attacking from position 6-8',
    evolvedFrom: 'rogue'
  },
  {
    templateId: 'archer',
    name: 'Archer',
    type: CARD_TYPES.CREATURE,
    classType: CLASS_TYPES.ADVANCED,
    cost: 4,
    cp: 7000,
    stats: { ...DEFAULT_STATS.archer },
    image: `${ASSETS.IMAGES_PATH}archer.png`,
    ability: 'Long Range: Attack range increased to 3',
    evolvedFrom: 'rogue'
  },
  // Spell cards
  {
    templateId: 'fireball',
    name: 'Fireball',
    type: CARD_TYPES.SPELL,
    cost: 3,
    stats: { STR: 0, VIT: 0, DEX: 0, INT: 5, EXP: 0 },
    image: `${ASSETS.IMAGES_PATH}card_back.png`,
    effect: 'Deal 3000 damage to target creature',
    securityEffect: 'Deal 2000 damage to the attacking creature'
  },
  {
    templateId: 'healing',
    name: 'Healing Wave',
    type: CARD_TYPES.SPELL,
    cost: 2,
    stats: { STR: 0, VIT: 5, DEX: 0, INT: 3, EXP: 0 },
    image: `${ASSETS.IMAGES_PATH}card_back.png`,
    effect: 'Restore 2000 CP to target creature',
    securityEffect: 'Add this card to your hand'
  }
];

// Apprentice Card Database
export const APPRENTICE_DATABASE = [
  {
    templateId: 'anastasia',
    name: 'Apprentice Anastasia',
    type: CARD_TYPES.APPRENTICE,
    cost: 1,
    stats: { STR: 1, VIT: 1, DEX: 1, INT: 3, EXP: 10 },
    image: `${ASSETS.IMAGES_PATH}apprentice_anastasia.png`,
    passive: { stat: 'INT', value: 30 },
    effect: 'Grants +30 INT to evolved form'
  },
  {
    templateId: 'brendan',
    name: 'Apprentice Brendan',
    type: CARD_TYPES.APPRENTICE,
    cost: 1,
    stats: { STR: 2, VIT: 1, DEX: 3, INT: 4, EXP: 10 },
    image: `${ASSETS.IMAGES_PATH}apprentice_brendan.png`,
    passive: { stat: 'DEX', value: 25 },
    effect: 'Grants +25 DEX to evolved form'
  }
];