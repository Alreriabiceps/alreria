// Get current user's display name
export const getCurrentUserName = (user) => {
  if (!user) return "Player";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return user.username || "Player";
};

// Fetch opponent user data from backend
export const fetchOpponentData = async (opponentUserId, backendUrl) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await fetch(
      `${backendUrl}/api/modules/student/${opponentUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const userData = await response.json();
      return userData.data; // The response has a data property
    }
  } catch (error) {
    console.error("Error fetching opponent data:", error);
  }
  return null;
};

// Get opponent name from various sources
export const getOpponentName = (player, initialPlayers, myPlayerId) => {
  // If this is the current user, use their real name
  if (String(player.userId) === String(myPlayerId)) {
    return null; // This shouldn't happen, but handle gracefully
  }

  // Try to get opponent name from initialPlayers first
  if (initialPlayers && initialPlayers.length > 0) {
    const opponent = initialPlayers.find(
      (p) => String(p.userId) === String(player.userId)
    );
    if (opponent && opponent.name) {
      return opponent.name;
    }
  }

  // Use server-provided name if it's not generic
  if (player.name && player.name !== "Player") {
    return player.name;
  }

  // Fallback
  return "Opponent";
};

// Update player name in players array
export const updatePlayerName = (players, playerIndex, newName) => {
  return players.map((p, index) =>
    index === playerIndex ? { ...p, name: newName, username: newName } : p
  );
};

// Create initial player structure
export const createInitialPlayer = (user, myPlayerId, isOpponent = false) => {
  const name = isOpponent
    ? "Waiting for opponent..."
    : getCurrentUserName(user);

  return {
    name,
    username: name,
    hp: 100,
    maxHp: 100,
    cards: [], // Empty cards - will be populated by server
    userId: isOpponent ? (myPlayerId ? myPlayerId + 1 : 1) : myPlayerId,
  };
};

// Check if player name needs updating
export const shouldUpdatePlayerName = (player, currentUserName) => {
  return (
    player &&
    (player.name === "Player" ||
      player.name === "Waiting for opponent..." ||
      player.name !== currentUserName)
  );
};

// Get player status text based on game state
export const getPlayerStatusText = (isCurrentTurn, isOpponent, gamePhase) => {
  if (isCurrentTurn && gamePhase === "cardSelection") {
    return "SELECTING CHALLENGE";
  }
  if (isOpponent && gamePhase === "cardSelection") {
    return "AWAITING CHALLENGE";
  }
  if (isCurrentTurn && gamePhase === "answering") {
    return "OPPONENT IS ANSWERING";
  }
  if (isOpponent && gamePhase === "answering") {
    return "ANSWER THE QUESTION!";
  }
  return "WAITING";
};

// Get HP color based on percentage
export const getHpColor = (hpPercentage) => {
  if (hpPercentage > 60) return "var(--hp-high-v5)";
  if (hpPercentage > 30) return "var(--hp-mid-v5)";
  return "var(--hp-low-v5)";
};


