import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../contexts/AuthContext";
import GameCard from "./GameCard";
import PlayerInfo from "./PlayerInfo";
import PowerUpsPanel from "./PowerUpsPanel";
import QuestionModal from "./QuestionModal";
import VictoryModal from "./VictoryModal";
import ConnectionStatus from "./ConnectionStatus";
import "./RealTimeGame.css";

const RealTimeGame = ({ gameId, players, currentPlayer, roomId }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Game state
  const [gameState, setGameState] = useState(null);
  const [localPlayer, setLocalPlayer] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winner, setWinner] = useState(null);

  // Refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !gameId) return;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    if (!backendUrl) {
      toast.error("Backend URL is not configured");
      return;
    }

    // Create socket connection
    const newSocket = io(backendUrl, {
      auth: { token },
      query: { gameId, playerId: currentPlayer },
      transports: ["websocket", "polling"],
      withCredentials: true,
      timeout: 45000,
      forceNew: true,
    });

    // Socket event handlers
    newSocket.on("connect", () => {
      console.log("Connected to game server");
      setIsConnected(true);
      toast.success("Connected to game server");

      // Join game room
      newSocket.emit("join_game_room", { roomId });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from game server");
      setIsConnected(false);
      toast.warning("Disconnected from game server");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      toast.error("Failed to connect to game server");
    });

    newSocket.on("game_state_update", (data) => {
      console.log("Game state updated:", data);
      setGameState(data.gameState);
      updateLocalState(data.gameState);
    });

    newSocket.on("opponent_action", (data) => {
      console.log("Opponent action:", data);
      handleOpponentAction(data);
    });

    newSocket.on("game_end", (data) => {
      console.log("Game ended:", data);
      setWinner(data.winner);
      setShowVictoryModal(true);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message || "Game error occurred");
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, gameId, currentPlayer, roomId]);

  // Update local state when game state changes
  const updateLocalState = useCallback(
    (newGameState) => {
      if (!newGameState) return;

      // Find local player and opponent
      const localPlayerData = newGameState.players.find(
        (p) => p.userId === currentPlayer
      );
      const opponentData = newGameState.players.find(
        (p) => p.userId !== currentPlayer
      );

      setLocalPlayer(localPlayerData);
      setOpponent(opponentData);
    },
    [currentPlayer]
  );

  // Handle opponent actions
  const handleOpponentAction = useCallback((data) => {
    const { action } = data;

    switch (action.type) {
      case "select_card":
        toast.info("Opponent selected a card");
        break;
      case "answer_question":
        toast.info("Opponent answered the question");
        break;
      case "use_powerup":
        toast.info(`Opponent used ${action.powerUpType} power-up`);
        break;
      case "activate_spell":
        toast.info(`Opponent activated ${action.spellCard.name} spell`);
        break;
      default:
        console.log("Unknown opponent action:", action);
    }
  }, []);

  // Handle card selection
  const handleCardSelect = useCallback(
    (card) => {
      if (!socket || !isConnected) {
        toast.error("Not connected to game server");
        return;
      }

      if (gameState?.currentTurn !== currentPlayer) {
        toast.error("Not your turn");
        return;
      }

      if (gameState?.gamePhase !== "cardSelection") {
        toast.error("Cannot select card at this time");
        return;
      }

      // Handle spell cards
      if (card.type === "spell") {
        handleSpellActivation(card);
        return;
      }

      // Handle question cards
      setSelectedCard(card);
      setShowQuestionModal(true);

      // Emit card selection to server
      socket.emit("select_card", { roomId, cardId: card.id });
    },
    [socket, isConnected, gameState, currentPlayer, roomId]
  );

  // Handle spell activation
  const handleSpellActivation = useCallback(
    (spellCard) => {
      if (!socket || !isConnected) {
        toast.error("Not connected to game server");
        return;
      }

      // Emit spell activation to server
      socket.emit("activate_spell", { roomId, spellCard });

      toast.success(`Activated ${spellCard.name} spell`);
    },
    [socket, isConnected, roomId]
  );

  // Handle power-up usage
  const handleUsePowerUp = useCallback(
    (powerUpType) => {
      if (!socket || !isConnected) {
        toast.error("Not connected to game server");
        return;
      }

      if (gameState?.currentTurn !== currentPlayer) {
        toast.error("Not your turn");
        return;
      }

      // Emit power-up usage to server
      socket.emit("use_powerup", { roomId, powerUpType });

      toast.success(`Used ${powerUpType} power-up`);
    },
    [socket, isConnected, gameState, currentPlayer, roomId]
  );

  // Handle question answer
  const handleAnswerQuestion = useCallback(
    (answer) => {
      if (!socket || !isConnected) {
        toast.error("Not connected to game server");
        return;
      }

      // Emit answer to server
      socket.emit("answer_question", { roomId, answer });

      setShowQuestionModal(false);
      setSelectedCard(null);
    },
    [socket, isConnected, roomId]
  );

  // Handle modal close
  const handleCloseQuestionModal = useCallback(() => {
    setShowQuestionModal(false);
    setSelectedCard(null);
  }, []);

  // Handle victory modal close
  const handleCloseVictoryModal = useCallback(() => {
    setShowVictoryModal(false);
    navigate("/student/versusmode");
  }, [navigate]);

  // Handle game exit
  const handleExitGame = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("leave_game_room", { roomId });
    }
    navigate("/student/versusmode");
  }, [socket, isConnected, roomId, navigate]);

  // Check if it's current player's turn
  const isCurrentTurn = gameState?.currentTurn === currentPlayer;

  // Check if game is finished
  const isGameFinished = gameState?.gameState === "finished";

  if (!gameState) {
    return (
      <div className="realTimeGame">
        <ConnectionStatus isConnected={isConnected} />
        <div className="loadingGame">
          <div className="loadingSpinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="realTimeGame">
      <ConnectionStatus isConnected={isConnected} />

      {/* Game Header */}
      <div className="gameHeader">
        <button className="exitButton" onClick={handleExitGame}>
          Exit Game
        </button>
        <div className="gameStatus">
          {isGameFinished
            ? "GAME FINISHED"
            : `PHASE: ${gameState.gamePhase?.toUpperCase()}`}
        </div>
      </div>

      {/* Game Board */}
      <div className="gameBoard">
        {/* Opponent Section */}
        <div className="opponentSection">
          {opponent && (
            <PlayerInfo
              player={opponent}
              isCurrentTurn={isCurrentTurn}
              isOpponent={true}
              gamePhase={gameState.gamePhase}
              activatedSpells={opponent.activatedSpells}
            />
          )}

          {/* Opponent Cards */}
          <div className="opponentCards">
            {opponent?.cards?.map((card, index) => (
              <GameCard
                key={card.id || index}
                card={card}
                isOpponent={true}
                className="opponentCard"
              />
            ))}
          </div>
        </div>

        {/* Battle Zone */}
        <div className="battleZone">
          <div className="selectedCardArea">
            {selectedCard && (
              <GameCard
                card={selectedCard}
                isSelected={true}
                className="selectedCard"
              />
            )}
          </div>

          <div className="gameInfo">
            <div className="deckInfo">
              <span>Deck: {gameState.deck?.length || 0} cards</span>
            </div>
            <div className="turnInfo">
              {isCurrentTurn ? "YOUR TURN" : "OPPONENT TURN"}
            </div>
          </div>
        </div>

        {/* Local Player Section */}
        <div className="localPlayerSection">
          {/* Local Player Cards */}
          <div className="localPlayerCards">
            {localPlayer?.cards?.map((card, index) => (
              <GameCard
                key={card.id || index}
                card={card}
                onClick={() => handleCardSelect(card)}
                isDisabled={
                  !isCurrentTurn || gameState.gamePhase !== "cardSelection"
                }
                className="localCard"
              />
            ))}
          </div>

          {localPlayer && (
            <PlayerInfo
              player={localPlayer}
              isCurrentTurn={isCurrentTurn}
              isOpponent={false}
              gamePhase={gameState.gamePhase}
              activatedSpells={localPlayer.activatedSpells}
            />
          )}
        </div>
      </div>

      {/* Power-Ups Panel */}
      <div className="powerUpsSection">
        <PowerUpsPanel
          powerUps={localPlayer?.powerUps || {}}
          onUsePowerUp={handleUsePowerUp}
          isCurrentTurn={isCurrentTurn}
        />
      </div>

      {/* Modals */}
      {showQuestionModal && selectedCard && (
        <QuestionModal
          card={selectedCard}
          onAnswer={handleAnswerQuestion}
          onClose={handleCloseQuestionModal}
          isVisible={showQuestionModal}
          powerUpEffects={gameState.powerUpEffects}
        />
      )}

      {showVictoryModal && (
        <VictoryModal
          winner={winner}
          players={gameState.players}
          onClose={handleCloseVictoryModal}
        />
      )}
    </div>
  );
};

export default RealTimeGame;
