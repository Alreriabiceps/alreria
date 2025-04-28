import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import { io } from "socket.io-client";
import styles from "./Pvp.module.css";
import axios from "axios";

// Custom hook to check if component is mounted
const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

// --- Mock Data ---
const QUESTIONS_DATA = {
  math: [
    {
      id: "math1",
      text: "What is 15 * 3?",
      options: ["40", "45", "50", "35"],
      correct: "45",
      subject: "math"
    },
    {
      id: "math2",
      text: "What is the square root of 144?",
      options: ["12", "14", "16", "10"],
      correct: "12",
      subject: "math"
    },
    {
      id: "math3",
      text: "What is 20% of 150?",
      options: ["25", "30", "35", "40"],
      correct: "30",
      subject: "math"
    },
    {
      id: "math4",
      text: "What is the value of π (pi) to two decimal places?",
      options: ["3.14", "3.16", "3.12", "3.18"],
      correct: "3.14",
      subject: "math"
    },
    {
      id: "math5",
      text: "What is 8 squared?",
      options: ["64", "56", "72", "48"],
      correct: "64",
      subject: "math"
    }
  ],
  science: [
    {
      id: "science1",
      text: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondrion", "Chloroplast"],
      correct: "Mitochondrion",
      subject: "science"
    },
    {
      id: "science2",
      text: "What element does 'Fe' represent?",
      options: ["Gold", "Silver", "Iron", "Lead"],
      correct: "Iron",
      subject: "science"
    },
    {
      id: "science3",
      text: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correct: "Carbon Dioxide",
      subject: "science"
    },
    {
      id: "science4",
      text: "Which planet is known as the Red Planet?",
      options: ["Jupiter", "Mars", "Venus", "Saturn"],
      correct: "Mars",
      subject: "science"
    },
    {
      id: "science5",
      text: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "O2", "H2"],
      correct: "H2O",
      subject: "science"
    }
  ],
  history: [
    {
      id: "history1",
      text: "Who painted the Mona Lisa?",
      options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
      correct: "Leonardo da Vinci",
      subject: "history"
    },
    {
      id: "history2",
      text: "In which year did World War II end?",
      options: ["1943", "1944", "1945", "1946"],
      correct: "1945",
      subject: "history"
    },
    {
      id: "history3",
      text: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
      correct: "George Washington",
      subject: "history"
    },
    {
      id: "history4",
      text: "Which ancient wonder was located in Alexandria?",
      options: ["Colossus of Rhodes", "Lighthouse", "Hanging Gardens", "Temple of Artemis"],
      correct: "Lighthouse",
      subject: "history"
    },
    {
      id: "history5",
      text: "Who wrote 'The Communist Manifesto'?",
      options: ["Karl Marx", "Friedrich Engels", "Vladimir Lenin", "Joseph Stalin"],
      correct: "Karl Marx",
      subject: "history"
    }
  ],
  geography: [
    {
      id: "geo1",
      text: "Capital of Japan?",
      options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correct: "Tokyo",
      subject: "geography"
    },
    {
      id: "geo2",
      text: "Smallest country in the world?",
      options: ["Monaco", "Nauru", "Vatican City", "San Marino"],
      correct: "Vatican City",
      subject: "geography"
    },
    {
      id: "geo3",
      text: "Which is the largest ocean on Earth?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correct: "Pacific",
      subject: "geography"
    },
    {
      id: "geo4",
      text: "What is the longest river in the world?",
      options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
      correct: "Nile",
      subject: "geography"
    },
    {
      id: "geo5",
      text: "Which country has the most natural lakes?",
      options: ["Canada", "Russia", "United States", "Finland"],
      correct: "Canada",
      subject: "geography"
    }
  ],
  literature: [
    {
      id: "lit1",
      text: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correct: "William Shakespeare",
      subject: "literature"
    },
    {
      id: "lit2",
      text: "What is the main theme of '1984' by George Orwell?",
      options: ["Love", "Totalitarianism", "Adventure", "Family"],
      correct: "Totalitarianism",
      subject: "literature"
    },
    {
      id: "lit3",
      text: "Who wrote 'The Great Gatsby'?",
      options: ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"],
      correct: "F. Scott Fitzgerald",
      subject: "literature"
    },
    {
      id: "lit4",
      text: "What is the first book in the Harry Potter series?",
      options: ["Chamber of Secrets", "Philosopher's Stone", "Prisoner of Azkaban", "Goblet of Fire"],
      correct: "Philosopher's Stone",
      subject: "literature"
    },
    {
      id: "lit5",
      text: "Who wrote 'Pride and Prejudice'?",
      options: ["Emily Brontë", "Charlotte Brontë", "Jane Austen", "Virginia Woolf"],
      correct: "Jane Austen",
      subject: "literature"
    }
  ],
  technology: [
    {
      id: "tech1",
      text: "What is 'const' in JavaScript?",
      options: ["Function", "Variable (reassignable)", "Variable (constant reference)", "Loop"],
      correct: "Variable (constant reference)",
      subject: "technology"
    },
    {
      id: "tech2",
      text: "What does HTML stand for?",
      options: ["HyperText Markup Language", "HighTech Machine Learning", "HyperTransfer Markup Language", "Hyperlink Text Mode Language"],
      correct: "HyperText Markup Language",
      subject: "technology"
    },
    {
      id: "tech3",
      text: "What is the main purpose of CSS?",
      options: ["Structure", "Behavior", "Styling", "Data Storage"],
      correct: "Styling",
      subject: "technology"
    },
    {
      id: "tech4",
      text: "What does 'API' stand for?",
      options: ["Application Programming Interface", "Advanced Program Interaction", "Applied Process Integration", "Automated Programming Input"],
      correct: "Application Programming Interface",
      subject: "technology"
    },
    {
      id: "tech5",
      text: "Which of these is not a programming language?",
      options: ["Python", "Java", "HTML", "Ruby"],
      correct: "HTML",
      subject: "technology"
    }
  ]
};

