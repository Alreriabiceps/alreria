import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './demo.css';
import Hand from './components/Hand';
import HPBar from './components/HPBar';
import QuestionModal from './components/QuestionModal';
import GameStartOverlay from './components/GameStartOverlay';
import { useAuth } from '../../../../../contexts/AuthContext';
import DeckPile from './components/DeckPile';
import ParticleBurst from './components/ParticleBurst';

// --- Card Definitions ---
const CARD_TYPES = {
  SPECIAL: 'SPECIAL',
  QUESTION: 'QUESTION',
};

const createCard = (id, type, questionData = null) => ({
  id,
  type,
  name: type === CARD_TYPES.QUESTION ? 'Question Card' : type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
  questionData,
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

  // Add Special cards (previously Exploding Kittens, now generic)
  for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
    pile.push(createCard(pile.length + 1, CARD_TYPES.SPECIAL));
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
const QuizCardGame = () => {
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
  const [dealQueue, setDealQueue] = useState([]);
  const CARDS_TO_DEAL = 7;
  const { user } = useAuth();
  const playAreaRef = useRef(null);
  const handAreaRef = useRef(null);
  const [flyingCard, setFlyingCard] = useState(null);
  const [flyingStyle, setFlyingStyle] = useState({});
  const nextSlotRef = useRef(null);
  const [spellHand, setSpellHand] = useState([]);
  const [isDraggingOverSpellArea, setIsDraggingOverSpellArea] = useState(false);

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
      setDealQueue(initialPile.slice(-CARDS_TO_DEAL));
      setDrawPile(initialPile.slice(0, -CARDS_TO_DEAL));
      setDealing(true);
    };
    setupSinglePlayerGame();
  }, [startDealing]);

  // Animate dealing cards one by one
  useEffect(() => {
    if (!dealing || flyingCard || dealQueue.length === 0) return;
    const card = dealQueue[0];
    const deckElem = playAreaRef.current?.querySelector('.deck-pile');
    const slotElem = nextSlotRef.current;
    const handElem = handAreaRef.current;
    if (!deckElem || !handElem) return;
    const deckRect = deckElem.getBoundingClientRect();
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
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;
    setFlyingCard(card);
    setFlyingStyle({
      position: 'fixed',
      left: startX - 30,
      top: startY - 45,
      width: 60,
      height: 90,
      zIndex: 3000,
      transition: 'transform 0.45s cubic-bezier(.22,1.2,.36,1)',
      transform: 'translate(0,0) scale(1) rotateY(0deg)',
      opacity: 1,
    });
    setTimeout(() => {
      setFlyingStyle((prev) => ({
        ...prev,
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.3) rotateY(180deg)`,
        opacity: 1,
      }));
    }, 20);
    setTimeout(() => {
      setFlyingStyle((prev) => ({
        ...prev,
        transition: 'transform 0.22s cubic-bezier(.22,1.2,.36,1)',
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1) rotateY(180deg)`,
        opacity: 1,
      }));
    }, 350);
    setTimeout(() => {
      setPlayerHand((prev) => [...prev, card]);
      setFlyingCard(null);
      setDealQueue((prev) => prev.slice(1));
      if (dealQueue.length === 1) {
        setDealing(false);
        setMessage('Your turn!');
      }
    }, 570);
  }, [dealing, flyingCard, dealQueue]);

  const handleDrawCard = () => {
    if (gameOver || drawPile.length === 0) return;
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
      setPlayerHP(Math.max(0, playerHP - 10));
    } else {
      setMessage('Incorrect! Try again next time.');
    }
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
  };

  const endTurnLogic = (shouldDrawOnEnd = true) => {
    if (gameOver) return;
    setGameOver(true);
    setMessage(`Game Over!`);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, card, handIndex, fromSpellHand = false) => {
    if (gameOver) return;
    setSelectedCard({ ...card, handIndex, fromSpellHand });
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id, handIndex, fromSpellHand }));
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
    setIsDraggingOverPlayArea(false);
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

  const handleDragOverSpellArea = (e) => {
    e.preventDefault();
    setIsDraggingOverSpellArea(true);
  };

  const handleDragLeaveSpellArea = (e) => {
    setIsDraggingOverSpellArea(false);
  };

  const handleDropOnSpellArea = (e) => {
    e.preventDefault();
    setIsDraggingOverSpellArea(false);
    if (selectedCard && selectedCard.type === CARD_TYPES.SPECIAL && !gameOver) {
      if (!selectedCard.fromSpellHand) {
        const card = playerHand[selectedCard.handIndex];
        setPlayerHand(playerHand.filter((_, idx) => idx !== selectedCard.handIndex));
        setSpellHand([...spellHand, card]);
      } else {
        const card = spellHand[selectedCard.handIndex];
        setSpellHand(spellHand.filter((_, idx) => idx !== selectedCard.handIndex));
        setPlayerHand([...playerHand, card]);
      }
    }
    setSelectedCard(null);
  };

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
        <div className="quiz-card-game game-over">
            <h1>Game Over!</h1>
            <p>{message}</p>
            <button onClick={() => window.location.reload()} className="ek-button">Play Again?</button>
        </div>
    );
  }

  return (
    <div className="quiz-card-game compact-layout">
      <div className="top-bar">
        <div className="game-info">
          <p>Draw Pile: {drawPile.length} cards</p>
          <p className="game-message">{message}</p>
        </div>
        <div className="actions-area">
          <button 
            onClick={handleDrawCard} 
            disabled={drawPile.length === 0 || gameOver || dealing} 
            className="ek-button draw-button"
          >
            Draw Card
          </button>
        </div>
      </div>
      <div className="main-board">
        <div className="center-console">
          <div 
            className={`play-area${isDraggingOverPlayArea ? ' drag-over' : ''}`}
            ref={playAreaRef}
            onDragOver={handleDragOverPlayArea}
            onDragLeave={handleDragLeavePlayArea}
            onDrop={handleDropOnPlayArea}
          >
            {dealing && <DeckPile count={drawPile.length} dealing={dealing} />}
            {!dealing && 'Drop card here to play'}
            {flyingCard && (
              <div style={flyingStyle} className="flying-card">
                <div className="deck-card flip" />
              </div>
            )}
          </div>
        </div>
        <div className="player-hand-area">
          <div className="player-info">
            <div className="player-header">
              <h3>{user?.firstName || 'You'}</h3>
            </div>
            <HPBar hp={playerHP} maxHp={MAX_HP} />
          </div>
          <Hand 
            hand={playerHand} 
            onCardClick={playCard} 
            nextSlotRef={dealing && dealQueue.length > 0 ? nextSlotRef : undefined}
            onDragStart={(e, card, idx) => handleDragStart(e, card, idx, false)}
          />
        </div>
        <div className="spell-hand-area">
          <h4>Spell Cards</h4>
          <div
            className={`spell-play-area${isDraggingOverSpellArea ? ' drag-over' : ''}`}
            onDragOver={handleDragOverSpellArea}
            onDragLeave={handleDragLeaveSpellArea}
            onDrop={handleDropOnSpellArea}
          >
            <Hand 
              hand={spellHand} 
              onCardClick={() => {}} 
              onDragStart={(e, card, idx) => handleDragStart(e, card, idx, true)}
            />
            <div className="spell-hint">Drag SPECIAL cards here</div>
          </div>
        </div>
      </div>
      {showSidePanel && selectedCard && selectedCard.type === CARD_TYPES.QUESTION && (
        <div className="side-panel">
          <button className="close-panel-button" onClick={closeSidePanel}>×</button>
          <div className="side-panel-content">
            <h3>Question Details</h3>
            <div className="question-details">
              <div style={{ marginBottom: '10px' }}>
                <div>
                  <strong>Subject:</strong>{' '}
                  {selectedCard.questionData.subjectName
                    || (typeof selectedCard.questionData.subject === 'object'
                        ? selectedCard.questionData.subject.subject
                        : selectedCard.questionData.subject)
                    || 'N/A'}
                </div>
                <div><strong>Bloom's Level:</strong> {selectedCard.questionData.bloomsLevel || 'N/A'}</div>
              </div>
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

export default QuizCardGame;