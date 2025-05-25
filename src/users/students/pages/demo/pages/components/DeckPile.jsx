import React from 'react';
import './DeckPile.css';

const DeckPile = ({ count, dealing }) => {
  return (
    <div className={`deck-pile${dealing ? ' dealing' : ''}`}> 
      <div className="deck-stack">
        {[...Array(Math.min(count, 5))].map((_, i) => (
          <div key={i} className="deck-card" style={{ top: -i * 3, left: i * 3, zIndex: i }} />
        ))}
        <span className="deck-count">{count}</span>
      </div>
      {/* Optionally, add an animated card leaving the pile here */}
    </div>
  );
};

export default DeckPile; 