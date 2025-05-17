import React from 'react';
import styles from '../pages/WeeklyTest.module.css';

const ResultModal = ({
  showResultModal,
  setShowResultModal,
  testResult,
  score,
  pointsEarned,
  currentRank,
  getScoreColor,
  getPointsColor,
  loading,
  error
}) => {
  if (!showResultModal) return null;

  return (
    <div className={styles.resultModalOverlay}>
      <div className={styles.resultModal}>
        {loading && !testResult ? (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <div className={styles.loadingMessage}>Calculating your results...</div>
            <div className={styles.spinner} style={{marginTop: '1.5em'}}></div>
          </div>
        ) : !loading && !testResult && error ? (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <h2 className={styles.resultTitle} style={{color: 'var(--blueprint-danger-text)'}}>Error</h2>
            <p className={styles.errorMessage} style={{marginTop: '1em', marginBottom: '1.5em'}}>{error}</p>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        ) : !loading && testResult ? (
          <>
            <h2 className={styles.resultTitle}>Test Results</h2>
            <div className={styles.resultContent}>
              <div className={styles.resultRow}>
                <span>Score:</span>
                <span className={getScoreColor(score, testResult.totalQuestions)}>
                  {score} / {testResult.totalQuestions}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span>Points Earned:</span>
                <span className={getPointsColor(pointsEarned)}>
                  {pointsEarned > 0 ? '+' : ''}{pointsEarned}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span>Rank:</span>
                <span style={{ color: currentRank?.color }}>{currentRank?.emoji} {currentRank?.name}</span>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <p className={styles.infoMessage}>No results to display.</p>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultModal; 