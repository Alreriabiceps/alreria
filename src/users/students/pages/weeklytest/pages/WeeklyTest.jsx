import React, { useState, useEffect } from 'react';
import styles from './WeeklyTest.module.css'; // Use CSS Modules
import { useAuth } from '../../../../../contexts/AuthContext';

// Constants for Filters
const SUBJECTS = [
  "All Subjects", "Effective Communication", "Life Skills",
  "General Mathematics", "General Science", "Pag-aaral ng Kasaysayan"
];

const WEEKS = [
  "All Weeks", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"
];

// Constants for sound effects
const SOUNDS = {
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  complete: '/sounds/complete.mp3'
};

// New Rank System
const RANKS = [
  { min: 0, max: 99, name: 'Grass', emoji: '🌱', description: 'Still growing' },
  { min: 100, max: 199, name: 'Wood', emoji: '🪵', description: 'Getting sturdy' },
  { min: 200, max: 299, name: 'Rock', emoji: '🪨', description: 'Solid start' },
  { min: 300, max: 399, name: 'Iron', emoji: '⚒️', description: 'Forged with effort' },
  { min: 400, max: 499, name: 'Silver', emoji: '🥈', description: 'Shiny and polished' },
  { min: 500, max: 599, name: 'Gold', emoji: '🥇', description: 'Shining like a star' },
  { min: 600, max: 700, name: 'Diamond', emoji: '💎', description: "You're a gem" },
];

// Points calculation based on score percentage
const calculatePointsGain = (score, totalQuestions) => {
  const percentage = (score / totalQuestions) * 100;

  if (percentage >= 90) {
    return 30; // 90% and above
  } else if (percentage >= 70) {
    return 20; // 70% to 89%
  } else if (percentage >= 50) {
    return 10; // 50% to 69%
  } else {
    return -10; // Below 50%
  }
};

// Get rank based on total points
const getRank = (totalPoints) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalPoints >= RANKS[i].min) {
      return RANKS[i];
    }
  }
  return RANKS[0];
};

