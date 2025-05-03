import React from 'react';
import styles from './DiceRollModal.module.css';

const DiceRollModal = ({
  show,
  playerDiceValue,
  opponentDiceValue,
  isRolling,
  bothRolled,
  onRollDice,
  winnerId,
  userId
}) => {

  if (!show) {
    return null;
  }

  const isPlayerWinner = bothRolled && winnerId === userId;
  const isOpponentWinner = bothRolled && winnerId && winnerId !== userId;
  const isTie = bothRolled && !winnerId;

  const getResultMessage = () => {
    if (isPlayerWinner) return 'You go first!';
    if (isOpponentWinner) return 'Opponent goes first!';
    if (isTie) return 'Tie! Roll again!'; // Message for tie handled in parent?
    return ''; // Should not happen if bothRolled is true
  };

  const getSubtitle = () => {
    if (isPlayerWinner) return 'You won!';
    if (isOpponentWinner) return 'Opponent won!';
    if (isTie) return 'Tie!';
    if (playerDiceValue && !opponentDiceValue) return 'Waiting for opponent...';
    return 'May the best roll win!';
  }

  // Do not render if show is false (already handled by the check above)
  // But we need to conditionally apply the show class for the transition
  const overlayClasses = show 
    ? `${styles.diceModalOverlay} ${styles.show}` 
    : styles.diceModalOverlay;

  return (
    <div className={overlayClasses}> {/* Apply conditional classes */} 
      <div className={`${styles.diceModalContent} ${bothRolled ? styles.showResult : ''}`}>
        <div className={styles.diceHeader}>
          <h2 className={styles.diceTitle}>Roll for First Turn!</h2>
          <div className={styles.diceSubtitle}>{getSubtitle()}</div>
        </div>

        <div className={styles.diceContainer}>
          {/* Player Dice */}
          <div className={styles.diceSection}>
            <div className={`${styles.dice3D} ${isRolling ? styles.rolling : ''} ${isPlayerWinner ? styles.winner : ''}`}>
              <div className={styles.diceFace}>{playerDiceValue || '?'}</div>
              <div className={styles.diceShadow}></div>
            </div>
            <span className={styles.diceLabel}>Your Roll</span>
          </div>

          <div className={styles.vsContainer}>
            <div className={styles.vs}>VS</div>
            <div className={styles.vsLine}></div>
          </div>

          {/* Opponent Dice */}
          <div className={styles.diceSection}>
            {/* Use opponentDiceValue to determine if rolled visually */}
            <div className={`${styles.dice3D} ${opponentDiceValue ? styles.rolled : ''} ${isOpponentWinner ? styles.winner : ''}`}>
              <div className={styles.diceFace}>{opponentDiceValue || '?'}</div>
              <div className={styles.diceShadow}></div>
            </div>
            <span className={styles.diceLabel}>Opponent's Roll</span>
          </div>
        </div>

        {/* Roll Button or Waiting Message */}
        {!playerDiceValue && !bothRolled && (
          <button
            className={styles.rollButton}
            onClick={onRollDice}
            disabled={isRolling} // Disable while player is rolling
          >
            <span className={styles.rollButtonText}>Roll Dice</span>
            <span className={styles.rollButtonIcon}>🎲</span>
          </button>
        )}

        {playerDiceValue && !opponentDiceValue && !bothRolled && (
          <div className={styles.waitingMessage}>
            <div className={styles.waitingIcon}>⏳</div>
            <div className={styles.waitingText}>Waiting for opponent to roll...</div>
          </div>
        )}

        {/* Result Message Area */}
        {bothRolled && (
          <div className={`${styles.resultMessage} ${isPlayerWinner ? styles.winner : isOpponentWinner ? styles.loser : styles.tie}`}>
            <div className={styles.resultIcon}>
              {isPlayerWinner ? '🎉' : isOpponentWinner ? '🎯' : '🤝'}
            </div>
            <div className={styles.resultText}>{getResultMessage()}</div>
            {/* Display score only if not a tie */}
            {!isTie && (
                <div className={styles.resultScore}>
                  {playerDiceValue} vs {opponentDiceValue}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRollModal; 