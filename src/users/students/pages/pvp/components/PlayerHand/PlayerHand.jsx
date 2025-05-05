import React from 'react';
import styles from './PlayerHand.module.css';
import CardDisplay from '../CardComponents/CardDisplay/CardDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const PlayerHand = ({
  hand, // Array of card objects { _id, type, text, ... }
  onCardClick, // Function to call when a playable card is clicked
  canPlay, // Boolean indicating if the player can play cards now
  // selectedCardIndex - Removing this, selection handled by parent potentially
}) => {

  // Internal render helper for a single card
  const renderCard = (card, index) => {
    if (!card) return null; // Guard against undefined/null cards
    // --- Log the individual card being rendered ---
    console.log(`[PlayerHand renderCard] Processing card ${index}:`, JSON.stringify(card, null, 2));

    const handleClick = () => {
      if (canPlay) {
        onCardClick(card); // Pass the full card object
      } else {
        console.log('Cannot play card now.');
      }
    };

    return (
      <motion.div
        key={`${card._id || 'p-card'}-${index}`}
        className={styles.cardWrapper}
        initial={{ y: 100, opacity: 0, scale: 0.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.35, type: 'spring', bounce: 0.3 }}
      >
        <CardDisplay
          card={{
            title: card.type === 'spellEffect' ? 'SPELL' : 'QUESTION',
            content: card.text,
            options: card.options || [],
            rarity: card.rarity || 'common',
            tooltip: canPlay ? `Play Card: ${card.text?.substring(0, 30)}...` : card.text?.substring(0, 30)
          }}
          onClick={handleClick}
          isPlayable={canPlay}
          isDraggable={canPlay}
        />
      </motion.div>
    );
  };

  // --- Log the entire hand prop received by the component ---
  console.log('[PlayerHand] Rendering with hand:', JSON.stringify(hand, null, 2));

  return (
    <div className={`${styles.handArea} ${styles.playerHandArea}`}>
      {hand.length === 0 && <div className={styles.emptyHandMessage}>Empty Hand</div>}
      <AnimatePresence initial={false}>
        {hand.map(renderCard)}
      </AnimatePresence>
      {/* Removed card count display from here - handled in Pvp.jsx */}
    </div>
  );
};

export default PlayerHand; 