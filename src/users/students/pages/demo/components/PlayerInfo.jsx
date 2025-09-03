import React from "react";

const PlayerInfo = ({ player, isOpponent = false }) => {
  const getHpColor = (currentHp, maxHp) => {
    const percentage = (currentHp / maxHp) * 100;

    if (percentage >= 70) {
      return "#22c55e"; // Green for high HP (70-100%)
    } else if (percentage >= 40) {
      return "#f59e0b"; // Orange for medium HP (40-69%)
    } else if (percentage >= 20) {
      return "#f97316"; // Red-orange for low HP (20-39%)
    } else {
      return "#dc2626"; // Dark red for critical HP (0-19%)
    }
  };

  if (!player) {
    return (
      <div className="playerInfo">
        <div className="playerName">
          {isOpponent ? "OPPONENT" : "PLAYER"}
        </div>
        <div className="hpBar">
          <div className="hpBarBackground">
            <div
              className="hpBarFill"
              style={{
                width: "100%",
                backgroundColor: "#22c55e",
              }}
            ></div>
          </div>
          <div className="hpText">100/100</div>
        </div>
      </div>
    );
  }

  const currentHp = player.hp || 100;
  const maxHp = player.maxHp || 100;
  const hpPercentage = (currentHp / maxHp) * 100;

  return (
    <div className="playerInfo">
      <div className="playerName">
        {player.name || (isOpponent ? "OPPONENT" : "PLAYER")}
      </div>
      <div className="hpBar">
        <div className="hpBarBackground">
          <div
            className="hpBarFill"
            style={{
              width: `${hpPercentage}%`,
              backgroundColor: getHpColor(currentHp, maxHp),
            }}
          ></div>
        </div>
        <div className="hpText">
          {currentHp}/{maxHp}
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;