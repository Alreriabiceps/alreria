import React from "react";
import { FaHeart, FaUserCircle, FaLayerGroup } from "react-icons/fa";
import { getPlayerStatusText, getHpColor } from "../utils/playerUtils";
import { GAME_PHASES } from "../constants/gameStates";
import GameCard from "./GameCard";
import SpellCard from "./SpellCard";

const PlayerZone = ({
  player,
  playerIndex,
  isCurrentTurn,
  isOpponent,
  gamePhase,
  selectedCard,
  onCardClick,
  isDisabled,
  isDealing,
  myPlayerIndex,
}) => {
  if (!player) return null;

  const hp = typeof player?.hp === "number" ? player.hp : 100;
  const maxHp = typeof player?.maxHp === "number" ? player.maxHp : 100;
  const cardCount = Array.isArray(player?.cards) ? player.cards.length : 0;
  const hpPercentage = (hp / (maxHp || 100)) * 100;

  const getStatusText = () => {
    return getPlayerStatusText(isCurrentTurn, isOpponent, gamePhase);
  };

  const hpColor = getHpColor(hpPercentage);

  return (
    <div
      className={`player-zone ${isCurrentTurn ? "active" : ""} ${
        isOpponent ? "opponent" : ""
      }`}
    >
      {/* Player Info */}
      <div className="player-info">
        <div className="player-avatar">
          <FaUserCircle className="avatar-icon" />
        </div>
        <div className="player-details">
          <h3 className="player-name">{player.name}</h3>
          <div className="player-status">
            <span className={`status-text ${isCurrentTurn ? "active" : ""}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="hp-container">
        <div className="hp-bar">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercentage}%`,
              backgroundColor: hpColor,
            }}
          />
        </div>
        <div className="hp-text">
          <FaHeart className="hp-icon" />
          <span>
            {hp}/{maxHp}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="player-cards">
        <div className="cards-header">
          <FaLayerGroup className="cards-icon" />
          <span className="cards-count">{cardCount} cards</span>
        </div>

        <div className="cards-container">
          {player.cards && player.cards.length > 0 ? (
            player.cards.map((card, cardIndex) => {
              const isSelected = selectedCard && selectedCard.id === card.id;

              if (card.type === "spell") {
                return (
                  <SpellCard
                    key={card.id}
                    spellCard={card}
                    isSelected={isSelected}
                    onClick={() => onCardClick(card, playerIndex)}
                    isDisabled={isDisabled}
                    className={`dealing-${cardIndex}`}
                  />
                );
              } else {
                return (
                  <GameCard
                    key={card.id}
                    card={card}
                    isSelected={isSelected}
                    onClick={() => onCardClick(card, playerIndex)}
                    isDisabled={isDisabled}
                    inBattle={false}
                    isDealing={isDealing}
                    index={cardIndex}
                    className={`dealing-${cardIndex}`}
                  />
                );
              }
            })
          ) : (
            <div className="no-cards">
              <span>No cards available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerZone;