const MAX_HP = 100;
const DAMAGE = 20;
const ANSWER_TIME_LIMIT = 30; // Seconds
const INITIAL_CARDS = 5; // Cards per player

// --- Game States ---
const GAME_STATE = {
  WAITING: "WAITING",
  COIN_FLIP: "COIN_FLIP",
  SUBJECT_SELECTION: "SUBJECT_SELECTION",
  CARD_SELECTION: "CARD_SELECTION",
  PLAYER_SELECT_CARD: "PLAYER_SELECT_CARD",
  PLAYER_CONFIRM_ASK: "PLAYER_CONFIRM_ASK",
  WAITING_OPPONENT_ANSWER: "WAITING_OPPONENT_ANSWER",
  OPPONENT_SELECT_CARD: "OPPONENT_SELECT_CARD",
  PLAYER_ANSWERING: "PLAYER_ANSWERING",
  SHOWING_FEEDBACK: "SHOWING_FEEDBACK",
  GAME_OVER: "GAME_OVER",
  RPS: "RPS",
};

const SUBJECTS = [
  { id: "680ccf6184af7139d0350489", name: "Effective Communication", icon: "💬" },
  { id: "680ccf6d84af7139d035048d", name: "General Math", icon: "📐" },
  { id: "680ccf6884af7139d035048b", name: "General Science", icon: "🔬" },
  { id: "680ccf7b84af7139d0350491", name: "Life Skills", icon: "🌟" },
  { id: "680ccf7684af7139d035048f", name: "Pag-aaral ng Kasaysayan", icon: "📚" }
];

const RPS_CHOICES = [
  { id: 'rock', icon: '✊', beats: 'scissors' },
  { id: 'paper', icon: '✋', beats: 'rock' },
  { id: 'scissors', icon: '✌️', beats: 'paper' }
];

