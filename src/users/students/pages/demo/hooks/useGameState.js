import { useState, useEffect, useCallback } from "react";
import {
  GAME_STATES,
  GAME_PHASES,
  CONNECTION_STATUS,
  COIN_FLIP_PHASES,
  INITIAL_POWER_UPS,
  INITIAL_POWER_UP_EFFECTS,
} from "../constants/gameStates";
import { getCurrentUserName, createInitialPlayer } from "../utils/playerUtils";
import { checkGameEnd } from "../utils/gameLogic";
import { transformBackendQuestions } from "../utils/cardUtils";

// Custom hook for managing game state
export const useGameState = ({
  gameId,
  initialCurrentPlayer,
  initialPlayers,
  myPlayerId,
  user,
  loadingQuestions,
  realQuestions,
}) => {
  // Core game state
  const [gameState, setGameState] = useState(
    gameId ? GAME_STATES.PLAYING : GAME_STATES.WAITING
  );
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.CARD_SELECTION);
  const [currentPlayer, setCurrentPlayer] = useState(initialCurrentPlayer || 0);
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [players, setPlayers] = useState(initialPlayers || []);

  // Power-ups and effects
  const [powerUps, setPowerUps] = useState(INITIAL_POWER_UPS);
  const [powerUpEffects, setPowerUpEffects] = useState(
    INITIAL_POWER_UP_EFFECTS
  );

  // Game mechanics
  const [deck, setDeck] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [questionPhase, setQuestionPhase] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDealing, setIsDealing] = useState(false);
  const [confirmCard, setConfirmCard] = useState(null);
  const [activatedSpells, setActivatedSpells] = useState({});

  // Coin flip state
  const [coinFlipResult, setCoinFlipResult] = useState(null);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [showCoinFlipResult, setShowCoinFlipResult] = useState(false);
  const [coinFlipPhase, setCoinFlipPhase] = useState(COIN_FLIP_PHASES.IDLE);

  // PvP state
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.CONNECTING
  );

  // Calculate opponent index
  const opponentIndex = myPlayerIndex === 0 ? 1 : 0;

  // Initialize game state
  const initializeGame = useCallback(() => {
    if (!myPlayerId || !user) return;

    setIsDealing(true);
    console.log("🔄 Waiting for server to initialize game...");

    const currentUserName = getCurrentUserName(user);
    console.log("🔄 Current user name:", currentUserName);

    setPlayers([
      createInitialPlayer(user, myPlayerId, false),
      createInitialPlayer(user, myPlayerId, true),
    ]);
    setDeck([]);
    setGameState(GAME_STATES.WAITING);
    setGamePhase(GAME_PHASES.WAITING);
    setCurrentPlayer(0);
    setSelectedCard(null);
    setWinner(null);
    setQuestionPhase(false);
    setConfirmCard(null);
    setIsDealing(false);
  }, [myPlayerId, user]);

  // Initialize game when dependencies change
  useEffect(() => {
    if (loadingQuestions && realQuestions.length > 0) {
      initializeGame();
    }
  }, [loadingQuestions, realQuestions, initializeGame]);

  // Check for game end
  useEffect(() => {
    const gameEndResult = checkGameEnd(players);
    if (gameEndResult.gameEnded) {
      setWinner(gameEndResult.winner);
      setGameState(GAME_STATES.FINISHED);
    }
  }, [players]);

  // Restart game
  const restart = useCallback(() => {
    if (gameState === GAME_STATES.WAITING) {
      return false; // Don't allow restart while waiting
    }

    setPlayers([]);
    setGameState(GAME_STATES.WAITING);
    setGamePhase(GAME_PHASES.CARD_SELECTION);
    setCurrentPlayer(0);
    setSelectedCard(null);
    setQuestionPhase(false);
    setWinner(null);
    setConfirmCard(null);
    setActivatedSpells({});
    return true;
  }, [gameState]);

  return {
    // Core state
    gameState,
    setGameState,
    gamePhase,
    setGamePhase,
    currentPlayer,
    setCurrentPlayer,
    currentTurnUserId,
    setCurrentTurnUserId,
    players,
    setPlayers,

    // Power-ups
    powerUps,
    setPowerUps,
    powerUpEffects,
    setPowerUpEffects,

    // Game mechanics
    deck,
    setDeck,
    selectedCard,
    setSelectedCard,
    questionPhase,
    setQuestionPhase,
    winner,
    setWinner,
    isDealing,
    setIsDealing,
    confirmCard,
    setConfirmCard,
    activatedSpells,
    setActivatedSpells,

    // Coin flip
    coinFlipResult,
    setCoinFlipResult,
    showCoinFlip,
    setShowCoinFlip,
    showCoinFlipResult,
    setShowCoinFlipResult,
    coinFlipPhase,
    setCoinFlipPhase,

    // PvP
    isConnected,
    setIsConnected,
    myPlayerIndex,
    setMyPlayerIndex,
    waitingForOpponent,
    setWaitingForOpponent,
    connectionStatus,
    setConnectionStatus,
    opponentIndex,

    // Actions
    initializeGame,
    restart,
  };
};
