import React from "react";
import { FaClock, FaUserCircle } from "react-icons/fa";
import { getTurnIndicatorText } from "../utils/gameLogic";
import { LOADING_STATES } from "../constants/uiConstants";
import PlayerZone from "./PlayerZone";

const GameBoard = React.memo(
  ({
    gameState,
    gamePhase,
    players,
    myPlayerIndex,
    opponentIndex,
    currentTurnUserId,
    myPlayerId,
    waitingForOpponent,
    selectedCard,
    onCardClick,
    isDealing,
    confirmCard,
    onConfirmChallenge,
    onCancelChallenge,
    questionPhase,
    onAnswer,
    powerUpEffects,
    activatedSpells,
  }) => {
    if (gameState === "waiting") {
      return (
        <div className="gameBoard waiting">
          <div className="waitingMessage">
            <FaClock className="waitingIcon" />
            <span>{LOADING_STATES.WAITING_SERVER}</span>
          </div>
        </div>
      );
    }

    const myPlayer = players[myPlayerIndex];
    const opponentPlayer = players[opponentIndex];
    const isMyTurn = currentTurnUserId === myPlayerId;
    const isOpponentTurn = !isMyTurn;

    return (
      <div className="gameBoard">
        {/* Game Status Bar */}
        <div className="gameStatusBar">
          <div className="statusContent">
            <FaUserCircle className="statusIcon" />
            <span className="statusText">
              {getTurnIndicatorText(
                currentTurnUserId,
                myPlayerId,
                waitingForOpponent
              )}
            </span>
          </div>
          <div className="playerCount">Players: {players.length}/2</div>
        </div>

        {/* Players Area */}
        <div className="playersArea">
          {/* Opponent Player */}
          <PlayerZone
            player={opponentPlayer}
            playerIndex={opponentIndex}
            isCurrentTurn={isOpponentTurn}
            isOpponent={true}
            gamePhase={gamePhase}
            selectedCard={selectedCard}
            onCardClick={onCardClick}
            isDisabled={true} // Opponent cards are not clickable
            isDealing={isDealing}
            myPlayerIndex={myPlayerIndex}
          />

          {/* Battle Area */}
          <div className="battleArea">
            {/* Phase Indicator */}
            <div className="phaseIndicator">
              <span className="phaseText">
                {gamePhase === "cardSelection"
                  ? "Select a card to challenge!"
                  : "Answer the question!"}
              </span>
            </div>

            {/* Confirmation Modal */}
            {confirmCard && (
              <div className="confirmationModal">
                <div className="confirmationCard">
                  <h3>Confirm Challenge</h3>
                  <p>Challenge opponent with this card?</p>
                  <div className="confirmationActions">
                    <button className="confirmBtn" onClick={onConfirmChallenge}>
                      Yes, Challenge!
                    </button>
                    <button className="cancelBtn" onClick={onCancelChallenge}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My Player */}
          <PlayerZone
            player={myPlayer}
            playerIndex={myPlayerIndex}
            isCurrentTurn={isMyTurn}
            isOpponent={false}
            gamePhase={gamePhase}
            selectedCard={selectedCard}
            onCardClick={onCardClick}
            isDisabled={!isMyTurn || waitingForOpponent || questionPhase}
            isDealing={isDealing}
            myPlayerIndex={myPlayerIndex}
          />
        </div>

        {/* Question Modal */}
        {questionPhase && selectedCard && (
          <div className="questionModal">
            <div className="modalCard">
              <div className="modalHeader">
                <div className="modalBloomType">
                  <selectedCard.icon />
                  {selectedCard.bloom_level}
                </div>
                <div className="modalTimer">
                  <FaClock />
                  30s
                </div>
              </div>
              <div className="modalQuestion">{selectedCard.question}</div>
              {selectedCard.choices && (
                <div className="choiceGrid">
                  {selectedCard.choices.map((choice, index) => (
                    <button
                      key={index}
                      className="choiceOption"
                      onClick={() => onAnswer(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

GameBoard.displayName = "GameBoard";

export default GameBoard;
