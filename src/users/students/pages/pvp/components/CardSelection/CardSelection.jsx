import React from 'react';
import styles from './CardSelection.module.css';

const CardSelection = ({
  isLoading,
  error,
  availableQuestions,
  selectedQuestions,
  requiredCount,
  onSelect,
  onDeselect,
  onConfirm,
  onRetry,
  selectedSubject // Needed for the retry functionality
}) => {

  // Filter out already selected questions before mapping
  const selectedIds = new Set(selectedQuestions.map(q => q.id));
  const questionsToShow = availableQuestions.filter(q => !selectedIds.has(q.id));

  return (
    <div className={styles.cardSelectionContainer}>
      <h2>Select {requiredCount} Questions</h2>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading questions...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          {selectedSubject && (
            <button
              className={styles.retryButton}
              onClick={() => onRetry(selectedSubject)} // Call retry with the subject
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.cardSelectionGrid}>
            <div className={styles.availableQuestions}>
              <h3>Available Questions</h3>
              {questionsToShow.map(question => (
                <div
                  key={question.id} // Keys are now unique within this list
                  className={styles.questionCard}
                  onClick={() => onSelect(question)}
                >
                  <p>{question.text}</p>
                </div>
              ))}
            </div>
            <div className={styles.selectedQuestions}>
              <h3>Selected Questions ({selectedQuestions.length}/{requiredCount})</h3>
              {selectedQuestions.map(question => (
                <div
                  key={question.id} // Keys are unique within this list
                  className={styles.questionCard}
                  onClick={() => onDeselect(question)}
                >
                  <p>{question.text}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={selectedQuestions.length !== requiredCount}
          >
            Confirm Selection
          </button>
        </>
      )}
    </div>
  );
};

export default CardSelection; 