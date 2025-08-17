import React from "react";
import {
  FaBrain,
  FaQuestion,
  FaBolt,
  FaFire,
  FaGem,
  FaCrown,
} from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import "./GameCard.css";

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

const GameCard = ({
  card,
  isSelected = false,
  onClick,
  isDisabled = false,
  inBattle = false,
  isDealing = false,
  index = 0,
  className = "",
  isOpponent = false,
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

  // For opponent cards, show minimal info
  if (isOpponent) {
    return (
      <div
        className={`gameCard opponentCard ${isSelected ? "selected" : ""} ${
          isDisabled ? "disabled" : ""
        } ${className}`}
        onClick={onClick}
        style={{
          background: `linear-gradient(145deg, rgba(75, 85, 99, 0.2), rgba(45, 55, 72, 0.9))`,
          borderColor: "#6b7280",
          opacity: 0.7,
          transform: "rotateY(180deg)",
        }}
      >
        <div className="cardHeader">
          <div className="cardDamage" style={{ color: "#6b7280" }}>
            <FaQuestion />
            CARD
          </div>
        </div>
        <div className="cardContent">
          <div className="cardQuestion" style={{ color: "#6b7280" }}>
            ???
          </div>
        </div>
        <div className="cardFooter" style={{ color: "#6b7280" }}>
          HIDDEN
        </div>
      </div>
    );
  }

  // For spell cards
  if (card.type === "spell") {
    return (
      <div
        className={`gameCard spellCard ${isSelected ? "selected" : ""} ${
          isDisabled ? "disabled" : ""
        } ${className}`}
        onClick={onClick}
        style={{
          background: `linear-gradient(145deg, ${
            card.bgColor || "rgba(124, 58, 237, 0.2)"
          }, rgba(45, 55, 72, 0.9))`,
          borderColor: card.color || "#7c3aed",
        }}
      >
        <div className="cardHeader">
          <div
            className="cardDamage"
            style={{ color: card.color || "#7c3aed" }}
          >
            <FaBolt />
            SPELL
          </div>
        </div>
        <div className="cardContent">
          <div
            className="cardQuestion"
            style={{ color: card.color || "#7c3aed", fontWeight: "bold" }}
          >
            {card.name}
          </div>
          <div
            className="spellDescription"
            style={{ color: "#e5e7eb", fontSize: "0.7rem", marginTop: "4px" }}
          >
            {card.description}
          </div>
        </div>
        <div
          className="cardFooter"
          style={{ color: card.color || "#7c3aed", textTransform: "uppercase" }}
        >
          {card.spellType || "utility"}
        </div>
      </div>
    );
  }

  // For question cards
  return (
    <div
      className={`gameCard ${isSelected ? "selected" : ""} ${
        isDisabled ? "disabled" : ""
      } ${className}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${config.bgColor}, rgba(45, 55, 72, 0.9))`,
        borderColor: config.color,
        animation: isDealing
          ? `dealCard 0.5s ease-out ${index * 0.1}s`
          : "none",
      }}
    >
      <div className="cardHeader">
        <div className="cardDamage" style={{ color: config.color }}>
          <IconComponent />
          {config.damage}
        </div>
      </div>
      <div className="cardContent">
        <div
          className="cardQuestion"
          style={{ color: config.color, fontWeight: "bold" }}
        >
          {card.question}
        </div>
        <div
          className="cardBloomLevel"
          style={{ color: config.color, fontSize: "0.8rem", marginTop: "4px" }}
        >
          {card.bloom_level}
        </div>
      </div>
      <div
        className="cardFooter"
        style={{ color: config.color, textTransform: "uppercase" }}
      >
        {card.bloom_level}
      </div>
    </div>
  );
};

export default GameCard;
