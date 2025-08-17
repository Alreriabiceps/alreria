import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
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
  FaShieldAlt,
  FaSnowflake,
  FaHourglassHalf,
  FaBalanceScale,
  FaMagic,
  FaEye,
  FaExchangeAlt,
  FaRandom,
  FaMedkit,
  FaRetweet,
  FaLock,
  FaForward,
  FaHandRock,
  FaHandPaper,
  FaHandScissors,
} from "react-icons/fa";
import {
  GiPerspectiveDiceSixFacesRandom,
  GiCrossedSwords,
} from "react-icons/gi";
import FloatingStars from "../../../components/FloatingStars/FloatingStars";
import TargetCursor from "../components/TargetCursor";
import useSocket from "../../../../../shared/hooks/useSocket";
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
    const rarity = BLOOM_RARITY[card.bloom_level] || 0.1; // Default rarity if not found
    totalWeight += rarity;
    return { card, weight: rarity };
  });

  // If totalWeight is 0, return a random card
  if (totalWeight === 0) {
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }

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

// Spell Cards Configuration (Deck-Based Cards with Colors)
const SPELL_CARDS_CONFIG = {
  // 🔥 Offensive Spells (Red/Orange)
  chain_lightning: {
    name: "Chain Lightning",
    description: "If you answer correctly, opponent loses an extra 5 HP",
    icon: FaBolt,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.2)",
    type: "offensive",
    damage: 5,
  },
  damage_boost: {
    name: "Damage Boost",
    description: "Next correct answer deals +10 extra damage",
    icon: FaFire,
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.2)",
    type: "offensive",
    damage: 10,
  },
  critical_strike: {
    name: "Critical Strike",
    description: "25% chance your next attack deals 3x damage",
    icon: GiCrossedSwords,
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.2)",
    type: "offensive",
    multiplier: 3,
  },
  card_burn: {
    name: "Card Burn",
    description: "Opponent discards 2 random cards from their hand",
    icon: FaFire,
    color: "#ea580c",
    bgColor: "rgba(234, 88, 12, 0.2)",
    type: "offensive",
  },

  // 🛡️ Defensive Spells (Blue/Cyan)
  heal: {
    name: "Heal",
    description: "Restore 20 HP instantly",
    icon: FaMedkit,
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.2)",
    type: "defensive",
    healing: 20,
  },
  reflect: {
    name: "Reflect",
    description: "Next wrong answer damages the questioner instead",
    icon: FaRetweet,
    color: "#0891b2",
    bgColor: "rgba(8, 145, 178, 0.2)",
    type: "defensive",
  },
  immunity: {
    name: "Immunity",
    description: "Can't take damage for one turn",
    icon: FaShieldAlt,
    color: "#0284c7",
    bgColor: "rgba(2, 132, 199, 0.2)",
    type: "defensive",
  },
  damage_reduction: {
    name: "Damage Reduction",
    description: "Next incoming damage is reduced by 50%",
    icon: FaShieldAlt,
    color: "#0891b2",
    bgColor: "rgba(8, 145, 178, 0.2)",
    type: "defensive",
  },

  // 🧠 Utility Spells (Purple/Yellow)
  card_swap: {
    name: "Card Swap",
    description: "Exchange your hand with opponent's hand",
    icon: FaExchangeAlt,
    color: "#7c3aed",
    bgColor: "rgba(124, 58, 237, 0.2)",
    type: "utility",
  },
  question_reroll: {
    name: "Question Reroll",
    description: "Get a new question card instead of current one",
    icon: FaRedo,
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.2)",
    type: "utility",
  },
  turn_skip: {
    name: "Turn Skip",
    description: "Skip opponent's next turn completely",
    icon: FaForward,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.2)",
    type: "utility",
  },
  second_chance: {
    name: "Second Chance",
    description: "Retry the same question after getting it wrong",
    icon: FaHeart,
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.2)",
    type: "utility",
  },
  freeze: {
    name: "Freeze",
    description: "Opponent loses one turn",
    icon: FaSnowflake,
    color: "#0891b2",
    bgColor: "rgba(8, 145, 178, 0.2)",
    type: "utility",
  },
  time_pressure: {
    name: "Time Pressure",
    description: "Cut opponent's timer in half for their next turn",
    icon: FaHourglassHalf,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.2)",
    type: "utility",
  },
};

