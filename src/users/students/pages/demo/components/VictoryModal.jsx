import React from "react";
import { FaTrophy, FaCrown, FaMedal, FaTimes } from "react-icons/fa";
import "./VictoryModal.css";

const VictoryModal = ({ winner, players, onClose }) => {
  const winnerPlayer = players?.find((p) => p.userId === winner);
  const loserPlayer = players?.find((p) => p.userId !== winner);

  return (
    <div className="victoryModalOverlay">
      <div className="victoryModal">
        <button className="closeButton" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="victoryContent">
          <div className="victoryHeader">
            <FaTrophy className="trophyIcon" />
            <h2>Game Over!</h2>
          </div>

          <div className="winnerSection">
            <div className="winnerCrown">
              <FaCrown />
            </div>
            <div className="winnerInfo">
              <h3>{winnerPlayer?.username || "Unknown Player"}</h3>
              <p className="winnerTitle">Victory!</p>
            </div>
          </div>

          <div className="resultsSection">
            <div className="playerResult winner">
              <div className="playerName">
                {winnerPlayer?.username || "Player 1"}
              </div>
              <div className="playerStats">
                <span className="hp">HP: {winnerPlayer?.hp || 0}</span>
                <span className="cards">
                  Cards: {winnerPlayer?.cards?.length || 0}
                </span>
              </div>
            </div>

            <div className="vsSeparator">VS</div>

            <div className="playerResult loser">
              <div className="playerName">
                {loserPlayer?.username || "Player 2"}
              </div>
              <div className="playerStats">
                <span className="hp">HP: {loserPlayer?.hp || 0}</span>
                <span className="cards">
                  Cards: {loserPlayer?.cards?.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="gameStats">
            <div className="statItem">
              <FaMedal />
              <span>Winner: {winnerPlayer?.username || "Unknown"}</span>
            </div>
            <div className="statItem">
              <span>Final HP: {winnerPlayer?.hp || 0}</span>
            </div>
          </div>

          <div className="actionButtons">
            <button className="playAgainButton" onClick={onClose}>
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryModal;
