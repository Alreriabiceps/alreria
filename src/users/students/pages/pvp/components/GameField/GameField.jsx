import React from 'react';
import styles from './GameField.module.css';

// Define GAME_STATE locally or import if shared (May not be needed anymore)
// const GAME_STATE = { ... };

const GameField = ({
  // Remove old props
  // gameState,
  // feedback,
  // questionBeingAsked,
  // currentQuestion,
  // timerValue,
  // selectedAnswer,
  // gameMessage,
  // onConfirmAsk,
  // onSelectAnswer, 
  // onConfirmAnswer,
  // attackingState

  // --- Add new props ---
  lastSummonedCard, // { cardId, playerId, text?, ... }
  lastPlayedSpell, // { cardId, playerId, description?, ... }
  myPlayerId, // To determine if summoned/played card was ours or opponent's
}) => {

  // Determine what to display based on the last actions
  let displayContent = null;
  if (lastSummonedCard) {
    const isMySummon = lastSummonedCard.playerId === myPlayerId;
    displayContent = (
      <div className={`${styles.centerDisplayBox} ${styles.summonedCardDisplay}`}>
        <p className={styles.fieldActionText}>{isMySummon ? 'You summoned:' : 'Opponent summoned:'}</p>
        {/* Display basic card info - enhance later */}
        <div className={styles.cardOnField}>
           <div className={styles.cardTypeIndicator}>Q</div> 
           <div className={styles.cardTextPreview}>{lastSummonedCard.text || `Card ID: ${lastSummonedCard.cardId}`}</div>
        </div>
         <p className={styles.fieldStateText}>{isMySummon ? 'Waiting for opponent to answer...' : 'Waiting for your answer...'}</p>
      </div>
    );
  } else if (lastPlayedSpell) {
     const isMySpell = lastPlayedSpell.playerId === myPlayerId;
     displayContent = (
      <div className={`${styles.centerDisplayBox} ${styles.spellEffectDisplay}`}>
        <p className={styles.fieldActionText}>{isMySpell ? 'You played Spell/Effect:' : 'Opponent played Spell/Effect:'}</p>
         {/* Display basic card info/effect */}
         <div className={styles.cardOnField}>
            <div className={styles.cardTypeIndicator}>SPELL</div> 
            {/* Display description from backend if available */} 
           <div className={styles.cardTextPreview}>{lastPlayedSpell.description || `Effect ID: ${lastPlayedSpell.cardId}`}</div> 
        </div>
        <p className={styles.fieldStateText}>{lastPlayedSpell.description || 'Effect resolved.'}</p>
      </div>
    );
  } else {
    // Placeholder when nothing is active on the field
    displayContent = (
      <div className={`${styles.centerDisplayBox} ${styles.messageBox}`}>
        <p>Game Field</p> {/* Default message */}
      </div>
    );
  }

  return (
    <div className={styles.fieldArea}>
      <div className={styles.centerContentContainer}>
         {displayContent}
      </div>
    </div>
  );
};

export default GameField; 