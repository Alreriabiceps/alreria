// Game States
export const GAME_STATES = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
};

// Game Phases
export const GAME_PHASES = {
  CARD_SELECTION: "cardSelection",
  ANSWERING: "answering",
  WAITING: "waiting",
};

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

// Coin Flip Phases
export const COIN_FLIP_PHASES = {
  IDLE: "idle",
  FLIPPING: "flipping",
  RESULT: "result",
  COMPLETE: "complete",
};

// Default Game Values
export const DEFAULT_GAME_VALUES = {
  PLAYER_HP: 100,
  MAX_PLAYER_HP: 100,
  QUESTION_TIMER: 30,
  CARDS_PER_PLAYER: 5,
  SPELL_CARD_CHANCE: 0.5, // 50% chance for testing
};

// Power-up Effects
export const POWER_UP_EFFECTS = {
  DOUBLE_DAMAGE: "doubleDamage",
  SHIELD: "shield",
  HINT_REVEAL: "hintReveal",
  EXTRA_TURN: "extraTurn",
  FIFTY_FIFTY: "fiftyFifty",
};

// Initial Power-ups State
export const INITIAL_POWER_UPS = {
  double_damage: { available: false, used: false },
  shield: { available: false, used: false },
  hint_reveal: { available: false, used: false },
  extra_turn: { available: false, used: false },
  card_draw: { available: false, used: false },
  fifty_fifty: { available: false, used: false },
};

// Initial Power-up Effects State
export const INITIAL_POWER_UP_EFFECTS = {
  doubleDamage: false,
  shield: false,
  hintReveal: false,
  extraTurn: false,
  fiftyFifty: false,
};


