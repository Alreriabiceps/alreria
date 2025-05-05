import React, { useRef, useEffect, useState } from 'react';
import styles from './DiceRollModal.module.css';

const DiceRollModal = ({
  show,
  playerDiceValue,
  opponentDiceValue,
  isRolling,
  bothRolled,
  onRollDice,
  winnerId,
  userId,
  onTimeoutComplete
}) => {
  const resultTimeoutRef = useRef(null);
  const displayDelayTimeoutRef = useRef(null);
  const [showWinnerResult, setShowWinnerResult] = useState(false);

  useEffect(() => {
    if (bothRolled && onTimeoutComplete) {
      if (displayDelayTimeoutRef.current) {
        clearTimeout(displayDelayTimeoutRef.current);
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
      setShowWinnerResult(false);

      console.log('[DiceRollModal] Starting short delay before showing result visuals (50ms)');
      displayDelayTimeoutRef.current = setTimeout(() => {
        console.log('[DiceRollModal] Short delay finished. Showing result visuals.');
        setShowWinnerResult(true);

        console.log('[DiceRollModal] Starting result display timeout (3s)');
        resultTimeoutRef.current = setTimeout(() => {
          console.log('[DiceRollModal] Result display timeout finished.');
          onTimeoutComplete();
        }, 3000);

      }, 50);

    } else {
      setShowWinnerResult(false);
    }

    return () => {
      if (displayDelayTimeoutRef.current) {
        console.log('[DiceRollModal] Clearing display delay timeout on unmount/change.');
        clearTimeout(displayDelayTimeoutRef.current);
        displayDelayTimeoutRef.current = null;
      }
      if (resultTimeoutRef.current) {
        console.log('[DiceRollModal] Clearing result display timeout on unmount/change.');
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
    };
  }, [bothRolled, onTimeoutComplete]);

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

  const overlayClasses = show
    ? `${styles.diceModalOverlay} ${styles.show}`
    : styles.diceModalOverlay;

  return (
    <div className={overlayClasses}>
      <div className={`${styles.diceModalContent} ${bothRolled ? styles.showResult : ''}`}>
        <div className={styles.diceHeader}>
          <h2 className={styles.diceTitle}>Roll for First Turn!</h2>
          <div className={styles.diceSubtitle}>{getSubtitle()}</div>
        </div>

        <div className={styles.diceContainer}>
          {/* Player Dice */}
          <div className={styles.diceSection}>
            <div className={`${styles.dice3D} ${isRolling ? styles.rolling : ''} ${bothRolled && showWinnerResult && isPlayerWinner ? styles.winner : ''} ${bothRolled && showWinnerResult && isOpponentWinner ? styles.loser : ''} ${bothRolled && showWinnerResult && isTie ? styles.tie : ''}`}>
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
            <div className={`${styles.dice3D} ${opponentDiceValue && !bothRolled ? '' : ''} ${bothRolled && showWinnerResult && isOpponentWinner ? styles.winner : ''} ${bothRolled && showWinnerResult && isPlayerWinner ? styles.loser : ''} ${bothRolled && showWinnerResult && isTie ? styles.tie : ''}`}>
              <div className={styles.diceFace}>{opponentDiceValue || '?'}</div>
              <div className={styles.diceShadow}></div>
            </div>
            <span className={styles.diceLabel}>Opponent's Roll</span>
          </div>
        </div>

        {!playerDiceValue && !bothRolled && (
          <button
            className={styles.rollButton}
            onClick={onRollDice}
            disabled={isRolling}
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

        {bothRolled && showWinnerResult && (
          <div className={`${styles.resultMessage} ${isPlayerWinner ? styles.winner : isOpponentWinner ? styles.loser : styles.tie}`}>
            <div className={styles.resultIcon}>
              {isPlayerWinner ? '🎉' : isOpponentWinner ? '🎯' : '🤝'}
            </div>
            <div className={styles.resultText}>{getResultMessage()}</div>
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