import React from "react";
import { FaCrown, FaSkull } from "react-icons/fa";
import { GAME_INFO } from "../constants/uiConstants";

const GameHeader = ({ winner, gameState }) => {
  if (winner) {
    return (
      <div className="gameHeader victory">
        <div className="victoryContent">
          <FaCrown className="victoryIcon" />
          <h1 className="victoryTitle">Victory!</h1>
          <p className="victoryMessage">{winner} has won the duel! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gameHeader">
      <h1 className="gameTitle">{GAME_INFO.TITLE}</h1>
      <div className="gameSubtitle">
        <span className="gameMode">PvP Match</span>
        <span className="gameStatus">
          {gameState === "waiting"
            ? "Waiting for players..."
            : "Battle in progress"}
        </span>
      </div>
    </div>
  );
};

export default GameHeader;