const Pvp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isMounted = useIsMounted();
  const [gameState, setGameState] = useState(GAME_STATE.RPS);
  const [playerInfo, setPlayerInfo] = useState({
    name: user?.username || "Player",
    hp: MAX_HP,
  });
  const [opponentInfo, setOpponentInfo] = useState({
    name: "Demo Opponent",
    hp: MAX_HP,
  });
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionBeingAsked, setQuestionBeingAsked] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, correct: null, message: "" });
  const [gameMessage, setGameMessage] = useState("Waiting for game to start...");
  const [turn, setTurn] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [attackingState, setAttackingState] = useState(null);
  const [playerHpShake, setPlayerHpShake] = useState(false);
  const [opponentHpShake, setOpponentHpShake] = useState(false);
  const [timerValue, setTimerValue] = useState(ANSWER_TIME_LIMIT);
  const timerRef = useRef(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [rpsChoice, setRpsChoice] = useState(null);
  const [opponentRpsChoice, setOpponentRpsChoice] = useState(null);
  const [rpsResult, setRpsResult] = useState(null);

  // Demo questions for testing
  const demoQuestions = [
    {
      id: 1,
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
      subject: "math"
    },
    {
      id: 2,
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
      subject: "geography"
    },
    {
      id: 3,
      text: "What is the chemical symbol for gold?",
      options: ["Ag", "Au", "Fe", "Cu"],
      correctAnswer: 1,
      subject: "science"
    }
  ];

  // Initialize demo game
  useEffect(() => {
    setAvailableQuestions(demoQuestions);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Function to fetch questions from backend
  const fetchQuestions = async (subjectId) => {
    try {
      setIsLoadingQuestions(true);
      setError(null);

      const response = await axios.get(`http://localhost:5000/api/questions/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Transform the backend question format to match our frontend format
      const transformedQuestions = response.data.map(question => ({
        id: question._id,
        text: question.questionText,
        options: question.choices,
        correctAnswer: question.correctAnswer,
        subject: question.subject._id
      }));

      setAvailableQuestions(transformedQuestions);
      return transformedQuestions;
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to fetch questions. Please try again.");
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const determineRpsWinner = (playerChoice, opponentChoice) => {
    if (playerChoice === opponentChoice) return 'draw';
    return RPS_CHOICES.find(choice => choice.id === playerChoice).beats === opponentChoice ? 'player' : 'opponent';
  };

  const handleRpsChoice = (choice) => {
    setRpsChoice(choice);
    // Simulate opponent choice (in real game, this would come from the server)
    const randomChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)].id;
    setOpponentRpsChoice(randomChoice);

    const result = determineRpsWinner(choice, randomChoice);
    setRpsResult(result);

    // After 2 seconds, move to subject selection
    setTimeout(() => {
      setGameState(GAME_STATE.SUBJECT_SELECTION);
      setTurn(result === 'player' ? 'player' : 'opponent');
    }, 2000);
  };

  // Handle subject selection
  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    setGameState(GAME_STATE.CARD_SELECTION);

    // Fetch questions for the selected subject
    const questions = await fetchQuestions(subject.id);
    if (questions.length === 0) {
      setGameMessage("No questions available for this subject. Please try another subject.");
      setGameState(GAME_STATE.SUBJECT_SELECTION);
      return;
    }
  };

  // Handle question selection
  const handleQuestionSelect = (question) => {
    if (selectedQuestions.length >= INITIAL_CARDS) return;
    setSelectedQuestions([...selectedQuestions, question]);
  };

  // Handle question deselection
  const handleQuestionDeselect = (question) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
  };

  // Handle confirming questions
  const handleConfirmQuestions = () => {
    if (selectedQuestions.length !== INITIAL_CARDS) return;

    // Deal cards to both players
    const playerCards = [...selectedQuestions];
    const opponentCards = [...demoQuestions.filter(q => !selectedQuestions.some(sq => sq.id === q.id))].slice(0, INITIAL_CARDS);

    setPlayerHand(playerCards);
    setOpponentHand(opponentCards);
    setGameState(GAME_STATE.PLAYER_SELECT_CARD);
  };

  // Handle card click
  const handleCardClick = (index) => {
    if (turn !== "player" || gameState !== GAME_STATE.PLAYER_SELECT_CARD) return;

    const card = playerHand[index];
    setSelectedCardIndex(index);
    setQuestionBeingAsked(card);
    setGameState(GAME_STATE.PLAYER_CONFIRM_ASK);
  };

  // Handle confirm ask
  const handleConfirmAsk = () => {
    if (!questionBeingAsked) return;

    setGameState(GAME_STATE.PLAYER_ANSWERING);
    setCurrentQuestion(questionBeingAsked);
    setQuestionBeingAsked(null);
    setSelectedCardIndex(null);
    startTimer();
  };

  // Handle answer selection
  const handleSelectAnswer = (option) => {
    setSelectedAnswer(option);
  };

  // Handle confirm answer
  const handleConfirmAnswer = (timedOut = false) => {
    if (!currentQuestion || selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const damage = isCorrect ? 0 : DAMAGE;

    // Update opponent's HP
    setOpponentInfo(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - damage)
    }));

    // Show feedback
    setFeedback({
      show: true,
      correct: isCorrect,
      message: isCorrect ? "Correct!" : "Wrong!"
    });

    // Trigger HP shake animation
    setOpponentHpShake(true);
    setTimeout(() => setOpponentHpShake(false), 500);

    // Check if game is over
    if (opponentInfo.hp - damage <= 0) {
      setTimeout(() => {
        setGameState(GAME_STATE.GAME_OVER);
        setGameMessage("You won!");
      }, 1500);
      return;
    }

    // Switch turns after delay
    setTimeout(() => {
      setFeedback({ show: false, correct: null, message: "" });
      setSelectedAnswer(null);
      setCurrentQuestion(null);
      setTurn("opponent");
      handleOpponentTurn();
    }, 1500);
  };

  // Handle opponent turn
  const handleOpponentTurn = () => {
    if (opponentHand.length === 0) {
      setGameState(GAME_STATE.GAME_OVER);
      setGameMessage("You won! Opponent ran out of cards.");
      return;
    }

    // Simulate opponent selecting a random card
    const randomIndex = Math.floor(Math.random() * opponentHand.length);
    const selectedCard = opponentHand[randomIndex];

    // Remove card from opponent's hand
    setOpponentHand(prev => prev.filter((_, i) => i !== randomIndex));

    // Simulate opponent asking the question
    setCurrentQuestion(selectedCard);
    setGameState(GAME_STATE.PLAYER_ANSWERING);
    startTimer();
  };

  // Timer functions
  const startTimer = () => {
    setTimerValue(ANSWER_TIME_LIMIT);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimerValue(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimerEnd = () => {
    if (gameState === GAME_STATE.PLAYER_ANSWERING) {
      handleConfirmAnswer(true);
    }
  };

  // Handle surrender
  const handleSurrender = () => {
    setGameState(GAME_STATE.GAME_OVER);
    setGameMessage("You surrendered!");
  };

  // Handle play again
  const handlePlayAgain = () => {
    setGameState(GAME_STATE.RPS);
    setPlayerInfo({ ...playerInfo, hp: MAX_HP });
    setOpponentInfo({ ...opponentInfo, hp: MAX_HP });
    setPlayerHand([]);
    setOpponentHand([]);
    setCurrentQuestion(null);
    setQuestionBeingAsked(null);
    setSelectedAnswer(null);
    setFeedback({ show: false, correct: null, message: "" });
    setGameMessage("Waiting for game to start...");
    setTurn(null);
    setSelectedSubject(null);
    setSelectedQuestions([]);
    setAvailableQuestions(demoQuestions);
  };

  // --- Rendering Helpers ---
  const renderPlayerHandCard = (card, index) => {
    const isSelected = selectedCardIndex === index;
    const canSelect = gameState === GAME_STATE.PLAYER_SELECT_CARD && turn === "player";

    return (
      <div
        key={`p-card-${card.id}-${index}`}
        className={`
          ${styles.card}
          ${styles.playerHandCard}
          ${isSelected ? styles.selected : ""}
          ${canSelect ? styles.selectable : ""}
        `}
        onClick={canSelect ? () => handleCardClick(index) : undefined}
        title={canSelect ? `Select Question ${index + 1}` : `Question ${index + 1}`}
      >
        <div className={styles.cardArtPlaceholder}>?</div>
        <div className={styles.cardTextPreview}>
          {card.text.substring(0, 40)}
          {card.text.length > 40 ? "..." : ""}
        </div>
      </div>
    );
  };

  const renderOpponentHandCard = (card, index /* ... (remains same) ... */) => (
    <div
      key={`o-card-${index}`}
      className={`${styles.card} ${styles.opponentHandCard}`}
      title="Opponent Card"
    >
      <div className={styles.cardBack}></div>
    </div>
  );

  const renderAnswerOption = (option, index) => {
    /* ... (remains same) ... */
    const isSelected = selectedAnswer === option;
    return (
      <button
        key={index}
        className={`${styles.answerButton} ${isSelected ? styles.selectedAnswer : ""
          }`}
        onClick={() => handleSelectAnswer(option)}
        disabled={gameState !== GAME_STATE.PLAYER_ANSWERING || feedback.show}
      >
        {option}
      </button>
    );
  };

  const getHpBarFillClass = (hp) => {
    /* ... (remains same) ... */
    const percentage = (hp / MAX_HP) * 100;
    let className = styles.hpBarFill;
    if (percentage <= 25) className += ` ${styles.lowHp}`;
    else if (percentage <= 50) className += ` ${styles.mediumHp}`;
    return className;
  };

  // --- Main Render Output ---
  return (
    <div className={styles.gameAreaWrapper}>
      <div className={styles.duelContainer}>
        {gameState === GAME_STATE.RPS && (
          <div className={styles.rpsContainer}>
            <h2>Choose Your Move</h2>
            <div className={styles.rpsChoices}>
              {RPS_CHOICES.map(choice => (
                <div
                  key={choice.id}
                  className={`${styles.rpsChoice} ${rpsChoice === choice.id ? styles.selected : ''}`}
                  onClick={() => !rpsChoice && handleRpsChoice(choice.id)}
                >
                  <span className={styles.rpsIcon}>{choice.icon}</span>
                </div>
              ))}
            </div>

            {rpsResult && (
              <div className={styles.rpsResult}>
                <div className={styles.rpsPlayers}>
                  <div className={styles.rpsPlayer}>
                    <div className={`${styles.rpsPlayerChoice} ${rpsResult === 'player' ? styles.winner : ''}`}>
                      {RPS_CHOICES.find(c => c.id === rpsChoice)?.icon}
                    </div>
                    <div className={styles.rpsPlayerName}>You</div>
                  </div>
                  <div className={styles.rpsPlayer}>
                    <div className={`${styles.rpsPlayerChoice} ${rpsResult === 'opponent' ? styles.winner : ''}`}>
                      {RPS_CHOICES.find(c => c.id === opponentRpsChoice)?.icon}
                    </div>
                    <div className={styles.rpsPlayerName}>Opponent</div>
                  </div>
                </div>
                <div className={styles.rpsResultMessage}>
                  {rpsResult === 'draw' ? "It's a draw!" : `${rpsResult === 'player' ? 'You' : 'Opponent'} won!`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subject Selection Screen */}
        {gameState === GAME_STATE.SUBJECT_SELECTION && (
          <div className={styles.subjectSelectionContainer}>
            <h2>Choose a Subject</h2>
            <div className={styles.subjectGrid}>
              {SUBJECTS.map(subject => (
                <button
                  key={subject.id}
                  className={styles.subjectButton}
                  onClick={() => handleSubjectSelect(subject)}
                >
                  <span className={styles.subjectIcon}>{subject.icon}</span>
                  <span className={styles.subjectName}>{subject.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Selection Screen */}
        {gameState === GAME_STATE.CARD_SELECTION && (
          <div className={styles.cardSelectionContainer}>
            <h2>Select {INITIAL_CARDS} Questions</h2>
            {isLoadingQuestions ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading questions...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorText}>{error}</p>
                <button
                  className={styles.retryButton}
                  onClick={() => handleSubjectSelect(selectedSubject)}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className={styles.cardSelectionGrid}>
                  <div className={styles.availableQuestions}>
                    <h3>Available Questions</h3>
                    {availableQuestions.map(question => (
                      <div
                        key={question.id}
                        className={styles.questionCard}
                        onClick={() => handleQuestionSelect(question)}
                      >
                        <p>{question.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className={styles.selectedQuestions}>
                    <h3>Selected Questions ({selectedQuestions.length}/{INITIAL_CARDS})</h3>
                    {selectedQuestions.map(question => (
                      <div
                        key={question.id}
                        className={styles.questionCard}
                        onClick={() => handleQuestionDeselect(question)}
                      >
                        <p>{question.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className={styles.confirmButton}
                  onClick={handleConfirmQuestions}
                  disabled={selectedQuestions.length !== INITIAL_CARDS}
                >
                  Confirm Selection
                </button>
              </>
            )}
          </div>
        )}

        {/* Main Game Screen */}
        {gameState !== GAME_STATE.RPS &&
          gameState !== GAME_STATE.SUBJECT_SELECTION &&
          gameState !== GAME_STATE.CARD_SELECTION && (
            <>
              {/* === Opponent Area === */}
              <div className={`${styles.playerInfoArea} ${styles.opponentInfoArea}`}>
                {/* HP Container with Shake */}
                <div
                  className={`${styles.hpContainer} ${opponentHpShake ? styles.shakeHp : ""
                    }`}
                >
                  <div className={styles.username}>{opponentInfo.name}</div>
                  <div className={styles.hpBarContainer}>
                    <div
                      className={getHpBarFillClass(opponentInfo.hp)}
                      style={{ width: `${(opponentInfo.hp / MAX_HP) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles.hpText}>
                    {opponentInfo.hp} / {MAX_HP}
                  </div>
                </div>
                <div className={`${styles.handArea} ${styles.opponentHandArea}`}>
                  {opponentHand.map(renderOpponentHandCard)}
                  <div className={styles.cardCount}>{opponentHand.length}</div>
                </div>
              </div>

              {/* === Field / Central Area === */}
              <div
                className={`${styles.fieldArea} ${attackingState ? styles.attackingGlow : ""
                  }`}
              >
                {/* Conditionally add attack animation class */}
                <div
                  className={`
                        ${styles.centerContentContainer}
                        ${attackingState === "player"
                      ? styles.playerAttackingAnim
                      : ""
                    }
                        ${attackingState === "opponent"
                      ? styles.opponentAttackingAnim
                      : ""
                    }
                     `}
                >
                  {/* Feedback Display */}
                  {feedback.show /* ... feedback box ... */ && (
                    <div
                      className={`${styles.centerDisplayBox} ${styles.feedbackBox} ${feedback.correct === true
                        ? styles.correctFeedback
                        : feedback.correct === false
                          ? styles.wrongFeedback
                          : ""
                        }`}
                    >
                      {" "}
                      <p>{feedback.message}</p>{" "}
                    </div>
                  )}
                  {/* Question Player is Asking (Confirmation Stage) */}
                  {gameState === GAME_STATE.PLAYER_CONFIRM_ASK &&
                    questionBeingAsked &&
                    !feedback.show /* ... ask confirm box ... */ && (
                      <div
                        className={`${styles.centerDisplayBox} ${styles.askConfirmBox}`}
                      >
                        {" "}
                        <p className={styles.askQuestionText}>Ask opponent:</p>{" "}
                        <p className={styles.questionTextConfirm}>
                          "{questionBeingAsked.text}"
                        </p>{" "}
                        <button
                          className={`${styles.gameButton} ${styles.confirmButton}`}
                          onClick={handleConfirmAsk}
                        >
                          {" "}
                          Confirm & Ask{" "}
                        </button>{" "}
                      </div>
                    )}
                  {/* Question Player is Answering */}
                  {gameState === GAME_STATE.PLAYER_ANSWERING &&
                    currentQuestion &&
                    !feedback.show /* ... answer box ... */ && (
                      <div
                        className={`${styles.centerDisplayBox} ${styles.answerBox}`}
                      >
                        {" "}
                        <div className={styles.timerDisplay}>
                          Time: {timerValue}s
                        </div>{" "}
                        <p className={styles.questionText}>{currentQuestion.text}</p>{" "}
                        <div className={styles.answerOptions}>
                          {" "}
                          {currentQuestion.options.map(renderAnswerOption)}{" "}
                        </div>{" "}
                        <button
                          className={`${styles.gameButton} ${styles.confirmButton}`}
                          onClick={() => handleConfirmAnswer(false)}
                          disabled={selectedAnswer === null || feedback.show}
                          style={{ marginTop: "15px" }}
                        >
                          {" "}
                          Confirm Answer{" "}
                        </button>{" "}
                      </div>
                    )}
                  {/* General Game Message / Placeholder */}
                  {!currentQuestion &&
                    !questionBeingAsked &&
                    !feedback.show &&
                    gameState !== GAME_STATE.GAME_OVER /* ... message box ... */ && (
                      <div
                        className={`${styles.centerDisplayBox} ${styles.messageBox}`}
                      >
                        {" "}
                        <p>{gameMessage}</p>{" "}
                      </div>
                    )}
                </div>
              </div>

              {/* === Player Area === */}
              <div
                className={`${styles.playerInfoArea} ${styles.playerInfoAreaLocal}`}
              >
                <div className={`${styles.handArea} ${styles.playerHandArea}`}>
                  {playerHand.map(renderPlayerHandCard)}
                  <div className={styles.cardCount}>{playerHand.length}</div>
                </div>
                {/* HP Container with Shake */}
                <div
                  className={`${styles.hpContainer} ${playerHpShake ? styles.shakeHp : ""
                    }`}
                >
                  <div className={styles.username}>{playerInfo.name}</div>
                  <div className={styles.hpBarContainer}>
                    <div
                      className={getHpBarFillClass(playerInfo.hp)}
                      style={{ width: `${(playerInfo.hp / MAX_HP) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles.hpText}>
                    {playerInfo.hp} / {MAX_HP}
                  </div>
                  {turn === "player" &&
                    (gameState === GAME_STATE.PLAYER_SELECT_CARD ||
                      gameState === GAME_STATE.PLAYER_CONFIRM_ASK) &&
                    !feedback.show && (
                      <button
                        className={`${styles.gameButton} ${styles.surrenderButton}`}
                        onClick={handleSurrender}
                      >
                        {" "}
                        Surrender{" "}
                      </button>
                    )}
                </div>
              </div>

              {/* Game Over Overlay */}
              {gameState === GAME_STATE.GAME_OVER /* ... game over overlay ... */ && (
                <div className={styles.gameOverOverlay}>
                  {" "}
                  <h2>
                    {turn === "player"
                      ? "Victory!"
                      : turn === "opponent"
                        ? "Defeat!"
                        : "It's a Draw!"}
                  </h2>{" "}
                  <p>{gameMessage}</p>{" "}
                  <button
                    className={`${styles.gameButton} ${styles.playAgainButton}`}
                    onClick={handlePlayAgain}
                  >
                    {" "}
                    Play Again?{" "}
                  </button>{" "}
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default Pvp;