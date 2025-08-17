import React from "react";
import {
  FaBolt,
  FaShieldAlt,
  FaLightbulb,
  FaForward,
  FaRandom,
  FaQuestion,
} from "react-icons/fa";
import "./PowerUpsPanel.css";

const POWERUPS_CONFIG = {
  double_damage: {
    name: "Double Damage",
    description: "Next correct answer deals double damage",
    icon: FaBolt,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.2)",
  },
  shield: {
    name: "Shield",
    description: "Next wrong answer deals no damage",
    icon: FaShieldAlt,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.2)",
  },
  hint_reveal: {
    name: "Hint Reveal",
    description: "Eliminate one wrong choice",
    icon: FaLightbulb,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.2)",
  },
  extra_turn: {
    name: "Extra Turn",
    description: "Take another turn after this one",
    icon: FaForward,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.2)",
  },
  card_draw: {
    name: "Card Draw",
    description: "Draw 2 extra cards",
    icon: FaRandom,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.2)",
  },
  fifty_fifty: {
    name: "50/50",
    description: "Eliminate two wrong choices",
    icon: FaQuestion,
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.2)",
  },
};

const PowerUpsPanel = ({
  powerUps = {},
  onUsePowerUp,
  isCurrentTurn = false,
  className = "",
}) => {
  const handlePowerUpClick = (powerUpType) => {
    if (!isCurrentTurn) return;

    const powerUp = powerUps[powerUpType];
    if (powerUp && powerUp.available && !powerUp.used) {
      onUsePowerUp(powerUpType);
    }
  };

  const getAvailablePowerUps = () => {
    return Object.entries(powerUps).filter(
      ([key, powerUp]) => powerUp.available && !powerUp.used
    );
  };

  const availablePowerUps = getAvailablePowerUps();

  if (availablePowerUps.length === 0) {
    return (
      <div className={`powerUpsPanel empty ${className}`}>
        <div className="powerUpsTitle">
          <FaBolt />
          POWER-UPS
        </div>
        <div className="noPowerUps">
          <span>No power-ups available</span>
          <small>Check back on your next turn!</small>
        </div>
      </div>
    );
  }

  return (
    <div className={`powerUpsPanel ${className}`}>
      <div className="powerUpsTitle">
        <FaBolt />
        POWER-UPS
        <span className="powerUpsCount">({availablePowerUps.length})</span>
      </div>

      <div className="powerUpsList">
        {availablePowerUps.map(([powerUpType, powerUp]) => {
          const config = POWERUPS_CONFIG[powerUpType];
          const IconComponent = config.icon;

          return (
            <div
              key={powerUpType}
              className={`powerUpItem ${
                isCurrentTurn ? "clickable" : "disabled"
              }`}
              onClick={() => handlePowerUpClick(powerUpType)}
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.color,
              }}
              title={config.description}
            >
              <div className="powerUpIcon" style={{ color: config.color }}>
                <IconComponent />
              </div>
              <div className="powerUpInfo">
                <div className="powerUpName" style={{ color: config.color }}>
                  {config.name}
                </div>
                <div className="powerUpDescription">{config.description}</div>
              </div>
              {isCurrentTurn && (
                <div className="powerUpUseIndicator">
                  <span>USE</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isCurrentTurn && availablePowerUps.length > 0 && (
        <div className="powerUpsHint">
          <small>Power-ups available on your turn</small>
        </div>
      )}
    </div>
  );
};

export default PowerUpsPanel;
