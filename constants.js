export const CARD_TYPES = {
  CREATURE: 'creature',
  SPELL: 'spell',
  APPRENTICE: 'apprentice'
};

export const CLASS_TYPES = {
  BASIC: 'basic',
  ADVANCED: 'advanced'
};

export const EVOLUTION_PATHS = {
  'warrior': ['paladin', 'knight'],
  'mage': ['wizard', 'priest'],
  'rogue': ['assassin', 'archer']
};

export const GAME_PHASES = {
  DRAW: 'draw',
  MOVEMENT: 'movement',
  PLAY: 'play',
  ATTACK: 'attack',
  END: 'end'
};

export const GAME_CONFIG = {
  MAX_CREATURES: 6,
  MAX_FIELD_SLOTS: 9,
  MAX_APPRENTICES: 3,
  STARTING_COINS: 10,
  MOVEMENT_COST: 2,
  ATTACK_COST: 1,
  OPTIONAL_DRAW_COST: 1,
  EVOLUTION_DISCOUNT: 1,
  SECURITY_COUNT: 5,
  INITIAL_HAND_SIZE: 5,
  MIN_DECK_SIZE: 30,
  MAX_DECK_SIZE: 50,
  MAX_APPRENTICE_DECK_SIZE: 5
};

export const CP_WEIGHTS = {
  STR: 100,
  VIT: 80,
  DEX: 100,
  INT: 120,
  EXP: 20
};

export const PLAYERS = {
  PLAYER_A: 'playerA',
  PLAYER_B: 'playerB'
};

export const ASSETS = {
  IMAGES_PATH: '/images/', 
  CARD_BACK: '/images/card_back.png' 
};

export const POSITION_CONFIG = {
  SUMMON_POSITIONS: [0, 1, 2, 3, 4, 5],
  BACK_ROW: [6, 7, 8],
  FRONT_ROW: [0, 1, 2, 3, 4, 5]
};

export const DEFAULT_STATS = {
  warrior: { STR: 25, VIT: 20, DEX: 15, INT: 10, EXP: 30 },
  mage: { STR: 5, VIT: 10, DEX: 15, INT: 25, EXP: 45 },
  rogue: { STR: 10, VIT: 15, DEX: 25, INT: 20, EXP: 30 },
  paladin: { STR: 35, VIT: 30, DEX: 25, INT: 40, EXP: 70 },
  knight: { STR: 40, VIT: 35, DEX: 35, INT: 20, EXP: 70 },
  wizard: { STR: 10, VIT: 25, DEX: 35, INT: 40, EXP: 90 },
  priest: { STR: 15, VIT: 40, DEX: 20, INT: 35, EXP: 90 },
  assassin: { STR: 25, VIT: 30, DEX: 40, INT: 35, EXP: 70 },
  archer: { STR: 20, VIT: 35, DEX: 35, INT: 40, EXP: 70 }
};

export const ATTACK_RANGES = {
  archer: 3,
  wizard: 2,
  mage: 2,
  default: 1
};

export const CARD_DATABASE = [
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