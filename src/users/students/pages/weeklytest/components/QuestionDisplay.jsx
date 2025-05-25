import React from 'react';
import styles from '../pages/WeeklyTest.module.css';

const QuestionDisplay = ({
  currentQuestion,
  currentQuestionIndex,
  tests,
  answers,
  handleAnswerSelect,
  handleNextQuestion,
  handlePreviousQuestion,
  isTestStarted,
  showAnimation,
  handleSubmit,
  setCurrentQuestionIndex
}) => {
  if (!currentQuestion) return null;
  const options = Array.isArray(currentQuestion.choices)
    ? currentQuestion.choices
    : Array.isArray(currentQuestion.options)
      ? currentQuestion.options
      : [];
  // Determine if all questions are answered
  const allAnswered = tests.every(q => answers[q._id]);
  // Find unanswered question indices
  const unansweredIndices = tests
    .map((q, idx) => (!answers[q._id] ? idx : null))
    .filter(idx => idx !== null);
  const unansweredCount = unansweredIndices.length;
  // Handler to jump to first unanswered question
  const handleReviewUnanswered = () => {
    if (unansweredIndices.length > 0) {
      // Use window event to communicate to parent (since navigation is in parent)
      // Or, if you want, you can lift a callback prop for setCurrentQuestionIndex
      // For now, use a custom event
      const event = new CustomEvent('jumpToQuestionIndex', { detail: { index: unansweredIndices[0] } });
      window.dispatchEvent(event);
    }
  };
  return (
    <div className={styles.questionPanel}>
      {/* Question Number Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {tests.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = !!answers[q._id];
          let bg = '#232c3a', color = '#fff', border = '1.5px solid #444';
          if (isCurrent) {
            bg = '#f1c40f'; color = '#0D131A'; border = '2.5px solid #f1c40f';
          } else if (isAnswered) {
            bg = '#27ae60'; color = '#fff'; border = '2px solid #27ae60';
          } else {
            bg = '#e74c3c'; color = '#fff'; border = '2px solid #e74c3c';
          }
          return (
            <button
              key={q._id}
              onClick={() => setCurrentQuestionIndex(idx)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: bg, color, border,
                fontWeight: isCurrent ? 800 : 600,
                fontSize: '1.1rem',
                cursor: isCurrent ? 'default' : 'pointer',
                outline: isCurrent ? '2px solid #fff' : 'none',
                boxShadow: isCurrent ? '0 0 8px #f1c40f' : 'none',
                transition: 'all 0.18s',
                margin: 2,
                pointerEvents: isCurrent ? 'none' : 'auto',
              }}
              aria-label={`Go to question ${idx + 1}`}
              tabIndex={0}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className={styles.questionHeader}>
        <span className={styles.questionNumber}>Question {currentQuestionIndex + 1} of {tests.length}</span>
        {currentQuestion.bloomsLevel && (
          <span className={styles.bloomLevel}>Bloom's Level: {currentQuestion.bloomsLevel}</span>
        )}
      </div>
      <div className={`${styles.questionContainer} ${showAnimation ? styles.questionVisible : styles.questionHidden}`}>
        <div className={styles.questionText}>{currentQuestion.questionText}</div>
        <div className={styles.answerOptions}>
          {options.length > 0 ? (
            options.map((option, idx) => (
              <button
                key={idx}
                className={
                  answers[currentQuestion._id] === option
                    ? styles.selectedAnswer
                    : styles.answerButton
                }
                onClick={() => handleAnswerSelect(currentQuestion._id, option)}
                disabled={!isTestStarted}
              >
                {option}
              </button>
            ))
          ) : (
            <div style={{ color: 'red', fontWeight: 'bold', padding: '1em' }}>
              No answer options available for this question.
            </div>
          )}
        </div>
      </div>
      <div className={styles.navigationButtons}>
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={styles.navButton}
        >
          Previous
        </button>
        {currentQuestionIndex === tests.length - 1 ? (
          <>
            {/* Show message and review button if not all answered */}
            {!allAnswered && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16 }}>
                <span style={{ color: '#ff3b3b', fontWeight: 600, marginBottom: 6 }}>
                  You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                </span>
                <button
                  type="button"
                  className={styles.navButton}
                  style={{ background: '#ff3b3b', color: '#fff', fontWeight: 700, marginBottom: 0 }}
                  onClick={handleReviewUnanswered}
                >
                  Review Unanswered
                </button>
              </div>
            )}
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Submit
            </button>
          </>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === tests.length - 1}
            className={styles.navButton}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionDisplay; 