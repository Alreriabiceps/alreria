import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import { io } from "socket.io-client";
import styles from "./Pvp.module.css";
import axios from "axios";
import SubjectSelection from "../components/SubjectSelection/SubjectSelection";
import CardSelection from "../components/CardSelection/CardSelection";
import DiceRollModal from "../components/DiceRollModal/DiceRollModal";
import RpsPhase from "../components/RpsPhase/RpsPhase";
import PlayerInfo from "../components/PlayerInfo/PlayerInfo";
import OpponentInfo from "../components/OpponentInfo/OpponentInfo";
import PlayerHand from "../components/PlayerHand/PlayerHand";
import OpponentHand from "../components/OpponentHand/OpponentHand";
import GameField from "../components/GameField/GameField";
import GameOverModal from "../components/GameOverModal/GameOverModal";
import QuestionModal from "../components/QuestionModal/QuestionModal";
import { motion, AnimatePresence } from "framer-motion";
import SubjectChosenModal from '../components/SubjectSelection/SubjectChosenModal';

const STARTING_HP = 100; // Updated starting HP to match backend
const STARTING_HAND_SIZE = 5;
const DECK_SIZE = 15;
const DECK_SELECTION_COUNT = 15; // Number of questions to select for the deck

// --- Game States (Import or define, ensure consistency with backend) ---
const GAME_STATE = {
  WAITING: "WAITING",
  RPS: "RPS",
  SUBJECT_SELECTION: "SUBJECT_SELECTION",
  DECK_CREATION: "DECK_CREATION", // Add state for selecting cards from pool
  // CARD_SELECTION: "CARD_SELECTION", // Remove this, replaced by DECK_CREATION
  DICE_ROLL: "DICE_ROLL",
  AWAITING_CARD_SUMMON: "AWAITING_CARD_SUMMON",
  AWAITING_OPPONENT_ANSWER: "AWAITING_OPPONENT_ANSWER",
  TURN_RESOLUTION: "TURN_RESOLUTION", // Might not be explicitly set on FE
  PLAYER_SELECT_CARD: "PLAYER_SELECT_CARD", // This might also need review/removal later
  GAME_OVER: "GAME_OVER",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
  // Remove old/unused states if necessary
};

const SUBJECTS = [
  { id: "680ccf6184af7139d0350489", name: "Effective Communication", icon: "💬" },
  { id: "680ccf6d84af7139d035048d", name: "General Math", icon: "📐" },
  { id: "680ccf6884af7139d035048b", name: "General Science", icon: "🔬" },
  { id: "680ccf7b84af7139d0350491", name: "Life Skills", icon: "🌟" },
  { id: "680ccf7684af7139d035048f", name: "Pag-aaral ng Kasaysayan", icon: "📚" }
];

// Update HPBar to always center content
const HPBar = ({ label, hp, maxHp }) => {
  const percent = maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 100;
  return (
    <div style={{
      minWidth: 120,
      maxWidth: 160,
      margin: '0 auto',
      background: 'rgba(0,0,0,0.7)',
      border: '2px solid #00ff9d99',
      borderRadius: 0,
      padding: '2px 8px 4px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '2px 2px 0 0 #000a',
      fontFamily: 'VT323, monospace',
      color: '#e0e0e0',
      fontSize: '0.85rem',
      marginTop: 4
    }}>
      <div style={{ color: '#00ff9d', fontFamily: 'Press Start 2P, cursive', fontSize: '0.85em', marginBottom: 1, letterSpacing: 1, textShadow: '1px 1px 0 #000a' }}>{label}</div>
      <div style={{ width: 80, height: 8, background: '#222', border: '2px solid #00ff9d99', borderRadius: 0, overflow: 'hidden', marginBottom: 2, boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: percent <= 25 ? '#ff3333' : percent <= 50 ? '#ffcc00' : '#00ff9d', transition: 'width 0.4s, background-color 0.4s' }} />
      </div>
      <div style={{ color: '#e0e0e0', fontSize: '0.8em', textShadow: '1px 1px 0 #000a' }}>{hp} / {maxHp}</div>
    </div>
  );
};

