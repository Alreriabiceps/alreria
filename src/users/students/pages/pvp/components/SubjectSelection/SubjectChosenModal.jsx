import React from 'react';
import styles from './SubjectSelection.module.css';

const SubjectChosenModal = ({ show, subjectName }) => {
    if (!show) return null;
    return (
        <div className={styles.subjectChosenModalOverlay}>
            <div className={styles.subjectChosenModalContent}>
                <h2 className={styles.subjectChosenTitle}>Subject Chosen!</h2>
                <div className={styles.subjectChosenName}>{subjectName}</div>
            </div>
        </div>
    );
};

export default SubjectChosenModal; 