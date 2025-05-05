import React, { useState, useEffect } from 'react';
import styles from './GameOverModal.module.css';
import { motion } from 'framer-motion'; // Use motion for animations

const GameOverModal = ({
  show,
  winnerId,
  winnerName,
  reason,
  myPlayerId,
  onPlayAgain,
  onExit
}) => {
  const [animation, setAnimation] = useState('');

  // Control animation based on show prop
  useEffect(() => {
    if (show) {
      setAnimation('show');
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const handlePlayAgainClick = () => {
    setAnimation('hide');
    // Wait for hide animation before calling parent handler
    setTimeout(onPlayAgain, 500);
  };

  const handleExitClick = () => {
    setAnimation('hide');
    // Wait for hide animation before calling parent handler
    setTimeout(onExit, 500);
  };

  // Determine if player won
  const isWinner = winnerId === myPlayerId;
  const title = isWinner ? 'Victory!' : 'Game Over';
  const message = reason || (isWinner ? 'You won the game!' : 'You lost the game!');

  return (
    <motion.div
      className={`${styles.gameOverModalOverlay} ${animation}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={styles.gameOverModalContent}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className={styles.gameOverTitle}>{title}</h2>
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
            Exit Game
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal; 