const Pvp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // --- Game State & Player Info ---
  const initialLobbyId = location.state?.lobbyId || localStorage.getItem('lobbyId') || null;
  const [lobbyId, setLobbyId] = useState(initialLobbyId);
  const [gameState, setGameState] = useState(GAME_STATE.WAITING); // Start in WAITING
  const [currentTurnId, setCurrentTurnId] = useState(null); // ID of player whose turn it is
  const [myPlayerId, setMyPlayerId] = useState(user?.id || null);
  const [opponentPlayerId, setOpponentPlayerId] = useState(null);
  const [myInfo, setMyInfo] = useState({ name: user?.firstName || "Player", hp: STARTING_HP, shake: false });
  const [opponentInfo, setOpponentInfo] = useState({ name: "Waiting...", hp: STARTING_HP, shake: false });
  const [showCardDistribution, setShowCardDistribution] = useState(false);

  // --- Card & Deck State ---
  const [myHand, setMyHand] = useState([]);
  const [displayedHand, setDisplayedHand] = useState([]); // For smooth animation
  const [myDeckCount, setMyDeckCount] = useState(DECK_SIZE - STARTING_HAND_SIZE);
  const [opponentHandCount, setOpponentHandCount] = useState(STARTING_HAND_SIZE);
  const [opponentDeckCount, setOpponentDeckCount] = useState(DECK_SIZE - STARTING_HAND_SIZE);
  const [lastSummonedCardOnField, setLastSummonedCardOnField] = useState(null); // { cardId, playerId, ...? }
  const [lastPlayedSpellEffect, setLastPlayedSpellEffect] = useState(null); // { cardId, playerId, description, ...? }

  // --- Question Answering State ---
  const [activeQuestion, setActiveQuestion] = useState(null); // { id, text, options }
  // const [selectedAnswer, setSelectedAnswer] = useState(null); // Handled locally in modal?
  // const [timerValue, setTimerValue] = useState(ANSWER_TIME_LIMIT);
  // const timerRef = useRef(null);

  // --- UI & Feedback State ---
  const [gameMessage, setGameMessage] = useState("Connecting...");
  const [feedback, setFeedback] = useState({
    show: false,
    message: '',
    type: null // 'correct' or 'wrong'
  });
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [gameReady, setGameReady] = useState(false); // Both players joined
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverData, setGameOverData] = useState(null); // { winnerId, winnerName, reason, ... }

  // --- DECK_CREATION State ---
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // Added missing state

  // --- Phase Specific State ---
  // RPS
  const [rpsChoice, setRpsChoice] = useState(null);
  const [opponentRpsChoice, setOpponentRpsChoice] = useState(null);
  const [rpsResult, setRpsResult] = useState(null);
  // Subject Selection
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false); // Old modal for display only
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [modalAnimation, setModalAnimation] = useState('');
  const [subjectModalCountdown, setSubjectModalCountdown] = useState(3);
  // Dice Roll
  const [playerDiceValue, setPlayerDiceValue] = useState(null);
  const [opponentDiceValue, setOpponentDiceValue] = useState(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [bothPlayersRolled, setBothPlayersRolled] = useState(false);
  const [diceWinnerId, setDiceWinnerId] = useState(null);

  // --- Turn Flags State ---
  const [hasSummonedQuestionThisTurn, setHasSummonedQuestionThisTurn] = useState(false);
  const [hasPlayedSpellEffectThisTurn, setHasPlayedSpellEffectThisTurn] = useState(false);

  // --- Refs ---
  const isMountedRef = useRef(true);
  const gameStateRef = useRef(gameState);
  const connectionAttemptsRef = useRef(0);
  const maxConnectionAttempts = 3;
  const connectionDelayMs = 2000;

  // Ref to track previous game state for modal logic
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Add useEffect for mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    // Cleanup function sets ref to false on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  // --- Define Callbacks Used in Other Callbacks/useEffect Dependencies First ---

  const fetchQuestions = useCallback(async (subjectId) => {
    if (!subjectId) {
      console.error('No subject ID provided');
      throw new Error('Subject ID is required');
    }

    setError(null);

    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      console.log('Fetching questions for subject:', subjectId);
      const response = await axios.get(`${baseUrl}/api/questions/${subjectId}`, config);

      console.log('Raw API Response:', {
        data: response.data,
        firstQuestion: response.data[0],
        totalQuestions: response.data.length
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format - expected array of questions');
      }

      // Transform questions to match the expected format
      const formattedQuestions = response.data.map((q, index) => {
        // Log raw question data
        console.log(`Raw question ${index}:`, q);

        const formatted = {
          id: q._id || `generated_id_${index}`,
          text: q.questionText || q.question || '', // Use questionText field first
          options: Array.isArray(q.choices) ? q.choices : [], // Use choices field
          correctAnswer: q.correctAnswer || '',
          subject: q.subject?._id || subjectId,
          difficulty: q.difficulty || 'medium'
        };

        // Log formatted question
        console.log(`Formatted question ${index}:`, formatted);

        return formatted;
      }).filter(q => {
        const isValid =
          q.text && // Has question text
          Array.isArray(q.options) &&
          q.options.length >= 2 && // At least 2 choices
          q.correctAnswer && // Has correct answer
          q.options.includes(q.correctAnswer.trim()); // Correct answer is in choices

        // Log validation result
        console.log(`Question validation for "${q.text.substring(0, 30)}..."`, {
          hasText: !!q.text,
          hasOptions: Array.isArray(q.options),
          optionsCount: q.options.length,
          hasAnswer: !!q.correctAnswer,
          answerInOptions: q.options.includes(q.correctAnswer.trim()),
          isValid: isValid
        });

        return isValid;
      });

      console.log(`Formatted ${response.data.length} questions, ${formattedQuestions.length} valid`);

      if (formattedQuestions.length === 0) {
        throw new Error('No valid questions found after formatting');
      }

      // Shuffle and limit questions
      const shuffledQuestions = formattedQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);

      console.log(`Successfully prepared ${shuffledQuestions.length} questions for game`);
      return shuffledQuestions;

    } catch (err) {
      console.error('Error fetching questions:', err.message);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }

      // Use default questions as fallback
      const defaultQuestions = [
        {
          id: '1',
          text: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          subject: subjectId,
          difficulty: 'easy'
        },
        {
          id: '2',
          text: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          subject: subjectId,
          difficulty: 'medium'
        },
        {
          id: '3',
          text: 'What is H2O?',
          options: ['Salt', 'Sugar', 'Water', 'Oil'],
          correctAnswer: 'Water',
          subject: subjectId,
          difficulty: 'easy'
        },
        {
          id: '4',
          text: 'Which planet is closest to the Sun?',
          options: ['Venus', 'Mars', 'Mercury', 'Earth'],
          correctAnswer: 'Mercury',
          subject: subjectId,
          difficulty: 'medium'
        },
        {
          id: '5',
          text: 'What is the largest mammal?',
          options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
          correctAnswer: 'Blue Whale',
          subject: subjectId,
          difficulty: 'medium'
        }
      ];

      return defaultQuestions;

    }
  }, [token]);

  const retryConnection = useCallback(() => {
    if (connectionAttemptsRef.current >= maxConnectionAttempts) {
      console.log('Max connection attempts reached');
      setGameMessage('Unable to connect. Please try again later.');
      setIsConnecting(false);
      return;
    }
    connectionAttemptsRef.current += 1;
    console.log(`Retrying connection, attempt ${connectionAttemptsRef.current}`);
    setTimeout(() => {
      if (socketRef.current) {
        console.log('Attempting to reconnect...');
        socketRef.current.connect();
      }
    }, connectionDelayMs);
  }, []);

  // --- Main Socket Connection useEffect ---
  useEffect(() => {
    if (!token || !location.state?.lobbyId) {
      console.log('Missing token or lobbyId, redirecting to dashboard');
      navigate('/student/dashboard');
      return;
    }

    // Add diagnostic logging to ensure cleanup fn works
    console.log("Mounting PvP component...");

    // Initialize socket connection if needed
    const connectSocket = async () => {
      if (isConnecting || !isMountedRef.current || socketRef.current) return;

      try {
        setIsConnecting(true);
        console.log('Initializing new socket connection...');

        socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
          auth: { token },
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          withCredentials: true,
          forceNew: false,
        });

        setSocket(socketRef.current);

        // Add connection event listeners before connecting
        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message, error.description);
          if (isMountedRef.current) {
            if (error.message === 'websocket error') {
              console.log('Retrying with polling transport...');
              socketRef.current.io.opts.transports = ['polling', 'websocket'];
            }
            retryConnection(); // Uses handler defined above
          }
        });

        socketRef.current.on('connect_timeout', () => {
          console.log('Socket connection timeout');
          if (isMountedRef.current) {
            retryConnection(); // Uses handler defined above
          }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log('Socket reconnected after', attemptNumber, 'attempts');
          if (isMountedRef.current && location.state?.lobbyId) {
            // Re-join the game room after reconnection
            socketRef.current.emit('join_game_room', {
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player'
            });
          }
        });

        socketRef.current.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          if (isMountedRef.current) {
            setGameMessage('Connection error. Please refresh the page.');
          }
        });

        socketRef.current.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          if (isMountedRef.current) {
            setGameMessage('Connection failed. Please refresh the page.');
            navigate('/');
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
          // Handle specific error types
          if (error.message === 'Authentication token required') {
            console.log('Token missing, attempting to refresh...');
            // You might want to trigger a token refresh here
          } else if (error.message === 'Game not found') {
            console.log('Game not found, redirecting...');
            navigate('/');
          }
        });

        socketRef.current.on('connect', () => {
          console.log('[SOCKET] Connected to server. Socket ID:', socketRef.current.id);
          if (!isMountedRef.current) return;

          console.log('Connected to socket server with ID:', socketRef.current.id);
          setIsConnecting(false);
          connectionAttemptsRef.current = 0;

          if (location.state?.lobbyId) {
            console.log('Joining game lobby:', location.state.lobbyId);
            socketRef.current.emit('join_game_room', {
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player'
            });

            socketRef.current.emit('join_game', {
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player',
              timestamp: Date.now()
            });

            setGameState(GAME_STATE.RPS);
            setGameMessage('Waiting for opponent to join...');
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          if (!isMountedRef.current) return;

          console.log('Socket disconnected:', reason, 'Socket ID:', socketRef.current.id);
          setIsConnecting(false);

          if (reason === 'io server disconnect' || reason === 'transport close') {
            retryConnection(); // Uses handler defined above
          }
        });

        socketRef.current.on('opponent_joined', (data) => {
          if (!isMountedRef.current) return;

          console.log('Opponent joined event received:', data);

          // Update opponent info
          setOpponentInfo(prev => ({
            ...prev,
            name: data.playerName
          }));

          // Update game state if provided
          if (data.state) {
            setGameState(data.state);
          }

          // Check if we have both players
          if (data.playerCount === 2) {
            setGameMessage('Opponent joined! Waiting for game to start...');
          } else {
            setGameMessage('Waiting for opponent to join...');
          }
        });

        socketRef.current.on('opponent_rps_choice', (data) => {
          if (!isMountedRef.current) return;
          console.log('Opponent RPS choice received:', data);
          setOpponentRpsChoice(data.choice);
        });

        socketRef.current.on('rps_result', (data) => {
          if (!isMountedRef.current) return;
          console.log('RPS result received:', data);
          const { winner, choices, isDraw } = data;

          // Find my choice and opponent's choice for consistency
          const myChoice = choices.find(c => c.playerId === user?.id)?.choice;
          const opponentChoice = choices.find(c => c.playerId !== user?.id)?.choice;

          console.log('Processing RPS choices:', { myId: user?.id, myChoice, opponentChoice, winner, isDraw });

          // Update local state mainly for display purposes if needed elsewhere, or just pass result down
          setRpsChoice(myChoice);
          setOpponentRpsChoice(opponentChoice);
          setGameMessage(''); // Clear waiting message

          // Set the result object for the RpsPhase component
          setRpsResult({
            isDraw: isDraw,
            winner: winner === user?.id, // Boolean: Is the current player the winner?
            choices: choices // Pass choices down so modal can display icons
          });

          // If it was a draw, we might need to reset state for next round here or in the timeout callback
          if (isDraw) {
            // Reset for next round will happen in handleRpsTimeoutComplete
          } else {
            // Set turn and game message immediately (parent still controls this)
            const isWinner = winner === myPlayerId; // Compare against myPlayerId state
            setCurrentTurnId(winner); // Use the actual winner ID from the server payload
            setGameMessage(isWinner ? 'You won! You get to choose the subject.' : 'You lost! Waiting for opponent to choose subject...');
            // Game state transition will happen in handleRpsTimeoutComplete
          }
        });

        socketRef.current.on('game_ready', (data) => {
          if (!isMountedRef.current) return;
          console.log('Game ready event received:', data);
          if (data.players.length === 2) {
            console.log('Setting initial game state for RPS');
            setGameReady(true);
            setGameState(GAME_STATE.RPS);
            setGameMessage('Game ready! Get ready to choose...');

            // Initialize hands and deck counts
            if (data.player1Id === myPlayerId) {
              const initialHand = Array.isArray(data.player1Hand) ? data.player1Hand : [];
              setMyHand(initialHand);
              setDisplayedHand(initialHand); // Ensure displayed hand is also set
              setMyDeckCount(data.player1DeckCount || DECK_SIZE - STARTING_HAND_SIZE);
              setOpponentHandCount(data.player2HandCount || STARTING_HAND_SIZE);
              setOpponentDeckCount(data.player2DeckCount || DECK_SIZE - STARTING_HAND_SIZE);
            } else {
              const initialHand = Array.isArray(data.player2Hand) ? data.player2Hand : [];
              setMyHand(initialHand);
              setDisplayedHand(initialHand); // Ensure displayed hand is also set
              setMyDeckCount(data.player2DeckCount || DECK_SIZE - STARTING_HAND_SIZE);
              setOpponentHandCount(data.player1HandCount || STARTING_HAND_SIZE);
              setOpponentDeckCount(data.player1DeckCount || DECK_SIZE - STARTING_HAND_SIZE);
            }
          }
        });

        socketRef.current.on('room_status', (data) => {
          if (!isMountedRef.current) return;
          console.log('Room status received:', data);
          // Update opponent info if we have two players
          if (data.players && data.players.length === 2) {
            const opponent = data.players.find(p => p.id !== user?.id);
            if (opponent) {
              setOpponentInfo(prev => ({
                ...prev,
                name: opponent.name
              }));
            }
          }

          // Update game message and state based on player count
          if (data.playerCount === 2 && !gameReady) {
            console.log('Room is ready with two players');
            setGameReady(true);

            // Only set RPS state if we're not already in a valid game state
            if (!Object.values(GAME_STATE).includes(gameState) || gameState === GAME_STATE.WAITING) {
              console.log('Setting initial RPS state');
              setGameState(GAME_STATE.RPS);
              setGameMessage('Game ready! Get ready to choose...');
              // Reset RPS state
              setRpsChoice(null);
              setOpponentRpsChoice(null);
              setRpsResult(null);
            }
          } else if (data.playerCount < 2) {
            console.log('Waiting for second player');
            setGameMessage('Waiting for opponent to join...');
            setGameReady(false);
          }
        });

        socketRef.current.on('game_update', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE game_update] Received:', data, 'myPlayerId:', myPlayerId);
          console.log('[FE game_update] Previous state:', { gameState, currentTurnId, myHand });

          const previousTurnId = currentTurnId;

          // Always update basic info if present
          if (data.gameState) setGameState(data.gameState);
          if (data.currentTurn) {
            console.log('[FE game_update] Setting currentTurnId to:', data.currentTurn);
            setCurrentTurnId(data.currentTurn);
          }
          if (data.gameMessage) setGameMessage(data.gameMessage);
          if (data.selectedSubject) setSelectedSubject(data.selectedSubject);
          if (data.availableQuestions) setAvailableQuestions(data.availableQuestions);

          // Update player hands and deck counts
          if (data.player1Id === myPlayerId) {
            if (data.player1Hand) {
              // Filter for unique question text only and limit to 5 cards
              const uniqueByText = [];
              const seenTexts = new Set();
              for (const card of data.player1Hand.slice(0, 5)) {
                const textKey = (card.text || card.questionText || '').trim().toLowerCase();
                if (textKey && !seenTexts.has(textKey)) {
                  uniqueByText.push(card);
                  seenTexts.add(textKey);
                }
              }
              setMyHand(uniqueByText);
              setDisplayedHand(uniqueByText);
            }
            if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
            if (data.player1DeckCount !== undefined) setMyDeckCount(data.player1DeckCount);
            if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
            if (data.player2DeckCount !== undefined) setOpponentDeckCount(data.player2DeckCount);
          } else if (data.player2Id === myPlayerId) {
            if (data.player2Hand) {
              // Filter for unique question text only and limit to 5 cards
              const uniqueByText = [];
              const seenTexts = new Set();
              for (const card of data.player2Hand.slice(0, 5)) {
                const textKey = (card.text || card.questionText || '').trim().toLowerCase();
                if (textKey && !seenTexts.has(textKey)) {
                  uniqueByText.push(card);
                  seenTexts.add(textKey);
                }
              }
              setMyHand(uniqueByText);
              setDisplayedHand(uniqueByText);
            }
            if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
            if (data.player2DeckCount !== undefined) setMyDeckCount(data.player2DeckCount);
            if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
            if (data.player1DeckCount !== undefined) setOpponentDeckCount(data.player1DeckCount);
          }

          // Update turn information
          if (data.currentTurn) {
            setCurrentTurnId(data.currentTurn);
          }

          // Update game message
          if (data.gameMessage) {
            setGameMessage(data.gameMessage);
          }

          // Update HP
          if (data.player1Id && data.player1Hp !== undefined) {
            if (data.player1Id === myPlayerId) {
              setMyInfo(prev => ({ ...prev, hp: data.player1Hp }));
            } else {
              setOpponentPlayerId(data.player1Id);
              setOpponentInfo(prev => ({ ...prev, name: data.player1Name || prev.name, hp: data.player1Hp }));
            }
          }
          if (data.player2Id && data.player2Hp !== undefined) {
            if (data.player2Id === myPlayerId) {
              setMyInfo(prev => ({ ...prev, hp: data.player2Hp }));
            } else {
              setOpponentPlayerId(data.player2Id);
              setOpponentInfo(prev => ({ ...prev, name: data.player2Name || prev.name, hp: data.player2Hp }));
            }
          }

          // Update Field State
          if (data.lastCardSummoned !== undefined) {
            console.log('[FE game_update] Setting last summoned card');
            setLastSummonedCardOnField(data.lastCardSummoned);
            setLastPlayedSpellEffect(null);
          }
          if (data.lastCardPlayed && data.lastCardPlayed.type === 'spellEffect') {
            console.log('[FE game_update] Setting last played spell effect');
            setLastPlayedSpellEffect(data.lastCardPlayed);
          }

          // Update game message based on new states
          if (data.gameState === GAME_STATE.AWAITING_CARD_SUMMON) {
            if (data.currentTurn === myPlayerId) {
              setGameMessage('Your Turn: Play a card!');
            } else {
              const oppName = opponentInfo.name === 'Waiting...' ? 'Opponent' : opponentInfo.name;
              setGameMessage(`Waiting for ${oppName} to play a card...`);
            }
            setActiveQuestion(null);
          }
          if (data.gameState === GAME_STATE.AWAITING_OPPONENT_ANSWER) {
            // Message usually set by handleSummonCard confirmation or other event
          }

          // Clear opponent RPS choice visual if state moves past RPS
          if (data.gameState !== GAME_STATE.RPS) {
            setOpponentRpsChoice(null);
          }

          // Update opponent name if received and not already set properly
          if (data.player1Id && data.player2Id) {
            if (data.player1Id === myPlayerId) {
              setOpponentPlayerId(data.player2Id);
            } else if (data.player2Id === myPlayerId) {
              setOpponentPlayerId(data.player1Id);
            }
          }
          if (opponentInfo.name === 'Waiting...' && data.players) {
            const opponent = data.players.find(p => p.id !== myPlayerId);
            if (opponent) setOpponentInfo(prev => ({ ...prev, name: opponent.name }));
          } else if (opponentInfo.name === 'Waiting...' && opponentPlayerId) {
            const p1Name = data.player1Id === opponentPlayerId ? data.player1Name : null;
            const p2Name = data.player2Id === opponentPlayerId ? data.player2Name : null;
            if (p1Name) setOpponentInfo(prev => ({ ...prev, name: p1Name }));
            else if (p2Name) setOpponentInfo(prev => ({ ...prev, name: p2Name }));
          }

          console.log('[FE game_update] New state:', {
            gameState: data.gameState,
            currentTurn: data.currentTurn,
            myHand: myHand,
            handCount: myHand.length
          });

          // Always update my hand if playerHand is present in the payload
          if (data.playerHand) {
            setMyHand(Array.isArray(data.playerHand) ? data.playerHand.slice(0, 5).map(card => ({
              ...card,
              type: card.type || (card.questionText ? 'question' : undefined)
            })) : []);
            setDisplayedHand(Array.isArray(data.playerHand) ? data.playerHand.slice(0, 5).map(card => ({
              ...card,
              type: card.type || (card.questionText ? 'question' : undefined)
            })) : []);
          }
        });

        socketRef.current.on('dice_result', (data) => {
          if (!isMountedRef.current) {
            console.log('[FE dice_result] Component unmounted, ignoring event.');
            return;
          }
          console.log('[FE dice_result] Received (broadcast payload):', data);

          // Determine user's roll vs opponent's roll
          let yourRoll = null;
          let opponentRoll = null;
          if (data.player1Id === user?.id) {
            yourRoll = data.player1Roll;
            opponentRoll = data.player2Roll;
          } else if (data.player2Id === user?.id) {
            yourRoll = data.player2Roll;
            opponentRoll = data.player1Roll;
          } else {
            console.error("[FE dice_result] Could not determine user's roll from payload:", data);
            yourRoll = data.player1Roll;
            opponentRoll = data.player2Roll;
          }

          setPlayerDiceValue(yourRoll);
          setOpponentDiceValue(opponentRoll);
          setBothPlayersRolled(true);
          setDiceWinnerId(data.winnerId); // Store the winner ID
          console.log(`[FE dice_result] Updated dice values state. You: ${yourRoll}, Opp: ${opponentRoll}`);

          const message = data.winnerId === user?.id ? 'You won the roll! Starting turn...' : data.winnerId ? 'Opponent won the roll! Waiting for them...' : 'Dice roll tie! Roll again!';
          setGameMessage(message);
          console.log('[FE dice_result] Set game message:', message);

          if (data.winnerId) { // If there's a winner (not a tie)
            console.log('[FE dice_result] Winner determined. Setting 3s timeout for result display.');
            // Start a timeout to display the result for a bit
            setTimeout(() => {
              if (!isMountedRef.current) {
                console.log('[FE dice_result - Winner Timeout] Component unmounted before timeout executed.');
                return;
              }
              console.log(`[FE dice_result - Winner Timeout] Executing timeout callback at ${new Date().toLocaleTimeString()}`);

              // Reset the visual rolling state
              setIsDiceRolling(false);

              // Request game state update from server
              if (socketRef.current && socketRef.current.connected) {
                console.log('[FE dice_result] Requesting game state update after dice roll - REMOVED');
                // socketRef.current.emit('request_game_state', { lobbyId: location.state?.lobbyId });
              }
            }, 3000); // Display result in modal for 3 seconds 
          } else { // Handle tie (re-roll)
            console.log('[FE dice_result] Tie detected. Setting 1.5s timeout for re-roll reset.');
            setTimeout(() => {
              if (!isMountedRef.current) {
                console.log('[FE dice_result - Tie Timeout] Component unmounted before timeout executed.');
                return;
              }
              console.log(`[FE dice_result - Tie Timeout] Executing timeout callback at ${new Date().toLocaleTimeString()}`);
              // Reset state needed to allow re-roll AND hide the result display
              setPlayerDiceValue(null);
              setOpponentDiceValue(null);
              setBothPlayersRolled(false);
              setIsDiceRolling(false);
              setDiceWinnerId(null);
              setGameMessage('Tie! Roll again!');
            }, 1500);
          }
          console.log('[FE dice_result] Listener execution finished.');
        });

        socketRef.current.on('opponent_asking', (data) => {
          if (!isMountedRef.current) return;
          console.log('Received opponent_asking:', data);
          if (data.question) {
            // Opponent is asking us a question
            setActiveQuestion(data.question);
            setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
            setCurrentTurnId('player'); // Implicitly our turn if we are being asked
            setGameMessage("Opponent is asking you:");
          }
        });

        socketRef.current.on('answer_result', (data) => {
          console.log('[FE answer_result] Received:', { data, myPlayerId, opponentPlayerId }); // <-- Added log
          console.log('Answer result received:', data);

          // Use attacker/defender IDs to assign HPs correctly
          if (data.attackerId && data.defenderId) {
            if (data.attackerId === myPlayerId) {
              setMyInfo(prev => ({ ...prev, hp: data.attackerHp }));
              setOpponentInfo(prev => ({ ...prev, hp: data.defenderHp }));
            } else {
              setMyInfo(prev => ({ ...prev, hp: data.defenderHp }));
              setOpponentInfo(prev => ({ ...prev, hp: data.attackerHp }));
            }
          }

          // Show feedback message with HP change
          let feedbackMessage = '';
          let feedbackType = '';
          if (data.resultRole === 'answerer') {
            if (data.isCorrect) {
              feedbackMessage = 'Correct! Opponent takes damage!';
              feedbackType = 'correct';
            } else {
              feedbackMessage = 'Wrong! You take damage!';
              feedbackType = 'wrong';
            }
          } else if (data.resultRole === 'asker') {
            if (data.isCorrect) {
              feedbackMessage = 'Opponent got it right! You take damage!';
              feedbackType = 'wrong';
            } else {
              feedbackMessage = 'Opponent got it wrong! They take damage!';
              feedbackType = 'correct';
            }
          }
          setFeedback({
            show: true,
            message: feedbackMessage,
            type: feedbackType
          });

          // Hide feedback after 1.5 seconds
          setTimeout(() => {
            setFeedback({ show: false, message: '', type: '' });
            // After feedback is hidden, do NOT set turn locally. Wait for game_update from backend.
          }, 1500);
          console.log('[FE answer_result] New state:', { gameState: GAME_STATE.AWAITING_CARD_SUMMON, currentTurnId: data.isCorrect ? myPlayerId : opponentPlayerId });
        });

        socketRef.current.on('game_over', (data) => {
          if (!isMountedRef.current) return;
          console.log('Received game_over event:', data);
          // Update final HP from server data
          if (data.finalPlayerHp !== undefined) setMyInfo(prev => ({ ...prev, hp: data.finalPlayerHp }));
          if (data.finalOpponentHp !== undefined) setOpponentInfo(prev => ({ ...prev, hp: data.finalOpponentHp }));

          setGameState(GAME_STATE.GAME_OVER);
          setGameOverData(data);
          console.log('Set game state to GAME_OVER and updated gameOverData:', data);
        });

        // Add 'deal_cards' event listener for receiving initial cards
        socketRef.current.on('deal_cards', (data) => {
          console.log('[SOCKET] deal_cards handler fired:', data);
          if (!isMountedRef.current) return;

          try {
            console.log('[DEBUG] deal_cards handler fired:', data);

            if (data && data.playerHand && Array.isArray(data.playerHand)) {
              // Filter cards to ensure they have valid properties
              const validCards = data.playerHand
                .filter(card => card && (card.text || card.questionText))
                .slice(0, 5); // Limit to 5 cards

              if (validCards.length === 0) {
                console.warn('[DEBUG] deal_cards event received but no valid cards found');
                return;
              }

              // Filter unique cards by text and limit to 5 cards
              const uniqueCards = [];
              const seenTexts = new Set();

              for (const card of validCards) {
                // Ensure card has necessary ID properties
                const processedCard = {
                  ...card,
                  _id: card._id || card.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  id: card.id || card._id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: card.type || (card.questionText ? 'question' : undefined)
                };

                const textKey = (processedCard.text || processedCard.questionText || '').trim().toLowerCase();
                if (textKey && !seenTexts.has(textKey)) {
                  uniqueCards.push(processedCard);
                  seenTexts.add(textKey);
                }
              }

              console.log('[DEBUG] Setting initial hand from deal_cards:', uniqueCards.length, 'cards');
              console.log('[DEBUG] Card data sample:', uniqueCards[0]);

              setMyHand(uniqueCards);
              setDisplayedHand(uniqueCards);
              setGameMessage('Cards dealt! Ready for battle!');
            } else {
              console.warn('[DEBUG] deal_cards event received but no valid playerHand data:', data);
            }
          } catch (error) {
            console.error('[DEBUG] Error processing deal_cards event:', error);
          }
        });

        socketRef.current.on('opponent_surrendered', (data) => {
          if (!isMountedRef.current) return;
          console.log('Opponent surrendered:', data);
          setGameState(GAME_STATE.GAME_OVER);
          setGameOverData({
            reason: "Opponent surrendered!",
            winnerId: myPlayerId // Player wins if opponent surrenders
          });
          console.log('Set game state to GAME_OVER due to opponent surrender');
        });

        // NEW Listener for opponent's intermediate roll value
        socketRef.current.on('opponent_dice_roll', (data) => {
          if (!isMountedRef.current) return;
          console.log('Received opponent_dice_roll:', data);
          if (data && data.value !== undefined) {
            setOpponentDiceValue(data.value);
            // Update message maybe? Relies on game_message emit from backend
            // setGameMessage("Opponent rolled. Your turn!"); 
          }
        });

        // Add new handler for game state updates after dice roll
        socketRef.current.on('game_state_update', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE game_state_update] Received:', data);
          console.log('[FE game_state_update] Previous state:', { gameState, currentTurnId });

          // Update game state
          if (data.gameState) {
            setGameState(data.gameState);
          }

          // Update player hands if provided
          if (data.playerHand && data.playerId === myPlayerId) {
            console.log('[FE game_state_update] Updating player hand:', data.playerHand);
            setMyHand(data.playerHand.map(card => ({
              ...card,
              type: card.type || (card.questionText ? 'question' : undefined)
            })));
          }

          // Update turn information
          if (data.currentTurn) {
            setCurrentTurnId(data.currentTurn);
          }

          // Update game message
          if (data.gameMessage) {
            setGameMessage(data.gameMessage);
          }

          // Update deck counts
          if (data.player1Id === myPlayerId) {
            if (data.player1HandCount !== undefined) setMyHand(data.player1HandCount);
            if (data.player1DeckCount !== undefined) setMyDeckCount(data.player1DeckCount);
          } else if (data.player2Id === myPlayerId) {
            if (data.player2HandCount !== undefined) setMyHand(data.player2HandCount);
            if (data.player2DeckCount !== undefined) setMyDeckCount(data.player2DeckCount);
          }

          // Update opponent's counts
          if (data.player1Id !== myPlayerId) {
            if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
            if (data.player1DeckCount !== undefined) setOpponentDeckCount(data.player1DeckCount);
          } else if (data.player2Id !== myPlayerId) {
            if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
            if (data.player2DeckCount !== undefined) setOpponentDeckCount(data.player2DeckCount);
          }
          console.log('[FE game_state_update] New state:', { gameState: data.gameState, currentTurn: data.currentTurn });
        });

        socketRef.current.on('card_summoned', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE card_summoned] Received:', data);
          console.log('[FE card_summoned] Previous state:', { gameState, currentTurnId });

          // Update game state to show the question is being asked
          setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
          setGameMessage('Waiting for opponent to answer...');

          // Update the last summoned card on field
          setLastSummonedCardOnField({
            cardId: data.cardId,
            playerId: data.playerId,
            question: data.question
          });
          console.log('[FE card_summoned] New state:', { gameState: GAME_STATE.AWAITING_OPPONENT_ANSWER });
        });

        socketRef.current.on('opponent_answering', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE opponent_answering] Received:', data);

          // Update game message to show opponent is answering
          setGameMessage('Opponent is answering...');
        });

        socketRef.current.on('question_presented', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE question_presented] Received on client:', user?.id, data);
          console.log('[FE question_presented] Previous state:', { gameState, currentTurnId });
          if (data.question) {
            setActiveQuestion(data.question);
            setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
            setGameMessage(`${data.attackerName || 'Opponent'} is asking you a question!`);
            console.log('[FE question_presented] New state:', { gameState: GAME_STATE.AWAITING_OPPONENT_ANSWER });
          }
        });

        // Add handler for player_hand_update event
        socketRef.current.on('player_hand_update', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE player_hand_update] Received:', data);
          console.log('[FE player_hand_update] Previous hand:', myHand);

          if (data && data.playerHand) {
            if (myHand.length === 0) {
              // Initial hand - limit to 5 cards
              const initialHand = Array.isArray(data.playerHand) ? data.playerHand.slice(0, 5).map(card => ({
                ...card,
                type: card.type || (card.questionText ? 'question' : undefined)
              })) : [];
              setMyHand(initialHand);
              setDisplayedHand(initialHand);
            } else if (Array.isArray(data.playerHand) && data.playerHand.length === 1) {
              // New card drawn - only add if hand is less than 5 cards
              if (myHand.length < 5) {
                const newCard = {
                  ...data.playerHand[0],
                  type: data.playerHand[0].type || (data.playerHand[0].questionText ? 'question' : undefined)
                };
                setMyHand(prev => [...prev, newCard]);
                setDisplayedHand(prev => [...prev, newCard]);
              }
            }
          }
        });

        socketRef.current.connect();

      } catch (error) {
        console.error('Error initializing socket:', error);
        if (isMountedRef.current) {
          setIsConnecting(false);
          retryConnection();
        }
      }
    };

    if (token && location.state?.lobbyId && !socketRef.current) {
      connectSocket();
    }

    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        console.log('Cleaning up socket connection - component unmounting');
        // Remove ALL listeners explicitly
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('connect_timeout');
        socketRef.current.off('reconnect');
        socketRef.current.off('reconnect_error');
        socketRef.current.off('reconnect_failed');
        socketRef.current.off('error');
        socketRef.current.off('opponent_joined');
        socketRef.current.off('opponent_rps_choice');
        socketRef.current.off('rps_result');
        socketRef.current.off('game_ready');
        socketRef.current.off('room_status');
        socketRef.current.off('game_update');
        socketRef.current.off('dice_result');
        socketRef.current.off('opponent_asking');
        socketRef.current.off('answer_result');
        socketRef.current.off('game_over');
        socketRef.current.off('opponent_surrendered');
        socketRef.current.off('opponent_dice_roll');
        socketRef.current.off('game_state_update');
        socketRef.current.off('card_summoned');
        socketRef.current.off('opponent_answering');
        socketRef.current.off('question_presented');
        socketRef.current.off('player_hand_update');
        socketRef.current.off('deal_cards');

        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      connectionAttemptsRef.current = 0;
      setIsConnecting(false);
      setGameReady(false);
    };
  }, [token, location.state?.lobbyId, user?.id, user?.firstName, navigate, retryConnection]);

  // Update handleRpsChoice
  const handleRpsChoice = useCallback((choice) => {
    if (!socketRef.current || !choice || rpsChoice) { // Prevent choosing again
      console.error('Cannot make choice: socket/invalid choice/already chosen');
      return;
    }
    console.log('Making RPS choice:', choice);
    setRpsChoice(choice); // Update local state immediately for UI feedback
    // RpsPhase component will show waiting message based on this prop
    try {
      socketRef.current.emit('rps_choice', {
        lobbyId: location.state?.lobbyId,
        choice,
        playerId: user?.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending RPS choice:', error);
      setRpsChoice(null); // Reset choice on error
      setGameMessage('Error making choice. Try again.');
    }
  }, [location.state?.lobbyId, user?.id, rpsChoice]); // Add rpsChoice dependency

  // Callback for when the RpsPhase result display timeout completes
  const handleRpsTimeoutComplete = useCallback(() => {
    console.log('RPS Result timeout complete.');
    if (rpsResult?.isDraw) {
      console.log('Resetting for RPS draw.');
      // Reset state for the next round
      setRpsChoice(null);
      setOpponentRpsChoice(null);
      setRpsResult(null);
      setGameState(GAME_STATE.RPS); // Stay in RPS state for re-roll
      setGameMessage("It's a draw! Get ready for next round...");
      // The RpsPhase component useEffect will trigger the countdown again
    } else if (rpsResult) { // If it wasn't a draw, just clear the result
      console.log('RPS win/loss display finished. Clearing result.');
      // REMOVE the direct state transition
      // setGameState(GAME_STATE.SUBJECT_SELECTION); 
      // The game_update listener will handle the actual state transition
      setRpsResult(null); // Clear the result to hide the RpsPhase component
      // Turn and message were already set in the rps_result listener
    }
  }, [rpsResult]); // Depend on rpsResult

  // Handle subject select
  const handleSubjectSelect = useCallback(async (subject) => {
    // Add diagnostic log
    console.log('[handleSubjectSelect] Check values:', {
      socketConnected: !!socketRef.current,
      currentTurn: currentTurnId,
      myId: myPlayerId,
      currentGameState: gameState,
      expectedState: GAME_STATE.SUBJECT_SELECTION
    });

    if (!socketRef.current || currentTurnId !== myPlayerId || gameState !== GAME_STATE.SUBJECT_SELECTION) {
      console.log('Cannot select subject: not your turn or wrong state/socket disconnected');
      return;
    }

    try {
      console.log('Emitting select_subject:', subject.name);
      socketRef.current.emit('select_subject', {
        subject,
        lobbyId: location.state?.lobbyId,
        playerId: user?.id,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error emitting select_subject:", err);
    }
  }, [socketRef, currentTurnId, myPlayerId, gameState, location.state?.lobbyId]); // Updated dependencies

  // Handle question selection
  const handleQuestionSelect = (question) => {
    // Prevent duplicates
    if (selectedQuestions.length >= DECK_SELECTION_COUNT) return;
    if (selectedQuestions.some(q => q.id === question.id)) return;
    setSelectedQuestions([...selectedQuestions, question]);
  };

  // Handle question deselection
  const handleQuestionDeselect = (question) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
  };

  // Handle confirming questions
  const handleConfirmQuestions = () => {
    if (selectedQuestions.length !== DECK_SELECTION_COUNT) return;

    const selectedQuestionIds = selectedQuestions.map(q => q.id);

    console.log('Emitting confirm_question_selection with IDs:', selectedQuestionIds);
    if (socketRef.current) {
      socketRef.current.emit('confirm_question_selection', {
        lobbyId: location.state?.lobbyId,
        selectedQuestionIds: selectedQuestionIds,
      });

      // Clear local selection and wait for server to deal cards
      setSelectedQuestions([]);
      setAvailableQuestions([]); // Clear available questions view
      setGameMessage("Selection confirmed. Waiting for server to deal cards and start dice roll...");
      // DO NOT set hands or change game state locally. Wait for 'deal_cards' and 'dice_result' / 'game_update'

    } else {
      console.error("Socket not connected, cannot confirm question selection");
      setGameMessage("Connection error. Cannot confirm selection.");
    }
  };

  // Add state for selectedCard
  const [selectedCard, setSelectedCard] = useState(null);
  const [isCardActionPending, setIsCardActionPending] = useState(false);

  // Add handler for confirming card selection
  const handleConfirmCard = (card) => {
    if (isCardActionPending) return;
    setIsCardActionPending(true);
    if (socketRef.current && card && card._id) {
      socketRef.current.emit('summon_card', {
        lobbyId,
        cardId: card._id,
      });
    }
    // Optionally clear selectedCard here if not already done in modal
  };

  // Update handleDiceRollComplete
  const handleDiceRollComplete = useCallback(() => {
    console.log('[Pvp.jsx] Dice roll result display timeout finished.');

    if (!diceWinnerId) {
      console.log('[Pvp.jsx] Tie detected during dice roll complete handler - likely already handled.');
      return;
    }

    // Show card distribution animation
    setShowCardDistribution(true);

    // Request initial cards for both players

    // Set a timeout to hide card distribution animation and proceed to game
    setTimeout(() => {
      setShowCardDistribution(false);

      // Set game state and turn
      setGameState(GAME_STATE.AWAITING_CARD_SUMMON);
      setCurrentTurnId(diceWinnerId);

      // Set appropriate game message
      if (diceWinnerId === myPlayerId) {
        setGameMessage('You won the roll! Your turn to play a card.');
      } else {
        const oppName = opponentInfo.name === 'Waiting...' ? 'Opponent' : opponentInfo.name;
        setGameMessage(`Opponent won the roll! Waiting for ${oppName} to play...`);
      }

      // Reset dice-related state
      setPlayerDiceValue(null);
      setOpponentDiceValue(null);
      setBothPlayersRolled(false);
    }, 3000);

  }, [diceWinnerId, myPlayerId, lobbyId, opponentInfo.name, socketRef, myHand.length]);

  // Add handler for when card distribution animation completes
  const handleCardDistributionComplete = useCallback(() => {
    console.log('[Pvp.jsx] Card distribution animation completed (this is now redundant)');
    // This function is no longer needed as the logic is now in handleDiceRollComplete
  }, []);

  // Add this debugging effect to monitor hand changes, with null checks to prevent errors
  useEffect(() => {
    try {
      console.log('[DEBUG] Hand state changed:', {
        myHand: myHand.length > 0 ?
          myHand.map(card => card ? (card._id || card.id || 'no-id') : 'null-card').join(', ') :
          'empty',
        displayedHand: displayedHand.length > 0 ?
          displayedHand.map(card => card ? (card._id || card.id || 'no-id') : 'null-card').join(', ') :
          'empty',
        handLength: myHand.length,
        displayedHandLength: displayedHand.length,
        gameState
      });
    } catch (error) {
      console.error('[DEBUG] Error logging hand state:', error);
    }
  }, [myHand, displayedHand, gameState]);

  // Add back handleCardClick
  const handleCardClick = (card) => {
    console.log('handleCardClick called:', { card, currentTurnId, myPlayerId, gameState });
    if (isCardActionPending) return;
    if (currentTurnId !== myPlayerId || gameState !== GAME_STATE.AWAITING_CARD_SUMMON) {
      console.log('Not your turn or wrong state, cannot play card.');
      return; // Only allow clicking if it's your turn and you can play cards
    }
    setSelectedCard(card);
  };

  // Add back handleSubmitAnswer
  const handleSubmitAnswer = (answer) => {
    if (!activeQuestion) return;

    // Emit the answer to the server
    console.log('Submitting answer with lobbyId:', lobbyId);
    socketRef.current.emit('submit_answer', {
      lobbyId: lobbyId, // Use correct key and value
      questionId: activeQuestion.id,
      answer: answer
    });

    // Show temporary feedback while waiting for server response
    setFeedback({
      show: true,
      message: "Checking answer...",
      type: "neutral"
    });

    // Close the question modal by clearing the active question
    setActiveQuestion(null);
  };

  // Update the answer_result event handler
  useEffect(() => {
    if (!socketRef.current) return;

    const handleAnswerResult = (data) => {
      console.log('[FE answer_result] Received:', { data, myPlayerId, opponentPlayerId }); // <-- Added log
      console.log('Answer result received:', data);

      // Use attacker/defender IDs to assign HPs correctly
      if (data.attackerId && data.defenderId) {
        if (data.attackerId === myPlayerId) {
          setMyInfo(prev => ({ ...prev, hp: data.attackerHp }));
          setOpponentInfo(prev => ({ ...prev, hp: data.defenderHp }));
        } else {
          setMyInfo(prev => ({ ...prev, hp: data.defenderHp }));
          setOpponentInfo(prev => ({ ...prev, hp: data.attackerHp }));
        }
      }

      // Show feedback message with HP change
      let feedbackMessage = '';
      let feedbackType = '';
      if (data.resultRole === 'answerer') {
        if (data.isCorrect) {
          feedbackMessage = 'Correct! Opponent takes damage!';
          feedbackType = 'correct';
        } else {
          feedbackMessage = 'Wrong! You take damage!';
          feedbackType = 'wrong';
        }
      } else if (data.resultRole === 'asker') {
        if (data.isCorrect) {
          feedbackMessage = 'Opponent got it right! You take damage!';
          feedbackType = 'wrong';
        } else {
          feedbackMessage = 'Opponent got it wrong! They take damage!';
          feedbackType = 'correct';
        }
      }
      setFeedback({
        show: true,
        message: feedbackMessage,
        type: feedbackType
      });

      // Hide feedback after 1.5 seconds
      setTimeout(() => {
        setFeedback({ show: false, message: '', type: '' });
        // After feedback is hidden, do NOT set turn locally. Wait for game_update from backend.
      }, 1500);
    };

    socketRef.current.on('answer_result', handleAnswerResult);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('answer_result', handleAnswerResult);
      }
    };
  }, [myPlayerId, opponentPlayerId]);

  // Cleanup function
  useEffect(() => {
    return () => {
      console.log("Component unmounting - cleanup effect runs."); // Add log to confirm execution
      // Keep other potential cleanup logic here
    };
  }, []); // Empty dependency array means this cleanup runs on unmount

  // Handle surrender
  const handleSurrender = () => {
    console.log('Player surrendering...');
    // Inform opponent
    if (socketRef.current) {
      socketRef.current.emit('surrender', { lobbyId });
    }
    // Set game over locally immediately
    setGameState(GAME_STATE.GAME_OVER);
    setGameOverData({
      reason: "You surrendered!",
      winnerId: opponentPlayerId // Opponent wins if you surrender
    });
    console.log('Set game state to GAME_OVER due to player surrender');
  };

  // Handle play again
  const handlePlayAgain = () => {
    console.log('Attempting to play again...');
    if (socketRef.current) {
      console.log('Emitting play_again event');
      socketRef.current.emit('play_again', { lobbyId: location.state?.lobbyId });
    } else {
      console.error('Cannot emit play_again: socket not available.');
      // Maybe try to reconnect or show error?
      return;
    }

    // Reset ALL relevant state for a new game
    console.log('Resetting state for new game...');
    setGameState(GAME_STATE.WAITING); // Start in WAITING, wait for server game_ready/RPS
    setMyInfo(prev => ({ ...prev, hp: STARTING_HP, shake: false }));
    setOpponentInfo(prev => ({ ...prev, hp: STARTING_HP, shake: false })); // Reset opponent HP too
    setMyHand([]);
    setMyDeckCount(DECK_SIZE - STARTING_HAND_SIZE); // Reset counts
    setOpponentHandCount(STARTING_HAND_SIZE);
    setOpponentDeckCount(DECK_SIZE - STARTING_HAND_SIZE);
    setLastSummonedCardOnField(null);
    setLastPlayedSpellEffect(null);
    setActiveQuestion(null);
    setFeedback({ show: false, correct: null, message: "" });
    setGameMessage("Waiting for new game to start...");
    setCurrentTurnId(null); // Reset turn
    setSelectedSubject(null);
    setSelectedQuestions([]);
    setAvailableQuestions([]);
    setRpsChoice(null);
    setOpponentRpsChoice(null);
    setRpsResult(null);
    setPlayerDiceValue(null);
    setOpponentDiceValue(null);
    setIsDiceRolling(false);
    setBothPlayersRolled(false);
    setDiceWinnerId(null);
    setHasSummonedQuestionThisTurn(false);
    setHasPlayedSpellEffectThisTurn(false);
    setGameOverData(null); // Clear game over data
    // showGameOverModal is controlled by gameState, no need to set false

  };

  // Add state monitoring effect
  useEffect(() => {
    console.log('Dice state update:', {
      playerDiceValue,
      opponentDiceValue,
      bothPlayersRolled,
      isDiceRolling,
      gameState
    });
  }, [playerDiceValue, opponentDiceValue, bothPlayersRolled, isDiceRolling, gameState]);

  // Add game state monitoring
  useEffect(() => {
    console.log('Game state changed:', {
      state: gameState,
      ready: gameReady,
      rpsChoice,
      opponentRpsChoice
    });
  }, [gameState, gameReady, rpsChoice, opponentRpsChoice]);

  // Refactored handleDiceRoll - emits event, waits for server's dice_result
  const handleDiceRoll = useCallback(() => {
    // Prevent rolling if already rolled OR currently in the brief visual rolling state
    if (playerDiceValue !== null || isDiceRolling) {
      console.log('Dice roll already occurred or is visually rolling');
      return;
    }

    // Check socket connection before starting animation
    if (!socketRef.current) {
      console.error('Socket reference not available for dice roll');
      setGameMessage("Connection error. Reconnecting...");
      retryConnection();
      return;
    }

    if (!socketRef.current.connected) {
      console.error('Socket not connected for dice roll');
      setGameMessage("Connection lost. Reconnecting...");
      socketRef.current.connect();
      // Wait a moment and try again if socket reconnects
      setTimeout(() => {
        if (socketRef.current?.connected) {
          setGameMessage("Reconnected! You can roll now.");
        }
      }, 2000);
      return;
    }

    // Set rolling state TRUE only for the visual effect duration
    setIsDiceRolling(true);
    setGameMessage("Rolling the dice...");

    // Use longer animation time to ensure connection is stable
    setTimeout(() => {
      // Set rolling state FALSE *before* emitting - button becomes clickable again
      // The check above (playerDiceValue !== null) prevents re-rolling after result comes back
      setIsDiceRolling(false);

      try {
        if (socketRef.current && socketRef.current.connected) {
          console.log('Emitting dice_roll event');
          socketRef.current.emit('dice_roll', {
            lobbyId: lobbyId,
          });
          // Update message to indicate waiting for server/opponent
          setGameMessage("Waiting for opponent to roll...");
        } else {
          throw new Error('Socket not connected after animation');
        }
      } catch (error) {
        console.error('Error sending dice roll:', error);
        setGameMessage("Connection error. Please try again.");
        if (!socketRef.current?.connected) {
          retryConnection();
        }
      }
    }, 1500); // Visual roll duration
  }, [isDiceRolling, playerDiceValue, lobbyId, retryConnection]);

  // Effect to handle showing modals based on gameState
  useEffect(() => {
    console.log(`Effect triggered by gameState change: ${gameState}`);
    // Any other modal logic dependent on gameState can go here
  }, [gameState]);

  // When you get a valid lobbyId (e.g., after joining), store it:
  useEffect(() => {
    if (lobbyId) {
      localStorage.setItem('lobbyId', lobbyId);
    }
  }, [lobbyId]);

  // In game_update and card_summoned handlers, reset isCardActionPending
  useEffect(() => {
    if (!socketRef.current) return;

    const handleGameUpdate = (data) => {
      setIsCardActionPending(false);
      // ...existing game_update logic...
    };
    socketRef.current.on('game_update', handleGameUpdate);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('game_update', handleGameUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleCardSummoned = (data) => {
      setIsCardActionPending(false);
    };
    socketRef.current.on('card_summoned', handleCardSummoned);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('card_summoned', handleCardSummoned);
      }
    };
  }, []);

  // Add a new effect to log hand changes
  useEffect(() => {
    console.log('[FE] Hand updated:', {
      hand: myHand,
      count: myHand.length,
      currentTurn: currentTurnId,
      myPlayerId: myPlayerId,
      isMyTurn: currentTurnId === myPlayerId
    });
  }, [myHand, currentTurnId, myPlayerId]);

  // Add this just after all useState declarations for IDs
  const isMyTurn = currentTurnId?.toString() === myPlayerId?.toString();

  // Add a debug log to help track turn logic issues
  useEffect(() => {
    console.log('[TURN DEBUG]', {
      currentTurnId,
      myPlayerId,
      currentTurnIdType: typeof currentTurnId,
      myPlayerIdType: typeof myPlayerId,
      isMyTurn
    });
  }, [currentTurnId, myPlayerId]);

  // Remove showCardDistribution and CardDistributionAnimation overlay logic
  // Add state for initial hand animation
  const [showInitialHandAnim, setShowInitialHandAnim] = useState(false);
  const [initialHandAnimCards, setInitialHandAnimCards] = useState([]); // array of indices for animating

  // After dice roll, trigger the initial hand animation
  useEffect(() => {
    if (gameState === GAME_STATE.AWAITING_CARD_SUMMON && myHand.length === 5 && !showInitialHandAnim) {
      setShowInitialHandAnim(true);
      setInitialHandAnimCards([0, 1, 2, 3, 4]);
      // Hide animation after all cards have flown (5 * 300ms + buffer)
      setTimeout(() => setShowInitialHandAnim(false), 1800);
    }
  }, [gameState, myHand.length]);

  // Add state for animating initial hand draw
  const [flyingCards, setFlyingCards] = useState([]); // [{id, animating}]
  const [visualHand, setVisualHand] = useState([]); // for animation only
  const [visualDeckCount, setVisualDeckCount] = useState(myDeckCount);

  // Trigger animation after dice roll, before showing hand
  useEffect(() => {
    if (gameState === GAME_STATE.AWAITING_CARD_SUMMON && myHand.length === 5 && !animatingInitialHand) {
      setAnimatingInitialHand(true);
      setVisualHand([]);
      setVisualDeckCount(15); // Always start at 15 for animation
      let flyCards = [];
      for (let i = 0; i < 5; i++) flyCards.push({ id: i, animating: false });
      setFlyingCards(flyCards);
      // Animate each card with delay
      flyCards.forEach((card, idx) => {
        setTimeout(() => {
          setFlyingCards(fcs => fcs.map((c, j) => j === idx ? { ...c, animating: true } : c));
          setTimeout(() => {
            setVisualHand(h => [...h, card.id]);
            setVisualDeckCount(c => c - 1);
            setFlyingCards(fcs => fcs.map((c, j) => j === idx ? { ...c, animating: false } : c));
            if (idx === 4) setTimeout(() => {
              setAnimatingInitialHand(false);
              setVisualHand([]);
              setVisualDeckCount(myDeckCount); // Sync to backend after animation
            }, 400);
          }, 400);
        }, idx * 320);
      });
    }
  }, [gameState, myHand.length]);

  // After all useState/useEffect declarations, add:
  const showDeckAndHand = ![
    GAME_STATE.RPS,
    GAME_STATE.SUBJECT_SELECTION,
    GAME_STATE.DECK_CREATION,
    GAME_STATE.DICE_ROLL,
    GAME_STATE.GAME_OVER
  ].includes(gameState) && rpsResult === null;

  // Add state for animating single card draw
  const [drawAnimCard, setDrawAnimCard] = useState(null);
  const [drawAnimActive, setDrawAnimActive] = useState(false);
  const prevHandRef = useRef(myHand);

  // Watch for single card draw (not initial hand)
  useEffect(() => {
    if (
      myHand.length > prevHandRef.current.length &&
      myHand.length !== 5 && // not initial hand
      myHand.length - prevHandRef.current.length === 1
    ) {
      const newCard = myHand[myHand.length - 1];
      setDrawAnimCard(newCard);
      setDrawAnimActive(true);
      setTimeout(() => setDrawAnimActive(false), 600);
    }
    prevHandRef.current = myHand;
  }, [myHand]);

  // State for animating initial hand and per-turn draws
  const [animatedHand, setAnimatedHand] = useState([]); // Cards currently visible in hand
  const [animatingInitialHand, setAnimatingInitialHand] = useState(false);
  const [animatingDrawIndex, setAnimatingDrawIndex] = useState(null); // index of card being animated in

  // Initial hand animation: when myHand goes from 0 to 5
  useEffect(() => {
    if (myHand.length === 5 && animatedHand.length === 0 && !animatingInitialHand) {
      setAnimatingInitialHand(true);
      let i = 0;
      const animateNext = () => {
        if (myHand[i]) {
          setDisplayedHand(hand => [...hand, myHand[i]]);
        }
        i++;
        if (i < myHand.length) {
          setTimeout(animateNext, 350);
        }
      };
      animateNext();
    }
  }, [myHand]);

  // Per-turn draw animation: when myHand increases by 1 after initial hand
  const prevHandLengthRef = useRef(0);
  useEffect(() => {
    if (!animatingInitialHand && myHand.length > animatedHand.length) {
      const newCard = myHand[myHand.length - 1];
      setAnimatingDrawIndex(animatedHand.length);
      setTimeout(() => {
        setAnimatedHand(hand => [...hand, newCard]);
        setAnimatingDrawIndex(null);
      }, 350);
    }
    prevHandLengthRef.current = myHand.length;
  }, [myHand, animatingInitialHand, animatedHand.length]);

  // Reset animatedHand if game resets
  useEffect(() => {
    if (myHand.length === 0) setAnimatedHand([]);
  }, [myHand.length]);

  // Add state for overlays
  const [showSubjectChosen, setShowSubjectChosen] = useState(false);
  const [subjectChosenName, setSubjectChosenName] = useState("");

  // Show subject chosen overlay for 3 seconds
  useEffect(() => {
    if (selectedSubject && selectedSubject.name) {
      setSubjectChosenName(selectedSubject.name);
      setShowSubjectChosen(true);
      const t = setTimeout(() => setShowSubjectChosen(false), 3000);
      return () => clearTimeout(t);
    }
  }, [selectedSubject]);

  // Reset displayedHand if hand is emptied (e.g., on game reset)
  useEffect(() => {
    if (myHand.length === 0 && displayedHand.length !== 0) {
      setDisplayedHand([]);
    }
  }, [myHand, displayedHand.length]);

  // Fix: Animate in all cards whenever myHand changes and is not empty
  useEffect(() => {
    if (myHand.length === 0 && displayedHand.length !== 0) {
      setDisplayedHand([]);
      return;
    }
    // Initial hand: animate all cards
    if (myHand.length > 0 && displayedHand.length === 0) {
      let i = 0;
      const animateNext = () => {
        if (myHand[i]) {
          setDisplayedHand(hand => [...hand, myHand[i]]);
        }
        i++;
        if (i < myHand.length) {
          setTimeout(animateNext, 350);
        }
      };
      animateNext();
      return;
    }
    // Per-turn draw: only animate in the new card
    if (myHand.length > displayedHand.length && displayedHand.length > 0) {
      const newCard = myHand[myHand.length - 1];
      if (newCard) {
        setTimeout(() => {
          setDisplayedHand(hand => [...hand, newCard]);
        }, 350);
      }
    }
  }, [myHand, displayedHand.length]);

  // Add state to force show DiceRollModal for at least 2 seconds after dice_result
  const [forceShowDiceModal, setForceShowDiceModal] = useState(false);

  // Show DiceRollModal for at least 2 seconds after dice_result
  useEffect(() => {
    if (gameState === GAME_STATE.DICE_ROLL && diceWinnerId !== null) {
      setForceShowDiceModal(true);
      const t = setTimeout(() => setForceShowDiceModal(false), 2000);
      return () => clearTimeout(t);
    }
  }, [gameState, diceWinnerId]);

  // Add or update the player_hand_update socket listener
  useEffect(() => {
    if (!socketRef.current) return;

    const handlePlayerHandUpdate = (data) => {
      console.log('[FE player_hand_update] Received:', data);
      try {
        if (data && data.playerHand) {
          if (myHand.length === 0) {
            // Initial hand - limit to 5 cards
            console.log('[FE player_hand_update] Setting initial hand with data:', data.playerHand);

            const initialHand = Array.isArray(data.playerHand)
              ? data.playerHand
                .filter(card => card && (card.text || card.questionText)) // Ensure cards have text content
                .slice(0, 5)
                .map(card => ({
                  ...card,
                  _id: card._id || card.id || Date.now().toString() + Math.random().toString(),
                  id: card.id || card._id || Date.now().toString() + Math.random().toString(),
                  type: card.type || (card.questionText ? 'question' : undefined)
                }))
              : [];

            console.log('[FE player_hand_update] Processed initial hand:', initialHand);
            setMyHand(initialHand);
            setDisplayedHand(initialHand);

          } else if (Array.isArray(data.playerHand) && data.playerHand.length === 1) {
            // New card drawn - only add if hand is less than 5 cards
            if (myHand.length < 5) {
              console.log('[FE player_hand_update] Adding single new card to hand');
              const newCard = {
                ...data.playerHand[0],
                _id: data.playerHand[0]._id || data.playerHand[0].id || Date.now().toString() + Math.random().toString(),
                id: data.playerHand[0].id || data.playerHand[0]._id || Date.now().toString() + Math.random().toString(),
                type: data.playerHand[0].type || (data.playerHand[0].questionText ? 'question' : undefined)
              };
              setMyHand(prev => [...prev, newCard]);
              setDisplayedHand(prev => [...prev, newCard]);
            } else {
              console.warn('[FE player_hand_update] Hand already at 5 cards, not adding more');
            }
          }
        } else {
          console.warn('[FE player_hand_update] Received invalid data:', data);
        }
      } catch (error) {
        console.error('[FE player_hand_update] Error processing hand update:', error);
      }
    };

    socketRef.current.on('player_hand_update', handlePlayerHandUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('player_hand_update', handlePlayerHandUpdate);
      }
    };
  }, [myHand, displayedHand]);

  // Add this after all useState/useEffect declarations, but before the main render:
  useEffect(() => {
    if (
      gameState === GAME_STATE.AWAITING_CARD_SUMMON &&
      myHand.length === 0 &&
      socketRef.current &&
      socketRef.current.connected &&
      lobbyId &&
      myPlayerId
    ) {
      console.log('[FIX] Emitting request_initial_cards after handlers registered and dice roll complete');
      socketRef.current.emit('request_initial_cards', {
        lobbyId: lobbyId,
        playerId: myPlayerId
      });
    }
  }, [gameState, myHand.length, socketRef, lobbyId, myPlayerId]);

  // --- Main Render Output ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', width: '100vw', position: 'relative' }}>
        {/* Only show HP bars and Surrender button during main game phase */}
        {gameState !== GAME_STATE.RPS &&
          gameState !== GAME_STATE.SUBJECT_SELECTION &&
          gameState !== GAME_STATE.DECK_CREATION &&
          gameState !== GAME_STATE.DICE_ROLL &&
          gameState !== GAME_STATE.GAME_OVER &&
          rpsResult === null && (
            <>
              {/* Opponent HP bar - top left */}
              <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 200 }}>
                <HPBar label="ENEMY HP" hp={opponentInfo.hp} maxHp={STARTING_HP} />
              </div>
              {/* Player HP bar - bottom right */}
              <div style={{ position: 'absolute', bottom: 64, right: 24, zIndex: 200 }}>
                <HPBar label="YOUR HP" hp={myInfo.hp} maxHp={STARTING_HP} />
              </div>
              {/* Surrender button - just below player HP bar */}
              <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 200, width: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSurrender}
                  style={{
                    margin: 0,
                    padding: '8px 28px',
                    background: '#ff3333',
                    color: '#fff',
                    fontFamily: 'Press Start 2P, monospace',
                    fontSize: '0.8rem',
                    border: '2px solid #ff3333',
                    borderRadius: 0,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 #000a',
                    letterSpacing: 1,
                    textShadow: '1px 1px 0 #000a',
                    transition: 'background 0.2s, color 0.2s',
                    minHeight: 0,
                    height: 28
                  }}
                >
                  SURRENDER
                </button>
              </div>
            </>
          )}
        <div className={styles.gameAreaWrapper} style={{ height: '100%', width: '100vw', display: 'flex', flexDirection: 'column', padding: 0, margin: 0 }}>
          <div className={styles.duelContainer} style={{ height: '100%', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0 }}>
            {/* Turn Indicator - only show during main game phase */}
            {gameState !== GAME_STATE.RPS &&
              gameState !== GAME_STATE.SUBJECT_SELECTION &&
              gameState !== GAME_STATE.DECK_CREATION &&
              gameState !== GAME_STATE.DICE_ROLL &&
              gameState !== GAME_STATE.GAME_OVER &&
              rpsResult === null && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 300,
                  background: 'rgba(0,0,0,0.85)',
                  border: '2px solid #00ff9d',
                  borderRadius: 0,
                  padding: '8px 32px',
                  fontFamily: 'Press Start 2P, monospace',
                  fontSize: '1.1em',
                  color: isMyTurn ? '#00ff9d' : '#ff3333',
                  textShadow: '1px 1px 0 #000a',
                  letterSpacing: 2,
                  boxShadow: '2px 2px 0 0 #000a',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {isMyTurn ? 'YOUR TURN' : 'ENEMY TURN'}
                </div>
              )}
            {/* Render GameOverModal */}
            <GameOverModal
              show={gameState === GAME_STATE.GAME_OVER}
              winnerId={gameOverData?.winnerId}
              winnerName={gameOverData?.winnerName}
              reason={gameOverData?.reason}
              myPlayerId={myPlayerId}
              onPlayAgain={handlePlayAgain}
              onExit={() => {
                console.log('Exiting to dashboard');
                navigate('/student/dashboard');
              }}
            />
            {console.log('GameOverModal props:', {
              show: gameState === GAME_STATE.GAME_OVER,
              gameState,
              gameOverData,
              myPlayerId
            })}
            {/* Subject Selection Modal - Removed (Integrated into main flow) */}
            {/* Render other conditional components */}
            <DiceRollModal
              show={gameState === GAME_STATE.DICE_ROLL}
              playerDiceValue={playerDiceValue}
              opponentDiceValue={opponentDiceValue}
              isRolling={isDiceRolling}
              bothRolled={bothPlayersRolled}
              onRollDice={handleDiceRoll}
              winnerId={diceWinnerId}
              userId={user?.id}
              onTimeoutComplete={handleDiceRollComplete}
            />
            <RpsPhase
              show={gameState === GAME_STATE.RPS || rpsResult !== null}
              onChoice={handleRpsChoice}
              rpsChoice={rpsChoice}
              opponentRpsChoice={opponentRpsChoice}
              rpsResult={rpsResult}
              userId={user?.id}
              onTimeoutComplete={handleRpsTimeoutComplete}
            />
            {/* Only show Subject Selection if state matches AND RPS result is cleared */}
            {gameState === GAME_STATE.SUBJECT_SELECTION && rpsResult === null && (
              <SubjectSelection
                subjects={SUBJECTS}
                onSelectSubject={handleSubjectSelect}
                isPlayerTurn={isMyTurn}
              />
            )}
            {/* Only show Card Selection if state matches DECK_CREATION AND RPS result is cleared */}
            {gameState === GAME_STATE.DECK_CREATION && rpsResult === null && (
              <CardSelection
                isLoading={isLoadingQuestions}
                error={error}
                availableQuestions={availableQuestions}
                selectedQuestions={selectedQuestions}
                requiredCount={DECK_SELECTION_COUNT}
                onSelect={handleQuestionSelect}
                onDeselect={handleQuestionDeselect}
                onConfirm={handleConfirmQuestions}
                onRetry={handleSubjectSelect}
                selectedSubject={selectedSubject}
              />
            )}

            {/* --- Render Question Modal Conditionally --- */}
            {activeQuestion && (
              <>
                {console.log('[FE] Rendering QuestionModal for question:', activeQuestion)}
                <QuestionModal
                  question={activeQuestion}
                  onSubmitAnswer={handleSubmitAnswer}
                />
              </>
            )}

            {/* Main Game Screen Conditionally Rendered - only if not in initial phases AND RPS result is cleared */}
            {gameState !== GAME_STATE.RPS &&
              gameState !== GAME_STATE.SUBJECT_SELECTION &&
              gameState !== GAME_STATE.DECK_CREATION &&
              gameState !== GAME_STATE.DICE_ROLL &&
              gameState !== GAME_STATE.GAME_OVER &&
              rpsResult === null && (
                <>
                  {/* === Opponent Hand (no HP bar here) === */}
                  <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', marginBottom: 0, marginTop: 0 }}>
                    <div style={{ width: '100vw', display: 'flex', justifyContent: 'center', marginBottom: 2, marginTop: 0 }}>
                      <OpponentHand cardCount={opponentHandCount} />
                    </div>
                  </div>
                  {/* === Opponent Area === */}
                  <div className={styles.opponentCounts} style={{ margin: 0, padding: 0, fontSize: '0.9em' }}>
                    <span>Hand: {opponentHandCount}</span>
                    <span>Deck: {opponentDeckCount}</span>
                  </div>
                  {/* === Field / Central Area === */}
                  <div className={styles.gameFieldSection} style={{ flex: 1, minHeight: 0, margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GameField
                      lastSummonedCard={lastSummonedCardOnField}
                      lastPlayedSpell={lastPlayedSpellEffect}
                      myPlayerId={myPlayerId}
                    />
                  </div>
                  {/* === Player Area === */}
                  <div className={styles.playerCounts} style={{ margin: 0, padding: 0, fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{
                      transition: 'transform 0.2s',
                      transform: 'scale(1)',
                      color: '#00ff9d',
                      fontWeight: 'bold',
                    }}>Hand: {myHand.length}</span>
                    <span style={{
                      transition: 'transform 0.2s',
                      transform: 'scale(1)',
                      color: '#00ccff',
                      fontWeight: 'bold',
                    }}>Deck: {myDeckCount}</span>
                  </div>
                  {/* === Player Hand (no HP bar or Surrender button here) === */}
                  {console.log('[Pvp] PlayerHand canPlay:', {
                    currentTurnId,
                    myPlayerId,
                    currentTurnIdType: typeof currentTurnId,
                    myPlayerIdType: typeof myPlayerId,
                    gameState,
                    canPlay: isMyTurn && gameState === GAME_STATE.AWAITING_CARD_SUMMON
                  })}
                  <div className={styles.playerHandArea} style={{ width: '100vw' }}>
                    <PlayerHand
                      hand={displayedHand}
                      onCardClick={handleCardClick}
                      canPlay={isMyTurn && gameState === GAME_STATE.AWAITING_CARD_SUMMON && displayedHand.length > 0}
                    />
                  </div>
                </>
              )}

            {/* Feedback Overlay */}
            {feedback.show && (
              <div className={`${styles.feedbackOverlay} ${styles[feedback.type]}`}>
                {feedback.message}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Centered modal for card confirmation */}
      {selectedCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#19122e',
            border: '4px solid #00ff9d',
            boxShadow: '0 0 0 2px #000',
            fontFamily: 'VT323, monospace',
            color: '#e0e0e0',
            fontSize: '1.2em',
            padding: '32px 32px 24px 32px',
            minWidth: 320,
            maxWidth: 480,
            borderRadius: 0,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}>
            <div style={{ fontFamily: 'Press Start 2P, cursive', color: '#00ff9d', fontSize: '1.1em', marginBottom: 16 }}>Question</div>
            <div style={{ marginBottom: 24, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{selectedCard.text}</div>
            <button
              style={{
                background: '#00ff9d',
                color: '#19122e',
                fontFamily: 'Press Start 2P, monospace',
                fontSize: '1em',
                border: '2px solid #00ff9d',
                borderRadius: 0,
                padding: '10px 32px',
                marginRight: 16,
                cursor: isCardActionPending ? 'not-allowed' : 'pointer',
                boxShadow: '2px 2px 0 0 #000a',
                letterSpacing: 1,
                textShadow: '1px 1px 0 #000a',
                transition: 'background 0.2s, color 0.2s',
                opacity: isCardActionPending ? 0.6 : 1,
              }}
              onClick={() => { if (!isCardActionPending) { handleConfirmCard(selectedCard); setSelectedCard(null); } }}
              disabled={isCardActionPending}
            >
              Confirm
            </button>
            <button
              style={{
                background: '#222',
                color: '#e0e0e0',
                fontFamily: 'Press Start 2P, monospace',
                fontSize: '1em',
                border: '2px solid #888',
                borderRadius: 0,
                padding: '10px 32px',
                cursor: isCardActionPending ? 'not-allowed' : 'pointer',
                boxShadow: '2px 2px 0 0 #000a',
                letterSpacing: 1,
                textShadow: '1px 1px 0 #000a',
                transition: 'background 0.2s, color 0.2s',
                opacity: isCardActionPending ? 0.6 : 1,
              }}
              onClick={() => { if (!isCardActionPending) setSelectedCard(null); }}
              disabled={isCardActionPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* In main game UI render, always show deck area (bottom left) and hand area (bottom center) */}
      {/* Only show deck/hand UI in main game phases */}
      {showDeckAndHand && (
        <>
          <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 100 }}>
            {/* Deck Area */}
            <div style={{ position: 'relative', width: 80, height: 120 }}>
              <div style={{ width: 80, height: 120, background: 'linear-gradient(45deg, #00ff9d, #00ccff)', border: '4px solid #fff', borderRadius: 10, boxShadow: '0 0 20px rgba(0,255,157,0.5)' }} />
              <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Press Start 2P, monospace', color: '#00ff9d', fontSize: '1.1em', textShadow: '0 0 10px #00ff9d88' }}>
                Deck (Backend): {myDeckCount}<br />
                Deck (Visible): {DECK_SIZE - displayedHand.length}
              </div>
            </div>
          </div>
          {/* Hand Area (bottom center) - REMOVE ANIMATED HAND BLOCK, ONLY KEEP PlayerHand BELOW */}
        </>
      )}
      {showDeckAndHand && drawAnimActive && drawAnimCard && (
        <AnimatePresence>
          <motion.div
            key={`drawcard-fly`}
            initial={{ x: 24, y: window.innerHeight - 120 - 24, scale: 1, opacity: 1 }}
            animate={{ x: window.innerWidth / 2 - 40 + (myHand.length - 1) * 92, y: window.innerHeight - 120 - 24, scale: 1.1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: 'fixed', width: 80, height: 120, zIndex: 9999, pointerEvents: 'none' }}
          >
            <div style={{ width: 80, height: 120, background: '#222', border: '2px solid #00ff9d', borderRadius: 8, boxShadow: '0 0 8px #00ff9d88', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: 18 }}>{drawAnimCard.text ? drawAnimCard.text.slice(0, 8) + '...' : 'Card'}</div>
          </motion.div>
        </AnimatePresence>
      )}
      {showSubjectChosen && (
        <SubjectChosenModal show={showSubjectChosen} subjectName={subjectChosenName} />
      )}
    </div>
  );
};

export default Pvp;
