import React from "react";
import { FaClock, FaUserCircle } from "react-icons/fa";
import { getTurnIndicatorText } from "../utils/gameLogic";
import { LOADING_STATES } from "../constants/uiConstants";

const GameStatusBar = ({
  currentTurnUserId,
  myPlayerId,
  waitingForOpponent,
  players,
  myPlayerIndex,
  gameState,
}) => {
  const turnText = getTurnIndicatorText(
    currentTurnUserId,
    myPlayerId,
    waitingForOpponent
  );

  if (gameState === "waiting") {
    return (
      <div className="gameStatusBar waiting">
        <div className="statusContent">
          <FaClock className="statusIcon" />
          <span className="statusText">{LOADING_STATES.WAITING_SERVER}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gameStatusBar">
      <div className="statusContent">
        <FaUserCircle className="statusIcon" />
        <span className="statusText">{turnText}</span>
      </div>
      <div className="playerCount">Players: {players.length}/2</div>
    </div>
  );
};

export default GameStatusBar;


