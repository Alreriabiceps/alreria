import React, { useState, useEffect } from 'react';
import styles from './GameOverModal.module.css';
import { motion } from 'framer-motion'; // Use motion for animations

const GameOverModal = ({
  show,
  winnerMessage,
  playerHp,
  opponentHp,
  onPlayAgain
}) => {
  const [animation, setAnimation] = useState('');

  // Control animation based on show prop
  useEffect(() => {
    if (show) {
      setAnimation('show');
    } else {
      // Optional: Trigger hide animation if needed, though typically unmounted
      // setAnimation('hide'); 
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const handlePlayAgainClick = () => {
    setAnimation('hide');
    // Wait for hide animation before calling parent handler
    setTimeout(onPlayAgain, 500); // Adjust timeout to match CSS
  }

  return (
    <motion.div 
      className={`${styles.gameOverModalOverlay}`}
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
        <h2>{winnerMessage.includes('Victory') || winnerMessage.includes('win') ? 'Victory!' : 'Game Over'}</h2>
        <div className={styles.winnerMessage}>{winnerMessage}</div>
        <div className={styles.finalScores}>
          <div className={styles.scoreItem}>
            <span>Your Score:</span>
            <span>{playerHp}</span>
          </div>
          <div className={styles.scoreItem}>
            <span>Opponent's Score:</span>
            <span>{opponentHp}</span>
          </div>
        </div>
        <button
          className={styles.playAgainButton}
          onClick={handlePlayAgainClick}
        >
          Play Again
        </button>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal; 