// Create Spell Card objects
const createSpellCards = () => {
  const spellCards = Object.keys(SPELL_CARDS_CONFIG).map((spellType, index) => {
    const spellConfig = SPELL_CARDS_CONFIG[spellType];
    return {
      id: `spell_${index + 1000}`,
      spell_type: spellType,
      type: "spell",
      name: spellConfig.name,
      description: spellConfig.description,
      icon: spellConfig.icon,
      color: spellConfig.color,
      bgColor: spellConfig.bgColor,
      spellType: spellConfig.type,
    };
  });

  return spellCards;
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
  // Handle cases where bloom_level doesn't match BLOOM_CONFIG keys
  const config = BLOOM_CONFIG[card.bloom_level] ||
    BLOOM_CONFIG["Remembering"] || {
      damage: 5,
      color: "#9ca3af",
      bgColor: "rgba(156, 163, 175, 0.2)",
      icon: FaBrain,
    };
  const IconComponent = config.icon;

  return (
    <div
      className={`gameCard cursor-target ${isSelected ? "selected" : ""} ${
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
const PlayerInfo = ({
  player,
  isCurrentTurn,
  isOpponent,
  gamePhase,
  activatedSpells = [],
}) => {
  const safeName = player?.name || "Player";
  const hp = typeof player?.hp === "number" ? player.hp : 100;
  const maxHp = typeof player?.maxHp === "number" ? player.maxHp : 100;
  const cardCount = Array.isArray(player?.cards) ? player.cards.length : 0;
  const hpPercentage = (hp / (maxHp || 100)) * 100;

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
            <div className="name-v5">{safeName}</div>
            <div className="status-v5">{getStatusText()}</div>
          </div>
          <div className="card-count-v5">
            <FaLayerGroup />
            <span>{cardCount}</span>
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
            <span>HP</span> {hp}
            <span>/{maxHp}</span>
          </div>
        </div>

        {/* Show activated spells */}
        {activatedSpells.length > 0 && (
          <div
            className="activatedSpells"
            style={{
              marginTop: "8px",
              padding: "4px 8px",
              background: "rgba(124, 58, 237, 0.2)",
              borderRadius: "4px",
              border: "1px solid rgba(124, 58, 237, 0.5)",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "#a78bfa",
                marginBottom: "2px",
              }}
            >
              <FaMagic style={{ marginRight: "4px" }} />
              Active Spells:
            </div>
            {activatedSpells.map((spell, index) => (
              <div
                key={index}
                style={{
                  fontSize: "0.6rem",
                  color: "#e5e7eb",
                  marginLeft: "8px",
                }}
              >
                • {spell.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Question Modal Component
const QuestionModal = ({ card, onAnswer, isVisible, powerUpEffects = {} }) => {
  const [selectedChoice, setSelectedChoice] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [eliminatedChoices, setEliminatedChoices] = useState([]);
  const config = BLOOM_CONFIG[card?.bloom_level] ||
    BLOOM_CONFIG["Remembering"] || {
      color: "#9ca3af",
      icon: FaBrain,
    };

  useEffect(() => {
    if (!isVisible) return;

    setSelectedChoice("");
    setTimeLeft(30);
    setEliminatedChoices([]);

    // Apply hint effects if available
    if (powerUpEffects.hintReveal && card?.choices) {
      // Eliminate one wrong answer
      const wrongChoices = card.choices.filter(
        (choice) => choice !== card.answer
      );
      if (wrongChoices.length > 0) {
        const randomWrongChoice =
          wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
        setEliminatedChoices([randomWrongChoice]);
      }
    }

    if (powerUpEffects.fiftyFifty && card?.choices) {
      // Eliminate two wrong answers
      const wrongChoices = card.choices.filter(
        (choice) => choice !== card.answer
      );
      if (wrongChoices.length >= 2) {
        const shuffledWrong = wrongChoices.sort(() => Math.random() - 0.5);
        setEliminatedChoices(shuffledWrong.slice(0, 2));
      }
    }

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
  }, [isVisible, onAnswer, powerUpEffects, card]);

  if (!isVisible || !card) return null;

  const handleSubmit = () => {
    if (card.type === "spell") {
      // For spell cards, just acknowledge and close
      onAnswer("SPELL_ACKNOWLEDGED");
    } else if (selectedChoice) {
      // For question cards, submit the selected choice
      onAnswer(selectedChoice);

      // Clear hint effects after use
      if (powerUpEffects.hintReveal || powerUpEffects.fiftyFifty) {
        // This will be handled by the parent component
        onAnswer(selectedChoice);
      }
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

        {/* Only show choices for question cards, not spell cards */}
        {card.type !== "spell" && card.choices && (
          <div className="choiceGrid">
            {card.choices.map((choice, index) => {
              const isEliminated = eliminatedChoices.includes(choice);
              return (
                <button
                  key={index}
                  className={`choiceOption cursor-target ${
                    selectedChoice === choice ? "selected" : ""
                  } ${isEliminated ? "eliminated" : ""}`}
                  onClick={() => !isEliminated && setSelectedChoice(choice)}
                  disabled={isEliminated}
                  style={{
                    opacity: isEliminated ? 0.3 : 1,
                    textDecoration: isEliminated ? "line-through" : "none",
                    cursor: isEliminated ? "not-allowed" : "pointer",
                  }}
                >
                  {choice}
                  {isEliminated && (
                    <span style={{ color: "#ef4444" }}> ❌</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Show spell card info if it's a spell */}
        {card.type === "spell" && (
          <div
            className="spellCardInfo"
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              padding: "16px",
              borderRadius: "8px",
              margin: "16px 0",
              border: "1px solid var(--field-border)",
            }}
          >
            <div style={{ color: "#f59e0b", marginBottom: "8px" }}>
              <FaMagic style={{ marginRight: "8px" }} />
              SPELL CARD
            </div>
            <div style={{ color: "#e5e7eb", fontSize: "0.9rem" }}>
              {card.description}
            </div>
            <div
              style={{
                color: "#10b981",
                fontSize: "0.8rem",
                marginTop: "8px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Type: {card.type}
            </div>
          </div>
        )}

        <div className="modalActions">
          <button
            className="submitBtn cursor-target"
            onClick={handleSubmit}
            disabled={card.type !== "spell" && !selectedChoice}
          >
            <FaCheck />
            {card.type === "spell" ? "Acknowledge Spell" : "Submit Answer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Rock Paper Scissors Modal Component
const RockPaperScissorsModal = ({
  isVisible,
  rpsPhase,
  myChoice,
  opponentChoice,
  onChoice,
  showResult,
  winner,
  myPlayerIndex,
}) => {
  if (!isVisible) return null;

  const getRpsIcon = (choice) => {
    switch (choice) {
      case "rock":
        return <FaHandRock />;
      case "paper":
        return <FaHandPaper />;
      case "scissors":
        return <FaHandScissors />;
      default:
        return <FaQuestion />;
    }
  };

  const getRpsColor = (choice) => {
    switch (choice) {
      case "rock":
        return "#8b5a2b";
      case "paper":
        return "#3b82f6";
      case "scissors":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="questionModal">
      <div className="modalCard" style={{ maxWidth: "600px" }}>
        <div className="modalHeader">
          <div className="modalBloomType" style={{ color: "#f59e0b" }}>
            <GiCrossedSwords />
            Rock Paper Scissors
          </div>
          <div className="modalTimer">
            {rpsPhase === "selecting"
              ? "Choose your move!"
              : rpsPhase === "waiting"
              ? "Waiting..."
              : "Results!"}
          </div>
        </div>

        <div
          className="modalQuestion"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          {rpsPhase === "selecting"
            ? "Choose your weapon to determine who goes first!"
            : rpsPhase === "waiting"
            ? "Waiting for opponent's choice..."
            : "Round Results!"}
        </div>

        {showResult && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              margin: "20px 0",
              padding: "20px",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "8px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "10px",
                  color: "#e5e7eb",
                }}
              >
                You
              </div>
              <div
                style={{
                  fontSize: "4rem",
                  color: getRpsColor(myChoice),
                  filter:
                    winner === myPlayerIndex
                      ? "drop-shadow(0 0 10px currentColor)"
                      : "none",
                }}
              >
                {getRpsIcon(myChoice)}
              </div>
              <div
                style={{ fontSize: "1rem", marginTop: "8px", color: "#e5e7eb" }}
              >
                {myChoice}
              </div>
            </div>

            <div style={{ fontSize: "2rem", color: "#f59e0b" }}>VS</div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "10px",
                  color: "#e5e7eb",
                }}
              >
                Opponent
              </div>
              <div
                style={{
                  fontSize: "4rem",
                  color: getRpsColor(opponentChoice),
                  filter:
                    winner === 1 - myPlayerIndex
                      ? "drop-shadow(0 0 10px currentColor)"
                      : "none",
                }}
              >
                {getRpsIcon(opponentChoice)}
              </div>
              <div
                style={{ fontSize: "1rem", marginTop: "8px", color: "#e5e7eb" }}
              >
                {opponentChoice}
              </div>
            </div>
          </div>
        )}

        {rpsPhase === "selecting" && (
          <div
            className="choiceGrid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {["rock", "paper", "scissors"].map((choice) => (
              <button
                key={choice}
                className="choiceOption cursor-target"
                onClick={() => onChoice(choice)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  padding: "20px",
                  fontSize: "3rem",
                  color: getRpsColor(choice),
                  border: `2px solid ${getRpsColor(choice)}`,
                  background: `linear-gradient(145deg, rgba(${
                    choice === "rock"
                      ? "139, 90, 43"
                      : choice === "paper"
                      ? "59, 130, 246"
                      : "239, 68, 68"
                  }, 0.1), rgba(45, 55, 72, 0.9))`,
                }}
              >
                {getRpsIcon(choice)}
                <span style={{ fontSize: "1rem", textTransform: "capitalize" }}>
                  {choice}
                </span>
              </button>
            ))}
          </div>
        )}

        {showResult && winner !== null && (
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              padding: "15px",
              background:
                winner === myPlayerIndex
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              border: `1px solid ${
                winner === myPlayerIndex ? "#22c55e" : "#ef4444"
              }`,
            }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: winner === myPlayerIndex ? "#22c55e" : "#ef4444",
              }}
            >
              {winner === myPlayerIndex ? "🎉 You Won!" : "😔 Opponent Won!"}
            </div>
            <div style={{ color: "#e5e7eb", marginTop: "8px" }}>
              {winner === myPlayerIndex
                ? "You will attack first!"
                : "Opponent attacks first!"}
            </div>
          </div>
        )}
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

// Power-ups Configuration (6 Core - 10% Random Chance)
const POWERUPS_CONFIG = {
  double_damage: {
    name: "Double Damage",
    description: "Next correct answer deals 2x damage",
    icon: FaBolt,
    color: "#ef4444",
  },
  shield: {
    name: "Shield",
    description: "Block next incoming damage completely",
    icon: FaShieldAlt,
    color: "#06b6d4",
  },
  hint_reveal: {
    name: "Hint Reveal",
    description: "Eliminate one wrong answer from current question",
    icon: FaGem,
    color: "#10b981",
  },
  extra_turn: {
    name: "Extra Turn",
    description: "Take an additional turn after this one",
    icon: FaClock,
    color: "#8b5cf6",
  },
  card_draw: {
    name: "Card Draw",
    description: "Draw 2 extra cards immediately",
    icon: FaLayerGroup,
    color: "#f59e0b",
  },
  fifty_fifty: {
    name: "50/50",
    description: "Eliminate two wrong options in multiple-choice",
    icon: FaBalanceScale,
    color: "#ec4899",
  },
};

// Spell Card Component
const SpellCard = ({
  spellCard,
  onClick,
  isSelected = false,
  isDisabled = false,
  className = "",
}) => {
  // Use the spell card's own properties if available, otherwise fall back to config
  const config = {
    name:
      spellCard.name ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.name ||
      "Unknown Spell",
    description:
      spellCard.description ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.description ||
      "A mysterious spell card",
    icon:
      spellCard.icon ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.icon ||
      FaMagic,
    color:
      spellCard.color ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.color ||
      "#7c3aed",
    bgColor:
      spellCard.bgColor ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.bgColor ||
      "rgba(124, 58, 237, 0.2)",
    type:
      spellCard.spellType ||
      SPELL_CARDS_CONFIG[spellCard.spell_type]?.type ||
      "utility",
  };
  const IconComponent = config.icon;

  return (
    <div
      className={`gameCard spellCard cursor-target ${
        isSelected ? "selected" : ""
      } ${isDisabled ? "disabled" : ""} ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${config.bgColor}, rgba(45, 55, 72, 0.9))`,
        borderColor: config.color,
      }}
    >
      <div className="cardHeader">
        <div className="cardDamage" style={{ color: config.color }}>
          <IconComponent />
          SPELL
        </div>
      </div>

      <div className="cardContent">
        <div
          className="cardQuestion"
          style={{ color: config.color, fontWeight: "bold" }}
        >
          {config.name}
        </div>
        <div
          className="spellDescription"
          style={{ color: "#e5e7eb", fontSize: "0.7rem", marginTop: "4px" }}
        >
          {config.description}
        </div>
      </div>

      <div
        className="cardFooter"
        style={{ color: config.color, textTransform: "uppercase" }}
      >
        {config.type}
      </div>
    </div>
  );
};

// Power-ups Panel Component
const PowerUpsPanel = ({ powerUps, onUsePowerUp }) => {
  return (
    <div className="powerupsPanel cursor-target">
      <div className="powerupsTitle cursor-target">⚡ POWER-UPS</div>
      {Object.entries(POWERUPS_CONFIG).map(([key, config]) => {
        const powerUp = powerUps[key];
        const isAvailable = powerUp?.available && !powerUp?.used;
        const isUsed = powerUp?.used;

        return (
          <div
            key={key}
            className={`powerupItem cursor-target ${
              isAvailable ? "available" : isUsed ? "used" : ""
            }`}
            onClick={() => isAvailable && onUsePowerUp(key)}
          >
            <config.icon
              className="powerupIcon"
              style={{ color: config.color }}
            />
            <div className="powerupName" style={{ color: config.color }}>
              {config.name}
            </div>
            <div className="powerupDescription">{config.description}</div>
            <div
              className={`powerupStatus ${
                isAvailable ? "available" : isUsed ? "used" : "unavailable"
              }`}
            >
              {isAvailable ? "READY" : isUsed ? "USED" : "UNAVAILABLE"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main Demo Component
const Demo = () => {
  const location = useLocation();
  const socketRef = useSocket();

  // Extract game data from navigation state (from VersusModeLobby)
  const gameData = location.state || {};
  const {
    gameId,
    players: initialPlayers,
    currentPlayer: initialCurrentPlayer,
    roomId,
    gameMode,
  } = gameData;

  const [gameState, setGameState] = useState(gameId ? "rps" : "setup"); // setup, rps, playing, finished
  const [gamePhase, setGamePhase] = useState("cardSelection"); // cardSelection, answering
  const [currentPlayer, setCurrentPlayer] = useState(initialCurrentPlayer || 0); // 0 or 1
  const [players, setPlayers] = useState(
    initialPlayers || [
      { name: "Player 1", hp: 100, maxHp: 100, cards: [] },
      { name: "Player 2", hp: 100, maxHp: 100, cards: [] },
    ]
  );
  const [powerUps, setPowerUps] = useState({
    double_damage: { available: false, used: false },
    shield: { available: false, used: false },
    hint_reveal: { available: false, used: false },
    extra_turn: { available: false, used: false },
    card_draw: { available: false, used: false },
    fifty_fifty: { available: false, used: false },
  });
  const [deck, setDeck] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [questionPhase, setQuestionPhase] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDealing, setIsDealing] = useState(false);
  const [confirmCard, setConfirmCard] = useState(null); // For confirmation modal
  const [realQuestions, setRealQuestions] = useState([]); // Real questions from backend
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [activatedSpells, setActivatedSpells] = useState({}); // Track activated spells per player
  const [powerUpEffects, setPowerUpEffects] = useState({
    doubleDamage: false,
    shield: false,
    hintReveal: false,
    extraTurn: false,
    fiftyFifty: false,
  }); // Track active power-up effects

  // PvP-specific state
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Rock Paper Scissors state
  const [rpsPhase, setRpsPhase] = useState("waiting"); // waiting, selecting, revealing, finished
  const [myRpsChoice, setMyRpsChoice] = useState(null);
  const [opponentRpsChoice, setOpponentRpsChoice] = useState(null);
  const [rpsWinner, setRpsWinner] = useState(null);
  const [showRpsResult, setShowRpsResult] = useState(false);

  const opponentIndex = 1 - myPlayerIndex;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch real questions from backend
  const fetchRealQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found, using sample questions");
        setRealQuestions(SAMPLE_QUESTIONS);
        return;
      }

      const response = await fetch(`${backendUrl}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();

      // Transform backend questions to match our game format
      const transformedQuestions = data.map((question, index) => {
        // Log bloom levels to debug
        console.log(
          `Question ${index}: bloomsLevel = "${question.bloomsLevel}"`
        );

        // Normalize bloom level to match our game format
        const normalizeBloomLevel = (level) => {
          if (!level) return "Remembering";

          const levelStr = level.toString().toLowerCase();
          if (levelStr.includes("remember")) return "Remembering";
          if (levelStr.includes("understand")) return "Understanding";
          if (levelStr.includes("apply")) return "Applying";
          if (levelStr.includes("analyze")) return "Analyzing";
          if (levelStr.includes("evaluate")) return "Evaluating";
          if (levelStr.includes("create")) return "Creating";

          // Default fallback
          return "Remembering";
        };

        return {
          id: question._id || index,
          question: question.questionText,
          choices: question.choices || [],
          answer: question.correctAnswer,
          bloom_level: normalizeBloomLevel(question.bloomsLevel),
          subject: question.subject?.subject || "General",
          difficulty: question.difficulty || "medium",
        };
      });

      setRealQuestions(transformedQuestions);
      console.log(
        `Loaded ${transformedQuestions.length} real questions from backend`
      );
    } catch (err) {
      console.error("Error fetching questions:", err);
      console.warn("Falling back to sample questions");
      setRealQuestions(SAMPLE_QUESTIONS);
    } finally {
      setLoadingQuestions(false);
    }
  }, [backendUrl]);

  // Load questions on component mount
  useEffect(() => {
    fetchRealQuestions();
  }, [fetchRealQuestions]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!socketRef.current || !roomId) return;

    const socket = socketRef.current;

    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    setMyPlayerId(currentUser.id);

    // Determine player index based on user ID
    if (initialPlayers && currentUser.id) {
      const playerIndex = initialPlayers.findIndex(
        (p) => p.userId === currentUser.id
      );
      setMyPlayerIndex(playerIndex !== -1 ? playerIndex : 0);
    }

    // Connection handlers
    socket.on("connect", () => {
      console.log("Connected to game server");
      setIsConnected(true);
      setConnectionStatus("connected");

      // Join the game room
      socket.emit("join_game_room", { roomId });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from game server");
      setIsConnected(false);
      setConnectionStatus("disconnected");
      toast.error("Connection lost! Attempting to reconnect...");
    });

    // Game state synchronization
    socket.on("game_state_update", (data) => {
      console.log("Game state updated:", data);
      const { gameState: newGameState } = data;

      if (newGameState) {
        // Update players from server
        console.log("Updating players from server:", newGameState.players);
        setPlayers(newGameState.players || players);

        // Re-map my index by userId (server is source of truth)
        if (newGameState.players && myPlayerId) {
          const updatedPlayerIndex = newGameState.players.findIndex(
            (p) => p.userId === myPlayerId
          );
          console.log("Player index from server state:", updatedPlayerIndex);
          if (
            updatedPlayerIndex !== -1 &&
            updatedPlayerIndex !== myPlayerIndex
          ) {
            console.log(
              "Updating myPlayerIndex from",
              myPlayerIndex,
              "to",
              updatedPlayerIndex
            );
            setMyPlayerIndex(updatedPlayerIndex);
          }
        }

        // Map server currentTurn (userId) to local player index
        let turnIndex = 0;
        if (newGameState.players && newGameState.currentTurn) {
          const idx = newGameState.players.findIndex(
            (p) => p.userId === newGameState.currentTurn
          );
          turnIndex = idx !== -1 ? idx : 0;
        }
        setCurrentPlayer(turnIndex);

        // Use server gamePhase
        setGamePhase(newGameState.gamePhase || "cardSelection");

        // Sync selected card and answering phase
        if (newGameState.selectedCard) {
          setSelectedCard(newGameState.selectedCard);
        } else {
          setSelectedCard(null);
        }
        setQuestionPhase(newGameState.gamePhase === "answering");
      }
    });

    // Handle opponent actions
    socket.on("opponent_action", (data) => {
      console.log("Opponent action:", data);
      const { playerId, action } = data;

      // Only process if it's not our own action
      if (playerId !== myPlayerId) {
        switch (action.type) {
          case "select_card":
            toast.info("Opponent selected a challenge card!", {
              autoClose: 2000,
            });
            setWaitingForOpponent(false);
            break;
          case "answer_question":
            toast.info("Opponent answered the question!", { autoClose: 2000 });
            break;
          default:
            break;
        }
      }
    });

    // Handle question challenges
    socket.on("question_challenge", (data) => {
      console.log("Received question challenge:", data);
      const { card, challengerId } = data;

      // If we're the one being challenged
      if (challengerId !== myPlayerId) {
        setSelectedCard(card);
        setQuestionPhase(true);
        setGamePhase("answering");
        toast.info("You have been challenged! Answer the question!", {
          autoClose: 3000,
        });
      }
    });

    // Handle RPS events
    socket.on("rps_phase_start", () => {
      console.log("RPS phase started");
      setRpsPhase("selecting");
      setMyRpsChoice(null);
      setOpponentRpsChoice(null);
      setRpsWinner(null);
      setShowRpsResult(false);
      toast.info("Choose your move for Rock Paper Scissors!", {
        autoClose: 3000,
      });
    });

    socket.on("rps_choice_made", (data) => {
      console.log("Opponent made RPS choice");
      // Don't reveal the choice yet, just show that opponent chose
      if (data.playerId !== myPlayerId) {
        toast.info("Opponent has made their choice!", { autoClose: 2000 });
      }
    });

    socket.on("rps_result", (data) => {
      console.log("RPS result received:", data);
      console.log("My Player ID:", myPlayerId);
      console.log("My Player Index:", myPlayerIndex);
      console.log("Current players state:", players);

      const {
        player1Choice,
        player2Choice,
        winner,
        winnerUserId,
        playersUserIds,
        isDraw,
      } = data;

      // Show both choices
      setOpponentRpsChoice(myPlayerIndex === 0 ? player2Choice : player1Choice);
      setShowRpsResult(true);

      if (isDraw) {
        setRpsWinner(null);
        toast.warning("It's a draw! Choose again!", { autoClose: 2000 });
        setTimeout(() => {
          setRpsPhase("selecting");
          setMyRpsChoice(null);
          setOpponentRpsChoice(null);
          setShowRpsResult(false);
        }, 2500);
      } else {
        // Prefer winnerUserId if provided by server for accuracy
        let resolvedWinnerIndex = winner;
        if (winnerUserId && Array.isArray(playersUserIds)) {
          const idx = playersUserIds.findIndex(
            (uid) => String(uid) === String(winnerUserId)
          );
          if (idx !== -1) {
            resolvedWinnerIndex = idx;
          }
        }

        console.log("Resolved winner index:", resolvedWinnerIndex);
        console.log("Am I the winner?", resolvedWinnerIndex === myPlayerIndex);

        setRpsWinner(resolvedWinnerIndex);
        const isWinner = resolvedWinnerIndex === myPlayerIndex;
        toast[isWinner ? "success" : "info"](
          isWinner ? "You won! You go first!" : "Opponent won! They go first!",
          { autoClose: 3000 }
        );

        console.log("Setting up transition to game phase...");
        setTimeout(() => {
          console.log("Transitioning to game phase - winner goes first");
          setRpsPhase("finished");
          setCurrentPlayer(resolvedWinnerIndex);
          setGameState("playing");
          console.log(
            "Game state set to playing, current player:",
            resolvedWinnerIndex
          );
        }, 3000);
      }
    });

    // Handle game events
    socket.on("game_event", (data) => {
      console.log("Game event:", data);
      const { type, message } = data;

      switch (type) {
        case "player_joined":
          toast.success(`${message}`, { autoClose: 2000 });
          break;
        case "player_left":
          toast.warning(`${message}`, { autoClose: 3000 });
          break;
        case "game_ended":
          setWinner(data.winner);
          setGameState("finished");
          toast.success(`Game ended: ${message}`, { autoClose: 5000 });
          break;
        default:
          break;
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(`Game error: ${error.message}`, { autoClose: 3000 });
    });

    // Cleanup
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("game_state_update");
      socket.off("opponent_action");
      socket.off("question_challenge");
      socket.off("rps_phase_start");
      socket.off("rps_choice_made");
      socket.off("rps_result");
      socket.off("game_event");
      socket.off("error");
    };
  }, [socketRef, roomId, myPlayerId, initialPlayers, players, myPlayerIndex]);

  // Initialize deck and shuffle
  const initializeGame = useCallback(() => {
    if (loadingQuestions || realQuestions.length === 0) {
      console.warn("Questions not loaded yet or empty");
      return;
    }

    setIsDealing(true);

    const player1Cards = [];
    const player2Cards = [];
    let tempAvailableQuestions = [...realQuestions];
    const spellCards = createSpellCards();

    // Deal 4 question cards to each player based on rarity
    for (let i = 0; i < 4; i++) {
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

    // Add spell cards with 18% chance for each player
    const addSpellCard = (playerCards) => {
      if (Math.random() < 0.5) {
        // 50% chance (increased for testing)
        const randomSpell =
          spellCards[Math.floor(Math.random() * spellCards.length)];
        playerCards.push(randomSpell);
      }
    };

    addSpellCard(player1Cards);
    addSpellCard(player2Cards);

    console.log("Spell cards created:", spellCards.length);
    console.log(
      "Player 1 cards:",
      player1Cards.map((card) => ({
        id: card.id,
        type: card.type,
        name: card.name || card.question,
      }))
    );
    console.log(
      "Player 2 cards:",
      player2Cards.map((card) => ({
        id: card.id,
        type: card.type,
        name: card.name || card.question,
      }))
    );

    setPlayers([
      { name: "Player 1", hp: 100, maxHp: 100, cards: player1Cards },
      { name: "Player 2", hp: 100, maxHp: 100, cards: player2Cards },
    ]);

    // Deck contains remaining questions + all spell cards (since they're added randomly)
    setDeck([...tempAvailableQuestions, ...spellCards]);
    setGameState("playing");
    setGamePhase("cardSelection");
    setCurrentPlayer(0);
    setSelectedCard(null);
    setWinner(null);
    setQuestionPhase(false);
    setConfirmCard(null); // Reset confirmation modal

    setTimeout(() => setIsDealing(false), 1000); // Animation duration
  }, [loadingQuestions, realQuestions]);

  // Initialize game when transitioning from RPS to playing
  useEffect(() => {
    if (gameState === "playing" && rpsPhase === "finished") {
      initializeGame();
    }
  }, [gameState, rpsPhase, initializeGame]);

  // Draw a card for a player
  const drawCard = useCallback(
    (playerIndex) => {
      if (deck.length === 0) return;

      // Handle both question cards and spell cards
      const newCard = deck[Math.floor(Math.random() * deck.length)];
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

  const activateSpellCard = useCallback(
    (spellCard) => {
      // Remove spell card from current player's hand
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === currentPlayer
            ? {
                ...player,
                cards: player.cards.filter((c) => c.id !== spellCard.id),
              }
            : player
        )
      );

      // Add to activated spells for current player
      setActivatedSpells((prev) => ({
        ...prev,
        [currentPlayer]: [...(prev[currentPlayer] || []), spellCard],
      }));

      // Show activation notification
      toast.success(`✨ ${spellCard.name} activated!`, {
        position: "top-center",
        autoClose: 2000,
      });

      // Show activation message
      toast.success(`✨ ${spellCard.name} activated!`, {
        position: "top-center",
        autoClose: 2000,
      });

      console.log(
        `Player ${currentPlayer + 1} activated spell:`,
        spellCard.name
      );
    },
    [currentPlayer]
  );

  // Handle card selection (current player selects card for opponent to answer)
  const handleCardSelect = useCallback(
    (card) => {
      // Only allow if it's our turn and we're connected
      if (
        currentPlayer !== myPlayerIndex ||
        !isConnected ||
        !socketRef.current
      ) {
        toast.warning("It's not your turn or you're not connected!");
        return;
      }

      // If it's a spell card, activate it immediately
      if (card.type === "spell") {
        activateSpellCard(card);
        return;
      }

      // For question cards, show confirmation modal
      setConfirmCard(card);
    },
    [activateSpellCard, currentPlayer, myPlayerIndex, isConnected, socketRef]
  );

  // Confirm the challenge
  const confirmChallenge = useCallback(() => {
    if (!confirmCard || !socketRef.current || !roomId) return;

    const socket = socketRef.current;

    // Emit card selection to server
    socket.emit("select_card", {
      roomId,
      cardId: confirmCard.id,
      card: confirmCard,
      challengerId: myPlayerId,
    });

    // Update local state
    setSelectedCard(confirmCard);
    setGamePhase("answering");
    setQuestionPhase(false); // We don't answer our own question
    setConfirmCard(null);
    setWaitingForOpponent(true);

    toast.info(
      `You challenged your opponent with a ${confirmCard.bloom_level} question!`,
      { autoClose: 3000 }
    );
  }, [confirmCard, socketRef, roomId, myPlayerId]);

  // Cancel the challenge
  const cancelChallenge = useCallback(() => {
    setConfirmCard(null);
  }, []);

  // Handle RPS choice
  const handleRpsChoice = useCallback(
    (choice) => {
      if (rpsPhase !== "selecting" || !socketRef.current || !roomId) return;

      setMyRpsChoice(choice);
      setRpsPhase("waiting");

      // Send choice to server
      socketRef.current.emit("rps_choice", {
        roomId,
        choice,
        playerId: myPlayerId,
      });

      toast.info(`You chose ${choice}! Waiting for opponent...`, {
        autoClose: 2000,
      });
    },
    [rpsPhase, socketRef, roomId, myPlayerId]
  );

  // Start RPS phase
  const startRpsPhase = useCallback(() => {
    if (!socketRef.current || !roomId) return;

    socketRef.current.emit("start_rps", { roomId });
  }, [socketRef, roomId]);

  // Power-up RNG check (5% chance each turn)
  const checkForPowerUpDrop = useCallback(() => {
    const powerUpKeys = Object.keys(POWERUPS_CONFIG);
    const randomPowerUp =
      powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];

    // 10% chance to get a power-up
    if (Math.random() < 0.1) {
      setPowerUps((prev) => ({
        ...prev,
        [randomPowerUp]: { available: true, used: false },
      }));

      toast.success(
        `⚡ Power-up available: ${POWERUPS_CONFIG[randomPowerUp].name}!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    }
  }, []);

  // Use power-up function
  const handleUsePowerUp = useCallback(
    (powerUpKey) => {
      const powerUp = powerUps[powerUpKey];
      if (!powerUp?.available || powerUp?.used) return;

      // Mark power-up as used
      setPowerUps((prev) => ({
        ...prev,
        [powerUpKey]: { available: false, used: true },
      }));

      // Apply power-up effect based on type
      switch (powerUpKey) {
        case "double_damage":
          setPowerUpEffects((prev) => ({ ...prev, doubleDamage: true }));
          toast.success(
            "Double Damage activated! Next attack deals 2x damage.",
            {
              position: "top-center",
              autoClose: 2000,
            }
          );
          break;

        case "shield":
          setPowerUpEffects((prev) => ({ ...prev, shield: true }));
          toast.success("Shield activated! Next incoming damage blocked.", {
            position: "top-center",
            autoClose: 2000,
          });
          break;

        case "hint_reveal":
          setPowerUpEffects((prev) => ({ ...prev, hintReveal: true }));
          toast.success("Hint Reveal activated! One wrong answer eliminated.", {
            position: "top-center",
            autoClose: 2000,
          });
          break;

        case "extra_turn":
          setPowerUpEffects((prev) => ({ ...prev, extraTurn: true }));
          toast.success("Extra Turn activated! You get another turn!", {
            position: "top-center",
            autoClose: 2000,
          });
          break;

        case "card_draw":
          toast.success("Card Draw activated! Drawing 2 extra cards.", {
            position: "top-center",
            autoClose: 2000,
          });
          // Actually draw 2 cards
          drawCard(currentPlayer);
          drawCard(currentPlayer);
          break;

        case "fifty_fifty":
          setPowerUpEffects((prev) => ({ ...prev, fiftyFifty: true }));
          toast.success("50/50 activated! Two wrong options eliminated.", {
            position: "top-center",
            autoClose: 2000,
          });
          break;

        default:
          break;
      }
    },
    [powerUps, drawCard, currentPlayer]
  );

  // Handle answer submission (opponent answers the selected card)
  const handleAnswer = useCallback(
    (answer) => {
      if (!selectedCard || !socketRef.current || !roomId) return;

      const socket = socketRef.current;

      // Handle spell cards differently
      if (selectedCard.type === "spell") {
        if (answer === "SPELL_ACKNOWLEDGED") {
          // Remove the spell card from current player's hand
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

          toast.success(`Spell card "${selectedCard.name}" acknowledged!`, {
            position: "top-center",
            autoClose: 2000,
          });

          // Switch turns after delay
          setTimeout(() => {
            setCurrentPlayer(opponentIndex);
            setGamePhase("cardSelection");
            setSelectedCard(null);
            setQuestionPhase(false);
            drawCard(opponentIndex);
            checkForPowerUpDrop();
          }, 2000);
        }
        return;
      }

      // Emit answer to server
      socket.emit("answer_question", {
        roomId,
        answer,
        questionId: selectedCard.id,
        playerId: myPlayerId,
      });

      // Close the question modal immediately
      setQuestionPhase(false);

      // Show feedback
      toast.info("Answer submitted! Waiting for results...", {
        position: "top-center",
        autoClose: 2000,
      });
    },
    [
      selectedCard,
      socketRef,
      roomId,
      myPlayerId,
      currentPlayer,
      opponentIndex,
      drawCard,
      checkForPowerUpDrop,
    ]
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
    setActivatedSpells({}); // Clear all activated spells
  };

  const getPhaseText = () => {
    const currentName = players?.[currentPlayer]?.name || "Player";
    const opponentName = players?.[opponentIndex]?.name || "Opponent";
    if (gamePhase === "cardSelection") {
      return `${currentName} is selecting a challenge card for ${opponentName} to answer`;
    } else if (gamePhase === "answering") {
      return `${opponentName} must answer the question`;
    }
    return "";
  };

  return (
    <div className="demoContainer">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <FloatingStars />

      {/* Power-ups Panel */}
      {gameState === "playing" && (
        <PowerUpsPanel powerUps={powerUps} onUsePowerUp={handleUsePowerUp} />
      )}

      {/* Header */}
      <div className="gameHeader">
        <h1 className="gameTitle">
          <FaDice />
          QUIZ CARD DUEL
        </h1>
      </div>

      {gameState === "setup" && (
        <div className="setupScreen">
          <div className="setupPanel">
            {/* Compact Single-Screen Game Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
                maxWidth: "600px",
                margin: "0 auto 16px auto",
              }}
            >
              {/* Game Title */}
              <div
                style={{
                  background: "rgba(20, 35, 50, 0.85)",
                  border: "2px solid var(--legendary-gold)",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#f7fafc",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    color: "var(--legendary-gold)",
                    fontFamily: "Bangers, cursive",
                    fontSize: "1.3rem",
                    margin: "0",
                  }}
                >
                  🎮 Quiz Card Duel - PvP Bloom's Taxonomy Battle
                </h3>
              </div>

              {/* Quick Rules */}
              <div
                style={{
                  background: "rgba(20, 35, 50, 0.85)",
                  border: "2px solid #60a5fa",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#f7fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  <span>
                    <b>⚡ Start:</b> 100 HP, 5 cards each
                  </span>
                  <span>
                    <b>🎯 Goal:</b> Reduce opponent to 0 HP
                  </span>
                  <span>
                    <b>💥 Damage:</b> Wrong answer = they take damage
                  </span>
                </div>
              </div>

              {/* Game Features */}
              <div
                style={{
                  background: "rgba(20, 35, 50, 0.85)",
                  border: "2px solid #7c3aed",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#f7fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.8rem",
                  }}
                >
                  <span>
                    <b>✨ Spell Cards:</b> Purple cards with special effects
                  </span>
                  <span>
                    <b>⚡ Power-Ups:</b> 10% chance random bonuses
                  </span>
                  <span>
                    <b>📊 Bloom's:</b> Higher levels = more damage
                  </span>
                </div>
              </div>
            </div>
            <h2>Ready to Duel?</h2>
            <p>
              Each duelist starts with 100 LP and 5 cards. Select a card to
              challenge your opponent! If they answer correctly, you take
              damage. If they're wrong, they take damage!
            </p>

            {/* Questions Status */}
            <div
              className="questionsStatus"
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                padding: "12px",
                borderRadius: "8px",
                margin: "16px 0",
                border: "1px solid var(--field-border)",
              }}
            >
              {loadingQuestions ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#f59e0b",
                  }}
                >
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Loading questions from database...</span>
                </div>
              ) : realQuestions.length > 0 ? (
                <div style={{ color: "#10b981" }}>
                  <FaCheck style={{ marginRight: "8px" }} />
                  {realQuestions.length} questions loaded successfully!
                </div>
              ) : (
                <div style={{ color: "#ef4444" }}>
                  <FaTimes style={{ marginRight: "8px" }} />
                  No questions available. Please add questions to the system
                  first.
                </div>
              )}
            </div>

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

            <button
              className={`startBtn cursor-target ${
                loadingQuestions ? "loading" : ""
              }`}
              onClick={initializeGame}
              disabled={loadingQuestions || realQuestions.length === 0}
            >
              {loadingQuestions ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading Questions...
                </>
              ) : realQuestions.length === 0 ? (
                <>
                  <FaTimes />
                  No Questions Available
                </>
              ) : (
                <>
                  <FaPlay />
                  Start Duel ({realQuestions.length} Questions)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {gameState === "rps" && (
        <div className="setupScreen">
          <div className="setupPanel">
            <h2>🎯 Ready for Battle!</h2>
            <p>Both players are connected. Time to determine who goes first!</p>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                padding: "20px",
                borderRadius: "8px",
                margin: "20px 0",
                border: "1px solid var(--field-border)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#f59e0b",
                  fontSize: "1.2rem",
                  marginBottom: "10px",
                }}
              >
                <GiCrossedSwords style={{ marginRight: "8px" }} />
                Rock Paper Scissors
              </div>
              <p style={{ color: "#e5e7eb", marginBottom: "20px" }}>
                Winner attacks first! Both players will receive cards after this
                round.
              </p>

              {rpsPhase === "waiting" && (
                <button
                  className="startBtn cursor-target"
                  onClick={startRpsPhase}
                  disabled={!isConnected}
                >
                  <GiCrossedSwords />
                  Start Rock Paper Scissors
                </button>
              )}

              {rpsPhase !== "waiting" && (
                <div style={{ color: "#10b981" }}>
                  <FaCheck style={{ marginRight: "8px" }} />
                  Rock Paper Scissors in progress...
                </div>
              )}
            </div>
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
            <div
              className="connectionStatus"
              style={{
                color: isConnected ? "#10b981" : "#ef4444",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#10b981" : "#ef4444",
                }}
              ></div>
              {connectionStatus}
            </div>
            <div className="turnIndicator">
              <FaArrowRight />
              {currentPlayer === myPlayerIndex
                ? "Your Turn"
                : "Opponent's Turn"}
              {waitingForOpponent && " (Waiting for opponent...)"}
            </div>
            <div className="phaseIndicator">
              {gameMode === "pvp"
                ? `PvP Match - Room: ${roomId?.slice(-6)}`
                : getPhaseText()}
            </div>
          </div>

          {/* Top Player (Opponent) */}
          <div className="playerZone topPlayer">
            <PlayerInfo
              player={
                players?.[opponentIndex] || {
                  name: "Opponent",
                  hp: 100,
                  maxHp: 100,
                  cards: [],
                }
              }
              isCurrentTurn={false}
              isOpponent={true}
              gamePhase={gamePhase}
              activatedSpells={activatedSpells[opponentIndex] || []}
            />
            <div className="cardHand">
              {Array.isArray(players?.[opponentIndex]?.cards) &&
                players[opponentIndex].cards.map((card, index) =>
                  card.type === "spell" ? (
                    <SpellCard
                      key={`${card.id}-${index}`}
                      spellCard={card}
                      isSelected={false}
                      onClick={() => {}}
                      isDisabled={true}
                      className="cursor-target"
                    />
                  ) : (
                    <GameCard
                      key={`${card.id}-${index}`}
                      card={card}
                      isSelected={false}
                      onClick={() => {}}
                      isDisabled={true}
                      isDealing={isDealing}
                      index={index}
                    />
                  )
                )}
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

          {/* Bottom Player (My Player) */}
          <div className="playerZone bottomPlayer">
            <PlayerInfo
              player={
                players?.[myPlayerIndex] || {
                  name: "Player",
                  hp: 100,
                  maxHp: 100,
                  cards: [],
                }
              }
              isCurrentTurn={currentPlayer === myPlayerIndex}
              isOpponent={false}
              gamePhase={gamePhase}
              activatedSpells={activatedSpells[myPlayerIndex] || []}
            />
            <div className="cardHand">
              {Array.isArray(players?.[myPlayerIndex]?.cards) &&
                players[myPlayerIndex].cards.map((card, index) =>
                  card.type === "spell" ? (
                    <SpellCard
                      key={`${card.id}-${index}`}
                      spellCard={card}
                      isSelected={selectedCard?.id === card.id}
                      onClick={() =>
                        gamePhase === "cardSelection" &&
                        currentPlayer === myPlayerIndex &&
                        isConnected &&
                        handleCardSelect(card)
                      }
                      isDisabled={
                        gamePhase !== "cardSelection" ||
                        currentPlayer !== myPlayerIndex ||
                        !isConnected
                      }
                      className="cursor-target"
                    />
                  ) : (
                    <GameCard
                      key={`${card.id}-${index}`}
                      card={card}
                      isSelected={selectedCard?.id === card.id}
                      onClick={() =>
                        gamePhase === "cardSelection" &&
                        currentPlayer === myPlayerIndex &&
                        isConnected &&
                        handleCardSelect(card)
                      }
                      isDisabled={
                        gamePhase !== "cardSelection" ||
                        currentPlayer !== myPlayerIndex ||
                        !isConnected
                      }
                      isDealing={isDealing}
                      index={index}
                      className="cursor-target"
                    />
                  )
                )}
            </div>
          </div>

          {/* Game Controls */}
          <div className="gameControls">
            <button
              className="controlBtn cursor-target"
              onClick={() =>
                setDeck([...deck, ...realQuestions, ...createSpellCards()])
              }
              disabled={realQuestions.length === 0}
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

      {/* Rock Paper Scissors Modal */}
      <RockPaperScissorsModal
        isVisible={gameState === "rps" && rpsPhase !== "waiting"}
        rpsPhase={rpsPhase}
        myChoice={myRpsChoice}
        opponentChoice={opponentRpsChoice}
        onChoice={handleRpsChoice}
        showResult={showRpsResult}
        winner={rpsWinner}
        myPlayerIndex={myPlayerIndex}
      />

      {/* Question Modal - Shows for the player being challenged */}
      <QuestionModal
        card={selectedCard}
        onAnswer={handleAnswer}
        isVisible={questionPhase && currentPlayer !== myPlayerIndex}
        powerUpEffects={powerUpEffects}
      />

      {/* Confirmation Modal */}
      {confirmCard && (
        <div className="questionModal">
          <div className="modalCard">
            <div className="modalHeader">
              <div
                className="modalBloomType"
                style={{
                  color: (
                    BLOOM_CONFIG[confirmCard.bloom_level] ||
                    BLOOM_CONFIG["Remembering"] || {
                      color: "#9ca3af",
                      icon: FaBrain,
                    }
                  ).color,
                }}
              >
                {React.createElement(
                  (
                    BLOOM_CONFIG[confirmCard.bloom_level] ||
                    BLOOM_CONFIG["Remembering"] || {
                      color: "#9ca3af",
                      icon: FaBrain,
                    }
                  ).icon
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
