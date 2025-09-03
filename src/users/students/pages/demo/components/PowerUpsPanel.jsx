import React from "react";
import { POWERUPS_CONFIG } from "../constants/gameConstants";

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

export default PowerUpsPanel;
