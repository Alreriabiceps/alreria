import React from "react";
import { FaClock, FaPlay, FaHeart, FaBolt, FaDice } from "react-icons/fa";
import { GAME_INFO } from "../constants/uiConstants";

const SetupScreen = React.memo(({ gameState, players, myPlayerIndex }) => {
  const isWaitingForCards =
    !players[myPlayerIndex]?.cards ||
    players[myPlayerIndex]?.cards.length === 0;

  return (
    <div className="setupScreen">
      <div className="setupPanel">
        {/* Game Info Section */}
        <div className="gameInfoSection">
          {/* Game Title */}
          <div className="gameTitleCard">
            <h3 className="gameTitleText">{GAME_INFO.TITLE}</h3>
          </div>

          {/* Quick Rules */}
          <div className="quickRulesCard">
            <div className="rulesGrid">
              <span className="ruleItem">
                <b>⚡ Start:</b> {GAME_INFO.QUICK_RULES.START}
              </span>
              <span className="ruleItem">
                <b>🎯 Goal:</b> {GAME_INFO.QUICK_RULES.GOAL}
              </span>
              <span className="ruleItem">
                <b>💥 Damage:</b> {GAME_INFO.QUICK_RULES.DAMAGE}
              </span>
            </div>
          </div>

          {/* Game Features */}
          <div className="gameFeatures">
            <div className="feature">
              <FaHeart className="featureIcon" />
              <span>Health Points</span>
            </div>
            <div className="feature">
              <FaBolt className="featureIcon" />
              <span>Power-ups</span>
            </div>
            <div className="feature">
              <FaDice className="featureIcon" />
              <span>Random Events</span>
            </div>
          </div>

          {/* Game Features Details */}
          <div className="gameFeaturesCard">
            <div className="featuresGrid">
              <span className="featureItem">
                <b>✨ Spell Cards:</b> {GAME_INFO.FEATURES.SPELL_CARDS}
              </span>
              <span className="featureItem">
                <b>⚡ Power-Ups:</b> {GAME_INFO.FEATURES.POWER_UPS}
              </span>
              <span className="featureItem">
                <b>📊 Bloom's:</b> {GAME_INFO.FEATURES.BLOOMS}
              </span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="statusSection">
          {/* Waiting for Server */}
          {gameState === "waiting" && (
            <div className="gameStatus waiting">
              <div className="statusMessage">
                <FaClock className="statusIcon" />
                <span>Waiting for server to initialize game...</span>
              </div>
              <div className="loadingSpinner"></div>
            </div>
          )}

          {/* Game in Progress */}
          {gameState === "playing" && (
            <div className="gameStatus playing">
              <div className="statusMessage">
                <FaPlay className="statusIcon" />
                <span>Game in progress</span>
              </div>
            </div>
          )}

          {/* Loading Cards */}
          {isWaitingForCards && (
            <div className="gameStatus waiting">
              <div className="statusMessage">
                <FaClock className="statusIcon" />
                <span>Loading cards from server...</span>
              </div>
              <div className="loadingSpinner"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SetupScreen.displayName = "SetupScreen";

export default SetupScreen;
