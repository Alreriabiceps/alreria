import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FaHeart,
  FaBolt,
  FaDice,
  FaPlay,
  FaRedo,
  FaCrown,
  FaSkull,
  FaBrain,
  FaFire,
  FaGem,
  FaQuestion,
  FaCheck,
  FaTimes,
  FaArrowRight,
  FaClock,
  FaUserCircle,
  FaLayerGroup,
} from "react-icons/fa";
import {
  GiPerspectiveDiceSixFacesRandom,
  GiCrossedSwords,
} from "react-icons/gi";
import FloatingStars from "../../../components/FloatingStars/FloatingStars";
import TargetCursor from "../components/TargetCursor";
import "./demo.css";

// Bloom's Taxonomy Configuration with card game colors
const BLOOM_CONFIG = {
  Remembering: {
    damage: 5,
    color: "#9ca3af",
    bgColor: "rgba(156, 163, 175, 0.2)",
    icon: FaBrain,
  },
  Understanding: {
    damage: 10,
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.2)",
    icon: FaQuestion,
  },
  Applying: {
    damage: 15,
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.2)",
    icon: FaBolt,
  },
  Analyzing: {
    damage: 20,
    color: "#fb923c",
    bgColor: "rgba(251, 146, 60, 0.2)",
    icon: FaFire,
  },
  Evaluating: {
    damage: 25,
    color: "#f87171",
    bgColor: "rgba(248, 113, 113, 0.2)",
    icon: FaGem,
  },
  Creating: {
    damage: 30,
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.2)",
    icon: FaCrown,
  },
};

const BLOOM_RARITY = {
  Remembering: 0.3,
  Understanding: 0.25,
  Applying: 0.2,
  Analyzing: 0.12,
  Evaluating: 0.08,
  Creating: 0.05,
};

// Helper function to get a weighted random card
const getWeightedRandomCard = (availableCards) => {
  if (availableCards.length === 0) return null;

  let totalWeight = 0;
  const weightedCards = availableCards.map((card) => {
    const rarity = BLOOM_RARITY[card.bloom_level];
    totalWeight += rarity;
    return { card, weight: rarity };
  });

  let random = Math.random() * totalWeight;
  for (let i = 0; i < weightedCards.length; i++) {
    if (random < weightedCards[i].weight) {
      return weightedCards[i].card;
    }
    random -= weightedCards[i].weight;
  }
  // Fallback in case of floating point issues, return a random card
  return availableCards[Math.floor(Math.random() * availableCards.length)];
};

// Sample questions with Bloom's levels
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "What is the capital of France?",
    choices: ["London", "Berlin", "Paris", "Madrid"],
    answer: "Paris",
    bloom_level: "Remembering",
  },
  {
    id: 2,
    question:
      "Explain the difference between a variable and a constant in programming.",
    choices: [
      "Variables change, constants don't",
      "Constants change, variables don't",
      "They are the same",
      "Neither can change",
    ],
    answer: "Variables change, constants don't",
    bloom_level: "Understanding",
  },
  {
    id: 3,
    question:
      "Calculate the area of a circle with radius 5 using the formula πr².",
    choices: ["25π", "10π", "5π", "15π"],
    answer: "25π",
    bloom_level: "Applying",
  },
  {
    id: 4,
    question:
      "Compare the advantages and disadvantages of renewable vs non-renewable energy sources.",
    choices: [
      "Renewable is always better",
      "Non-renewable is more reliable",
      "Both have trade-offs",
      "They are identical",
    ],
    answer: "Both have trade-offs",
    bloom_level: "Analyzing",
  },
  {
    id: 5,
    question:
      "Evaluate the effectiveness of online learning compared to traditional classroom learning.",
    choices: [
      "Online is superior",
      "Traditional is superior",
      "Depends on context and learner",
      "Both are equally effective",
    ],
    answer: "Depends on context and learner",
    bloom_level: "Evaluating",
  },
  {
    id: 6,
    question: "Design a solution to reduce plastic waste in your community.",
    choices: [
      "Ban all plastics",
      "Recycling programs + education",
      "Do nothing",
      "Use more plastic",
    ],
    answer: "Recycling programs + education",
    bloom_level: "Creating",
  },
  {
    id: 7,
    question: "Who wrote 'Romeo and Juliet'?",
    choices: [
      "Charles Dickens",
      "William Shakespeare",
      "Jane Austen",
      "Mark Twain",
    ],
    answer: "William Shakespeare",
    bloom_level: "Remembering",
  },
  {
    id: 8,
    question: "What does photosynthesis mean in plants?",
    choices: [
      "Plants eat sunlight",
      "Plants convert light to energy",
      "Plants sleep",
      "Plants grow bigger",
    ],
    answer: "Plants convert light to energy",
    bloom_level: "Understanding",
  },
];

