import { BLOOM_CONFIG } from "../constants/gameConstants";

// Calculate damage based on bloom level and power-up effects
export const calculateDamage = (bloomLevel, powerUpEffects = {}) => {
  const baseDamage = BLOOM_CONFIG[bloomLevel]?.damage || 5;

  if (powerUpEffects.doubleDamage) {
    return baseDamage * 2;
  }

  return baseDamage;
};

// Check if game should end
export const checkGameEnd = (players) => {
  const player1Dead = players[0]?.hp <= 0;
  const player2Dead = players[1]?.hp <= 0;

  if (player1Dead || player2Dead) {
    return {
      gameEnded: true,
      winner: player1Dead ? players[1]?.name : players[0]?.name,
    };
  }

  return { gameEnded: false, winner: null };
};

// Get phase text for game display
export const getPhaseText = (players, currentPlayer, gamePhase) => {
  const currentName = players?.[currentPlayer]?.name || "Player";
  const opponentIndex = currentPlayer === 0 ? 1 : 0;
  const opponentName = players?.[opponentIndex]?.name || "Opponent";

  if (gamePhase === "cardSelection") {
    return `${currentName} is selecting a challenge card for ${opponentName} to answer`;
  } else if (gamePhase === "answering") {
    return `${opponentName} must answer the question`;
  }
  return "";
};

// Validate card selection
export const validateCardSelection = (
  card,
  playerIndex,
  myPlayerIndex,
  currentTurnUserId,
  myPlayerId,
  gameState,
  waitingForOpponent,
  questionPhase,
  players
) => {
  // Check if it's the player's turn
  if (currentTurnUserId !== myPlayerId) {
    return { valid: false, message: "It's not your turn!" };
  }

  // Check if waiting for opponent
  if (waitingForOpponent) {
    return {
      valid: false,
      message: "Please wait for your opponent to respond!",
    };
  }

  // Check if in question phase
  if (questionPhase) {
    return {
      valid: false,
      message: "Please answer the current question first!",
    };
  }

  // Check if card belongs to current player
  if (playerIndex !== myPlayerIndex) {
    return { valid: false, message: "You can only select your own cards!" };
  }

  // Check if cards are loaded
  const currentPlayerCards = players[myPlayerIndex]?.cards || [];
  if (currentPlayerCards.length === 0) {
    return {
      valid: false,
      message: "Cards are still loading from server. Please wait...",
    };
  }

  // Check if card exists in hand
  const cardExists = currentPlayerCards.some(
    (c) => String(c.id) === String(card.id)
  );
  if (!cardExists) {
    return {
      valid: false,
      message: "This card is no longer available. Please select another card.",
    };
  }

  return { valid: true, message: null };
};

// Apply power-up effects
export const applyPowerUpEffect = (
  powerUpKey,
  powerUps,
  setPowerUps,
  setPowerUpEffects,
  drawCard,
  currentPlayer
) => {
  const powerUp = powerUps[powerUpKey];
  if (!powerUp?.available || powerUp?.used) return;

  // Mark power-up as used
  setPowerUps((prev) => ({
    ...prev,
    [powerUpKey]: { available: false, used: true },
  }));

  // Apply power-up effect based on type
  switch (powerUpKey) {
    case "double_damage":
      setPowerUpEffects((prev) => ({ ...prev, doubleDamage: true }));
      return "Double Damage activated! Next attack deals 2x damage.";

    case "shield":
      setPowerUpEffects((prev) => ({ ...prev, shield: true }));
      return "Shield activated! Next incoming damage blocked.";

    case "hint_reveal":
      setPowerUpEffects((prev) => ({ ...prev, hintReveal: true }));
      return "Hint Reveal activated! One wrong answer eliminated.";

    case "extra_turn":
      setPowerUpEffects((prev) => ({ ...prev, extraTurn: true }));
      return "Extra Turn activated! You get another turn!";

    case "card_draw":
      // Actually draw 2 cards
      drawCard(currentPlayer);
      drawCard(currentPlayer);
      return "Card Draw activated! Drawing 2 extra cards.";

    case "fifty_fifty":
      setPowerUpEffects((prev) => ({ ...prev, fiftyFifty: true }));
      return "50/50 activated! Two wrong options eliminated.";

    default:
      return null;
  }
};

// Process hint effects for question modal
export const processHintEffects = (powerUpEffects, card) => {
  const eliminatedChoices = [];

  if (powerUpEffects.hintReveal && card?.choices) {
    // Eliminate one wrong answer
    const wrongChoices = card.choices.filter(
      (choice) => choice !== card.answer
    );
    if (wrongChoices.length > 0) {
      const randomWrongChoice =
        wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
      eliminatedChoices.push(randomWrongChoice);
    }
  }

  if (powerUpEffects.fiftyFifty && card?.choices) {
    // Eliminate two wrong answers
    const wrongChoices = card.choices.filter(
      (choice) => choice !== card.answer
    );
    if (wrongChoices.length >= 2) {
      const shuffledWrong = wrongChoices.sort(() => Math.random() - 0.5);
      eliminatedChoices.push(...shuffledWrong.slice(0, 2));
    }
  }

  return eliminatedChoices;
};

// Get turn indicator text
export const getTurnIndicatorText = (
  currentTurnUserId,
  myPlayerId,
  waitingForOpponent
) => {
  if (!currentTurnUserId || !myPlayerId) {
    return "Loading...";
  }

  let text = currentTurnUserId === myPlayerId ? "Your Turn" : "Opponent's Turn";

  if (waitingForOpponent) {
    text += " (Waiting for opponent...)";
  }

  return text;
};


