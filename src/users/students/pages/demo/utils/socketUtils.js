import { toast } from "react-toastify";
import { TOAST_MESSAGES, ERROR_MESSAGES } from "../constants/uiConstants";

// Handle socket connection events
export const handleSocketConnection = (
  socket,
  roomId,
  setIsConnected,
  setConnectionStatus
) => {
  socket.on("connect", () => {
    console.log("Connected to game server");
    setIsConnected(true);
    setConnectionStatus("connected");

    // Join the game room
    socket.emit("join_game_room", { roomId });

    console.log("Current state when connecting:", {
      roomId,
    });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    setIsConnected(false);
    setConnectionStatus("error");
    toast.error(TOAST_MESSAGES.CONNECTION_ERROR, { autoClose: 3000 });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from game server");
    setIsConnected(false);
    setConnectionStatus("disconnected");
    toast.error(TOAST_MESSAGES.CONNECTION_LOST);
  });
};

// Handle socket errors with specific error handling
export const handleSocketError = (error) => {
  console.error("Socket error details:", {
    error,
    message: error?.message,
    type: typeof error,
    keys: Object.keys(error || {}),
    stack: error?.stack,
  });

  // Handle different error formats from server
  let errorMessage = "Unknown socket error";
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object") {
    errorMessage = error.message || error.error?.message || error.toString();
  }

  // Handle specific errors more gracefully
  if (errorMessage.includes("Not your turn")) {
    toast.warning("It's not your turn! Wait for your opponent.", {
      position: "top-center",
      autoClose: 3000,
    });
    console.warn("Turn validation failed - syncing game state...");
  } else if (errorMessage.includes("Card not found")) {
    toast.error(
      "The selected card is no longer valid. Please try selecting another card.",
      {
        position: "top-center",
        autoClose: 4000,
      }
    );
    console.error(
      "Card validation failed - card may have been removed from hand"
    );
  } else if (errorMessage.includes("Game not found")) {
    toast.error(TOAST_MESSAGES.GAME_ERROR, {
      position: "top-center",
      autoClose: 5000,
    });
    console.error("❌ Game not found in database - session expired");
    // Redirect back to lobby after showing the message
    setTimeout(() => {
      window.location.href = "/student/versus-mode-lobby";
    }, 3000);
  } else {
    toast.error(`Game error: ${errorMessage}`, { autoClose: 3000 });
  }
};

// Handle opponent actions
export const handleOpponentAction = (
  data,
  myPlayerId,
  setWaitingForOpponent
) => {
  console.log("Opponent action:", data);
  const { playerId, action } = data;

  // Only process if it's not our own action
  if (playerId !== myPlayerId) {
    switch (action.type) {
      case "select_card":
        toast.info(TOAST_MESSAGES.OPPONENT_SELECTED_CARD, {
          autoClose: 2000,
        });
        setWaitingForOpponent(false);
        break;
      case "answer_question":
        toast.info(TOAST_MESSAGES.OPPONENT_ANSWERED, { autoClose: 2000 });
        break;
      default:
        break;
    }
  }
};

// Handle game events
export const handleGameEvent = (data, setWinner, setGameState) => {
  console.log("Game event:", data);
  const { type, message } = data;

  switch (type) {
    case "player_joined":
      toast.success(`${message}`, { autoClose: 2000 });
      break;
    case "player_left":
      toast.warning(`${message}`, { autoClose: 3000 });
      break;
    case "game_ended":
      setWinner(data.winner);
      setGameState("finished");
      toast.success(`Game ended: ${message}`, { autoClose: 5000 });
      break;
    default:
      break;
  }
};

// Handle question challenges
export const handleQuestionChallenge = (
  data,
  myPlayerId,
  setSelectedCard,
  setQuestionPhase,
  setGamePhase
) => {
  console.log("Received question challenge:", data);
  const { card, challengerId } = data;

  // If we're the one being challenged
  if (challengerId !== myPlayerId) {
    setSelectedCard(card);
    setQuestionPhase(true);
    setGamePhase("answering");
    toast.info(TOAST_MESSAGES.YOU_HAVE_BEEN_CHALLENGED, {
      autoClose: 3000,
    });
  }
};

// Emit card selection to server
export const emitCardSelection = (socket, roomId, card, myPlayerId) => {
  try {
    console.log("Emitting card selection:", {
      cardId: String(card.id),
      cardName: card.name || card.question,
      playerId: myPlayerId,
      roomId,
    });

    socket.emit("select_card", {
      roomId,
      cardId: String(card.id),
      card: card,
      challengerId: myPlayerId,
    });

    return true;
  } catch (error) {
    console.error("Error selecting card:", error);
    toast.error(ERROR_MESSAGES.FAILED_SELECT_CARD, {
      autoClose: 3000,
    });
    return false;
  }
};

// Emit answer to server
export const emitAnswer = (socket, roomId, answer, myPlayerId) => {
  try {
    console.log("Submitting answer:", {
      answer,
      playerId: myPlayerId,
      roomId,
    });

    socket.emit("answer_question", {
      roomId,
      playerId: myPlayerId,
      answer,
    });

    return true;
  } catch (error) {
    console.error("Error submitting answer:", error);
    toast.error(ERROR_MESSAGES.FAILED_SUBMIT_ANSWER, {
      autoClose: 3000,
    });
    return false;
  }
};


