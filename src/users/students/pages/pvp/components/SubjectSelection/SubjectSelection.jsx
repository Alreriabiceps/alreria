import React from 'react';
import styles from './SubjectSelection.module.css'; // Path is now correct within the same folder

const SubjectSelection = ({ subjects, onSelectSubject, isPlayerTurn }) => {
  // Add render log
  console.log('[SubjectSelection] Rendering. Is player turn:', isPlayerTurn);

  return (
    <div className={styles.subjectSelectionContainer}>
      <h2>{isPlayerTurn ? 'Choose a Subject' : 'Waiting for opponent to choose subject...'}</h2>
      <div className={styles.subjectGrid}>
        {subjects.map(subject => (
          <button
            key={subject.id}
            className={styles.subjectButton}
            onClick={() => onSelectSubject(subject)} // Pass the subject object to the handler
            disabled={!isPlayerTurn} // Disable if not player's turn
          >
            <span className={styles.subjectIcon}>{subject.icon}</span>
            <span className={styles.subjectName}>{subject.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelection; 