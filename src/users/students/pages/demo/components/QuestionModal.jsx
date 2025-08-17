import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaCheck,
  FaBrain,
  FaQuestion,
  FaBolt,
  FaFire,
  FaGem,
  FaCrown,
} from "react-icons/fa";
import "./QuestionModal.css";

// Bloom's Taxonomy Configuration
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

const QuestionModal = ({
  card,
  onAnswer,
  onClose,
  isVisible,
  powerUpEffects = {},
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle power-up effects for choice elimination
  useEffect(() => {
    if (isVisible && card && card.choices) {
      const newEliminatedChoices = [];

      if (powerUpEffects.hintReveal) {
        // Eliminate 1 wrong choice
        const wrongChoices = card.choices.filter(
          (choice) => choice !== card.answer
        );
        if (wrongChoices.length > 0) {
          const randomWrongChoice =
            wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
          newEliminatedChoices.push(randomWrongChoice);
        }
      } else if (powerUpEffects.fiftyFifty) {
        // Eliminate 2 wrong choices
        const wrongChoices = card.choices.filter(
          (choice) => choice !== card.answer
        );
        if (wrongChoices.length >= 2) {
          const shuffled = wrongChoices.sort(() => 0.5 - Math.random());
          newEliminatedChoices.push(shuffled[0], shuffled[1]);
        } else if (wrongChoices.length === 1) {
          newEliminatedChoices.push(wrongChoices[0]);
        }
      }

      setEliminatedChoices(newEliminatedChoices);
    }
  }, [isVisible, card, powerUpEffects]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isVisible) {
      setSelectedChoice(null);
      setEliminatedChoices([]);
      setIsSubmitting(false);
    }
  }, [isVisible]);

  const handleChoiceSelect = (choice) => {
    if (isEliminated(choice) || isSubmitting) return;
    setSelectedChoice(choice);
  };

  const handleSubmit = () => {
    if (!selectedChoice || isSubmitting) return;

    setIsSubmitting(true);
    onAnswer(selectedChoice);
  };

  const isEliminated = (choice) => {
    return eliminatedChoices.includes(choice);
  };

  const getConfig = () => {
    return (
      BLOOM_CONFIG[card.bloom_level] ||
      BLOOM_CONFIG["Remembering"] || {
        damage: 5,
        color: "#9ca3af",
        bgColor: "rgba(156, 163, 175, 0.2)",
        icon: FaBrain,
      }
    );
  };

  const config = getConfig();
  const IconComponent = config.icon;

  if (!isVisible || !card) return null;

  return (
    <div className="questionModalOverlay">
      <div className="questionModal">
        <div className="modalHeader">
          <div className="cardInfo">
            <div className="cardDamage" style={{ color: config.color }}>
              <IconComponent />
              {config.damage}
            </div>
            <div className="cardBloomLevel" style={{ color: config.color }}>
              {card.bloom_level}
            </div>
          </div>
          <button className="closeButton" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modalContent">
          <div className="questionText">{card.question}</div>

          {card.type !== "spell" && card.choices && (
            <div className="choicesContainer">
              {card.choices.map((choice, index) => (
                <button
                  key={index}
                  className={`choiceButton ${
                    selectedChoice === choice ? "selected" : ""
                  } ${isEliminated(choice) ? "eliminated" : ""}`}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={isEliminated(choice) || isSubmitting}
                >
                  <span className="choiceText">{choice}</span>
                  {isEliminated(choice) && (
                    <span className="eliminatedIcon">❌</span>
                  )}
                  {selectedChoice === choice && (
                    <FaCheck className="selectedIcon" />
                  )}
                </button>
              ))}
            </div>
          )}

          {card.type === "spell" && (
            <div className="spellInfo">
              <div
                className="spellName"
                style={{ color: card.color || "#7c3aed" }}
              >
                {card.name}
              </div>
              <div className="spellDescription">{card.description}</div>
            </div>
          )}
        </div>

        <div className="modalFooter">
          <button
            className="submitButton"
            onClick={handleSubmit}
            disabled={!selectedChoice || isSubmitting}
            style={{ backgroundColor: config.color }}
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
