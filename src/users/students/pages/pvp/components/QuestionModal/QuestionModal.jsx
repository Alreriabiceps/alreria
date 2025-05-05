import React, { useState, useEffect } from 'react';
import styles from './QuestionModal.module.css';

const QuestionModal = ({
    question, // { id, text, options } or { id, questionText, choices }
    onSubmitAnswer // Function to call with the selected answer
}) => {
    const [selectedOption, setSelectedOption] = useState(null);

    // Reset selection when the question changes
    useEffect(() => {
        setSelectedOption(null);
    }, [question]);

    const handleSubmit = () => {
        if (selectedOption !== null) {
            onSubmitAnswer(selectedOption);
        } else {
            console.warn('No answer selected to submit.');
            // Optionally show a message to the user
        }
    };

    // Prevent rendering if no question is provided
    if (!question) {
        return null;
    }

    // Log the question data for debugging
    console.log('QuestionModal received question:', question);

    // Handle both old and new question data formats
    const questionText = question.text || question.questionText;
    const options = question.options || question.choices;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <p className={styles.questionText}>{questionText}</p>
                <div className={styles.optionsContainer}>
                    {(options || []).map((option, index) => (
                        <button
                            key={index}
                            className={`
                                ${styles.optionButton}
                                ${selectedOption === option ? styles.selected : ''}
                            `}
                            onClick={() => setSelectedOption(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <button
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                >
                    Submit Answer
                </button>
                {/* Add Timer display here later if needed */}
            </div>
        </div>
    );
};

export default QuestionModal; 