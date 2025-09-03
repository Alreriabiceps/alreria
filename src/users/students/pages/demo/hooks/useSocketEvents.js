import { useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { GAME_STATES, GAME_PHASES } from "../constants/gameStates";
import { TOAST_MESSAGES, ERROR_MESSAGES } from "../constants/uiConstants";
import {
  handleSocketConnection,
  handleSocketError,
  handleOpponentAction,
  handleGameEvent,
  handleQuestionChallenge,
} from "../utils/socketUtils";

// Custom hook for managing socket events
export const useSocketEvents = ({
  socket,
  roomId,
  myPlayerId,
  myPlayerIndex,
  setIsConnected,
  setConnectionStatus,
  setPlayers,
  setGameState,
  setGamePhase,
  setCurrentPlayer,
  setCurrentTurnUserId,
  setSelectedCard,
  setQuestionPhase,
  setWinner,
  setWaitingForOpponent,
  setDeck,
  setActivatedSpells,
  setPowerUps,
  setPowerUpEffects,
  setCoinFlipResult,
  setShowCoinFlip,
  setShowCoinFlipResult,
  setCoinFlipPhase,
}) => {
  const socketRef = useRef(socket);

  // Update socket ref when socket changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Handle socket connection events
  useEffect(() => {
    if (!socket) return;

    handleSocketConnection(socket, roomId, setIsConnected, setConnectionStatus);

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [socket, roomId, setIsConnected, setConnectionStatus]);

  // Handle game state updates from server
  useEffect(() => {
    if (!socket) return;

    const handleGameStateUpdate = (data) => {
      console.log("🔄 Game state update received:", data);

      // Extract gameState from the data object
      const gameState = data.gameState || data;

      if (gameState.players) {
        setPlayers(gameState.players);
      }

      if (gameState.currentPlayer !== undefined) {
        setCurrentPlayer(gameState.currentPlayer);
      }

      if (gameState.currentTurnUserId !== undefined) {
        setCurrentTurnUserId(gameState.currentTurnUserId);
      }

      if (gameState.gamePhase) {
        setGamePhase(gameState.gamePhase);
      }

      if (gameState.gameState !== undefined) {
        setGameState(gameState.gameState);
      }

      if (gameState.deck) {
        setDeck(gameState.deck);
      }

      if (gameState.activatedSpells) {
        setActivatedSpells(gameState.activatedSpells);
      }

      if (gameState.powerUps) {
        setPowerUps(gameState.powerUps);
      }

      if (gameState.powerUpEffects) {
        setPowerUpEffects(gameState.powerUpEffects);
      }
    };

    socket.on("game_state_update", handleGameStateUpdate);

    return () => {
      socket.off("game_state_update", handleGameStateUpdate);
    };
  }, [
    socket,
    setPlayers,
    setCurrentPlayer,
    setCurrentTurnUserId,
    setGamePhase,
    setGameState,
    setDeck,
    setActivatedSpells,
    setPowerUps,
    setPowerUpEffects,
  ]);

  // Handle question challenges
  useEffect(() => {
    if (!socket) return;

    const handleQuestionChallengeEvent = (data) => {
      handleQuestionChallenge(
        data,
        myPlayerId,
        setSelectedCard,
        setQuestionPhase,
        setGamePhase
      );
    };

    socket.on("question_challenge", handleQuestionChallengeEvent);

    return () => {
      socket.off("question_challenge", handleQuestionChallengeEvent);
    };
  }, [socket, myPlayerId, setSelectedCard, setQuestionPhase, setGamePhase]);

  // Handle opponent actions
  useEffect(() => {
    if (!socket) return;

    const handleOpponentActionEvent = (data) => {
      handleOpponentAction(data, myPlayerId, setWaitingForOpponent);
    };

    socket.on("opponent_action", handleOpponentActionEvent);

    return () => {
      socket.off("opponent_action", handleOpponentActionEvent);
    };
  }, [socket, myPlayerId, setWaitingForOpponent]);

  // Handle game events
  useEffect(() => {
    if (!socket) return;

    const handleGameEventEvent = (data) => {
      handleGameEvent(data, setWinner, setGameState);
    };

    socket.on("game_event", handleGameEventEvent);

    return () => {
      socket.off("game_event", handleGameEventEvent);
    };
  }, [socket, setWinner, setGameState]);

  // Handle coin flip events
  useEffect(() => {
    if (!socket) return;

    const handleCoinFlipStart = (data) => {
      console.log("🪙 Coin flip started:", data);
      setShowCoinFlip(true);
      setCoinFlipPhase("flipping");
    };

    const handleCoinFlipResult = (data) => {
      console.log("🪙 Coin flip result:", data);
      setCoinFlipResult(data);
      setShowCoinFlip(false);
      setShowCoinFlipResult(true);
      setCoinFlipPhase("result");

      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setShowCoinFlipResult(false);
        setCoinFlipPhase("complete");
      }, 3000);
    };

    socket.on("coin_flip_start", handleCoinFlipStart);
    socket.on("coin_flip_result", handleCoinFlipResult);

    return () => {
      socket.off("coin_flip_start", handleCoinFlipStart);
      socket.off("coin_flip_result", handleCoinFlipResult);
    };
  }, [
    socket,
    setShowCoinFlip,
    setCoinFlipResult,
    setShowCoinFlipResult,
    setCoinFlipPhase,
  ]);

  // Handle socket errors
  useEffect(() => {
    if (!socket) return;

    const handleError = (error) => {
      handleSocketError(error);
    };

    socket.on("error", handleError);

    return () => {
      socket.off("error", handleError);
    };
  }, [socket]);

  // Get current socket reference
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  return {
    getSocket,
  };
};
