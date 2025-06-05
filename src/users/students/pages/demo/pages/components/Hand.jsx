import React from 'react';
import Card from './Card';

const Hand = ({ hand, onCardClick, nextSlotRef, onDragStart }) => {
  return (
    <div className="cards-container">
      {hand.map((card, idx) => (
        <div
          key={card.id}
          draggable={!!onDragStart}
          onDragStart={onDragStart ? (e) => onDragStart(e, card, idx) : undefined}
        >
          <Card card={card} onClick={() => onCardClick(idx)} />
        </div>
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