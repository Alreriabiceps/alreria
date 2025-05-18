import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './demo.css'; // We'll create/update this for Exploding Kittens
import io from 'socket.io-client';

// Socket connection
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// --- Card Definitions ---
const CARD_TYPES = {
  EXPLODING_KITTEN: 'EXPLODING_KITTEN',
  QUESTION: 'QUESTION', // Question cards
};

const createCard = (id, type, questionData = null) => ({
  id,
  type,
  name: type === CARD_TYPES.QUESTION ? 'Question Card' : type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
  questionData, // Store question data for question cards
});

// --- Game Setup Utilities ---
const createInitialDrawPile = async (numPlayers) => {
  let pile = [];
  
  // Fetch questions from the database
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get all subjects first
    const subjectsResponse = await fetch(`${backendUrl}/api/subjects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!subjectsResponse.ok) {
      throw new Error('Failed to fetch subjects');
    }
    
    const subjects = await subjectsResponse.json();
    
    // For each subject, fetch questions
    for (const subject of subjects) {
      const questionsResponse = await fetch(`${backendUrl}/api/questions/${subject._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (questionsResponse.ok) {
        const questions = await questionsResponse.json();
        // Add questions as cards to the pile
        questions.forEach(question => {
          pile.push(createCard(pile.length + 1, CARD_TYPES.QUESTION, question));
        });
      }
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
  }

  // Add Exploding Kittens (fewer than before since we want more questions)
  for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
    pile.push(createCard(pile.length + 1, CARD_TYPES.EXPLODING_KITTEN));
  }
  
  return shuffleArray(pile);
};

