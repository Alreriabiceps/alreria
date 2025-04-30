import React from 'react';
import styles from './PlayerHand.module.css';

const PlayerHand = ({
  hand, // Array of card objects { _id, type, text, ... }
  onCardClick, // Function to call when a playable card is clicked
  canPlay, // Boolean indicating if the player can play cards now
  // selectedCardIndex - Removing this, selection handled by parent potentially
}) => {

  // Internal render helper for a single card
  const renderCard = (card, index) => {
    
    // Determine card style based on type and playability
    const cardTypeClass = card.type === 'spellEffect' ? styles.spellEffectCard : styles.questionCard;
    const playableClass = canPlay ? styles.playable : '';

    const handleClick = () => {
      if (canPlay) {
        onCardClick(card); // Pass the full card object
      } else {
        console.log('Cannot play card now.');
      }
    };

    return (
      <div
        key={card._id || `p-card-${index}`} // Use card._id if available
        className={`
          ${styles.card}
          ${styles.playerHandCard} 
          ${cardTypeClass}
          ${playableClass}
        `}
        onClick={handleClick}
        title={canPlay ? `Play Card: ${card.text?.substring(0, 30)}...` : card.text?.substring(0, 30)}
      >
        {/* Basic Card Visual - Enhance as needed */}
        <div className={styles.cardTypeIndicator}>{card.type === 'spellEffect' ? 'SPELL' : 'Q'}</div>
        <div className={styles.cardTextPreview}>
          {card.text?.substring(0, 40)}
          {card.text?.length > 40 ? "..." : ""}
        </div>
        {/* Add cost, stats, etc. later if applicable */}
      </div>
    );
  };

  return (
    <div className={`${styles.handArea} ${styles.playerHandArea}`}>
       {hand.length === 0 && <div className={styles.emptyHandMessage}>Empty Hand</div>}
      {hand.map(renderCard)}
      {/* Removed card count display from here - handled in Pvp.jsx */}
    </div>
  );
};

export default PlayerHand; 