// UI Colors and Styling
export const UI_COLORS = {
  HP_HIGH: "var(--hp-high-v5)",
  HP_MID: "var(--hp-mid-v5)",
  HP_LOW: "var(--hp-low-v5)",
  LEGENDARY_GOLD: "var(--legendary-gold)",
  FIELD_BORDER: "var(--field-border)",
};

// Animation Delays
export const ANIMATION_DELAYS = {
  CARD_DEALING: 0.1, // seconds between card dealing animations
  COIN_FLIP_DURATION: 3000, // milliseconds
  COIN_RESULT_DURATION: 3000, // milliseconds
};

// Toast Messages
export const TOAST_MESSAGES = {
  GAME_INITIALIZING: "Game is still initializing. Please wait...",
  NOT_YOUR_TURN: "It's not your turn!",
  WAIT_FOR_OPPONENT: "Please wait for your opponent to respond!",
  ANSWER_CURRENT_QUESTION: "Please answer the current question first!",
  CARDS_LOADING: "Cards are still loading from server. Please wait...",
  CARD_NOT_AVAILABLE:
    "This card is no longer available. Please select another card.",
  CAN_ONLY_SELECT_OWN: "You can only select your own cards!",
  CHALLENGE_SENT: "Challenge sent! Waiting for server response...",
  ANSWER_SUBMITTED: "Answer submitted! Waiting for result...",
  CONNECTION_LOST: "Connection lost! Attempting to reconnect...",
  CONNECTION_ERROR: "Failed to connect to game server!",
  GAME_ERROR: "Game session expired. Please create a new game.",
  OPPONENT_SELECTED_CARD: "Opponent selected a challenge card!",
  OPPONENT_ANSWERED: "Opponent answered the question!",
  CHALLENGE_CONFIRMED: "Challenge confirmed:",
  YOU_HAVE_BEEN_CHALLENGED: "You have been challenged! Answer the question!",
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_AUTH_TOKEN: "No authentication token found, using sample questions",
  FAILED_FETCH_QUESTIONS: "Failed to fetch questions",
  FALLBACK_QUESTIONS: "Falling back to sample questions",
  NO_CARDS_AVAILABLE: "No cards available from server yet",
  GAME_WAITING: "Game is still waiting for server initialization",
  CARD_NO_LONGER_EXISTS:
    "This card is no longer in your hand. Please select another card.",
  CANNOT_SUBMIT_ANSWER: "Cannot submit answer: missing required data",
  FAILED_SELECT_CARD: "Failed to select card. Please try again.",
  FAILED_SUBMIT_ANSWER: "Failed to submit answer. Please try again.",
  ERROR_PROCESSING_COIN_FLIP: "Error processing coin flip result!",
  CRITICAL_ERROR: "CRITICAL ERROR IN DEMO COMPONENT RENDER:",
};

// Status Messages
export const STATUS_MESSAGES = {
  SELECTING_CHALLENGE: "SELECTING CHALLENGE",
  AWAITING_CHALLENGE: "AWAITING CHALLENGE",
  OPPONENT_IS_ANSWER: "OPPONENT IS ANSWERING",
  ANSWER_THE_QUESTION: "ANSWER THE QUESTION!",
  WAITING: "WAITING",
  YOUR_TURN: "Your Turn",
  OPPONENT_TURN: "Opponent's Turn",
  LOADING: "Loading...",
  WAITING_FOR_OPPONENT: "Waiting for opponent...",
  PVP_MATCH: "PvP Match - Room:",
};

// Loading States
export const LOADING_STATES = {
  LOADING_QUESTIONS: "Loading questions from database...",
  LOADING_CARDS: "Loading cards from server...",
  WAITING_SERVER: "Waiting for server to initialize game...",
  GAME_IN_PROGRESS: "Game in progress",
};

// Button Text
export const BUTTON_TEXT = {
  START_DUEL: "Start Duel",
  LOADING_QUESTIONS: "Loading Questions...",
  NO_QUESTIONS: "No Questions Available",
  WAITING_SERVER: "Waiting for Server...",
  RESTART: "Restart",
  WAITING: "Waiting...",
  SUBMIT_ANSWER: "Submit Answer",
  ACKNOWLEDGE_SPELL: "Acknowledge Spell",
  YES_CHALLENGE: "Yes, Challenge!",
  CANCEL: "Cancel",
  NEW_DUEL: "New Duel",
  EXIT: "Exit",
  TEST_OPPONENT_DATA: "🧪 Test Opponent Data",
};

// Game Info Text
export const GAME_INFO = {
  TITLE: "🎮 Quiz Card Duel - PvP Bloom's Taxonomy Battle",
  QUICK_RULES: {
    START: "⚡ Start: 100 HP, 5 cards each",
    GOAL: "🎯 Goal: Reduce opponent to 0 HP",
    DAMAGE: "💥 Damage: Wrong answer = they take damage",
  },
  FEATURES: {
    SPELL_CARDS: "✨ Spell Cards: Purple cards with special effects",
    POWER_UPS: "⚡ Power-Ups: 10% chance random bonuses",
    BLOOMS: "📊 Bloom's: Higher levels = more damage",
  },
  READY_TO_DUEL: "Ready to Duel?",
  DUEL_DESCRIPTION:
    "Each duelist starts with 100 LP and 5 cards. Select a card to challenge your opponent! If they answer correctly, you take damage. If they're wrong, they take damage!",
  CARD_TYPES_DAMAGE: "Card Types & Damage:",
};


