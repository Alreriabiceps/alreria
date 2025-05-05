import React, { useState, useEffect } from 'react';
import styles from './PlayerInfo.module.css';

const PlayerInfo = ({
  name,
  hp,
  maxHp,
  isOpponent,
  isActiveTurn,
  hpShake,
  onHpChange
}) => {
  const [hpChange, setHpChange] = useState(null);
  const [showHpChange, setShowHpChange] = useState(false);

  // Helper to determine HP bar fill color class
  const getHpBarFillClass = (currentHp, maximumHp) => {
    const percentage = (currentHp / maximumHp) * 100;
    let className = styles.hpBarFill;
    if (percentage <= 25) className += ` ${styles.lowHp}`;
    else if (percentage <= 50) className += ` ${styles.mediumHp}`;
    return className;
  };

  // Handle HP changes
  useEffect(() => {
    if (hp !== undefined && hp !== null) {
      const change = hp - (hpChange?.previousHp || hp);
      if (change !== 0) {
        setHpChange({
          value: change,
          previousHp: hpChange?.previousHp || hp,
          newHp: hp
        });
        setShowHpChange(true);

        // Notify parent of HP change
        if (onHpChange) {
          onHpChange(change);
        }

        // Hide the change text after animation
        setTimeout(() => {
          setShowHpChange(false);
        }, 1000);
      }
    }
  }, [hp]);

  return (
    <div
      className={`
        ${styles.playerInfoContainer} 
        ${isOpponent ? styles.opponentInfo : styles.localPlayerInfo}
        ${isActiveTurn ? styles.activeTurn : ''}
      `}
    >
      <div className={styles.infoDisplayBox}>
        <div className={styles.username}>{name}</div>
        <div className={`${styles.hpBarContainer} ${hpShake ? styles.shake : ''}`}>
          <div
            className={getHpBarFillClass(hp, maxHp)}
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
          {showHpChange && hpChange && (
            <div
              className={styles.hpChangeText}
              style={{
                color: hpChange.value < 0 ? 'var(--color-hp-low)' : 'var(--color-hp-high)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {hpChange.value > 0 ? '+' : ''}{hpChange.value}HP
            </div>
          )}
        </div>
        <div className={styles.hpText}>{hp} / {maxHp}</div>
      </div>
    </div>
  );
};

export default PlayerInfo; 