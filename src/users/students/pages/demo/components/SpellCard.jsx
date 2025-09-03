import React from "react";
import { getSpellCardConfig } from "../utils/cardUtils";

const SpellCard = ({
  spellCard,
  onClick,
  isSelected = false,
  isDisabled = false,
  className = "",
}) => {
  // Use the spell card's own properties if available, otherwise fall back to config
  const config = getSpellCardConfig(spellCard);
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

export default SpellCard;


