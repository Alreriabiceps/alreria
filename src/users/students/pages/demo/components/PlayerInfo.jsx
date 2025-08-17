import React from "react";
import { FaUser, FaHeart, FaShieldAlt, FaBolt } from "react-icons/fa";
import "./PlayerInfo.css";

const PlayerInfo = ({
  player,
  isCurrentTurn = false,
  isOpponent = false,
  gamePhase = "cardSelection",
  activatedSpells = [],
  className = "",
}) => {
  const getStatusText = () => {
    if (gamePhase === "cardSelection") {
      return isCurrentTurn ? "SELECTING CARD" : "WAITING";
    } else if (gamePhase === "answering") {
      return isCurrentTurn ? "ANSWERING" : "OPPONENT TURN";
    }
    return "READY";
  };

  const getStatusColor = () => {
    if (isCurrentTurn) return "#10b981";
    if (gamePhase === "answering") return "#f59e0b";
    return "#6b7280";
  };

  return (
    <div
      className={`playerInfo ${isOpponent ? "opponent" : "local"} ${className}`}
    >
      <div className="playerHeader">
        <div className="playerAvatar">
          <FaUser />
        </div>
        <div className="playerDetails">
          <div className="playerName">{player.username}</div>
          <div className="playerStatus" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </div>
        </div>
        <div className="playerStats">
          <div className="statItem">
            <FaHeart className="statIcon" />
            <span className="statValue">
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <div className="statItem">
            <FaBolt className="statIcon" />
            <span className="statValue">{player.cards?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="hpBarContainer">
        <div className="hpBar">
          <div
            className="hpFill"
            style={{
              width: `${(player.hp / player.maxHp) * 100}%`,
              backgroundColor:
                player.hp > 50
                  ? "#10b981"
                  : player.hp > 25
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          />
        </div>
      </div>

      {/* Activated Spells */}
      {activatedSpells && activatedSpells.length > 0 && (
        <div className="activatedSpells">
          <div className="spellsTitle">
            <FaBolt />
            ACTIVE SPELLS
          </div>
          <div className="spellsList">
            {activatedSpells.map((spell, index) => (
              <div
                key={spell.id || index}
                className="spellIndicator"
                style={{
                  backgroundColor: spell.bgColor || "rgba(124, 58, 237, 0.2)",
                  borderColor: spell.color || "#7c3aed",
                }}
                title={spell.name}
              >
                <span style={{ color: spell.color || "#7c3aed" }}>
                  {spell.name?.charAt(0) || "S"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turn Indicator */}
      {isCurrentTurn && (
        <div className="turnIndicator">
          <div className="turnPulse"></div>
          <span>YOUR TURN</span>
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;
