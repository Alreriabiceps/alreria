import { useCallback } from "react";
import { toast } from "react-toastify";
import { TOAST_MESSAGES } from "../constants/uiConstants";
import { validateCardSelection, applyPowerUpEffect } from "../utils/gameLogic";
import { emitCardSelection, emitAnswer } from "../utils/socketUtils";

// Custom hook for game actions
export const useGameActions = ({
  socket,
  roomId,
  myPlayerId,
  myPlayerIndex,
  gameState,
  waitingForOpponent,
  questionPhase,
  players,
  powerUps,
  setPowerUps,
  setPowerUpEffects,
  setConfirmCard,
  setWaitingForOpponent,
  setAnswerSubmitted,
  setQuestionPhase,
  drawCard,
  currentPlayer,
  selectedCard,
}) => {
  // Handle card selection
  const handleCardClick = useCallback(
    (card, playerIndex) => {
      const validation = validateCardSelection(
        card,
        playerIndex,
        myPlayerIndex,
        null, // currentTurnUserId - will be handled by server
        myPlayerId,
        gameState,
        waitingForOpponent,
        questionPhase,
        players
      );

      if (!validation.valid) {
        toast.info(validation.message, { autoClose: 2000 });
        return;
      }

      console.log("Card clicked:", {
        card,
        playerIndex,
        myPlayerIndex,
        gameState,
      });

      setConfirmCard(card);
    },
    [
      myPlayerIndex,
      myPlayerId,
      gameState,
      waitingForOpponent,
      questionPhase,
      players,
      setConfirmCard,
    ]
  );

  // Confirm challenge
  const confirmChallenge = useCallback(() => {
    if (!socket || !roomId || !myPlayerId) return;

    const success = emitCardSelection(socket, roomId, null, myPlayerId); // card will be set by confirmCard
    if (success) {
      setConfirmCard(null);
      setWaitingForOpponent(true);
      toast.info(TOAST_MESSAGES.CHALLENGE_SENT, {
        autoClose: 2000,
      });
    }
  }, [socket, roomId, myPlayerId, setConfirmCard, setWaitingForOpponent]);

  // Cancel challenge
  const cancelChallenge = useCallback(() => {
    setConfirmCard(null);
  }, [setConfirmCard]);

  // Use power-up
  const handleUsePowerUp = useCallback(
    (powerUpKey) => {
      const message = applyPowerUpEffect(
        powerUpKey,
        powerUps,
        setPowerUps,
        setPowerUpEffects,
        drawCard,
        currentPlayer
      );

      if (message) {
        toast.success(message, {
          position: "top-center",
          autoClose: 2000,
        });
      }
    },
    [powerUps, setPowerUps, setPowerUpEffects, drawCard, currentPlayer]
  );

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer) => {
      if (!selectedCard || !socket || !roomId || !myPlayerId) {
        toast.error(ERROR_MESSAGES.CANNOT_SUBMIT_ANSWER, {
          autoClose: 3000,
        });
        return;
      }

      if (gameState === "waiting") {
        toast.info(TOAST_MESSAGES.GAME_INITIALIZING, {
          autoClose: 2000,
        });
        return;
      }

      const success = emitAnswer(socket, roomId, answer, myPlayerId);
      if (success) {
        setAnswerSubmitted(true);
        setQuestionPhase(false);
        toast.info(TOAST_MESSAGES.ANSWER_SUBMITTED, {
          autoClose: 2000,
        });
      }
    },
    [
      selectedCard,
      socket,
      roomId,
      myPlayerId,
      gameState,
      setAnswerSubmitted,
      setQuestionPhase,
    ]
  );

  // Draw card (disabled in PvP)
  const drawCardAction = useCallback((playerIndex) => {
    console.log("Card drawing disabled - server manages cards");
    return;
  }, []);

  return {
    handleCardClick,
    confirmChallenge,
    cancelChallenge,
    handleUsePowerUp,
    handleAnswer,
    drawCard: drawCardAction,
  };
};
