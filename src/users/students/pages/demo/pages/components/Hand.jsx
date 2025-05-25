import React from 'react';
import Card from './Card';

const Hand = ({ hand, onCardClick, nextSlotRef }) => {
  return (
    <div className="cards-container">
      {hand.map((card, idx) => (
        <Card key={card.id} card={card} onClick={() => onCardClick(idx)} />
      ))}
      {/* Ghost slot for next dealt card, only if nextSlotRef is provided */}
      {nextSlotRef && (
        <div
          ref={nextSlotRef}
          className="card ek-card ghost-slot"
          style={{ visibility: 'hidden', pointerEvents: 'none', position: 'relative' }}
        />
      )}
    </div>
  );
};

export default Hand; 