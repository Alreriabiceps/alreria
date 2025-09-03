import React from "react";
import { FaBolt } from "react-icons/fa";
import { getCardConfig } from "../utils/cardUtils";
import { BLOOM_CONFIG } from "../constants/gameConstants";

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
  const config = getCardConfig(card, BLOOM_CONFIG);
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

export default GameCard;
