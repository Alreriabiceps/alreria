import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './demo.css'; // We'll create/update this for Exploding Kittens
import Hand from './components/Hand';
import HPBar from './components/HPBar';
import QuestionModal from './components/QuestionModal';
import GameStartOverlay from './components/GameStartOverlay';
import { useAuth } from '../../../../../contexts/AuthContext';
import DeckPile from './components/DeckPile';
import ParticleBurst from './components/ParticleBurst';
// import io from 'socket.io-client';

// --- Multiplayer socket connection is commented for single-player feature development ---
// const socket = io(import.meta.env.VITE_BACKEND_URL, {
//   auth: {
//     token: localStorage.getItem('token')
//   },
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000
// });

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
  const navigate = useNavigate();
  const [drawPile, setDrawPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerHP, setPlayerHP] = useState(100);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isDraggingOverPlayArea, setIsDraggingOverPlayArea] = useState(false);
  const MAX_HP = 100;
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [startDealing, setStartDealing] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [dealQueue, setDealQueue] = useState([]); // queue of cards to deal
  const CARDS_TO_DEAL = 7;
  const { user } = useAuth();
  const playAreaRef = useRef(null);
  const handAreaRef = useRef(null);
  const [flyingCard, setFlyingCard] = useState(null);
  const [flyingStyle, setFlyingStyle] = useState({});
  const nextSlotRef = useRef(null);

  // Only start dealing after overlay is dismissed
  useEffect(() => {
    if (!startDealing) return;
    const setupSinglePlayerGame = async () => {
      setIsLoading(true);
      const initialPile = await createInitialDrawPile(1);
      setDrawPile(initialPile);
      setPlayerHand([]);
      setPlayerHP(MAX_HP);
      setGameStarted(true);
      setGameOver(false);
      setMessage('Dealing cards...');
      setIsLoading(false);
      // Prepare a queue of cards to deal
      setDealQueue(initialPile.slice(-CARDS_TO_DEAL));
      setDrawPile(initialPile.slice(0, -CARDS_TO_DEAL));
      setDealing(true);
    };
    setupSinglePlayerGame();
  }, [startDealing]);

  // Animate dealing cards one by one
  useEffect(() => {
    if (!dealing || flyingCard || dealQueue.length === 0) return;
    // Animate the next card in the queue
    const card = dealQueue[0];
    // Get deck and next slot positions
    const deckElem = playAreaRef.current?.querySelector('.deck-pile');
    const slotElem = nextSlotRef.current;
    const handElem = handAreaRef.current;
    if (!deckElem || !handElem) return;
    const deckRect = deckElem.getBoundingClientRect();
    // Fallback to hand center if slot not available
    let endX, endY;
    if (slotElem) {
      const slotRect = slotElem.getBoundingClientRect();
      endX = slotRect.left + slotRect.width / 2;
      endY = slotRect.top + slotRect.height / 2;
    } else {
      const handRect = handElem.getBoundingClientRect();
      endX = handRect.left + handRect.width / 2;
      endY = handRect.top + handRect.height / 2;
    }
    // Start position: deck center
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;
    setFlyingCard(card);
    setFlyingStyle({
      position: 'fixed',
      left: startX - 30, // card width/2
      top: startY - 45,  // card height/2
      width: 60,
      height: 90,
      zIndex: 3000,
      transition: 'transform 0.45s cubic-bezier(.22,1.2,.36,1)',
      transform: 'translate(0,0) scale(1) rotateY(0deg)',
      opacity: 1,
    });
    // Animate to hand after a tick
    setTimeout(() => {
      setFlyingStyle((prev) => ({
        ...prev,
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.3) rotateY(180deg)`,
        opacity: 1,
      }));
    }, 20);
    // Animate shrink to fit
    setTimeout(() => {
      setFlyingStyle((prev) => ({
        ...prev,
        transition: 'transform 0.22s cubic-bezier(.22,1.2,.36,1)',
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1) rotateY(180deg)`,
        opacity: 1,
      }));
    }, 350);
    // After shrink, add card to hand
    setTimeout(() => {
      setPlayerHand((prev) => [...prev, card]);
      setFlyingCard(null);
      setDealQueue((prev) => prev.slice(1));
      // If this was the last card, finish dealing
      if (dealQueue.length === 1) {
        setDealing(false);
        setMessage('Your turn!');
      }
    }, 570);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealing, flyingCard, dealQueue]);

  const handleDrawCard = () => {
    if (gameOver || drawPile.length === 0) return;
    // Draw a card from the pile
    const newPile = [...drawPile];
    const card = newPile.pop();
    setDrawPile(newPile);
    setPlayerHand([...playerHand, card]);
    setMessage(`You drew a card: ${card.name}`);
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
        const newHand = [...playerHand, extraCard];
        setPlayerHand(newHand);
        setMessage(`Correct! You drew an extra card: ${extraCard.name}`);
      } else {
        setMessage('Correct! But there are no more cards to draw.');
      }
      
      // Deal damage to opponent
      setPlayerHP(Math.max(0, playerHP - 10)); // Deal 10 damage
    } else {
      setMessage('Incorrect! Try again next time.');
    }
    
    // Close modal after a delay
    setTimeout(() => {
      setShowQuestionModal(false);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setQuestionResult(null);
    }, 2000);
  };

  const playCard = (cardIndex) => {
    if (gameOver) return;
    const cardToPlay = playerHand[cardIndex];
    if (!cardToPlay) return;
    if (cardToPlay.type === CARD_TYPES.QUESTION) {
      setSelectedCard(cardToPlay);
      setShowSidePanel(true);
    }
    // Remove the card from hand after playing (optional, or after answering question)
  };

  const endTurnLogic = (shouldDrawOnEnd = true) => {
    if (gameOver) return;

    // Normal turn ending
    setGameOver(true);
    setMessage(`Game Over!`);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, card, handIndex) => {
    if (gameOver) return;
    setSelectedCard({ ...card, handIndex });
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
    if (selectedCard && !gameOver) {
      playCard(selectedCard.handIndex); 
    }
    setSelectedCard(null);
  };

  const handleDragEnd = () => {
    setSelectedCard(null);
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

  // Show overlay before game starts
  if (showStartOverlay) {
    return (
      <GameStartOverlay
        playerName={user?.firstName || 'You'}
        opponentName="AI Opponent"
        onStart={() => { setShowStartOverlay(false); setStartDealing(true); }}
      />
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

  return (
    <div className="exploding-kittens-game">
      <h2>Exploding Kittens</h2>

      {/* Game Info & Play Area (Middle) */}
      <div className="center-console" ref={playAreaRef}>
        <div className="game-info">
          <p>Draw Pile: {drawPile.length} cards</p>
          <p className="game-message">{message}</p>
        </div>
        <div 
          className={`play-area ${isDraggingOverPlayArea ? 'drag-over' : ''}`}
          onDragOver={handleDragOverPlayArea}
          onDragLeave={handleDragLeavePlayArea}
          onDrop={handleDropOnPlayArea}
        >
          {/* Deck pile in the center during dealing */}
          {dealing && <DeckPile count={drawPile.length} dealing={dealing} />}
          {!dealing && 'Drop card here to play'}
          {/* Flying card animation */}
          {flyingCard && (
            <div style={flyingStyle} className="flying-card">
              <div className="deck-card flip" />
            </div>
          )}
        </div>
      </div>
      
      {/* Current Player's Hand Area (Bottom) */}
      <div className="player-hand-display current-player-hand-area current-player-active" ref={handAreaRef} style={{ position: 'relative' }}>
        <div className="player-info">
          <div className="player-header">
            <h3>{user?.firstName || 'You'}</h3>
          </div>
          <HPBar hp={playerHP} maxHp={MAX_HP} />
        </div>
        <Hand hand={playerHand} onCardClick={playCard} nextSlotRef={dealing && dealQueue.length > 0 ? nextSlotRef : undefined} />
      </div>

      {/* Actions Area */}
      <div className="actions-area">
        <button 
          onClick={handleDrawCard} 
          disabled={drawPile.length === 0 || gameOver || dealing} 
          className="ek-button draw-button"
        >
          Draw Card
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
        <QuestionModal
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          questionResult={questionResult}
          onAnswer={handleQuestionAnswer}
          onClose={() => {
            setShowQuestionModal(false);
            setCurrentQuestion(null);
            setSelectedAnswer(null);
            setQuestionResult(null);
          }}
        />
      )}
    </div>
  );
};

export default ExplodingKittensGame;