const shuffleArray = (array) => {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- React Component ---
const ExplodingKittensGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId, players, currentPlayer } = location.state || {};

  const [error, setError] = useState(null);
  const [drawPile, setDrawPile] = useState([]);
  const [playerHands, setPlayerHands] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [attackTurns, setAttackTurns] = useState(0); // For Attack card effect
  const [draggedCardInfo, setDraggedCardInfo] = useState(null); // { card, handIndex }
  const [isDraggingOverPlayArea, setIsDraggingOverPlayArea] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [playerHP, setPlayerHP] = useState([]);
  const MAX_HP = 100;
  const [challengedPlayer, setChallengedPlayer] = useState(null);
  const [challengeQuestion, setChallengeQuestion] = useState(null);
  const [isChallenged, setIsChallenged] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isWaitingForPlayers, setIsWaitingForPlayers] = useState(false);

  // Initialize game with lobby data
  useEffect(() => {
    if (!gameId || !players || !currentPlayer) {
      setError('Missing game data. Please return to the lobby.');
      return;
    }

    try {
      // Set up initial game state
      const numPlayers = players.length;
      const initialHands = Array(numPlayers).fill().map(() => []);
      const initialHP = Array(numPlayers).fill(MAX_HP);
      const playerIndex = players.findIndex(p => p._id === currentPlayer);
      
      if (playerIndex === -1) {
        setError('Player not found in game. Please return to the lobby.');
        return;
      }

      setPlayerHands(initialHands);
      setPlayerHP(initialHP);
      setCurrentPlayerIndex(playerIndex);
      setGameStarted(true);
      
      // Join the game room
      socket.emit('joinGame', { gameId });
    } catch (err) {
      console.error('Error initializing game:', err);
      setError('Failed to initialize game. Please try again.');
    }
  }, [gameId, players, currentPlayer]);

  // Socket event handlers
  useEffect(() => {
    const handleGameStateUpdate = (gameState) => {
      try {
        if (!gameState) {
          console.error('Received invalid game state');
          return;
        }

        // Ensure all arrays are properly initialized
        const numPlayers = players?.length || 0;
        const defaultHands = Array(numPlayers).fill().map(() => []);
        const defaultHP = Array(numPlayers).fill(MAX_HP);

        setDrawPile(gameState.drawPile || []);
        setPlayerHands(gameState.playerHands || defaultHands);
        setCurrentPlayerIndex(gameState.currentPlayerIndex || 0);
        setPlayerHP(gameState.playerHP || defaultHP);
        setMessage(gameState.message || '');
        setGameOver(gameState.gameOver || false);
      } catch (err) {
        console.error('Error updating game state:', err);
        setError('Error updating game state');
      }
    };

    const handleGameOver = () => {
      setGameOver(true);
      setTimeout(() => {
        navigate('/student/versusmodelobby');
      }, 3000);
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'An error occurred');
    };

    socket.on('gameStateUpdate', handleGameStateUpdate);
    socket.on('gameOver', handleGameOver);
    socket.on('error', handleError);

    return () => {
      socket.off('gameStateUpdate', handleGameStateUpdate);
      socket.off('gameOver', handleGameOver);
      socket.off('error', handleError);
    };
  }, [navigate]);

  // Handle socket connection errors
  useEffect(() => {
    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server. Please try again.');
    };

    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  const initializeGame = async () => {
    setIsLoading(true);
    try {
      const initialPile = await createInitialDrawPile(players.length);
      const newPlayerHands = Array(players.length).fill(null).map(() => []);
      
      // Deal 7 cards to each player
      for (let cardCount = 0; cardCount < 7; cardCount++) {
        for (let i = 0; i < players.length; i++) {
          if(initialPile.length > 0) {
            newPlayerHands[i].push(initialPile.pop());
          } else {
            break; // Not enough cards for all players
          }
        }
      }

      setDrawPile(shuffleArray(initialPile)); // Shuffle again after kittens are in
      setPlayerHands(newPlayerHands.map(hand => shuffleArray(hand)));
      setCurrentPlayerIndex(0);
      setGameStarted(true);
      setGameOver(false);
      setMessage(`Player ${currentPlayerIndex + 1}'s turn.`);
      setAttackTurns(0);
    } catch (error) {
      console.error('Error initializing game:', error);
      setMessage('Error starting game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = () => {
    socket.emit('createGame', { numPlayers: players.length });
  };

  const handleDrawCard = () => {
    if (gameOver || currentPlayerIndex !== playerId) return;
    socket.emit('drawCard', { gameId });
  };

  const handleQuestionAnswer = (answer) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.questionData.correctAnswer;
    setQuestionResult(isCorrect);
    
    if (isCorrect) {
      // If correct, player gets to draw an extra card and deals damage to opponent
      if (drawPile.length > 0) {
        const extraCard = drawPile[0];
        const newDrawPile = drawPile.slice(1);
        setDrawPile(newDrawPile);
        const newHand = [...playerHands[currentPlayerIndex], extraCard];
        setPlayerHands(prevHands => prevHands.map((h, i) => i === currentPlayerIndex ? newHand : h));
        setMessage(`Correct! You drew an extra card: ${extraCard.name}`);
      } else {
        setMessage('Correct! But there are no more cards to draw.');
      }
      
      // Deal damage to opponent
      const opponentIndex = (currentPlayerIndex + 1) % players.length;
      setPlayerHP(prevHP => {
        const newHP = [...prevHP];
        newHP[opponentIndex] = Math.max(0, newHP[opponentIndex] - 10); // Deal 10 damage
        return newHP;
      });
    } else {
      setMessage('Incorrect! Try again next time.');
    }
    
    // Close modal after a delay
    setTimeout(() => {
      setShowQuestionModal(false);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setQuestionResult(null);
      endTurnLogic();
    }, 2000);
  };

  const playCard = (cardIndex) => {
    if (gameOver || currentPlayerIndex !== playerId) return;
    
    const cardToPlay = playerHands[currentPlayerIndex][cardIndex];
    if (!cardToPlay) return;

    if (cardToPlay.type === CARD_TYPES.QUESTION) {
      socket.emit('playCard', {
        gameId,
        cardIndex,
        card: cardToPlay
      });
    }
  };

  const handleChallengeAnswer = (answer) => {
    socket.emit('answerChallenge', {
      gameId,
      answer,
      questionId: challengeQuestion.id
    });
  };

  const endTurnLogic = (shouldDrawOnEnd = true) => {
    if (gameOver) return;

    if (attackTurns > 0 && !shouldDrawOnEnd) { // This means an attack card was played
       // The current player finishes their action (playing the Attack card)
       // The attackTurns counter is for the *next* player.
       setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
       setMessage(`Player ${currentPlayerIndex + 2 > players.length ? 1: currentPlayerIndex + 2}'s turn (Attack - ${attackTurns} turns remaining).`);
       // Attack turns are decremented when the *attacked* player *starts* their turn action (drawing)
    } else if (attackTurns > 0 && shouldDrawOnEnd) { // This is the attacked player drawing
        setAttackTurns(prev => prev -1);
        if (attackTurns - 1 > 0) {
            // Player still has more turns to take from attack, so they don't switch
            setMessage(`Player ${currentPlayerIndex + 1} drew. ${attackTurns-1} more turn(s) from Attack.`);
            // They will draw again automatically or play cards
        } else {
            // Last turn from attack
            setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
            setMessage(`Player ${currentPlayerIndex + 1} finished attack turns. Player ${currentPlayerIndex + 2 > players.length ? 1: currentPlayerIndex + 2}'s turn.`);
        }
    } else { // Normal turn ending
        setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
        setMessage(`Player ${ (currentPlayerIndex + 1) % players.length + 1}'s turn.`);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, card, handIndex) => {
    if (gameOver) return;
    setDraggedCardInfo({ card, handIndex });
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id, handIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPlayArea = (e) => {
    e.preventDefault();
    setIsDraggingOverPlayArea(true);
  };

  const handleDragLeavePlayArea = (e) => {
    setIsDraggingOverPlayArea(false);
  };

  const handleDropOnPlayArea = (e) => {
    e.preventDefault();
    setIsDraggingOverPlayArea(false);
    if (draggedCardInfo && !gameOver) {
      playCard(draggedCardInfo.handIndex); 
    }
    setDraggedCardInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedCardInfo(null);
    setIsDraggingOverPlayArea(false); // Just in case dragleave didn't fire
  };

  const handleCardClick = (card) => {
    if (card.type === CARD_TYPES.QUESTION) {
      setSelectedCard(card);
      setShowSidePanel(true);
    }
  };

  const closeSidePanel = () => {
    setShowSidePanel(false);
    setSelectedCard(null);
  };

  const handleSurrender = () => {
    if (gameOver || currentPlayerIndex !== playerId) return;
    socket.emit('surrender', { gameId });
  };

  if (error) {
    return (
      <div className="exploding-kittens-game">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/student/versusmodelobby')} className="ek-button">
          Return to Lobby
        </button>
      </div>
    );
  }

  if (!gameId || !players || !currentPlayer) {
    return (
      <div className="exploding-kittens-game">
        <h1>Exploding Kittens</h1>
        <p>No game data found. Please return to the lobby.</p>
        <button onClick={() => navigate('/student/versusmodelobby')} className="ek-button">
          Return to Lobby
        </button>
      </div>
    );
  }

  if (isWaitingForPlayers) {
    return (
      <div className="exploding-kittens-game">
        <h1>Waiting for Players</h1>
        <p>Game ID: {gameId}</p>
        <p>Share this ID with other players</p>
        <div className="players-list">
          {players.map((player, index) => (
            <div key={index} className="player-item">
              Player {index + 1}: {player._id === playerId ? 'You' : 'Opponent'}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
        <div className="exploding-kittens-game game-over">
            <h1>Game Over!</h1>
            <p>{message}</p>
            <button onClick={initializeGame} className="ek-button">Play Again?</button>
        </div>
    );
  }

  // Determine opponent index (assuming 2 players for simplicity in this direct layout change)
  const opponentPlayerIndex = (currentPlayerIndex + 1) % players.length;

  return (
    <div className="exploding-kittens-game">
      <h2>Exploding Kittens</h2>

      {/* Opponent's Hand Area (Top) */}
      {players.length > 1 && playerHands[opponentPlayerIndex] && (
        <div className="player-hand-display opponent-hand-area">
          <div className="player-info">
            <h3>Player {opponentPlayerIndex + 1}</h3>
            <div className="hp-bar-container">
              <div className="hp-bar" style={{ width: `${(playerHP[opponentPlayerIndex] / MAX_HP) * 100}%` }}>
                <span className="hp-text">{playerHP[opponentPlayerIndex]}</span>
              </div>
            </div>
          </div>
          <div className="cards-container other-player-hand">
            {playerHands[opponentPlayerIndex].map((card) => (
              <div key={card.id} className="card ek-card card-back"></div>
            ))}
          </div>
        </div>
      )}

      {/* Game Info & Play Area (Middle) */}
      <div className="center-console">
        <div className="game-info">
          <p>Draw Pile: {drawPile.length} cards</p>
          <p>Current Player: {currentPlayerIndex + 1}</p>
          <p className="game-message">{message}</p>
        </div>
        <div 
          className={`play-area ${isDraggingOverPlayArea ? 'drag-over' : ''}`}
          onDragOver={handleDragOverPlayArea}
          onDragLeave={handleDragLeavePlayArea}
          onDrop={handleDropOnPlayArea}
        >
          Drop card here to play
        </div>
      </div>
      
      {/* Current Player's Hand Area (Bottom) */}
      <div className="player-hand-display current-player-hand-area current-player-active">
        <div className="player-info">
          <div className="player-header">
            <h3>Player {currentPlayerIndex + 1}</h3>
            <button 
              className="surrender-button"
              onClick={handleSurrender}
              disabled={gameOver}
            >
              Surrender
            </button>
          </div>
          <div className="hp-bar-container">
            <div className="hp-bar" style={{ width: `${(playerHP[currentPlayerIndex] || 0) / MAX_HP * 100}%` }}>
              <span className="hp-text">{playerHP[currentPlayerIndex] || 0}</span>
            </div>
          </div>
        </div>
        <div className="cards-container">
          {Array.isArray(playerHands[currentPlayerIndex]) && playerHands[currentPlayerIndex].map((card, cardIdx) => (
            <div 
              key={card.id} 
              className={`card ek-card ${draggedCardInfo && draggedCardInfo.card.id === card.id ? 'dragging' : ''} ${card.type === CARD_TYPES.QUESTION ? 'question-card' : ''}`}
              draggable={!gameOver}
              onDragStart={!gameOver ? (e) => handleDragStart(e, card, cardIdx) : undefined}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick(card)}
              title={card.type === CARD_TYPES.QUESTION ? card.questionData.questionText : card.name}
            >
              {card.type === CARD_TYPES.QUESTION ? (
                <div className="question-card-content">
                  <div className="question-card-icon">?</div>
                  <div className="question-card-text">
                    {card.questionData.questionText.length > 50 
                      ? card.questionData.questionText.substring(0, 47) + '...'
                      : card.questionData.questionText}
                  </div>
                </div>
              ) : (
                card.name
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions Area */}
      <div className="actions-area">
        <button 
          onClick={handleDrawCard} 
          disabled={drawPile.length === 0 || gameOver} 
          className="ek-button draw-button"
        >
          End Turn & Draw Card
        </button>
      </div>

      {/* Side Panel */}
      {showSidePanel && selectedCard && selectedCard.type === CARD_TYPES.QUESTION && (
        <div className="side-panel">
          <button className="close-panel-button" onClick={closeSidePanel}>×</button>
          <div className="side-panel-content">
            <h3>Question Details</h3>
            <div className="question-details">
              <p className="question-text">{selectedCard.questionData.questionText}</p>
              <div className="choices">
                {selectedCard.questionData.choices.map((choice, index) => (
                  <div key={index} className="choice-item">
                    <span className="choice-letter">{String.fromCharCode(65 + index)}.</span>
                    <span className="choice-text">{choice}</span>
                  </div>
                ))}
              </div>
              <div className="question-actions">
                <button 
                  className="ek-button play-question-button"
                  onClick={() => {
                    setShowSidePanel(false);
                    setCurrentQuestion(selectedCard);
                    setShowQuestionModal(true);
                  }}
                >
                  Play This Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && currentQuestion && (
        <div className="question-modal">
          <div className="question-content">
            <h3>Question Card</h3>
            <p className="question-text">{currentQuestion.questionData.questionText}</p>
            <div className="choices">
              {currentQuestion.questionData.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionAnswer(choice)}
                  disabled={selectedAnswer !== null}
                  className={`choice-button ${selectedAnswer === choice ? (questionResult ? 'correct' : 'incorrect') : ''}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {isChallenged && challengeQuestion && (
        <div className="question-modal">
          <div className="question-content">
            <h3>Challenge Question</h3>
            <p className="question-text">{challengeQuestion.questionData.questionText}</p>
            <div className="choices">
              {challengeQuestion.questionData.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChallengeAnswer(choice)}
                  disabled={challengeResult !== null}
                  className={`choice-button ${challengeResult !== null ? (challengeResult ? 'correct' : 'incorrect') : ''}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplodingKittensGame;