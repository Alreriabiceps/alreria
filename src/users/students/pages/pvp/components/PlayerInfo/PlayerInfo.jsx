import React from 'react';
import styles from './PlayerInfo.module.css';

const PlayerInfo = ({
  name,
  hp,
  maxHp,
  isOpponent,
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
        ${styles.playerInfoArea} 
        ${isOpponent ? styles.opponentInfoArea : styles.playerInfoAreaLocal}
        ${isActiveTurn ? styles.activeTurn : ''}
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
      {/* Note: Hand display is now handled by separate components */}
    </div>
  );
};

export default PlayerInfo; 