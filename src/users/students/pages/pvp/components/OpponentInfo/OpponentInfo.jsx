import React from 'react';
import styles from './OpponentInfo.module.css';

const OpponentInfo = ({
  name,
  hp,
  maxHp,
  // isOpponent = true, // Implicitly true for this component
  isActiveTurn,
  hpShake
}) => {

  // Helper to determine HP bar fill color class
  const getHpBarFillClass = (currentHp, maximumHp) => {
    const percentage = (currentHp / maximumHp) * 100;
    let className = styles.hpBarFill;
    if (percentage <= 25) className += ` ${styles.lowHp}`;
    else if (percentage <= 50) className += ` ${styles.mediumHp}`;
    return className;
  };

  return (
    <div 
      className={`
        ${styles.opponentInfoArea} 
        ${isActiveTurn ? styles.activeTurn : ''} /* Optional: Style if opponent's turn */
      `}
    >
      {/* HP Container with Shake */}
      <div className={`${styles.hpContainer} ${hpShake ? styles.shakeHp : ""}`}>
        <div className={styles.username}>{name}</div>
        <div className={styles.hpBarContainer}>
          <div
            className={getHpBarFillClass(hp, maxHp)}
            style={{ width: `${(hp / maxHp) * 100}%` }}
          ></div>
        </div>
        <div className={styles.hpText}>{hp} / {maxHp}</div>
      </div>
      {/* Opponent hand count display would likely be separate */}
    </div>
  );
};

export default OpponentInfo; 