// Card Component
const GameCard = ({
  card,
  isSelected,
  onClick,
  isDisabled,
  inBattle = false,
  isDealing = false,
  index = 0,
  className,
}) => {
  const config = BLOOM_CONFIG[card.bloom_level];
  const IconComponent = config.icon;

  return (
    <div
      className={`gameCard ${isSelected ? "selected" : ""} ${
        isDisabled ? "disabled" : ""
      } ${inBattle ? "inBattle" : ""} ${
        isDealing ? "is-dealing" : ""
      } ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${config.bgColor}, rgba(45, 55, 72, 0.9))`,
        animationDelay: isDealing ? `${index * 0.1}s` : "0s",
        borderColor: config.color,
      }}
    >
      <div className="cardHeader">
        <div className="cardDamage" style={{ color: config.color }}>
          <FaBolt />
          {config.damage}
        </div>
      </div>

      <div className="cardContent">
        <div className="cardQuestion">{card.question}</div>
      </div>

      <div className="cardFooter" style={{ color: config.color }}>
        {card.bloom_level}
      </div>
    </div>
  );
};

// Player Info Panel Component - v5
const PlayerInfo = ({ player, isCurrentTurn, isOpponent, gamePhase }) => {
  const hpPercentage = (player.hp / player.maxHp) * 100;

  const getStatusText = () => {
    if (isCurrentTurn && gamePhase === "cardSelection")
      return "SELECTING CHALLENGE";
    if (isOpponent && gamePhase === "cardSelection")
      return "AWAITING CHALLENGE";
    if (isCurrentTurn && gamePhase === "answering")
      return "OPPONENT IS ANSWERING";
    if (isOpponent && gamePhase === "answering") return "ANSWER THE QUESTION!";
    return "WAITING";
  };

  const hpColor =
    hpPercentage > 60
      ? "var(--hp-high-v5)"
      : hpPercentage > 30
      ? "var(--hp-mid-v5)"
      : "var(--hp-low-v5)";

  return (
    <div
      className={`player-card-v5 ${isCurrentTurn ? "active" : ""} ${
        isOpponent ? "opponent" : ""
      }`}
    >
      <div className="player-card-inner-v5">
        <div className="header-v5">
          <div className="avatar-wrapper-v5">
            <FaUserCircle className="avatar-v5" />
          </div>
          <div className="name-and-status-v5">
            <div className="name-v5">{player.name}</div>
            <div className="status-v5">{getStatusText()}</div>
          </div>
          <div className="card-count-v5">
            <FaLayerGroup />
            <span>{player.cards.length}</span>
          </div>
        </div>
        <div className="hp-gauge-v5">
          <div className="hp-gauge-track-v5">
            <div
              className="hp-gauge-fill-v5"
              style={{ width: `${hpPercentage}%`, backgroundColor: hpColor }}
            ></div>
          </div>
          <div className="hp-text-v5">
            <span>HP</span> {player.hp}
            <span>/{player.maxHp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Question Modal Component
const QuestionModal = ({ card, onAnswer, isVisible }) => {
  const [selectedChoice, setSelectedChoice] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const config = BLOOM_CONFIG[card?.bloom_level];

  useEffect(() => {
    if (!isVisible) return;

    setSelectedChoice("");
    setTimeLeft(30);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAnswer(""); // Time's up, wrong answer
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onAnswer]);

  if (!isVisible || !card) return null;

  const handleSubmit = () => {
    if (selectedChoice) {
      onAnswer(selectedChoice);
    }
  };

  return (
    <div className="questionModal">
      <div className="modalCard">
        <div className="modalHeader">
          <div className="modalBloomType" style={{ color: config.color }}>
            <config.icon />
            {card.bloom_level}
          </div>
          <div className="modalTimer">
            <FaClock />
            {timeLeft}s
          </div>
        </div>

        <div className="modalQuestion">{card.question}</div>

        <div className="choiceGrid">
          {card.choices.map((choice, index) => (
            <button
              key={index}
              className={`choiceOption cursor-target ${
                selectedChoice === choice ? "selected" : ""
              }`}
              onClick={() => setSelectedChoice(choice)}
            >
              {choice}
            </button>
          ))}
        </div>

        <div className="modalActions">
          <button
            className="submitBtn cursor-target"
            onClick={handleSubmit}
            disabled={!selectedChoice}
          >
            <FaCheck />
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
};

// Victory Modal Component
const VictoryModal = ({ winner, onRestart, onClose, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="victoryModal">
      <div className="victoryCard">
        <div className="victoryIcon">{winner ? <FaCrown /> : <FaSkull />}</div>
        <h2 className="victoryTitle">
          {winner ? `${winner} WINS!` : "DUEL END"}
        </h2>
        <div className="victoryActions">
          <button className="victoryBtn" onClick={onRestart}>
            <FaRedo />
            New Duel
          </button>
          <button className="victoryBtn secondary" onClick={onClose}>
            <FaTimes />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Demo Component
const Demo = () => {
  const [gameState, setGameState] = useState("setup"); // setup, playing, finished
  const [gamePhase, setGamePhase] = useState("cardSelection"); // cardSelection, answering
  const [currentPlayer, setCurrentPlayer] = useState(0); // 0 or 1
  const [players, setPlayers] = useState([
    { name: "Player 1", hp: 100, maxHp: 100, cards: [] },
    { name: "Player 2", hp: 100, maxHp: 100, cards: [] },
  ]);
  const [deck, setDeck] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [questionPhase, setQuestionPhase] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDealing, setIsDealing] = useState(false);
  const [confirmCard, setConfirmCard] = useState(null); // For confirmation modal

  const opponentIndex = 1 - currentPlayer;

  // Initialize deck and shuffle
  const initializeGame = useCallback(() => {
    setIsDealing(true);

    const player1Cards = [];
    const player2Cards = [];
    let tempAvailableQuestions = [...SAMPLE_QUESTIONS];

    // Deal 5 cards to each player based on rarity
    for (let i = 0; i < 5; i++) {
      const card1 = getWeightedRandomCard(tempAvailableQuestions);
      if (card1) {
        player1Cards.push(card1);
        tempAvailableQuestions = tempAvailableQuestions.filter(
          (q) => q.id !== card1.id
        );
      }

      const card2 = getWeightedRandomCard(tempAvailableQuestions);
      if (card2) {
        player2Cards.push(card2);
        tempAvailableQuestions = tempAvailableQuestions.filter(
          (q) => q.id !== card2.id
        );
      }
    }

    setPlayers([
      { name: "Player 1", hp: 100, maxHp: 100, cards: player1Cards },
      { name: "Player 2", hp: 100, maxHp: 100, cards: player2Cards },
    ]);
    setDeck(tempAvailableQuestions); // Remaining questions form the deck
    setGameState("playing");
    setGamePhase("cardSelection");
    setCurrentPlayer(0);
    setSelectedCard(null);
    setWinner(null);
    setQuestionPhase(false);
    setConfirmCard(null); // Reset confirmation modal

    setTimeout(() => setIsDealing(false), 1000); // Animation duration
  }, []);

  // Draw a card for a player
  const drawCard = useCallback(
    (playerIndex) => {
      if (deck.length === 0) return;

      const newCard = { ...getWeightedRandomCard(deck) };
      setDeck((prev) => prev.filter((q) => q.id !== newCard.id));

      setPlayers((prev) =>
        prev.map((player, index) =>
          index === playerIndex
            ? { ...player, cards: [...player.cards, newCard] }
            : player
        )
      );

      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((player) => ({
            ...player,
            cards: player.cards.map((card) => {
              return card;
            }),
          }))
        );
      }, 700); // Animation duration
    },
    [deck]
  );

  // Handle card selection (current player selects card for opponent to answer)
  const handleCardSelect = useCallback((card) => {
    setConfirmCard(card); // Show confirmation modal
  }, []);

  // Confirm the challenge
  const confirmChallenge = useCallback(() => {
    if (!confirmCard) return;
    setSelectedCard(confirmCard);
    setGamePhase("answering");
    setQuestionPhase(true);
    setConfirmCard(null);
    toast.info(
      `${players[currentPlayer].name} challenges ${players[opponentIndex].name} with a ${confirmCard.bloom_level} question!`,
      { autoClose: 3000 }
    );
  }, [confirmCard, currentPlayer, opponentIndex, players]);

  // Cancel the challenge
  const cancelChallenge = useCallback(() => {
    setConfirmCard(null);
  }, []);

  // Handle answer submission (opponent answers the selected card)
  const handleAnswer = useCallback(
    (answer) => {
      if (!selectedCard) return;

      const isCorrect = answer === selectedCard.answer;
      const damage = BLOOM_CONFIG[selectedCard.bloom_level].damage;

      // If opponent answers correctly, current player takes damage
      // If opponent answers incorrectly, opponent takes damage
      const targetPlayer = isCorrect ? currentPlayer : opponentIndex;

      // Apply damage
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === targetPlayer
            ? { ...player, hp: Math.max(0, player.hp - damage) }
            : player
        )
      );

      // Remove used card from current player's hand
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === currentPlayer
            ? {
                ...player,
                cards: player.cards.filter((c) => c.id !== selectedCard.id),
              }
            : player
        )
      );

      // Show result
      const resultMessage = isCorrect
        ? `Correct! ${damage} damage to ${players[currentPlayer].name}`
        : `Incorrect! ${damage} damage to ${players[opponentIndex].name}`;

      toast[isCorrect ? "success" : "error"](resultMessage, {
        autoClose: 3000,
      });

      // Draw new card for current player after delay
      setTimeout(() => {
        // Switch turns - now the opponent gets to select a card
        setCurrentPlayer(opponentIndex);
        setGamePhase("cardSelection");
        setSelectedCard(null);
        setQuestionPhase(false);
        drawCard(opponentIndex); // Draw a card for the new current player (opponent)
      }, 2500);
    },
    [selectedCard, currentPlayer, opponentIndex, players, drawCard]
  );

  // Check for game end
  useEffect(() => {
    const player1Dead = players[0].hp <= 0;
    const player2Dead = players[1].hp <= 0;

    if (player1Dead || player2Dead) {
      setWinner(player1Dead ? players[1].name : players[0].name);
      setGameState("finished");
    }
  }, [players]);

  const restart = () => {
    setPlayers([
      { name: "Player 1", hp: 100, maxHp: 100, cards: [] },
      { name: "Player 2", hp: 100, maxHp: 100, cards: [] },
    ]);
    setGameState("setup");
    setGamePhase("cardSelection");
    setCurrentPlayer(0);
    setSelectedCard(null);
    setQuestionPhase(false);
    setWinner(null);
    setConfirmCard(null); // Reset confirmation modal on restart
  };

  const getPhaseText = () => {
    if (gamePhase === "cardSelection") {
      return `${players[currentPlayer].name} is selecting a challenge card for ${players[opponentIndex].name} to answer`;
    } else if (gamePhase === "answering") {
      return `${players[opponentIndex].name} must answer the question`;
    }
    return "";
  };

  return (
    <div className="demoContainer">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <style>{`
         :root {
           --card-bg-v5: linear-gradient(145deg, #1f2937, #111827);
           --card-border-v5: #374151;
           --card-active-border-v5: #f59e0b;
           --text-light-v5: #e5e7eb;
           --text-dark-v5: #9ca3af;
           --hp-low-v5: #ef4444;
           --hp-mid-v5: #f59e0b;
           --hp-high-v5: #22c55e;
           --avatar-bg-v5: #4b5563;
         }

         .player-card-v5 {
           background: var(--card-bg-v5);
           border-radius: 12px;
           border: 2px solid var(--card-border-v5);
           padding: 12px;
           width: 100%;
           max-width: 400px;
           align-self: center;
           box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5),
             inset 0 1px 1px rgba(255, 255, 255, 0.05);
           transition: all 0.3s ease-in-out;
         }

         .player-card-v5.active {
           border-color: var(--card-active-border-v5);
           box-shadow: 0 0 20px -5px var(--card-active-border-v5),
             0 4px 16px rgba(0, 0, 0, 0.5),
             inset 0 1px 1px rgba(255, 255, 255, 0.05);
         }

         .player-card-v5.opponent {
           transform: scaleX(-1);
         }
         .player-card-v5.opponent .player-card-inner-v5 {
           transform: scaleX(-1);
         }

         .header-v5 {
           display: flex;
           align-items: center;
           margin-bottom: 12px;
         }

         .avatar-wrapper-v5 {
           background-color: var(--avatar-bg-v5);
           border-radius: 50%;
           padding: 4px;
           margin-right: 12px;
           border: 2px solid var(--card-border-v5);
         }
         .avatar-v5 {
           font-size: 32px;
           color: var(--text-light-v5);
           display: block;
         }
         .player-card-v5.active .avatar-wrapper-v5 {
           border-color: var(--card-active-border-v5);
         }

         .name-and-status-v5 {
           flex-grow: 1;
         }
         .name-v5 {
           font-size: 1.25rem;
           font-weight: 700;
           color: var(--text-light-v5);
         }
         .status-v5 {
           font-size: 0.75rem;
           font-weight: 500;
           color: var(--card-active-border-v5);
           text-transform: uppercase;
           letter-spacing: 0.5px;
         }

         .card-count-v5 {
           display: flex;
           align-items: center;
           font-size: 1rem;
           font-weight: 600;
           color: var(--text-light-v5);
           background: rgba(0, 0, 0, 0.2);
           padding: 6px 10px;
           border-radius: 6px;
         }
         .card-count-v5 svg {
           margin-right: 6px;
           color: var(--text-dark-v5);
         }

         .hp-gauge-v5 {
           position: relative;
         }
         .hp-gauge-track-v5 {
           background-color: #111827;
           border-radius: 6px;
           height: 20px;
           border: 1px solid #4b5563;
           box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
           overflow: hidden;
         }
         .hp-gauge-fill-v5 {
           height: 100%;
           border-radius: 5px;
           transition: width 0.5s ease, background-color 0.5s ease;
           box-shadow: 0 0 10px 1px var(--hp-high-v5); /* Default glow */
         }
         .hp-gauge-fill-v5[style*="var(--hp-mid-v5)"] {
           box-shadow: 0 0 10px 1px var(--hp-mid-v5);
         }
         .hp-gauge-fill-v5[style*="var(--hp-low-v5)"] {
           box-shadow: 0 0 10px 1px var(--hp-low-v5);
         }

         .hp-text-v5 {
           position: absolute;
           top: 50%;
           left: 12px;
           transform: translateY(-50%);
           color: #fff;
           font-weight: 700;
           font-size: 0.9rem;
           text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
           pointer-events: none;
         }
         .hp-text-v5 span:first-child {
           font-size: 0.7rem;
           margin-right: 4px;
           opacity: 0.8;
         }
         .hp-text-v5 span:last-child {
           font-size: 0.8rem;
           opacity: 0.8;
         }

         /* Battle Zone v2 */
         .battleZone-v2 {
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 20px;
           min-height: 250px;
         }

         .deck-area-v2, .challenge-card-area-v2 {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 16px;
         }

         .deck-v2 {
           position: relative;
           width: 100px;
           height: 140px;
           cursor: pointer;
         }

         .deck-card-v2 {
           position: absolute;
           width: 100%;
           height: 100%;
           border-radius: 8px;
           background: var(--card-bg-v5);
           border: 2px solid var(--card-border-v5);
           box-shadow: 0 2px 8px rgba(0,0,0,0.4);
           transition: transform 0.3s ease;
         }

         .deck-card-v2.back {
           transform: rotate(-10deg);
         }
         .deck-card-v2.middle {
           transform: rotate(-5deg);
         }
         .deck-card-v2.front {
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 48px;
           color: var(--card-active-border-v5);
           background: linear-gradient(145deg, #2a3a4a, #1a202c);
         }

         .deck-area-v2:hover .deck-card-v2.back {
           transform: translateY(-10px) rotate(-15deg);
         }
         .deck-area-v2:hover .deck-card-v2.middle {
           transform: translateY(-5px) rotate(-7deg);
         }

         .deck-info-v2 {
           text-align: center;
         }
         .deck-title-v2 {
           font-size: 1.2rem;
           font-weight: 700;
           color: var(--text-light-v5);
           margin: 0;
         }
         .deck-count-v2 {
           font-size: 0.9rem;
           color: var(--text-dark-v5);
           margin: 0;
         }

         .battle-status-v2 {
           background: rgba(0,0,0,0.3);
           padding: 8px 16px;
           border-radius: 8px;
           font-size: 0.9rem;
           font-weight: 600;
           color: var(--text-light-v5);
           text-align: center;
           min-width: 300px;
         }

         .challenge-card-area-v2 .area-title-v2 {
           font-size: 1.2rem;
           font-weight: 700;
           color: var(--card-active-border-v5);
         }
         .challenge-card-area-v2 .area-subtext-v2 {
           font-size: 0.9rem;
           color: var(--text-dark-v5);
         }

         
      /* Card Dealing Animation */
         .gameCard.is-dealing {
           animation: deal-card 0.5s ease-out forwards;
           opacity: 0;
           transform: translateY(100px) scale(0.8);
         }

         @keyframes deal-card {
           to {
             opacity: 1;
             transform: translateY(0) scale(1);
           }
         }

         .pop-in-card {
           animation: pop-in-card 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
         }

         @keyframes pop-in-card {
           from {
             opacity: 0;
             transform: translate(0, -200px) scale(0.2) rotate(30deg); /* Start from deck area */
           }
           to {
             opacity: 1;
             transform: translate(0, 0) scale(1) rotate(0deg);
           }
         }
      `}</style>
      <FloatingStars />

      {/* Header */}
      <div className="gameHeader">
        <h1 className="gameTitle">
          <FaDice />
          QUIZ CARD DUEL
        </h1>
        <p className="gameSubtitle">
          Battle with knowledge cards based on Bloom's Taxonomy
        </p>
      </div>

      {gameState === "setup" && (
        <div className="setupScreen">
          <div className="setupPanel">
            <h2>Ready to Duel?</h2>
            <p>
              Each duelist starts with 100 LP and 5 cards. Select a card to
              challenge your opponent! If they answer correctly, you take
              damage. If they're wrong, they take damage!
            </p>

            <div className="bloomLegend">
              <h3>Card Types & Damage:</h3>
              <div className="legendGrid">
                {Object.entries(BLOOM_CONFIG).map(([level, config]) => (
                  <div
                    key={level}
                    className="legendItem"
                    style={{ borderColor: config.color }}
                  >
                    <config.icon style={{ color: config.color }} />
                    <span>{level}</span>
                    <span>{config.damage} DMG</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="startBtn cursor-target" onClick={initializeGame}>
              <FaPlay />
              Start Duel
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100vw",
          }}
        >
          {/* Game Status Bar */}
          <div className="gameStatusBar">
            <div className="turnIndicator">
              <FaArrowRight />
              {players[currentPlayer].name}'s Turn
            </div>
            <div className="phaseIndicator">{getPhaseText()}</div>
          </div>

          {/* Top Player (Opponent) */}
          <div className="playerZone topPlayer">
            <PlayerInfo
              player={players[opponentIndex]}
              isCurrentTurn={false}
              isOpponent={true}
              gamePhase={gamePhase}
            />
            <div className="cardHand">
              {players[opponentIndex].cards.map((card, index) => (
                <GameCard
                  key={`${card.id}-${index}`}
                  card={card}
                  isSelected={false}
                  onClick={() => {}}
                  isDisabled={true}
                  isDealing={isDealing}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Center Battle Zone */}
          <div className="battleZone-v2">
            {selectedCard ? (
              <div className="challenge-card-area-v2">
                <h3 className="area-title-v2">Challenge Card</h3>
                <GameCard
                  card={selectedCard}
                  isSelected={false}
                  onClick={() => {}}
                  isDisabled={true}
                  inBattle={true}
                />
                <p className="area-subtext-v2">
                  {players[opponentIndex].name} must answer this question!
                </p>
              </div>
            ) : (
              <div className="deck-area-v2">
                <div className="deck-v2">
                  <div className="deck-card-v2 back"></div>
                  <div className="deck-card-v2 middle"></div>
                  <div className="deck-card-v2 front">
                    <GiPerspectiveDiceSixFacesRandom />
                  </div>
                </div>
                <div className="deck-info-v2">
                  <h3 className="deck-title-v2">Deck</h3>
                  <p className="deck-count-v2">{deck.length} Cards</p>
                </div>
                <div className="battle-status-v2">
                  <p>{getPhaseText()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Player (Current Player) */}
          <div className="playerZone bottomPlayer">
            <PlayerInfo
              player={players[currentPlayer]}
              isCurrentTurn={true}
              isOpponent={false}
              gamePhase={gamePhase}
            />
            <div className="cardHand">
              {players[currentPlayer].cards.map((card, index) => (
                <GameCard
                  key={`${card.id}-${index}`}
                  card={card}
                  isSelected={selectedCard?.id === card.id}
                  onClick={() =>
                    gamePhase === "cardSelection" && handleCardSelect(card)
                  }
                  isDisabled={gamePhase !== "cardSelection"}
                  isDealing={isDealing}
                  index={index}
                  className="cursor-target"
                />
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="gameControls">
            <button
              className="controlBtn cursor-target"
              onClick={() => setDeck([...deck, ...SAMPLE_QUESTIONS])}
            >
              <GiPerspectiveDiceSixFacesRandom />
              Cards: {deck.length}
            </button>
            <button
              className="controlBtn danger cursor-target"
              onClick={restart}
            >
              <FaRedo />
              Restart
            </button>
          </div>
        </div>
      )}

      {/* Question Modal - Shows for the opponent */}
      <QuestionModal
        card={selectedCard}
        onAnswer={handleAnswer}
        isVisible={questionPhase}
      />

      {/* Confirmation Modal */}
      {confirmCard && (
        <div className="questionModal">
          <div className="modalCard">
            <div className="modalHeader">
              <div
                className="modalBloomType"
                style={{ color: BLOOM_CONFIG[confirmCard.bloom_level].color }}
              >
                {React.createElement(
                  BLOOM_CONFIG[confirmCard.bloom_level].icon
                )}
                {confirmCard.bloom_level}
              </div>
            </div>
            <div className="modalQuestion">
              Challenge your opponent with this question?
            </div>
            <div className="cardQuestion" style={{ margin: "16px 0" }}>
              {confirmCard.question}
            </div>
            <div className="modalActions">
              <button
                className="submitBtn cursor-target"
                onClick={confirmChallenge}
              >
                Yes, Challenge!
              </button>
              <button
                className="submitBtn cursor-target"
                style={{
                  background: "#222",
                  color: "#fff",
                  borderColor: "#444",
                  marginLeft: 12,
                }}
                onClick={cancelChallenge}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        winner={winner}
        onRestart={initializeGame}
        onClose={restart}
        isVisible={gameState === "finished"}
      />
    </div>
  );
};

export default Demo;
