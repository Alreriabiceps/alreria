import React from 'react';
import CardDisplay from '../CardComponents/CardDisplay/CardDisplay';
import styles from '../PlayerHand/PlayerHand.module.css';

const OpponentHand = ({ cardCount }) => {
  return (
    <div className={`${styles.handArea} ${styles.playerHandArea}`}>
      {Array.from({ length: cardCount }).map((_, idx) => (
        <div className={styles.cardWrapper} key={idx}>
          <CardDisplay card={{}} isFlipped />
        </div>
      ))}
    </div>
  );
};

export default OpponentHand; 