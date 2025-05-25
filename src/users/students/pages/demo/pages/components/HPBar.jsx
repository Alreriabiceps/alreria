import React from 'react';

const HPBar = ({ hp, maxHp }) => {
  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="hp-bar-container">
      <div className="hp-bar" style={{ width: `${percent}%` }}>
        <span className="hp-text">{hp}</span>
      </div>
    </div>
  );
};

export default HPBar; 