import React from "react";
import styles from "../pages/WeeklyTest.module.css";
import { FaTrophy, FaTimes } from "react-icons/fa";

const ResultModal = ({
  showResultModal,
  setShowResultModal,
  testResult,
  score,
  pointsEarned,
  currentRank,
  loading,
  error,
  user,
  selectedSubject,
  selectedWeek,
  // Optional extras for simple/portable usage
  title,
  plain,
  extraInfo, // { label: string, value: string | number }[]
  onGoDashboard,
  onTakeAnother,
}) => {
  if (!showResultModal) return null;

  // Get score color based on percentage
  const getScoreColorClass = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "#27ae60"; // Green
    if (percentage >= 70) return "#f39c12"; // Orange
    if (percentage >= 50) return "#f1c40f"; // Yellow
    return "#e74c3c"; // Red
  };

  return (
    <div className={styles.simpleModalOverlay}>
      <div className={styles.simpleModal}>
        <button
          onClick={() => setShowResultModal(false)}
          className={styles.simpleCloseBtn}
        >
          <FaTimes size={14} />
        </button>

        {loading && !testResult ? (
          <div className={styles.simpleContent}>
            <div className={styles.simpleLoading}>Loading...</div>
          </div>
        ) : !loading && !testResult && error ? (
          <div className={styles.simpleContent}>
            <div className={styles.simpleError}>Error: {error}</div>
            <button
              className={styles.simpleBtn}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        ) : testResult ? (
          <div className={styles.simpleContent}>
            {title && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {title}
              </div>
            )}
            <div className={styles.simpleScore}>
              {score}/{testResult.totalQuestions}
            </div>
            <div className={styles.simplePoints}>
              {pointsEarned > 0 ? "+" : ""}
              {pointsEarned} points
            </div>
            {Array.isArray(extraInfo) && extraInfo.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {extraInfo.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginTop: 4,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.simpleButtonRow}>
              {onGoDashboard && (
                <button className={styles.simpleBtn} onClick={onGoDashboard}>
                  Go to Dashboard
                </button>
              )}
              {onTakeAnother && (
                <button className={styles.simpleBtn} onClick={onTakeAnother}>
                  Take Another Test
                </button>
              )}
            </div>
            <button
              className={styles.simpleBtn}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <div className={styles.simpleContent}>
            <div className={styles.simpleError}>No results</div>
            <button
              className={styles.simpleBtn}
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
