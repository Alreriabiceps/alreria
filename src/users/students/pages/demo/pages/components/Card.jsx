import React from 'react';

const Card = ({ card, onClick }) => {
  return (
    <div
      className={`card ek-card ${card.type === 'QUESTION' ? 'question-card' : ''}`}
      onClick={onClick}
      title={card.type === 'QUESTION' && card.questionData ? card.questionData.questionText : card.name}
      style={{ cursor: 'pointer' }}
    >
      {card.type === 'QUESTION' && card.questionData ? (
        <div className="question-card-content">
          <div className="question-card-icon">?</div>
          <div className="question-card-text">
            {card.questionData.questionText.length > 50
              ? card.questionData.questionText.substring(0, 47) + '...'
              : card.questionData.questionText}
          </div>
        </div>
      ) : (
        <div className="card-name">{card.name}</div>
      )}
    </div>
  );
};

export default Card; 