const WeeklyTest = () => {
  const { user } = useAuth();
  // --- State Variables ---
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [tests, setTests] = useState([]); // Holds the fetched questions
  const [isLoading, setIsLoading] = useState(false); // Loading state for API call
  const [error, setError] = useState(null); // Error state for API call/no tests
  const [answers, setAnswers] = useState({}); // Stores user's answers { questionIndex: answerText }
  const [isTestStarted, setIsTestStarted] = useState(false); // Tracks if the test is in progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Index of the current question
  const [showAnimation, setShowAnimation] = useState(false); // Controls question transition animation
  const [subjects, setSubjects] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null); // Add this line
  const [currentRank, setCurrentRank] = useState(null);
  const [pointsChange, setPointsChange] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [filteredWeeks, setFilteredWeeks] = useState([]);

  // Fetch subjects and weeks on component mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        console.log('Fetching schedule from:', `${backendurl}/api/weeks/active`);

        const response = await fetch(`${backendurl}/api/weeks/active`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw schedule data:', data);

        // Ensure data is an array
        const scheduleArray = Array.isArray(data) ? data : [];

        if (scheduleArray.length === 0) {
          console.warn('No active schedule data available');
          setError('No active schedules available. Please contact your administrator to activate week schedules.');
          return;
        }

        // Extract unique subjects and weeks from the weekschedules
        const subjectMap = {};
        scheduleArray
          .filter(item => item && item.subjectId && item.isActive)
          .forEach(item => {
            subjectMap[item.subjectId._id] = {
              id: item.subjectId._id,
              name: item.subjectId.subject || `Subject ${item.subjectId._id}`
            };
          });
        const uniqueSubjects = Object.values(subjectMap);

        // Filter weeks based on the selected subject
        const uniqueWeeks = [...new Set(scheduleArray
          .filter(item => item && item.weekNumber && item.isActive)
          .map(item => ({
            number: item.weekNumber,
            display: `Week ${item.weekNumber}`,
            year: item.year,
            subjectId: item.subjectId._id // Add subjectId to each week
          })))].sort((a, b) => a.number - b.number);

        console.log('Extracted subjects:', uniqueSubjects);
        console.log('Extracted weeks:', uniqueWeeks);

        if (uniqueSubjects.length === 0 || uniqueWeeks.length === 0) {
          setError('No active schedules found. Please contact your administrator.');
          return;
        }

        setSubjects(uniqueSubjects);
        setWeeks(uniqueWeeks);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(`Failed to load schedule: ${err.message}. Please try again later.`);
      }
    };

    fetchSchedule();
  }, []);

  // Add this useEffect to filter weeks when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const filteredWeeks = weeks.filter(week => week.subjectId === selectedSubject.id);
      setFilteredWeeks(filteredWeeks);
    } else {
      setFilteredWeeks([]);
    }
  }, [selectedSubject, weeks]);

  // --- Effect to Fetch Tests when Filters Change ---
  useEffect(() => {
    const fetchTests = async () => {
      if (!selectedSubject || !selectedWeek) {
        setTests([]);
        setIsTestStarted(false);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setError(null);
        setCurrentSchedule(null); // Reset schedule
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsTestStarted(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTests([]);
      setCurrentSchedule(null); // Reset schedule

      try {
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        console.log('Fetching tests with params:', { selectedSubject, selectedWeek });

        // First fetch the week schedule
        const response = await fetch(
          `${backendurl}/api/weeks/active?subjectId=${encodeURIComponent(selectedSubject.id)}&weekNumber=${encodeURIComponent(selectedWeek.number)}&year=${encodeURIComponent(selectedWeek.year)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received week schedule data:', data);

        // Find the matching schedule
        const schedule = Array.isArray(data) ?
          data.find(s => s.subjectId._id === selectedSubject.id &&
            s.weekNumber === selectedWeek.number &&
            s.isActive) : null;

        if (!schedule) {
          setError('No active schedule found for this week and subject. Please contact your administrator.');
          return;
        }

        // Store the schedule in state
        setCurrentSchedule(schedule);

        // The questions should already be populated in the schedule response
        if (schedule.questionIds && schedule.questionIds.length > 0) {
          console.log('Questions from schedule:', schedule.questionIds);
          setTests(schedule.questionIds);
        } else {
          setError('No questions assigned to this week schedule. Please contact your administrator.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load tests: ${err.message}. Please try again later.`);
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [selectedSubject, selectedWeek]);

  // --- Audio Effects ---
  const playSound = (type) => {
    try {
      // Create audio element
      const audio = new Audio();

      // Set the source based on type
      const soundPath = SOUNDS[type];
      if (!soundPath) {
        console.warn('Unknown sound type:', type);
        return;
      }

      audio.src = soundPath;

      // Add error handling
      audio.onerror = (e) => {
        console.warn(`Failed to load sound: ${type}`, e);
        // Don't throw error, just log it
      };

      // Add success handling
      audio.oncanplaythrough = () => {
        // Play the sound when it's ready
        audio.play().catch(err => {
          console.warn(`Failed to play sound: ${type}`, err);
          // Don't throw error, just log it
        });
      };

      // Load the audio
      audio.load();
    } catch (err) {
      console.warn('Error setting up audio:', err);
      // Don't throw error, just log it
    }
  };

  // --- Handle Answer Selection ---
  const handleAnswerSelect = (questionId, answer) => {
    if (isTestStarted) {
      const currentQuestion = tests[currentQuestionIndex];
      const isCorrect = currentQuestion.correctAnswer === answer;
      setAnswers(prev => ({ ...prev, [questionId]: answer }));

      // Play sound based on answer
      if (isCorrect) {
        playSound('correct');
      } else {
        playSound('wrong');
      }
      // No auto-advance; user must click Next
    }
  };

  // --- Handle Test Completion ---
  const handleTestComplete = async () => {
    if (!currentSchedule) {
      setError('No active schedule found. Please try again.');
      return;
    }

    // Check if user exists and has student data
    if (!user || !user.id) {
      setError('Student data not found. Please log in again.');
      return;
    }

    setIsTestStarted(false);
    playSound('complete');

    // Calculate score
    const finalScore = Object.entries(answers).reduce((acc, [questionId, answer]) => {
      const question = tests.find(q => q._id === questionId);
      return acc + (question && question.correctAnswer === answer ? 1 : 0);
    }, 0);

    // Calculate points change based on score
    const pointsGain = calculatePointsGain(finalScore, tests.length);
    setPointsChange(pointsGain);

    // Prepare answers array for saving
    const answersArray = Object.entries(answers).map(([questionId, selectedAnswer]) => {
      const question = tests.find(q => q._id === questionId);
      return {
        questionId,
        selectedAnswer,
        isCorrect: question.correctAnswer === selectedAnswer
      };
    });

    // Prepare request data
    const requestData = {
      studentId: user.id,
      weekScheduleId: currentSchedule._id,
      subjectId: selectedSubject.id,
      weekNumber: selectedWeek.number,
      year: selectedWeek.year,
      score: finalScore,
      totalQuestions: tests.length,
      answers: answersArray,
      pointsGain: pointsGain
    };

    console.log('Sending test result data:', requestData);

    try {
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendurl}/api/weekly-test/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'You have already completed this test') {
          try {
            const previousResultsResponse = await fetch(
              `${backendurl}/api/weekly-test/results/${user.id}?weekScheduleId=${currentSchedule._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (previousResultsResponse.ok) {
              const previousResults = await previousResultsResponse.json();
              setScore(previousResults.data.score);
              setPointsEarned(previousResults.data.pointsEarned);
              setCurrentRank(getRank(previousResults.data.totalPoints));
              setTestResult(previousResults.data);
              setShowResultModal(true);
              return;
            }
          } catch (fetchErr) {
            console.error('Error fetching previous results:', fetchErr);
            throw new Error('Failed to fetch previous test results');
          }
        }
        throw new Error(data.message || `Failed to save test result: ${response.status} ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Server returned an error');
      }

      console.log('Test result saved successfully:', data);

      // Update state with the response data
      setScore(data.data.testResult.score);
      setPointsEarned(data.data.pointsEarned);
      setCurrentRank(getRank(data.data.totalPoints));
      setTestResult({
        ...data.data.testResult,
        score: data.data.testResult.score,
        totalQuestions: data.data.testResult.totalQuestions
      });
      setShowResultModal(true);
    } catch (err) {
      console.error('Error saving test result:', err);
      setError(`Failed to save test result: ${err.message}. Please try again later.`);
    }
  };

  // --- Event Handlers ---

  // Start the test view
  const handleStartTest = () => {
    if (tests.length > 0) { // Only start if there are questions
      setIsTestStarted(true);
      setCurrentQuestionIndex(0); // Go to the first question
      setAnswers({}); // Clear any previous answers
      setShowAnimation(true); // Trigger animation for the first question
    }
  };

  // Navigate to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < tests.length - 1) {
      setShowAnimation(false); // Start fade-out animation
      // Wait for fade-out, then change index and fade-in
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setShowAnimation(true);
      }, 300); // Should match CSS transition duration
    }
  };

  // Navigate to the previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setShowAnimation(false); // Start fade-out animation
      // Wait for fade-out, then change index and fade-in
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setShowAnimation(true);
      }, 300); // Should match CSS transition duration
    }
  };

  // Reset filters to initial state
  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedWeek('');
    // Other state resets happen via useEffect triggered by filter change
  };

  // Handle test submission
  const handleSubmit = () => {
    // Call handleTestComplete instead of just logging
    handleTestComplete();
  };

  // --- Handle Leaderboard View ---
  const handleViewLeaderboard = async () => {
    try {
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendurl}/api/weeklytest/leaderboard?subjectId=${encodeURIComponent(selectedSubject.id)}&year=${encodeURIComponent(selectedWeek.year)}&weekNumber=${encodeURIComponent(selectedWeek.number)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data);
        setShowLeaderboard(true);
      } else {
        throw new Error(data.message || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    }
  };

  // --- Derived State ---
  // Get the current question object based on the index (null if test not started/no tests)
  const currentQuestion = isTestStarted && tests && tests.length > 0 ? tests[currentQuestionIndex] : null;

  const getScoreColor = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return styles.scoreExcellent;
    if (percentage >= 70) return styles.scoreGood;
    if (percentage >= 50) return styles.scoreAverage;
    return styles.scorePoor;
  };

  const getPointsColor = (points) => {
    if (points > 0) return styles.pointsPositive;
    if (points < 0) return styles.pointsNegative;
    return styles.pointsNeutral;
  };

  // --- Render Logic ---
  return (
    <div className={styles.testListContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Weekly Tests</h1>
        <p className={styles.pageSubtitle}>Take tests to improve your skills and earn MMR points</p>
      </div>

      {/* Filter Panel */}
      <div className={styles.filterPanel}>
        <h2 className={styles.panelHeader}>🔧 Filters</h2>
        <div className={styles.filterControls}>
          {/* Subject Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Subject</label>
            <select
              value={selectedSubject ? selectedSubject.id : ''}
              onChange={(e) => {
                const subject = subjects.find(s => s.id === e.target.value);
                setSelectedSubject(subject || '');
              }}
              className={styles.filterSelect}
              disabled={isLoading || isTestStarted}
            >
              <option key="default-subject" value="">Select Subject</option>
              {Array.isArray(subjects) && subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <option key={`subject-${subject.id}-${index}`} value={subject.id}>
                    {subject.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No subjects available</option>
              )}
            </select>
          </div>
          {/* Week Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Week</label>
            <select
              value={selectedWeek ? selectedWeek.number : ''}
              onChange={(e) => {
                const week = filteredWeeks.find(w => w.number === parseInt(e.target.value));
                setSelectedWeek(week || '');
              }}
              className={styles.filterSelect}
              disabled={isLoading || isTestStarted}
            >
              <option key="default-week" value="">Select Week</option>
              {Array.isArray(filteredWeeks) && filteredWeeks.length > 0 ? (
                filteredWeeks.map((week, index) => (
                  <option key={`week-${week.number}-${week.year}-${index}`} value={week.number}>
                    {week.display}
                  </option>
                ))
              ) : (
                <option value="" disabled>No weeks available</option>
              )}
            </select>
          </div>
          {/* Reset Button */}
          <div className={styles.filterGroup}>
            <button
              onClick={handleResetFilters}
              className={styles.filterButton}
              disabled={isLoading || isTestStarted}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content Panel: Displays loading, error, start screen, or quiz */}
      <div className={styles.contentPanel}>
        {isLoading ? (
          // Loading State
          <div className={styles.messageContainer}>
            <p className={styles.loadingMessage}>Loading tests...</p>
          </div>
        ) : error ? (
          // Error State
          <div className={styles.messageContainer}>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        ) : !selectedSubject || !selectedWeek ? (
          // Initial State (Filters not selected)
          <div className={styles.messageContainer}>
            <p className={styles.infoMessage}>Please select both a subject and a week to view tests.</p>
          </div>
        ) : tests.length > 0 && !isTestStarted ? (
          // Start Test Screen (Tests loaded, not started yet)
          <div className={styles.startTestContainer}>
            <h3>Ready to start the test?</h3>
            <p>Subject: {selectedSubject ? selectedSubject.name : ''}</p>
            <p>Week: {selectedWeek ? selectedWeek.display : ''}</p>
            <p>Number of Questions: {tests.length}</p>
            <button onClick={handleStartTest} className={styles.startButton}>
              Start Test
            </button>
          </div>
        ) : isTestStarted && currentQuestion ? (
          // Quiz View (Test started, current question available)
          <div className={styles.quizArea}>
            {/* Progress Indicator */}
            <div className={styles.progressIndicator}>
              Question {currentQuestionIndex + 1} of {tests.length}
            </div>

            {/* Animated Question Container */}
            <div
              key={currentQuestionIndex}
              className={`${styles.questionContainer} ${showAnimation ? styles.questionVisible : styles.questionHidden}`}
            >
              {/* Bloom's Taxonomy Level */}
              {currentQuestion.bloomsLevel && (
                <div style={{ fontSize: '0.95rem', color: '#80ffce', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                  Bloom's Taxonomy Level: <b>{currentQuestion.bloomsLevel}</b>
                </div>
              )}
              {/* Question Text */}
              <h4>{`Q${currentQuestionIndex + 1}: ${currentQuestion.questionText}`}</h4>

              {/* Choices List */}
              {currentQuestion.choices && currentQuestion.choices.length > 0 ? (
                <div className={styles.choicesList}>
                  {currentQuestion.choices.map((choice, idx) => {
                    const inputId = `q${currentQuestionIndex}-choice${idx}`;
                    const isSelected = answers[currentQuestion._id] === choice;
                    return (
                      <label key={idx} htmlFor={inputId} className={`${styles.choiceItem} ${isSelected ? styles.choiceSelected : ''}`}> 
                        <input
                          id={inputId}
                          type="radio"
                          className={styles.radioInput}
                          value={choice}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(currentQuestion._id, choice)}
                        />
                        <span className={styles.radioLabel}>{choice}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.infoMessage}>No choices available for this question.</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className={styles.navigationButtons}>
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={styles.navButton}
              >
                Previous
              </button>

              {currentQuestionIndex < tests.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className={styles.navButton}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className={styles.submitButton}
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        ) : showResults ? (
          // Results Screen
          <div className={styles.resultsContainer}>
            <h3>Test Results</h3>
            <div className={styles.resultDetails}>
              <p>Your Score: {score} out of {tests.length}</p>
              <p>Points Change: {pointsChange > 0 ? '+' : ''}{pointsChange} points</p>
              <p>Total Points: {pointsEarned}</p>
              <p>Current Rank: {currentRank?.emoji} {currentRank?.name}</p>
              {currentRank?.description && (
                <p style={{ marginBottom: 10 }}>{currentRank.description}</p>
              )}
              <p>Subject: {selectedSubject.name}</p>
              <p>Week: {selectedWeek.display}</p>
            </div>
            <div className={styles.resultActions}>
              <button onClick={handleResetFilters} className={styles.startButton}>
                Take Another Test
              </button>
              <button onClick={handleViewLeaderboard} className={styles.leaderboardButton}>
                View Leaderboard
              </button>
            </div>
          </div>
        ) : testResult ? (
          <div className={styles.resultSection}>
            <h2 className={styles.resultTitle}>Test Results</h2>

            <div className={styles.scoreSection}>
              <div className={styles.scoreDisplay}>
                <span className={`${styles.score} ${getScoreColor(testResult.score, testResult.totalQuestions)}`}>
                  {testResult.score}/{testResult.totalQuestions}
                </span>
                <span className={styles.scorePercentage}>
                  {testResult.score && testResult.totalQuestions ? 
                    Math.round((testResult.score / testResult.totalQuestions) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className={styles.pointsSection}>
              <div className={styles.pointsDisplay}>
                <span className={styles.pointsLabel}>PR Points</span>
                <span className={`${styles.pointsValue} ${getPointsColor(pointsEarned)}`}>
                  {pointsEarned > 0 ? '+' : ''}{pointsEarned}
                </span>
              </div>
              <div className={styles.totalPoints}>
                <span className={styles.totalPointsLabel}>Total PR Points</span>
                <span className={styles.totalPointsValue}>{pointsEarned}</span>
              </div>
            </div>

            <div className={styles.rankSection}>
              <span className={styles.rankLabel}>Current Rank</span>
              <span className={`${styles.rankValue} ${styles[`rank${currentRank?.name || 'Apprentice'}`]}`}>
                {currentRank?.emoji} {currentRank?.name}
              </span>
            </div>

            {currentRank?.description && (
              <div style={{ fontSize: 14, color: '#80ffce', marginBottom: 10, fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                {currentRank.description}
              </div>
            )}

            <button
              className={styles.retakeButton}
              onClick={() => {
                setTestResult(null);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
            >
              Retake Test
            </button>
          </div>
        ) : (
          // Fallback State
          <div className={styles.messageContainer}>
            <p className={styles.infoMessage}>No tests available for the selected subject and week.</p>
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Leaderboard</h3>
            <div className={styles.leaderboardList}>
              {leaderboard.length > 0 ? (
                leaderboard.map((result, index) => (
                  <div key={result._id} className={styles.leaderboardItem}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{result.studentId.firstName} {result.studentId.lastName}</span>
                    <span className={styles.score}>{result.score}/{result.totalQuestions}</span>
                    <span className={styles.points}>{result.pointsEarned} points</span>
                  </div>
                ))
              ) : (
                <p className={styles.infoMessage}>No results available for this week.</p>
              )}
            </div>
            <button onClick={() => setShowLeaderboard(false)} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {showResultModal && testResult && (
        <div className={styles.modal}>
          <div className={styles.modalContent} style={{ maxWidth: 420, borderRadius: 12, background: 'linear-gradient(135deg, #1a1a2e 60%, #00ff9d22 100%)', boxShadow: '0 8px 32px 0 rgba(0,255,157,0.15), 0 1.5px 8px 0 #00ff9d44' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 8, color: '#00ff9d', textShadow: '0 0 12px #00ff9d88' }}>🏆</div>
              <h2 className={styles.resultTitle} style={{ color: '#00ff9d', fontSize: '1.5rem', marginBottom: 8, textShadow: '0 0 8px #00ff9d88' }}>Test Complete!</h2>
              <div style={{ fontSize: 18, color: '#fff', marginBottom: 18, fontFamily: 'var(--font-body)' }}>
                {testResult.score && testResult.totalQuestions ? (
                  <>
                    <span style={{ fontWeight: 700, fontSize: 32, color: '#80ffce', textShadow: '0 0 8px #00ff9d44' }}>{testResult.score}</span>
                    <span style={{ fontWeight: 400, fontSize: 22, color: '#fff' }}> / {testResult.totalQuestions}</span>
                  </>
                ) : null}
                <span style={{ display: 'block', fontSize: 16, color: '#80ffce', marginTop: 2 }}>
                  ({testResult.score && testResult.totalQuestions ? Math.round((testResult.score / testResult.totalQuestions) * 100) : 0}%)
                </span>
              </div>
              <div style={{ fontSize: 20, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 28, color: testResult.pointsEarned > 0 ? '#00ff9d' : testResult.pointsEarned < 0 ? '#ff4d4f' : '#fff', textShadow: '0 0 8px #00ff9d44' }}>💎</span>
                <span style={{ fontWeight: 700, fontSize: 24, color: testResult.pointsEarned > 0 ? '#00ff9d' : testResult.pointsEarned < 0 ? '#ff4d4f' : '#fff' }}>{testResult.pointsEarned > 0 ? '+' : ''}{testResult.pointsEarned} PR Points</span>
              </div>
              <div style={{ fontSize: 16, color: '#fff', marginBottom: 18, fontFamily: 'var(--font-body)' }}>
                <span>Total PR Points: </span>
                <span style={{ fontWeight: 700, color: '#80ffce' }}>{testResult.totalPoints}</span>
              </div>
              <div style={{ fontSize: 16, color: '#fff', marginBottom: 18, fontFamily: 'var(--font-body)' }}>
                <span>Current Rank: </span>
                <span style={{ fontWeight: 700, color: '#00ff9d' }}>{currentRank?.emoji} {currentRank?.name}</span>
              </div>
              {currentRank?.description && (
                <div style={{ fontSize: 14, color: '#80ffce', marginBottom: 10, fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                  {currentRank.description}
                </div>
              )}
              <div style={{ fontSize: 15, color: '#80ffce', marginBottom: 18, fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                {testResult.pointsEarned > 0
                  ? 'Great job! Keep up the good work!'
                  : testResult.pointsEarned < 0
                  ? "Don't give up! Review and try again!"
                  : 'Keep practicing to improve your score!'}
              </div>
              <div className={styles.modalActions} style={{ marginTop: 18 }}>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowResultModal(false);
                    handleResetFilters();
                  }}
                  style={{ fontWeight: 700, fontSize: 18, padding: '10px 32px', background: '#00ff9d', color: '#19122e', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px #00ff9d44', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTest;