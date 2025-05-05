import React, { useState, useEffect } from 'react';
import styles from './GameOverModal.module.css';
import Confetti from 'react-confetti';

const GameOverModal = ({
  show,
  winnerId,
  winnerName,
  reason,
  myPlayerId,
  onPlayAgain,
  onExit
}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Add state to track if confetti should be shown
  const [showConfetti, setShowConfetti] = useState(false);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Control when to show confetti based on winner status
  useEffect(() => {
    if (show && winnerId === myPlayerId) {
      console.log("Victory detected, enabling confetti!");
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [show, winnerId, myPlayerId]);

  // Don't render anything if not shown
  if (!show) {
    return null;
  }

  const handlePlayAgainClick = () => {
    // Call parent handler directly
    onPlayAgain();
  };

  const handleExitClick = () => {
    // Call parent handler directly
    onExit();
  };

  // Determine if player won
  const isWinner = winnerId === myPlayerId;
  const title = isWinner ? 'Victory!' : 'Game Over';
  const message = reason || (isWinner ? 'You won the game!' : 'You lost the game!');

  console.log("GameOverModal rendered with: ", { show, winnerId, myPlayerId, isWinner, showConfetti });

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.2}
          colors={['#00ff9d', '#2ecc71', '#3498db', '#f1c40f', '#e67e22', '#e74c3c']}
          confettiSource={{
            x: windowSize.width / 2,
            y: 0,
            w: 0,
            h: 0
          }}
        />
      )}
      <div
        className={`${styles.gameOverModalOverlay} ${show ? styles.show : ''}`}
      >
        <div
          className={`${styles.gameOverModalContent} ${isWinner ? styles.victoryContent : styles.defeatContent}`}
        >
          <h2 className={`${styles.gameOverTitle} ${isWinner ? styles.victoryTitle : styles.defeatTitle}`}>
            {title}
          </h2>

          <div className={styles.gameOverIcon}>
            {isWinner ? '🏆' : '💔'}
          </div>

          <div className={styles.winnerMessage}>{message}</div>

          <div className={styles.buttonContainer}>
            <button
              className={styles.playAgainButton}
              onClick={handlePlayAgainClick}
            >
              Play Again
            </button>
            <button
              className={styles.exitButton}
              onClick={handleExitClick}
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameOverModal; 