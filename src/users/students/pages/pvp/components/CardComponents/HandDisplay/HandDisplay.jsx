import React, { useState } from 'react';
import CardDisplay from '../CardDisplay/CardDisplay';
import './HandDisplay.css';

const HandDisplay = ({
  cards,
  onCardClick,
  isPlayable = true,
  onCardDragStart,
  onCardDragEnd,
  onCardDrop
}) => {
  const [draggingOver, setDraggingOver] = useState(false);
  const [draggingCard, setDraggingCard] = useState(null);

  const handleDragStart = (card, e) => {
    setDraggingCard(card);
    if (onCardDragStart) onCardDragStart(card, e);
  };

  const handleDragEnd = (card, e) => {
    setDraggingCard(null);
    if (onCardDragEnd) onCardDragEnd(card, e);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDraggingOver(true);
  };

  const handleDragLeave = () => {
    setDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggingOver(false);
    if (onCardDrop) onCardDrop(e);
  };

  return (
    <div
      className={`pixel-hand-area${draggingOver ? ' dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {cards.map((card, index) => (
        <div
          key={card._id || index}
          className={`pixel-card-wrapper${draggingCard === card ? ' dragging' : ''}`}
        >
          <CardDisplay
            card={card}
            onClick={() => onCardClick(card)}
          />
        </div>
      ))}
    </div>
  );
};

export default HandDisplay; 