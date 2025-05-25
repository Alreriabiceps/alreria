import React from 'react';

const QuestionModal = ({ question, selectedAnswer, questionResult, onAnswer, onClose }) => {
  if (!question) return null;
  return (
    <div className="question-modal">
      <div className="question-content">
        <h3>Question Card</h3>
        <p className="question-text">{question.questionData.questionText}</p>
        <div className="choices">
          {question.questionData.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => onAnswer(choice)}
              disabled={selectedAnswer !== null}
              className={`choice-button ${selectedAnswer === choice ? (questionResult ? 'correct' : 'incorrect') : ''}`}
            >
              {choice}
            </button>
          ))}
        </div>
        <button className="close-panel-button" onClick={onClose} style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>
  );
};

export default QuestionModal; 