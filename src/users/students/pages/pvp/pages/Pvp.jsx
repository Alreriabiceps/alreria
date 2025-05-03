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
import { motion } from "framer-motion";

const STARTING_HP = 20; // New starting HP
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

const Pvp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  
  // --- Game State & Player Info ---
  const [lobbyId, setLobbyId] = useState(location.state?.lobbyId || null);
  const [gameState, setGameState] = useState(GAME_STATE.WAITING); // Start in WAITING
  const [currentTurnId, setCurrentTurnId] = useState(null); // ID of player whose turn it is
  const [myPlayerId, setMyPlayerId] = useState(user?.id || null);
  const [opponentPlayerId, setOpponentPlayerId] = useState(null);
  const [myInfo, setMyInfo] = useState({ name: user?.firstName || "Player", hp: STARTING_HP, shake: false });
  const [opponentInfo, setOpponentInfo] = useState({ name: "Waiting...", hp: STARTING_HP, shake: false });
  
  // --- Card & Deck State ---
  const [myHand, setMyHand] = useState([]);
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
  const [feedback, setFeedback] = useState({ show: false, correct: null, message: "" }); // For answer results
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
    let mounted = true;
    let socketInstance = null;

    // Function to start the modal countdown timer
    const startSubjectModalCountdown = () => {
      setSubjectModalCountdown(3); // Reset to 3
      const interval = setInterval(() => {
        setSubjectModalCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return interval; // Return interval ID to clear it later
    };

    const connectSocket = async () => {
      if (isConnecting || !mounted || socketInstance) return;
      
      try {
        setIsConnecting(true);
        console.log('Initializing new socket connection...');

        socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
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

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        // Add connection event listeners before connecting
        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message, error.description);
          if (mounted) {
            if (error.message === 'websocket error') {
              console.log('Retrying with polling transport...');
              socketInstance.io.opts.transports = ['polling', 'websocket'];
            }
            retryConnection(); // Uses handler defined above
          }
        });

        socketInstance.on('connect_timeout', () => {
          console.log('Socket connection timeout');
          if (mounted) {
            retryConnection(); // Uses handler defined above
          }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          console.log('Socket reconnected after', attemptNumber, 'attempts');
          if (mounted && location.state?.lobbyId) {
            // Re-join the game room after reconnection
            socketInstance.emit('join_game_room', { 
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player'
            });
          }
        });

        socketInstance.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          if (mounted) {
            setGameMessage('Connection error. Please refresh the page.');
          }
        });

        socketInstance.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          if (mounted) {
            setGameMessage('Connection failed. Please refresh the page.');
            navigate('/');
          }
        });

        socketInstance.on('error', (error) => {
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

        socketInstance.on('connect', () => {
          if (!mounted) return;
          
          console.log('Connected to socket server with ID:', socketInstance.id);
          setIsConnecting(false);
          connectionAttemptsRef.current = 0;
          
          if (location.state?.lobbyId) {
            console.log('Joining game lobby:', location.state.lobbyId);
            socketInstance.emit('join_game_room', { 
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player'
            });
            
            socketInstance.emit('join_game', { 
              lobbyId: location.state.lobbyId,
              playerId: user?.id,
              playerName: user?.firstName || 'Player',
              timestamp: Date.now()
            });
            
            setGameState(GAME_STATE.RPS);
            setGameMessage('Waiting for opponent to join...');
          }
        });

        socketInstance.on('disconnect', (reason) => {
          if (!mounted) return;
          
          console.log('Socket disconnected:', reason, 'Socket ID:', socketInstance.id);
          setIsConnecting(false);
          
          if (reason === 'io server disconnect' || reason === 'transport close') {
            retryConnection(); // Uses handler defined above
          }
        });

        socketInstance.on('opponent_joined', (data) => {
          if (!mounted) return;
          
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

        socketInstance.on('opponent_rps_choice', (data) => {
          if (!mounted) return;
          console.log('Opponent RPS choice received:', data);
          setOpponentRpsChoice(data.choice);
        });

        socketInstance.on('rps_result', (data) => {
          if (!mounted) return;
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

        socketInstance.on('game_ready', (data) => {
          if (!mounted) return;
          console.log('Game ready event received:', data);
          if (data.players.length === 2) {
            console.log('Setting initial game state for RPS');
            setGameReady(true);
            setGameState(GAME_STATE.RPS);
            setGameMessage('Game ready! Get ready to choose...');
            // Reset RPS state for new game/round
            setRpsChoice(null);
            setOpponentRpsChoice(null);
            setRpsResult(null);
          }
        });

        socketInstance.on('room_status', (data) => {
          if (!mounted) return;
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

        socketInstance.on('game_update', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE game_update] Received:', data);

          const previousTurnId = currentTurnId; // Store previous turn ID
          
          // Always update basic info if present
          if (data.gameState) setGameState(data.gameState);
          if (data.currentTurn) setCurrentTurnId(data.currentTurn);
          if (data.gameMessage) setGameMessage(data.gameMessage);
          if (data.selectedSubject) setSelectedSubject(data.selectedSubject); // Update selected subject
          if (data.availableQuestions) setAvailableQuestions(data.availableQuestions); // Update available questions
          
          // --- Reset Turn Flags on Turn Change ---
          if (data.currentTurn && data.currentTurn !== previousTurnId) {
              console.log(`[FE game_update] Turn changed from ${previousTurnId} to ${data.currentTurn}. Resetting turn flags.`);
              setHasSummonedQuestionThisTurn(false);
              setHasPlayedSpellEffectThisTurn(false);
              // Clear field displays from previous turn? Optional.
              // setLastSummonedCardOnField(null);
              // setLastPlayedSpellEffect(null);
          }

          // Update HP
          if (data.player1Id && data.player1Hp !== undefined) {
              if (data.player1Id === myPlayerId) {
                  setMyInfo(prev => ({...prev, hp: data.player1Hp}));
              } else {
                  setOpponentPlayerId(data.player1Id);
                  setOpponentInfo(prev => ({...prev, name: data.player1Name || prev.name, hp: data.player1Hp})); // Added name update
              }
          }
           if (data.player2Id && data.player2Hp !== undefined) {
              if (data.player2Id === myPlayerId) {
                  setMyInfo(prev => ({...prev, hp: data.player2Hp}));
              } else {
                  setOpponentPlayerId(data.player2Id);
                  setOpponentInfo(prev => ({...prev, name: data.player2Name || prev.name, hp: data.player2Hp})); // Added name update
              }
          }

          // Update Hand/Deck Counts
          if (data.player1Id) {
              if (data.player1Id === myPlayerId) {
                  if (data.player1HandCount !== undefined) { /* Only update if count provided */ }
                  if (data.player1DeckCount !== undefined) setMyDeckCount(data.player1DeckCount);
              } else {
                  if (data.player1HandCount !== undefined) setOpponentHandCount(data.player1HandCount);
                  if (data.player1DeckCount !== undefined) setOpponentDeckCount(data.player1DeckCount);
              }
          }
          if (data.player2Id) {
              if (data.player2Id === myPlayerId) {
                  if (data.player2HandCount !== undefined) { /* Only update if count provided */ }
                  if (data.player2DeckCount !== undefined) setMyDeckCount(data.player2DeckCount);
              } else {
                  if (data.player2HandCount !== undefined) setOpponentHandCount(data.player2HandCount);
                  if (data.player2DeckCount !== undefined) setOpponentDeckCount(data.player2DeckCount);
              }
          }
          
           // Update player hand if explicitly sent (usually via 'my_hand_update', but maybe also here)
           if (data.playerHand && data.playerId === myPlayerId) { 
               console.log('[FE game_update] Receiving updated hand');
               setMyHand(data.playerHand.map(card => ({
                   ...card,
                   type: card.type || (card.questionText ? 'question' : undefined)
               })));
           } 

           // Update Field State
           if (data.lastCardSummoned !== undefined) { // Check for explicit presence
               console.log('[FE game_update] Setting last summoned card');
               setLastSummonedCardOnField(data.lastCardSummoned); // { cardId, playerId }
               setLastPlayedSpellEffect(null); // Clear spell effect display
           }
            if (data.lastCardPlayed && data.lastCardPlayed.type === 'spellEffect') {
               console.log('[FE game_update] Setting last played spell effect');
               setLastPlayedSpellEffect(data.lastCardPlayed); // { cardId, playerId, type, ...? }
               // Optionally clear summoned card display if needed
               // setLastSummonedCardOnField(null); 
           }

          // Update Game Message based on new states
          if (data.gameState === GAME_STATE.AWAITING_CARD_SUMMON) {
              if (data.currentTurn === myPlayerId) {
                  setGameMessage('Your Turn: Play a card!');
              } else {
                   const oppName = opponentInfo.name === 'Waiting...' ? 'Opponent' : opponentInfo.name;
                  setGameMessage(`Waiting for ${oppName} to play a card...`);
              }
              setActiveQuestion(null); // Ensure no question is displayed
          }
          if (data.gameState === GAME_STATE.AWAITING_OPPONENT_ANSWER) {
              // Message usually set by handleSummonCard confirmation or other event
          }
          
          // Clear opponent RPS choice visual if state moves past RPS
          if (data.gameState !== GAME_STATE.RPS) {
              setOpponentRpsChoice(null);
          }
          
          // Update opponent name if received and not already set properly
           if (!opponentPlayerId) {
                const p1 = data.player1Id;
                const p2 = data.player2Id;
                if (p1 && p1 !== myPlayerId) setOpponentPlayerId(p1);
                else if (p2 && p2 !== myPlayerId) setOpponentPlayerId(p2);
           }
           if (opponentInfo.name === 'Waiting...' && data.players) { 
                const opponent = data.players.find(p => p.id !== myPlayerId);
                if(opponent) setOpponentInfo(prev => ({...prev, name: opponent.name}));
           } else if (opponentInfo.name === 'Waiting...' && opponentPlayerId) {
               // Attempt to get name if ID is known but name wasn't in initial payload
               const p1Name = data.player1Id === opponentPlayerId ? data.player1Name : null;
               const p2Name = data.player2Id === opponentPlayerId ? data.player2Name : null;
               if (p1Name) setOpponentInfo(prev => ({...prev, name: p1Name}));
               else if (p2Name) setOpponentInfo(prev => ({...prev, name: p2Name}));
           }

           // --- NEW: Update player hand if received in game_update --- 
           // Backend should send this during the transition after dealing (e.g., to DICE_ROLL)
           if (data.playerHand && data.currentTurn === myPlayerId) { 
               console.log('[FE game_update] Receiving updated hand for my turn');
               setMyHand(data.playerHand.map(card => ({
                   ...card,
                   type: card.type || (card.questionText ? 'question' : undefined)
               })));
           } 
           // --- END NEW ---

        });

        socketInstance.on('dice_result', (data) => {
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
                console.log('[FE dice_result] Requesting game state update after dice roll');
                socketRef.current.emit('request_game_state', { lobbyId: location.state?.lobbyId });
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

        socketInstance.on('opponent_asking', (data) => {
          if (!mounted) return;
          console.log('Received opponent_asking:', data);
          if (data.question) {
            // Opponent is asking us a question
            setActiveQuestion(data.question);
            setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
            setCurrentTurnId('player'); // Implicitly our turn if we are being asked
            setGameMessage("Opponent is asking you:");
          }
        });

        socketInstance.on('answer_result', (data) => {
          if (!mounted) return;
          console.log('Received answer_result:', data);

          // Determine previous HP for shake effect trigger
          const prevPlayerHp = myInfo.hp;
          const prevOpponentHp = opponentInfo.hp;

          // Update HP based *only* on server data
          let playerHpChanged = false;
          let opponentHpChanged = false;
          if (data.playerHp !== undefined && data.playerHp !== prevPlayerHp) {
            setMyInfo(prev => ({ ...prev, hp: data.playerHp }));
            playerHpChanged = true;
          }
          if (data.opponentHp !== undefined && data.opponentHp !== prevOpponentHp) {
            setOpponentInfo(prev => ({ ...prev, hp: data.opponentHp }));
            opponentHpChanged = true;
          }
          
          // Trigger HP shake animations via state change in the parent (Pvp.jsx)
          // We need temporary state to trigger the prop change for PlayerInfo
          if(opponentHpChanged) {
              setOpponentInfo(prev => ({...prev, shake: true}));
              setTimeout(() => setOpponentInfo(prev => ({...prev, shake: false})), 500);
          }
           if(playerHpChanged) {
              setMyInfo(prev => ({...prev, shake: true}));
              setTimeout(() => setMyInfo(prev => ({...prev, shake: false})), 500);
          }

          // Show feedback based on server result
          setFeedback({ show: true, correct: data.isCorrect, message: data.message || (data.isCorrect ? "Correct!" : "Wrong!") });

          // Transition after feedback display
          setTimeout(() => {
              if (!isMountedRef.current) return;
              setFeedback({ show: false, correct: null, message: "" });
              setActiveQuestion(null); // Clear current question
              setCurrentQuestion(null); // Clear current question
              setTurn(data.nextTurn === user?.id ? 'player' : 'opponent'); // Server dictates next turn
              // Server might send a game_update event next, or client waits for opponent_asking/player_select_card state
              if (data.nextTurn === user?.id) {
                 setGameMessage("Your turn to attack!");
                 setGameState(GAME_STATE.PLAYER_SELECT_CARD); // Tentative state change
              } else {
                 setGameMessage("Waiting for opponent to attack...");
                 // Assume server pushes correct waiting state or next action event
              }

          }, 1500); // Feedback display duration
        });

        socketInstance.on('game_over', (data) => {
            if (!mounted) return;
            console.log('Received game_over:', data);
            // Update final HP from server data
            if (data.finalPlayerHp !== undefined) setPlayerInfo(prev => ({ ...prev, hp: data.finalPlayerHp }));
            if (data.finalOpponentHp !== undefined) setOpponentInfo(prev => ({ ...prev, hp: data.finalOpponentHp }));

            setGameState(GAME_STATE.GAME_OVER);
            setGameOverData(data);
        });

        socketInstance.on('opponent_surrendered', (data) => {
            if (!mounted) return;
            console.log('Opponent surrendered');
            setGameState(GAME_STATE.GAME_OVER);
            setGameOverData({ reason: "Opponent surrendered!" });
        });

        // NEW Listener for opponent's intermediate roll value
        socketInstance.on('opponent_dice_roll', (data) => {
            if (!mounted) return;
            console.log('Received opponent_dice_roll:', data);
            if (data && data.value !== undefined) {
                setOpponentDiceValue(data.value);
                // Update message maybe? Relies on game_message emit from backend
                // setGameMessage("Opponent rolled. Your turn!"); 
            }
        });

        // Add new handler for game state updates after dice roll
        socketInstance.on('game_state_update', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE game_state_update] Received:', data);

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
        });

        socketInstance.on('card_summoned', (data) => {
            if (!isMountedRef.current) return;
            console.log('[FE card_summoned] Received:', data);
            
            // Update game state to show the question is being asked
            setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
            setGameMessage('Waiting for opponent to answer...');
            
            // Update the last summoned card on field
            setLastSummonedCardOnField({
                cardId: data.cardId,
                playerId: data.playerId,
                question: data.question
            });
        });

        socketInstance.on('opponent_answering', (data) => {
            if (!isMountedRef.current) return;
            console.log('[FE opponent_answering] Received:', data);
            
            // Update game message to show opponent is answering
            setGameMessage('Opponent is answering...');
        });

        socketInstance.on('question_presented', (data) => {
          if (!isMountedRef.current) return;
          console.log('[FE question_presented] Received:', data);
          if (data.question) {
            setActiveQuestion(data.question);
            setGameState(GAME_STATE.AWAITING_OPPONENT_ANSWER);
            setGameMessage(`${data.attackerName || 'Opponent'} is asking you a question!`);
          }
        });

        socketInstance.connect();

      } catch (error) {
        console.error('Error initializing socket:', error);
        if (mounted) {
          setIsConnecting(false);
          retryConnection();
        }
      }
    };

    if (token && location.state?.lobbyId && !socketInstance) {
      connectSocket();
    }

    return () => {
      mounted = false;
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
    // Check against DECK_SELECTION_COUNT before adding
    if (selectedQuestions.length >= DECK_SELECTION_COUNT) return; 
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

  // Handle card click
  const handleCardClick = useCallback((card) => {
    console.log('Card clicked:', card);
    if (!socketRef.current || !socketRef.current.connected) {
        setGameMessage('Error: Not connected to server.');
        return;
    }
    if (currentTurnId !== myPlayerId) {
        setGameMessage('Not your turn!');
        return;
    }
    if (gameState !== GAME_STATE.AWAITING_CARD_SUMMON) {
        setGameMessage('Cannot play card in current phase.');
        return;
    }

    if (card.type === 'question') {
        if (hasSummonedQuestionThisTurn) {
            setGameMessage('You already summoned a question this turn.');
            return;
        }
        
        // Show confirmation dialog or directly emit
        const confirmSummon = window.confirm(`Do you want to ask this question: "${card.text}"?`);
        if (confirmSummon) {
            console.log(`Emitting summon_card for ${card._id}`);
            socketRef.current.emit('summon_card', { 
                lobbyId, 
                cardId: card._id,
                question: card // Send the full question data
            });
            setHasSummonedQuestionThisTurn(true);
            setGameMessage('Question summoned! Waiting for opponent to answer...');
        }
    } else if (card.type === 'spellEffect') {
        if (hasPlayedSpellEffectThisTurn) {
            setGameMessage('You already played a spell/effect this turn.');
            return;
        }
        console.log(`Emitting play_spell_effect for ${card._id}`);
        socketRef.current.emit('play_spell_effect', { 
            lobbyId, 
            cardId: card._id 
        });
        setHasPlayedSpellEffectThisTurn(true);
        setGameMessage('Playing spell/effect...');
    } else {
        console.warn('Clicked card has unknown type:', card.type);
    }
}, [lobbyId, currentTurnId, myPlayerId, gameState, hasSummonedQuestionThisTurn, hasPlayedSpellEffectThisTurn]);

   // NEW: Handle submitting answer from question modal
   const handleSubmitAnswer = useCallback((answer) => {
       console.log('Submitting answer:', answer);
       if (!socketRef.current || !socketRef.current.connected) {
           setGameMessage('Error: Not connected to server.');
           return;
       }
       // Refined check: Can only submit if there's an active question AND it's NOT my turn (meaning I'm defending)
       if (!activeQuestion || currentTurnId === myPlayerId) {
            console.warn('Cannot submit answer: No active question or it is your turn.');
           // setGameMessage('Cannot submit answer now.'); // Avoid unnecessary message spam
           return; 
       }
       if (answer === undefined || answer === null) {
           console.warn('Attempted to submit null/undefined answer');
           return;
       }
       socketRef.current.emit('submit_answer', { lobbyId, answer });
       setActiveQuestion(null); // Hide question modal immediately
       setGameMessage('Answer submitted. Waiting for result...');

   }, [lobbyId, activeQuestion, currentTurnId, myPlayerId]); // Updated dependencies

  // Cleanup function
  useEffect(() => {
    return () => {
      console.log("Component unmounting - cleanup effect runs."); // Add log to confirm execution
      // Keep other potential cleanup logic here
    };
  }, []); // Empty dependency array means this cleanup runs on unmount

  // Handle surrender
  const handleSurrender = () => {
    // Inform opponent (optional but good practice)
    if (socketRef.current) {
        socketRef.current.emit('surrender', { lobbyId });
    }
    // Set game over locally immediately
    setGameState(GAME_STATE.GAME_OVER);
    setGameOverData({ 
        reason: "You surrendered!", 
        winnerId: opponentPlayerId // Opponent wins if you surrender
    }); 
    console.log('Player surrendered.');
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
    // Set rolling state TRUE only for the visual effect duration
    setIsDiceRolling(true); 
    setGameMessage("Rolling the dice...");
    
    setTimeout(() => {
      // Set rolling state FALSE *before* emitting - button becomes clickable again
      // The check above (playerDiceValue !== null) prevents re-rolling after result comes back
      setIsDiceRolling(false); 

      if (socketRef.current && socketRef.current.connected) {
        console.log('Emitting dice_roll event');
        socketRef.current.emit('dice_roll', {
          lobbyId: lobbyId, 
        });
        // Update message to indicate waiting for server/opponent
        setGameMessage("Waiting for opponent to roll..."); 
      } else {
        console.error('Socket not available or not connected for dice roll');
        setGameMessage("Connection error. Cannot roll dice.");
        // Already set isDiceRolling back to false above
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

  // --- Main Render Output ---
  return (
    <div className={styles.gameAreaWrapper}>
      <div className={styles.duelContainer}>
        {/* Render GameOverModal */}
        <GameOverModal
          show={gameState === GAME_STATE.GAME_OVER}
          winnerId={gameOverData?.winnerId}
          winnerName={gameOverData?.winnerName}
          reason={gameOverData?.reason}
          myPlayerId={myPlayerId}
          onPlayAgain={handlePlayAgain}
          onExit={() => navigate('/')} 
        />

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
                isPlayerTurn={currentTurnId === myPlayerId}
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
            <QuestionModal 
                question={activeQuestion} 
                onSubmitAnswer={handleSubmitAnswer} 
            />
        )}

        {/* Main Game Screen Conditionally Rendered - only if not in initial phases AND RPS result is cleared */}
        {gameState !== GAME_STATE.RPS &&
          gameState !== GAME_STATE.SUBJECT_SELECTION &&
          gameState !== GAME_STATE.DECK_CREATION && 
          gameState !== GAME_STATE.DICE_ROLL &&
          gameState !== GAME_STATE.GAME_OVER &&
          rpsResult === null && 
           (
            <>
              {/* === Opponent Area === */}
              <OpponentInfo 
                name={opponentInfo.name}
                hp={opponentInfo.hp}
                maxHp={STARTING_HP}
                hpShake={opponentInfo.shake}
                isActiveTurn={currentTurnId === opponentPlayerId && gameState !== GAME_STATE.WAITING && gameState !== GAME_STATE.GAME_OVER}
              />
              <div className={styles.opponentCounts}>
                <span>Hand: {opponentHandCount}</span>
                <span>Deck: {opponentDeckCount}</span>
                  </div>
              {/* Opponent Hand visual component could go here (showing card backs) */} 
              {/* <OpponentHand cardCount={opponentHandCount} /> */}

              {/* === Field / Central Area === */}
              <div className={styles.gameFieldSection}>
                <GameField 
                    lastSummonedCard={lastSummonedCardOnField}
                    lastPlayedSpell={lastPlayedSpellEffect}
                    myPlayerId={myPlayerId}
                />
              </div>

              {/* === Player Area === */}
              <PlayerInfo 
                name={myInfo.name}
                hp={myInfo.hp}
                maxHp={STARTING_HP}
                hpShake={myInfo.shake}
                isActiveTurn={currentTurnId === myPlayerId && gameState !== GAME_STATE.WAITING && gameState !== GAME_STATE.GAME_OVER}
              />
              <div className={styles.playerCounts}>
                <span>Hand: {myHand.length}</span>
                <span>Deck: {myDeckCount}</span>
                </div>
              {/* Player Hand Area */} 
              <div className={styles.playerHandArea}>
                    {/* Log values used for canPlay calculation */} 
                    {console.log('[Pvp Render] Checking canPlay:', { 
                        currentTurnId, 
                        myPlayerId, 
                        isMyTurn: currentTurnId === myPlayerId, 
                        gameState, 
                        expectedState: GAME_STATE.AWAITING_CARD_SUMMON, 
                        isCorrectState: gameState === GAME_STATE.AWAITING_CARD_SUMMON, 
                        calculatedCanPlay: currentTurnId === myPlayerId && gameState === GAME_STATE.AWAITING_CARD_SUMMON 
                    })}
                    <PlayerHand 
                        hand={myHand} 
                        onCardClick={handleCardClick} 
                        canPlay={currentTurnId === myPlayerId && gameState === GAME_STATE.AWAITING_CARD_SUMMON}
                    />
                  </div>
            </> // Closing fragment tag
          )} 
      </div> {/* Closing duelContainer */}
    </div> // Closing gameAreaWrapper
  );
};

export default Pvp;
