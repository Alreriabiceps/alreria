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
  handleSubmit
}) => {
  if (!currentQuestion) return null;
  const options = Array.isArray(currentQuestion.choices)
    ? currentQuestion.choices
    : Array.isArray(currentQuestion.options)
      ? currentQuestion.options
      : [];
  // Determine if all questions are answered
  const allAnswered = tests.every(q => answers[q._id]);
  return (
    <div className={styles.questionPanel}>
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
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit
          </button>
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