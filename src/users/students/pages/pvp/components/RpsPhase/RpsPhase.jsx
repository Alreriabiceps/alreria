import React, { useState, useEffect, useRef } from 'react';
import styles from './RpsPhase.module.css';

// Define RPS_CHOICES locally within the component or import from constants
const RPS_CHOICES = [
  { id: 'rock', icon: '✊', beats: 'scissors' },
  { id: 'paper', icon: '✋', beats: 'rock' },
  { id: 'scissors', icon: '✌️', beats: 'paper' }
];

const RpsPhase = ({
  show, // Only render if true
  onChoice,
  rpsChoice, // Player's own choice
  opponentRpsChoice, // Opponent's choice (revealed with result)
  rpsResult, // { isDraw: bool, winner: bool (is player the winner?), choices: [...] }
  userId, // Needed to interpret rpsResult.winner
  onTimeoutComplete // Callback when result display finishes
}) => {
  const [countdown, setCountdown] = useState(null);
  const [showChoices, setShowChoices] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const countdownRef = useRef(null);
  const resultTimeoutRef = useRef(null);

  // Start countdown when the component is shown and not already counting down
  useEffect(() => {
    if (show && countdown === null && !rpsResult) {
      setCountdown(3);
      setShowChoices(false);
      setShowResultModal(false); // Ensure result modal is hidden initially
      
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) { // Should not happen, but safety check
              clearInterval(countdownRef.current);
              return null;
          }
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setShowChoices(true);
            // No automatic timeout for choice - parent/server handles it
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    // Cleanup countdown on unmount or when `show` becomes false
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [show, rpsResult]); // Rerun if shown or if result comes in (to stop countdown)

  // Show result modal when rpsResult is received
  useEffect(() => {
    console.log('[RpsPhase] rpsResult prop received:', rpsResult);
    if (rpsResult) {
      console.log('[RpsPhase] Setting showResultModal to true');
      setShowResultModal(true);
      // Clear any previous result display timeout
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
      // Set a timeout to hide the modal and notify parent
      resultTimeoutRef.current = setTimeout(() => {
        console.log('[RpsPhase] Result display timeout finished. Calling onTimeoutComplete.');
        setShowResultModal(false);
        if (onTimeoutComplete) {
           onTimeoutComplete(); // Notify parent (Pvp.jsx) to change state
        }
      }, 3000); // Display result for 3 seconds
    }
    // Cleanup timeout on unmount
    return () => {
       if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
    }
  }, [rpsResult, onTimeoutComplete]);

  // Don't render anything if not shown
  if (!show) {
    return null;
  }

  // Determine player/opponent choices for the result display
  let playerChoiceForResult = null;
  let opponentChoiceForResult = null;
  if (rpsResult && rpsResult.choices) {
      playerChoiceForResult = rpsResult.choices.find(c => c.playerId === userId)?.choice;
      opponentChoiceForResult = rpsResult.choices.find(c => c.playerId !== userId)?.choice;
  }

  const renderRpsResult = () => (
    <div className={`${styles.rpsResultModal} ${showResultModal ? styles.show : styles.hide}`}>
      <div className={styles.rpsResultContent}>
        <h2 className={styles.resultTitle}>Result!</h2>
        <div className={styles.rpsPlayers}>
          {/* Player */}
          <div className={`${styles.rpsPlayer} ${rpsResult?.winner && !rpsResult?.isDraw ? styles.winnerGlow : ''}`}>
            <div className={`${styles.rpsPlayerChoice} ${styles.animate}`}>
              {RPS_CHOICES.find(c => c.id === playerChoiceForResult)?.icon || '❓'}
            </div>
          </div>
          <div className={`${styles.rpsVs} ${styles.pulse}`}>VS</div>
          {/* Opponent */}
          <div className={`${styles.rpsPlayer} ${!rpsResult?.winner && !rpsResult?.isDraw ? styles.winnerGlow : ''}`}>
            <div className={`${styles.rpsPlayerChoice} ${styles.animate}`}>
              {RPS_CHOICES.find(c => c.id === opponentChoiceForResult)?.icon || '❓'}
            </div>
          </div>
        </div>
        <div className={`${styles.rpsResultMessage} ${rpsResult?.isDraw ? styles.draw : rpsResult?.winner ? styles.winner : styles.loser}`}>
          {rpsResult?.isDraw ? "DRAW!" : rpsResult?.winner ? 'VICTORY!' : 'DEFEAT!'}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.rpsPhaseContainer}>
       {/* Always render the choice/countdown area as the base */}
        <>
            <h2 className={styles.rpsTitle}>
                {/* Keep logic for title based on countdown/choice state */}
                {countdown !== null && !showResultModal ? 
                    <>Get Ready... <span className={styles.countdownTimer} style={{ animation: `${styles.pixelScalePulse} 1s infinite steps(1, end)`}}>{countdown}</span></> : 
                 showChoices && !rpsChoice && !showResultModal ? 'Choose Rock, Paper, or Scissors!' :
                 rpsChoice && !showResultModal ? 'Waiting for opponent...' :
                 showResultModal ? '' : /* Hide title when result shows? Or show "Result!"? */
                 'Waiting...' 
                }
            </h2>

            {/* Only show choices section if countdown finished AND result not shown */}
            {showChoices && !showResultModal && (
                <div className={styles.choicesContainer}>
                    {RPS_CHOICES.map((choice, index) => (
                        <button
                            key={choice.id}
                            className={`${styles.choiceButton} ${rpsChoice === choice.id ? styles.selected : ''}`}
                            onClick={() => onChoice(choice.id)}
                            disabled={!!rpsChoice} // Disable after choosing
                            style={{ animationDelay: `${index * 0.08}s` }}
                        >
                            <span className={styles.choiceIcon}>{choice.icon}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Display waiting message after player chooses AND result not shown */}
            {rpsChoice && !rpsResult && !showResultModal && (
                <p className={styles.waitingMessage}>Waiting for opponent...</p>
            )}
        </>

       {/* Render the result modal overlay conditionally *within* the container */} 
       {showResultModal && renderRpsResult()}

    </div>
  );
};

export default RpsPhase; 