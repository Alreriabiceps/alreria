import React from 'react';
import styles from './OpponentHand.module.css';

const OpponentHand = ({ cardCount }) => {

  // Internal render helper for a single card back
  const renderCardBack = (index) => (
    <div
      key={`o-card-${index}`}
      className={`${styles.card} ${styles.opponentHandCard}`}
      title="Opponent Card"
    >
      <div className={styles.cardBack}></div>
    </div>
  );

  return (
    <div className={`${styles.handArea} ${styles.opponentHandArea}`}>
      {Array.from({ length: cardCount || 0 }).map((_, index) => renderCardBack(index))}
      <div className={styles.cardCount}>{cardCount || 0}</div>
    </div>
  );
};

export default OpponentHand; 