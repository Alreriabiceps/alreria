// React and routing imports
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

// CSS imports
import "./pages/demo.css";

// Icon imports
import { FaDice } from "react-icons/fa";

// UI components
import TargetCursor from "@components/TargetCursor";
import FloatingStars from "../../components/FloatingStars/FloatingStars";

// Contexts and hooks
import { useAuth } from "../../../../contexts/AuthContext";
import useSocket from "../../../../shared/hooks/useSocket";

// Import custom hooks and components
import { QuestionModal, VictoryModal, BattleField } from "./components";
import QuickResultPopup from "./components/QuickResultPopup";

// Main Demo Component - REAL-TIME PVP MODE
const Demo = () => {
  // Extract game data from location state (passed from VersusModeLobby)
  const location = useLocation();
  const { user } = useAuth();
  const socketRef = useSocket();

  // Game initialization data from lobby
  const gameData = location.state || {};
  const {
    gameId,
    players: lobbyPlayers = [],
    roomId,
    gameMode = "demo",
    lobbyId,
  } = gameData;

  // Real-time game state
  const [gameState, setGameState] = useState("initializing"); // initializing, playing, finished
  const [gamePhase, setGamePhase] = useState("setup"); // setup, cardSelection, answering, result
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [questionPhase, setQuestionPhase] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);

  // Track opponent card count for visual display
  const [opponentCardCount, setOpponentCardCount] = useState(0);

  // Question Modal State
  const [opponentQuestion, setOpponentQuestion] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Results Phase State
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Processing flags to prevent duplicate event handling
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  // Cards are now managed by the backend game state

  // Game state refs for socket events
  const gameStateRef = useRef(gameState);
  const playersRef = useRef(players);
  const currentTurnRef = useRef(currentTurnUserId);

  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
    playersRef.current = players;
    currentTurnRef.current = currentTurnUserId;
  }, [gameState, players, currentTurnUserId]);

  // Determine player indices
  const myPlayerIndex = players.findIndex((p) => p.userId === user?.id);
  const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
  const myPlayerId = user?.id;
  const isMyTurn = currentTurnUserId === myPlayerId;

  // Cards are now created by the backend game engine

  // Card replacement is now handled by the backend game engine
  const replaceUsedCard = useCallback(() => {
    // This function is no longer needed as cards are managed by backend
    console.log("Card replacement handled by backend");
  }, []);

  // Card replacement is now handled by the backend game engine

  // Initialize game from lobby data
  const initializeGame = useCallback(() => {
    if (!lobbyPlayers.length || !user?.id) {
      console.log("⏳ Waiting for game data...");
      setWaitingForOpponent(true);
      return;
    }

    console.log("🎮 Initializing game with data:", {
      gameId,
      lobbyPlayers,
      currentPlayer: user.id,
      roomId,
      gameMode,
      lobbyId,
    });

    // Initialize players with real data - HP will be set by backend game state
    const initializedPlayers = lobbyPlayers.map((player) => ({
      id: player.userId || player._id || player.id,
      userId: player.userId || player._id || player.id,
      name:
        player.name ||
        player.username ||
        `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
        "Player",
      hp: 100, // Temporary - will be updated by backend
      maxHp: 100,
      cards: [], // Will be populated when questions load
    }));

    setPlayers(initializedPlayers);
    setGameState("playing");
    setGamePhase("challenge");
    setWaitingForOpponent(false);

    console.log(
      "🎮 Frontend initialized players with temporary HP, waiting for backend game state..."
    );

    // Initialize opponent card count
    const myPlayerIndex = initializedPlayers.findIndex(
      (p) => p.userId === user?.id
    );
    const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
    const opponent = initializedPlayers[opponentIndex];
    if (opponent && opponent.cards) {
      setOpponentCardCount(opponent.cards.length);
    }

    // Determine who goes first (room creator goes first)
    const roomCreator = lobbyPlayers[0]; // First player in lobby is usually the creator
    const firstPlayerId =
      roomCreator?.userId || roomCreator?._id || roomCreator?.id;
    setCurrentTurnUserId(firstPlayerId);

    console.log("🎯 Game initialized:", {
      players: initializedPlayers,
      firstPlayer: firstPlayerId,
      isMyTurn: firstPlayerId === user.id,
    });
  }, [lobbyPlayers, user?.id, gameId, roomId, gameMode, lobbyId]);

  // Socket event handlers
  const handleSocketEvents = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("🔌 Socket connected to game");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected from game");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setError("Connection lost. Please refresh the page.");
      setIsConnected(false);
    });

    // Game state events
    socket.on("game_state_update", (data) => {
      console.log("🔄 Game state update received:", data);

      // Extract gameState from the data object
      const gameState = data.gameState || data;

      if (gameState.players) {
        console.log("🔄 Updating players from backend game state:", {
          players: gameState.players.map((p) => ({
            userId: p.userId,
            name: p.name,
            hp: p.hp,
            maxHp: p.maxHp,
          })),
        });

        setPlayers(gameState.players);

        // Track opponent card count for visual display
        const myPlayerIndex = gameState.players.findIndex(
          (p) => p.userId === user?.id
        );
        const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
        const opponent = gameState.players[opponentIndex];

        if (opponent) {
          // If opponent has cards, use that count, otherwise maintain current count
          if (opponent.cards && opponent.cards.length > 0) {
            setOpponentCardCount(opponent.cards.length);
          }
          // If opponent cards are empty (hidden by backend), don't change the count
        }
      }
      if (gameState.currentTurn) setCurrentTurnUserId(gameState.currentTurn);
      if (gameState.gamePhase) setGamePhase(gameState.gamePhase);
      if (gameState.gameState) setGameState(gameState.gameState);
      if (gameState.winner) setWinner(gameState.winner);
    });

    // Card selection events
    socket.on("game:card_selected", (data) => {
      console.log("🎴 Card selected by opponent:", data);
      if (data.targetPlayerId === user?.id) {
        // First, reset any existing modal state to ensure clean start
        resetQuestionModalState();

        // Validate and fix the card data structure
        const validatedCard = validateQuestionData(data.card);

        if (!validatedCard) {
          console.error("❌ Invalid card data received:", data.card);
          return;
        }

        console.log(
          "🎯 Setting opponent question with validated card data:",
          validatedCard
        );

        // Opponent selected a card to challenge me with
        setOpponentQuestion(validatedCard);
        setGamePhase("answer");
        setQuestionPhase(true);

        // Replace the opponent's used card with a new one
        replaceUsedCard(data.card, data.playerId);

        // Decrease opponent card count when they use a card
        setOpponentCardCount((prev) => Math.max(0, prev - 1));

        console.log("🎯 Opponent is challenging me with:", validatedCard);
      }
    });

    // Listen for question challenge events from the game engine
    socket.on("question_challenge", (data) => {
      console.log("🎯 Question challenge received:", data);
      if (data.targetPlayerId === user?.id) {
        // Reset any existing modal state
        resetQuestionModalState();

        // Validate and fix the card data structure
        const validatedCard = validateQuestionData(data.card);

        if (!validatedCard) {
          console.error("❌ Invalid card data received:", data.card);
          return;
        }

        console.log(
          "🎯 Setting opponent question with validated card data:",
          validatedCard
        );

        // Set the opponent's question data
        setOpponentQuestion(validatedCard);
        setGamePhase("answer");
        setQuestionPhase(true);

        console.log("❓ Question challenge activated for opponent's card");
      }
    });

    // Answer submission events
    socket.on("game:answer_submitted", (data) => {
      // Prevent duplicate processing
      if (isProcessingAnswer) {
        console.log("🚫 Already processing answer, ignoring duplicate event");
        return;
      }

      console.log("📝 Answer submitted:", data);
      setIsProcessingAnswer(true);
      console.log(
        "🔍 Debug - challengerId:",
        data.challengerId,
        "user?.id:",
        user?.id
      );
      console.log(
        "🔍 Debug - Should show results modal:",
        data.challengerId === user?.id
      );

      // Don't immediately close question modal for the answerer
      // Let the QuestionModal show the result first, then auto-close after 3 seconds
      if (data.playerId === user?.id) {
        console.log(
          "✅ Answer submitted by user - QuestionModal will show result and auto-close"
        );
        // QuestionModal will handle its own closing after showing result
      }

      // Show results modal to the challenger (the one who sent the question)
      if (data.challengerId === user?.id) {
        console.log("✅ Showing results modal to challenger");

        // Get the selected card from the event data (preserved from backend)
        const selectedCard = data.selectedCard;
        const opponentPlayer = data.gameState?.players?.find(
          (p) => p.userId === data.playerId
        );

        const newResultData = {
          question: selectedCard?.question || "Question not available",
          opponentAnswer: data.answer || "Answer submitted",
          correctAnswer:
            selectedCard?.answer ||
            selectedCard?.correctAnswer ||
            "Answer not available",
          isCorrect: data.isCorrect,
          damage: data.damage,
          opponentName:
            opponentPlayer?.name || opponentPlayer?.username || "Opponent",
        };

        console.log("🔍 Setting result data:", newResultData);
        setResultData(newResultData);
        setShowResultsModal(true);
        console.log("🔍 Show results modal set to true");
      } else {
        console.log("❌ Not showing results modal - not the challenger");
      }

      // Handle answer result and damage calculation
      if (data.isCorrect) {
        // Answer was correct, the person who asked the question takes damage
        // (This means the challenger takes damage when opponent answers correctly)
        setPlayers((prev) =>
          prev.map((p) =>
            p.userId === data.challengerId
              ? { ...p, hp: Math.max(0, p.hp - data.damage) }
              : p
          )
        );
        console.log("✅ Correct answer! Challenger takes damage:", data.damage);
      } else {
        // Answer was incorrect, the person who answered takes damage
        setPlayers((prev) =>
          prev.map((p) =>
            p.userId === data.playerId
              ? { ...p, hp: Math.max(0, p.hp - data.damage) }
              : p
          )
        );
        console.log("❌ Incorrect answer! Answerer takes damage:", data.damage);
      }

      // Update HP with values from backend if available (more accurate)
      if (data.updatedHp) {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) => ({
            ...player,
            hp: data.updatedHp[player.userId] || player.hp,
          }))
        );
        console.log("🔄 Updated HP from backend:", data.updatedHp);
      }

      // Turn switching is now handled by game_state_update event
      // Only reset question modal if we're not currently showing a question
      // This prevents closing the modal while showing answer results
      if (!questionPhase) {
        console.log(
          "🔄 Game state updated - no active question, resetting modal state"
        );
        // Add a delay to allow QuestionModal to show result first
        setTimeout(() => {
          resetQuestionModalState(); // Only reset question modal, keep results modal
        }, 1000);
      } else {
        console.log(
          "🔄 Game state updated - question active, keeping modal open"
        );
      }

      // Reset processing flag after a delay to allow for proper state updates
      setTimeout(() => {
        setIsProcessingAnswer(false);
        console.log("✅ Answer processing completed, ready for next event");
      }, 2000);
    });

    // Game over events
    socket.on("game:game_over", (data) => {
      console.log("🏁 Game over:", data);
      setGameState("finished");
      setWinner(data.winner);

      // Update final HP values
      if (data.finalScores) {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) => ({
            ...player,
            hp: data.finalScores[player.userId] || player.hp,
          }))
        );
      }

      // Reset all modal states when game ends
      resetAllModalStates();

      console.log(`🏆 Game Over! Winner: ${data.winnerName || data.winner}`);
    });

    // Error events
    socket.on("game:error", (error) => {
      console.error("❌ Game error:", error);
      setError(error.message || "Game error occurred");
    });
  }, [socketRef, user?.id, replaceUsedCard, questionPhase, isProcessingAnswer]);

  // Initialize socket events
  useEffect(() => {
    handleSocketEvents();
  }, [handleSocketEvents]);

  // Join game room when component mounts
  useEffect(() => {
    if (socketRef.current && roomId) {
      console.log("🏠 Joining game room:", roomId);
      socketRef.current.emit("join_game_room", { roomId });
    }
  }, [socketRef, roomId]);

  // Initialize game when data is available
  useEffect(() => {
    if (lobbyPlayers.length > 0 && user?.id) {
      initializeGame();
    }
  }, [initializeGame, lobbyPlayers.length, user?.id]);

  // Cards are now managed by the backend game state, not locally

  // Game action handlers
  const handleCardClick = (card, playerIndex) => {
    console.log("🎴 Card clicked:", card, playerIndex);

    // Only allow clicking on current player's cards during their turn
    if (
      playerIndex === myPlayerIndex &&
      isMyTurn &&
      gamePhase === "cardSelection"
    ) {
      // Show preview modal to see the question before challenging
      setPreviewCard(card);
      setShowPreviewModal(true);
      console.log("👀 Previewing card:", card);
    }
  };

  // Handle submitting the challenge to opponent
  const handleSubmitChallenge = () => {
    if (!socketRef.current || !previewCard) return;

    console.log("🎯 Submitting challenge to opponent:", previewCard);
    console.log("🔍 Card questionData:", previewCard.questionData);

    // Store the card before clearing it
    const cardToChallenge = previewCard;

    // Ensure the card has proper questionData structure
    const cardWithQuestionData = {
      ...cardToChallenge,
      questionData: cardToChallenge.questionData || {
        _id: cardToChallenge.id,
        questionText: cardToChallenge.question,
        choices: cardToChallenge.choices || [],
        correctAnswer: cardToChallenge.correctAnswer || "",
        bloomsLevel: cardToChallenge.bloomLevel,
      },
    };

    console.log("🔍 Sending card with questionData:", cardWithQuestionData);

    // Send the card selection to the server to notify the opponent
    socketRef.current.emit("game:card_selected", {
      roomId,
      gameId,
      playerId: user?.id,
      card: cardWithQuestionData,
      targetPlayerId: players[opponentIndex]?.userId,
    });

    // Replace the used card with a new one
    replaceUsedCard(cardToChallenge, user?.id);

    // Close preview modal
    setShowPreviewModal(false);
    setPreviewCard(null);

    // Opponent gets a new card when I use one
    setOpponentCardCount((prev) => Math.min(7, prev + 1));

    // Don't show the question modal to ourselves - only the opponent should see it
    // The opponent will receive the socket event and show the modal on their side
    setGamePhase("waiting"); // Change to waiting phase while opponent answers

    console.log("✅ Challenge sent to opponent! Waiting for their answer...");
  };

  const handleAnswerSubmit = (result) => {
    console.log("📝 Answer submitted:", result);

    if (!socketRef.current || !opponentQuestion) return;

    // Find who challenged me (the person whose turn it was before)
    const challengerId = players.find((p) => p.userId !== user?.id)?.userId;

    // Delay the socket emission to allow QuestionModal to show result first
    // The QuestionModal will auto-close after 3 seconds, then we send the answer
    setTimeout(() => {
      console.log("📤 Sending answer to server after modal display delay");
      socketRef.current.emit("game:submit_answer", {
        roomId,
        gameId,
        playerId: user?.id,
        challengerId: challengerId,
        card: opponentQuestion,
        answer: result.selectedAnswer,
        isCorrect: result.isCorrect,
        damage: opponentQuestion.damage,
      });
    }, 5500); // Wait 5.5 seconds to allow modal to show result and close

    // Don't close modal here - let the QuestionModal handle its own closing
    // This prevents race conditions and ensures proper state management
  };

  // handleCloseResults removed - using resetResultsModalState instead

  // Test function removed - was for debugging only

  // Helper function to get HP color based on percentage
  const getHpColor = (currentHp, maxHp) => {
    const percentage = (currentHp / maxHp) * 100;

    if (percentage >= 70) {
      // Green for high HP (70-100%)
      return "#22c55e";
    } else if (percentage >= 40) {
      // Orange for medium HP (40-69%)
      return "#f59e0b";
    } else if (percentage >= 20) {
      // Red-orange for low HP (20-39%)
      return "#f97316";
    } else {
      // Dark red for critical HP (0-19%)
      return "#dc2626";
    }
  };

  // Helper function to validate and fix question data structure
  const validateQuestionData = (card) => {
    if (!card) return null;

    // If card already has proper questionData, return it
    if (
      card.questionData &&
      card.questionData._id &&
      card.questionData.questionText
    ) {
      return card;
    }

    // Otherwise, create proper questionData structure
    const fixedCard = {
      ...card,
      questionData: {
        _id: card.id || card._id || `temp-${Date.now()}`,
        questionText:
          card.question || card.questionText || "Question not available",
        choices: card.choices || ["A", "B", "C", "D"],
        correctAnswer: card.answer || card.correctAnswer || "A",
        bloomsLevel: card.bloomLevel || "Remembering",
      },
    };

    console.log("🔧 Fixed question data structure:", fixedCard);
    return fixedCard;
  };

  // Helper function to reset question modal state only
  const resetQuestionModalState = () => {
    console.log("🔄 Resetting question modal state");
    setQuestionPhase(false);
    setOpponentQuestion(null);
  };

  // Helper function to reset results modal state only
  const resetResultsModalState = () => {
    console.log("🔄 Resetting results modal state");
    setShowResultsModal(false);
    setResultData(null);
  };

  // Helper function to reset all modal states
  const resetAllModalStates = () => {
    console.log("🔄 Resetting all modal states");
    setQuestionPhase(false);
    setOpponentQuestion(null);
    setShowResultsModal(false);
    setResultData(null);
  };

  // Power-ups not currently implemented

  const restart = () => {
    window.location.reload();
  };

  try {
    // Questions are now loaded by backend

    // Show waiting state if no game data
    if (waitingForOpponent || !players.length) {
      return (
        <div className="demoContainer">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              color: "var(--text-primary)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "4px solid var(--field-border)",
                borderTop: "4px solid var(--legendary-gold)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "20px",
              }}
            ></div>
            <h2
              style={{ color: "var(--legendary-gold)", marginBottom: "10px" }}
            >
              Waiting for Game...
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              {waitingForOpponent
                ? "Waiting for opponent to join..."
                : "Initializing game..."}
            </p>
            {!isConnected && (
              <p style={{ color: "#ef4444", marginTop: "10px" }}>
                Connection lost. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="demoContainer">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              color: "var(--text-primary)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <h2 style={{ color: "#ef4444", marginBottom: "20px" }}>
              Game Error
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "var(--legendary-gold)",
                color: "#1f2937",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="demoContainer">
        <TargetCursor spinDuration={2} hideDefaultCursor={true} />
        <FloatingStars />

        {/* Power-ups Panel removed - not currently implemented */}

        {/* Header */}
        <div className="gameHeader">
          <h1 className="gameTitle">
            <FaDice />
            QUIZ CARD DUEL
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: isConnected ? "#22c55e" : "#ef4444",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#22c55e" : "#ef4444",
              }}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* Test button removed - was for debugging only */}

        {/* Main Duel Field */}
        <div className="duelField">
          {/* Game Status Bar */}
          <div className="gameStatusBar">
            <div className="turnIndicator">
              <FaDice />
              {isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
            </div>
            <div className="phaseIndicator">
              {gamePhase?.toUpperCase() || "CHALLENGE"}
            </div>
          </div>

          {/* Player Areas */}
          <div className="playerZone topPlayer">
            {/* Top Player Info */}
            <div className="playerInfo">
              <div className="playerName">
                {players[opponentIndex]?.name || "Opponent"}
              </div>
              <div className="hpBar">
                <div className="hpBarBackground">
                  <div
                    className="hpBarFill"
                    style={{
                      width: `${
                        ((players[opponentIndex]?.hp || 100) /
                          (players[opponentIndex]?.maxHp || 100)) *
                        100
                      }%`,
                      backgroundColor: getHpColor(
                        players[opponentIndex]?.hp || 100,
                        players[opponentIndex]?.maxHp || 100
                      ),
                    }}
                  ></div>
                </div>
                <div className="hpText">
                  {players[opponentIndex]?.hp || 100}/
                  {players[opponentIndex]?.maxHp || 100}
                </div>
              </div>
            </div>

            <div className="cardHand">
              {Array.from({ length: opponentCardCount }, (_, index) => {
                // Show face-down cards for opponent - no information visible
                return (
                  <div
                    key={`opponent-card-${index}`}
                    className="gameCard opponent face-down"
                  >
                    <div className="card-back">
                      <div className="card-back-pattern">
                        <div className="geometric-pattern">
                          <div className="pattern-line"></div>
                          <div className="pattern-diamond"></div>
                          <div className="pattern-line"></div>
                        </div>
                        <div className="card-back-text">BATTLE CARD</div>
                        <div className="card-back-subtitle">
                          Educational PvP
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Battle Zone */}
          <BattleField gamePhase={gamePhase} isMyTurn={isMyTurn} />

          {/* Current Player Area */}
          <div className="playerZone bottomPlayer">
            <div className="cardHand">
              {players[myPlayerIndex]?.cards?.map((card, index) => {
                // Handle spell cards differently
                if (card.type === "spell") {
                  return (
                    <div
                      key={card.id || index}
                      className="gameCard spellCard"
                      onClick={() => handleCardClick(card, myPlayerIndex)}
                      style={{
                        borderColor: card.color || "#7c3aed",
                        color: card.color || "#7c3aed",
                        background: `linear-gradient(145deg, ${
                          card.bgColor || "rgba(124, 58, 237, 0.2)"
                        }, rgba(45, 55, 72, 0.9))`,
                        cursor:
                          isMyTurn && gamePhase === "cardSelection"
                            ? "pointer"
                            : "default",
                        opacity:
                          isMyTurn && gamePhase === "cardSelection" ? 1 : 0.7,
                      }}
                    >
                      <div className="cardHeader">
                        <div
                          className="spellType"
                          style={{ color: card.color || "#7c3aed" }}
                        >
                          SPELL
                        </div>
                        <div
                          className="cardDamage"
                          style={{ color: card.color || "#7c3aed" }}
                        >
                          ⚡
                        </div>
                      </div>
                      <div className="cardContent">
                        <div
                          className="cardQuestion"
                          style={{
                            color: card.color || "#7c3aed",
                            fontWeight: "bold",
                          }}
                        >
                          {card.name || "Spell Card"}
                        </div>
                        <div
                          className="spellDescription"
                          style={{
                            color: "#e5e7eb",
                            fontSize: "0.7rem",
                            marginTop: "4px",
                          }}
                        >
                          {card.description || "A powerful spell"}
                        </div>
                      </div>
                      <div
                        className="cardFooter"
                        style={{
                          color: card.color || "#7c3aed",
                          textTransform: "uppercase",
                        }}
                      >
                        {card.spellType || "utility"}
                      </div>
                    </div>
                  );
                }

                // Regular question cards
                return (
                  <div
                    key={card.id || index}
                    className="gameCard"
                    onClick={() => handleCardClick(card, myPlayerIndex)}
                    style={{
                      borderColor: `var(--${card.type})`,
                      color: `var(--${card.type})`,
                      cursor:
                        isMyTurn && gamePhase === "cardSelection"
                          ? "pointer"
                          : "default",
                      opacity:
                        isMyTurn && gamePhase === "cardSelection" ? 1 : 0.7,
                    }}
                  >
                    <div className="cardHeader">
                      <div
                        className="bloomType"
                        style={{ color: `var(--${card.type})` }}
                      >
                        {card.bloomLevel}
                      </div>
                      <div
                        className="cardDamage"
                        style={{ color: `var(--${card.type})` }}
                      >
                        {card.damage}
                      </div>
                    </div>
                    <div className="cardContent">
                      <div className="cardQuestion">{card.question}</div>
                    </div>
                    <div className="cardFooter">{card.bloomLevel}</div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Player Info */}
            <div className="playerInfo">
              <div className="playerName">
                {players[myPlayerIndex]?.name || "You"}
              </div>
              <div className="hpBar">
                <div className="hpBarBackground">
                  <div
                    className="hpBarFill"
                    style={{
                      width: `${
                        ((players[myPlayerIndex]?.hp || 100) /
                          (players[myPlayerIndex]?.maxHp || 100)) *
                        100
                      }%`,
                      backgroundColor: getHpColor(
                        players[myPlayerIndex]?.hp || 100,
                        players[myPlayerIndex]?.maxHp || 100
                      ),
                    }}
                  ></div>
                </div>
                <div className="hpText">
                  {players[myPlayerIndex]?.hp || 100}/
                  {players[myPlayerIndex]?.maxHp || 100}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Victory Modal */}
        <VictoryModal
          winner={winner}
          onRestart={restart}
          onClose={restart}
          isVisible={gameState === "finished"}
        />

        {/* Preview Modal - Previewing Card Before Challenge */}
        {showPreviewModal && previewCard && (
          <div className="questionModalOverlay">
            <div className="questionModal">
              <div className="questionModalHeader">
                <h2 className="questionModalTitle">Preview Challenge</h2>
                <div
                  className="bloomLevel"
                  style={{ color: `var(--${previewCard.type})` }}
                >
                  {previewCard.bloomLevel}
                </div>
                <div
                  className="damageValue"
                  style={{ color: `var(--${previewCard.type})` }}
                >
                  {previewCard.damage} DMG
                </div>
                <button
                  className="closeButton"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewCard(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="questionModalContent">
                <div className="questionText">{previewCard.question}</div>

                <div className="previewChoices">
                  {(
                    previewCard.questionData?.choices ||
                    previewCard.choices ||
                    []
                  ).map((choice, index) => (
                    <div key={index} className="previewChoice">
                      <span className="choiceLetter">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="choiceText">{choice}</span>
                    </div>
                  ))}
                </div>

                <div className="submitSection">
                  <button
                    className="submitButton challengeButton"
                    onClick={handleSubmitChallenge}
                    style={{
                      background: `var(--${previewCard.type})`,
                      color: "#1f2937",
                      fontWeight: "700",
                    }}
                  >
                    🎯 Submit Challenge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Modal - Answering Opponent's Challenge */}
        <QuestionModal
          isOpen={
            questionPhase && opponentQuestion && opponentQuestion.questionData
          }
          onClose={() => {
            console.log("🔒 QuestionModal onClose called");
            resetQuestionModalState(); // Only reset question modal, keep results modal
          }}
          cardData={opponentQuestion}
          onAnswerSubmit={handleAnswerSubmit}
          playerName={players[myPlayerIndex]?.name || "Player"}
        />

        {/* Quick Result Popup - Show Opponent's Answer and Damage */}
        <QuickResultPopup
          isVisible={showResultsModal}
          resultData={resultData}
          onClose={() => {
            console.log("🔒 QuickResultPopup onClose called");
            resetResultsModalState();
          }}
        />

        {/* Victory Modal - Show when game is over */}
        {gameState === "finished" && winner && (
          <VictoryModal
            winner={
              players.find((p) => p.userId === winner)?.name || "Unknown Player"
            }
            isWinner={winner === user?.id}
            starChange={winner === user?.id ? 8 : -8}
            onRestart={() => {
              console.log("🔄 Restarting game...");
              window.location.reload();
            }}
            onClose={() => {
              console.log("🚪 Exiting game...");
              // Navigate back to lobby or main menu
              window.history.back();
            }}
            isVisible={true}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("❌ CRITICAL ERROR IN DEMO COMPONENT RENDER:");
    console.error("- Error message:", error.message);
    console.error("- Error stack:", error.stack);
    console.error("- Component state:", {
      gameState,
      gamePhase,
      players: players?.length,
      isConnected,
    });

    return (
      <div
        className="demoContainer"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <h1 style={{ color: "red" }}>Game Error!</h1>
        <p>The game encountered an error and needs to be restarted.</p>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Error: {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "10px 20px", marginTop: "20px" }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
};

export default Demo;
