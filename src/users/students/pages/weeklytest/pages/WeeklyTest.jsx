import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './WeeklyTest.module.css'; // Use CSS Modules
import { useAuth } from '../../../../../contexts/AuthContext';
import FilterPanel from '../components/FilterPanel';
import QuestionDisplay from '../components/QuestionDisplay';
import ResultModal from '../components/ResultModal';
import Leaderboard from '../components/Leaderboard';
import FloatingStars from '../../../components/FloatingStars/FloatingStars'; // Import FloatingStars

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

// New Rank System based on user request
const RANKS = [
  { min: 0, max: 149, name: 'Absent Legend', emoji: '🛌', description: 'Technically enrolled.' },
  { min: 150, max: 299, name: 'The Crammer', emoji: '⏰', description: 'Studies best under extreme pressure—like 5 minutes before class.' },
  { min: 300, max: 449, name: 'Seatwarmer', emoji: '📖', description: 'Physically present, mentally... buffering.' },
  { min: 450, max: 599, name: 'Group Project Ghost', emoji: '📎', description: 'Appears only during final presentation day.' },
  { min: 600, max: 749, name: 'Google Scholar (Unofficial)', emoji: '🔍', description: 'Master of Ctrl+F and "Quizlet."' },
  { min: 750, max: 899, name: 'The Lowkey Genius', emoji: '📚', description: 'Never recites, still gets the highest score.' },
  { min: 900, max: 1049, name: 'Almost Valedictorian', emoji: '🏅', description: 'Always 0.01 short—every time.' },
  { min: 1050, max: Infinity, name: 'The Valedictornator', emoji: '🎤', description: 'Delivers speeches, aces tests, and might run the school.' }
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

// Helper function to get localStorage key
const getLocalStorageKey = (userId) => userId ? `weeklyTestState_${userId}` : null;

const WeeklyTest = () => {
  const { user } = useAuth();
  const justRestoredSessionRef = useRef(false); // Ref to signal post-restoration

  // Dashboard theme variables
  const theme = {
    bg: '#0D131A',
    panelBg: '#18202b',
    panelBorder: '#232c3a',
    text: '#E0F2F7',
    accent: '#f1c40f',
    fontBody: 'Montserrat, sans-serif',
    fontHeader: 'Bangers, cursive',
    bubbleDarkText: '#0D131A', // For text on yellow accent elements
    inputBg: '#0D131A', // For input fields, matching theme.bg
  };

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
  const [resultLoading, setResultLoading] = useState(false);
  const [filteredWeeks, setFilteredWeeks] = useState([]);
  const [restoredSessionData, setRestoredSessionData] = useState(null); // New state

  // Helper function to clear test data from localStorage
  const clearLocalStorageTestData = () => {
    const key = getLocalStorageKey(user?.id);
    if (key) {
      console.log('Clearing test state from localStorage.');
      localStorage.removeItem(key);
    }
  };

  // --- Effect to Load Test State from LocalStorage ---
  useEffect(() => {
    const key = getLocalStorageKey(user?.id);
    if (!key) {
      setRestoredSessionData(null); // Ensure no stale data
      setIsLoading(false);
      return;
    }

    console.log('[DEBUG] Attempting to load test state from localStorage with key:', key);
    // Set loading to true here; main effect will set it to false after processing or fetching.
    setIsLoading(true); 
    const savedStateRaw = localStorage.getItem(key);

    if (savedStateRaw) {
      console.log('[DEBUG] Found saved state in localStorage:', savedStateRaw);
      try {
        const savedState = JSON.parse(savedStateRaw);
        console.log('[DEBUG] Parsed saved state:', savedState);

        // Basic structural validation before passing it on
        if (
          savedState &&
          savedState.selectedSubject && savedState.selectedSubject.id &&
          savedState.selectedWeek && savedState.selectedWeek.number !== undefined && savedState.selectedWeek.year !== undefined &&
          savedState.currentSchedule !== undefined && 
          savedState.isTestStarted !== undefined &&
          typeof savedState.currentQuestionIndex === 'number' &&
          savedState.answers !== undefined
        ) {
          console.log('[DEBUG] localStorage: Filters and full savedState will be processed by main effect.');
          // Set filters immediately for UI consistency and for main effect's direct dependencies
          setSelectedSubject(savedState.selectedSubject);
          setSelectedWeek(savedState.selectedWeek);
          setRestoredSessionData(savedState); // Pass the whole object for the main effect to process
          // setIsLoading(true) is already set. The main effect or fetch will set it to false.
        } else {
          console.warn('[DEBUG] localStorage: Invalid or incomplete saved test state found. Clearing localStorage. Problematic state:', savedState);
          localStorage.removeItem(key);
          setRestoredSessionData(null);
          setIsLoading(false); // Failed to load valid structure, stop loading
        }
      } catch (e) {
        console.error('[DEBUG] localStorage: Failed to parse saved test state. Clearing localStorage. Error:', e);
        localStorage.removeItem(key);
        setRestoredSessionData(null);
        setIsLoading(false); // Error in parsing, stop loading
      }
    } else {
      console.log('[DEBUG] localStorage: No saved state found for key:', key);
      setRestoredSessionData(null);
      setIsLoading(false); // No saved state, stop loading
    }
  }, [user?.id, setSelectedSubject, setSelectedWeek, setRestoredSessionData, setIsLoading]); // Added setters to deps

  // --- Effect to Save Test State to LocalStorage ---
  useEffect(() => {
    const key = getLocalStorageKey(user?.id);
    if (!key) return;

    if (isTestStarted && currentSchedule && tests && tests.length > 0) {
      const testStateToSave = {
        selectedSubject,
        selectedWeek,
        currentSchedule,
        isTestStarted,
        currentQuestionIndex,
        answers,
      };
      // console.log('Saving test state to localStorage:', testStateToSave);
      localStorage.setItem(key, JSON.stringify(testStateToSave));
    }
    // Explicit removal is handled in complete/reset functions
  }, [
    selectedSubject,
    selectedWeek,
    currentSchedule,
    isTestStarted,
    currentQuestionIndex,
    answers,
    user?.id,
    tests
  ]);

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

  // --- Helper function to fetch and set new test data ---
  const fetchAndSetNewTestData = React.useCallback(async () => {
    if (!selectedSubject || !selectedSubject.id || !selectedWeek || selectedWeek.number === undefined || selectedWeek.year === undefined) {
      console.log('[DEBUG] fetchAndSetNewTestData: Filters not selected. Aborting fetch.');
      // Ensure states are reset if filters are incomplete, even if called directly
      setIsLoading(false); // Stop loading if it was somehow true
      setError(null);      // Clear any previous errors
      // Do not clear testStarted here, let the main effect handle it based on context
      return;
    }

    console.log(`[DEBUG] fetchAndSetNewTestData called for Subject: ${selectedSubject?.name}, Week: ${selectedWeek?.display}`);
    setIsLoading(true);
    setError(null);
    // This is critical: fetching new data means it's a new test session or a reset.
    setIsTestStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTests([]);
    setCurrentSchedule(null);

    try {
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendurl}/api/weeks/active?subjectId=${encodeURIComponent(selectedSubject.id)}&weekNumber=${encodeURIComponent(selectedWeek.number)}&year=${encodeURIComponent(selectedWeek.year)}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const schedule = Array.isArray(data) ? data.find(s =>
        s.subjectId?._id === selectedSubject.id &&
        s.weekNumber === selectedWeek.number &&
        s.year === selectedWeek.year &&
        s.isActive
      ) : null;

      if (!schedule) {
        setError('No active schedule found for this week and subject. Please contact your administrator.');
        setTests([]);
        return;
      }
      setCurrentSchedule(schedule);
      if (schedule.questionIds && schedule.questionIds.length > 0) {
        setTests(schedule.questionIds);
      } else {
        setError('No questions assigned to this week schedule. Please contact your administrator.');
        setTests([]);
      }
    } catch (err) {
      setError(`Failed to load tests: ${err.message}. Please try again later.`);
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedSubject, // Dependency: reads selectedSubject
    selectedWeek,    // Dependency: reads selectedWeek
    setIsLoading,    // Setter
    setError,        // Setter
    setIsTestStarted,// Setter
    setCurrentQuestionIndex, // Setter
    setAnswers,      // Setter
    setTests,        // Setter
    setCurrentSchedule // Setter
    // user?.id is not directly used here but in the calling effect
  ]);

  // Main Test Logic Effect
  useEffect(() => {
    console.log(`[DEBUG] MAIN EFFECT RUN. User: ${user?.id}, SelSub: ${selectedSubject?.name}, SelWeek: ${selectedWeek?.display}, IsTestStarted_STATE: ${isTestStarted}, CQI_STATE: ${currentQuestionIndex}, HasRestoredData: ${!!restoredSessionData}, JustRestoredFlag: ${justRestoredSessionRef.current}`);

    if (restoredSessionData) {
      const dataToProcess = restoredSessionData;
      setRestoredSessionData(null); // Consume the data immediately

      console.log('[DEBUG] MAIN EFFECT: Processing restoredSessionData:', dataToProcess);

      const {
        selectedSubject: rSelectedSubject,
        selectedWeek: rSelectedWeek,
        currentSchedule: rCurrentSchedule,
        isTestStarted: rIsTestStarted,
        currentQuestionIndex: rCurrentQuestionIndex,
        answers: rAnswers
      } = dataToProcess;

      if (
        rIsTestStarted &&
        rCurrentSchedule && rCurrentSchedule.questionIds && rCurrentSchedule.questionIds.length > 0 &&
        rSelectedSubject && rSelectedSubject.id &&
        rSelectedWeek && rSelectedWeek.number !== undefined && rSelectedWeek.year !== undefined &&
        rCurrentSchedule.subjectId?._id === rSelectedSubject.id &&
        rCurrentSchedule.weekNumber === rSelectedWeek.number &&
        rCurrentSchedule.year === rSelectedWeek.year &&
        rCurrentSchedule.questionIds.every(q => q && q._id) &&
        rCurrentQuestionIndex < rCurrentSchedule.questionIds.length && rCurrentQuestionIndex >= 0
      ) {
        console.log('[DEBUG] MAIN EFFECT: Restored session from dataToProcess is VALID. Setting all states. CQI:', rCurrentQuestionIndex);
        setSelectedSubject(rSelectedSubject);
        setSelectedWeek(rSelectedWeek);
        setCurrentSchedule(rCurrentSchedule);
        setTests(rCurrentSchedule.questionIds);
        setIsTestStarted(rIsTestStarted);
        setCurrentQuestionIndex(rCurrentQuestionIndex);
        setAnswers(rAnswers || {});
        setError(null);
        setIsLoading(false);
        setShowAnimation(true); // Ensure question content is shown with animation
        justRestoredSessionRef.current = true; // Signal for the next run
        return; 
      } else {
        console.warn('[DEBUG] MAIN EFFECT: Restored session from dataToProcess FAILED validation or was not an active test. Details:', { rIsTestStarted, rCQI: rCurrentQuestionIndex, rScheduleID: rCurrentSchedule?._id });
        // If validation fails, isLoading was true from localStorage effect.
        // It will either proceed to fetch (if filters are valid) which handles isLoading,
        // or it will hit a filter check / user check which sets isLoading(false).
      }
    }

    // If this run is immediately after a successful restoration, skip further processing.
    if (justRestoredSessionRef.current) {
      justRestoredSessionRef.current = false; // Consume the flag
      console.log('[DEBUG] MAIN EFFECT: Post-restoration run. No-op. isLoading should be false.');
      // setIsLoading(false); // Should have been set by the restoration block
      return;
    }

    if (!user?.id) {
        console.log('[DEBUG] MAIN EFFECT: No user.id. Returning.');
        setIsLoading(false);
        return;
    }

    // If filters are not selected (and no session was successfully restored AND preserved above)
    if (!selectedSubject || !selectedSubject.id || !selectedWeek || selectedWeek.number === undefined || selectedWeek.year === undefined) {
      console.log(`[DEBUG] MAIN EFFECT: Filters not fully selected. SelSub: ${selectedSubject?.name}, SelWeek: ${selectedWeek?.display}.`);
      // If a test was marked as started (e.g. from a failed restore attempt or previous state)
      // but filters are now incomplete, we need to reset the test state.
      if (isTestStarted) {
        console.log('[DEBUG] MAIN EFFECT: Filters not selected BUT test was started. Resetting active test state.');
        setIsTestStarted(false);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setTests([]);
        setCurrentSchedule(null);
        setError(null); // Clear any test-related errors
      } else {
        // Filters not selected, and no test was active. Minimal reset.
        setError(null);
      }
      setIsLoading(false);
      return;
    }

    // If we reach here: user is loaded, filters ARE selected in component state.
    // AND ( (no restoredSessionData was processed) OR 
    //      (restoredSessionData was processed but FAILED validation) )
    // So, fetch new data for the selectedSubject and selectedWeek from component state.
    console.log(`[DEBUG] MAIN EFFECT: Proceeding to fetchAndSetNewTestData for Sub: ${selectedSubject.name} Week: ${selectedWeek.display}.`);
    fetchAndSetNewTestData();

  }, [
    user?.id,
    selectedSubject, // Depends on component state for filters
    selectedWeek,
    restoredSessionData, // Triggers processing of restored data
    fetchAndSetNewTestData, // Memoized fetch function
    // Setters are not needed in deps as per React guidelines if they are stable,
    // and state updates within an effect for consumption (like setRestoredSessionData(null))
    // will cause a re-run which is handled.
    setRestoredSessionData, // because we call it
    setIsLoading, // For the return paths
    setError, // For the return paths
    setIsTestStarted, setCurrentQuestionIndex, setAnswers, setTests, setCurrentSchedule, // for reset path if filters not selected
    setSelectedSubject, setSelectedWeek, // for setting state from rSelectedSubject if validation passes
    justRestoredSessionRef
  ]);

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
    if (!user || !user.id) {
      setError('Student data not found. Please log in again.');
      return;
    }
    setIsTestStarted(false);
    playSound('complete');
    setResultLoading(true);
    setShowResultModal(true);

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

    // console.log('WeeklyTest SUBMIT requestData:', requestData); // Existing log
    console.log('[DEBUG 400_ERROR_CHECK] Full requestData for POST /api/weekly-test/results:', JSON.stringify(requestData, null, 2));

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
            } else {
              // Failed to fetch previous results, but test IS already completed.
              console.error('Test already completed, but failed to fetch previous results. Status:', previousResultsResponse.status);
              setError('You have already completed this test. Failed to load your previous score.');
              setTestResult(null); // Explicitly nullify testResult on fetch failure
            }
          } catch (fetchErr) {
            console.error('Error fetching previous results after "already completed" notice:', fetchErr);
            setError('You have already completed this test. Error fetching your previous score.');
            setTestResult(null); // Explicitly nullify testResult on fetch failure
          } finally {
            // Whether fetching previous results succeeded or failed, the original test submission was for an already completed test.
            // Clear localStorage to prevent re-submission attempts on refresh.
            clearLocalStorageTestData();
            setResultLoading(false); // Ensure loading is stopped.
            return; // Exit handleTestComplete as the main action (submit) is resolved as "already completed".
          }
        }
        // If it wasn't an "already completed" error, or if some other !response.ok issue occurred with the POST
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
      setResultLoading(false);
      clearLocalStorageTestData(); // Clear after successful save
    } catch (err) {
      console.error('Error saving test result:', err);
      setError(`Failed to save test result: ${err.message}. Please try again later.`);
      setResultLoading(false);
      // Decide if to clear on error: for now, only on success/already completed.
    }
  };

  // --- Event Handlers ---

  // Start the test view
  const handleStartTest = () => {
    if (tests.length > 0) {
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
    setIsTestStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTests([]);
    setCurrentSchedule(null);
    setError(null);
    setShowResultModal(false); // Hide modal on reset
    clearLocalStorageTestData(); // Clear on filter reset
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
    <div style={{
      width: '100vw', 
      minHeight: '100vh', // Use minHeight to allow content to expand
      boxSizing: 'border-box',
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column', // Main layout is vertical
      alignItems: 'center', // Center content horizontally
      fontFamily: theme.fontBody,
      color: theme.text,
      position: 'relative',
      overflowX: 'hidden', // Prevent horizontal scroll from stars
      padding: '25px 15px 50px 15px', // Add some padding like Dashboard
    }} className={styles.testListContainer_themed}> {/* Add a new class for CSS overrides if needed */}
      <FloatingStars />
      
      {/* Page Header - Themed */}
      <div style={{
        width: '100%',
        maxWidth: '1000px', // Consistent with Dashboard
        marginBottom: '30px', // Increased spacing
        textAlign: 'center',
        zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: theme.fontHeader,
          fontSize: '3.5rem', // Slightly adjusted from Dashboard for context
          color: theme.accent,
          letterSpacing: '3px',
          textShadow: `2px 2px 0 ${theme.bubbleDarkText}, -1px -1px 0 ${theme.bg}, 1px -1px 0 ${theme.bg}, -1px 1px 0 ${theme.bg}, 1px 1px 0 ${theme.bg}`,
          marginBottom: '0.5rem',
          lineHeight: 1.1,
        }}>
          Weekly Lab Tests
        </h1>
        <p style={{
          fontFamily: theme.fontAccent, // Using dashboard's accent font for subtitle
          fontSize: '1.3rem',
          color: theme.text,
          opacity: 0.85,
          textShadow: `1px 1px 2px ${theme.bubbleDarkText}`,
          marginTop: '5px',
        }}>
          Enhance your schematics and earn TechBlueprints.
        </p>
      </div>

      {/* Filter Panel - Themed Wrapper */}
      <div className={styles.filterPanelWrapper_themed} style={{
        background: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: '15px',
        padding: '25px',
        width: '100%',
        maxWidth: '1000px',
        marginBottom: '30px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
      }}>
        <FilterPanel
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          subjects={subjects}
          weeks={weeks}
          filteredWeeks={filteredWeeks}
          handleResetFilters={handleResetFilters}
          theme={theme} // Pass theme to FilterPanel
        />
      </div>

      {/* Content Panel (Test Area) - Themed Wrapper */}
      <div className={styles.contentPanel_themed} style={{
        background: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: '15px',
        padding: '25px', // Uniform padding
        width: '100%',
        maxWidth: '1000px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        display: 'flex', // Added for centering content inside
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px', // Ensure it has some height
      }}>
        {isLoading ? (
          <div className={styles.messageContainer_themed} style={{ color: theme.text, fontSize: '1.2rem' }}>
            <p className={styles.loadingMessage_themed}>Loading Schematics...</p>
          </div>
        ) : error ? (
          <div className={styles.messageContainer_themed} style={{ color: theme.accent, fontSize: '1.2rem', textAlign: 'center' }}>
            <p className={styles.errorMessage_themed}>{error}</p>
          </div>
        ) : !selectedSubject || !selectedWeek ? (
          <div className={styles.messageContainer_themed} style={{ color: theme.text, opacity: 0.8, fontSize: '1.2rem', textAlign: 'center' }}>
            <p className={styles.infoMessage_themed}>Select Subject & Week to initiate test sequence.</p>
          </div>
        ) : tests.length > 0 && !isTestStarted ? (
          <div className={styles.startTestContainer_themed} style={{ textAlign: 'center', color: theme.text }}>
            <h3 style={{ fontFamily: theme.fontHeader, fontSize: '2rem', color: theme.accent, marginBottom: '15px' }}>Ready for System Analysis?</h3>
            <p style={{ marginBottom: '5px' }}>Subject: {selectedSubject ? selectedSubject.name : ''}</p>
            <p style={{ marginBottom: '5px' }}>Week: {selectedWeek ? selectedWeek.display : ''}</p>
            <p style={{ marginBottom: '20px' }}>Questions: {tests.length}</p>
            <button 
              onClick={handleStartTest} 
              className={styles.startButton_themed} 
              style={{
                background: theme.accent,
                color: theme.bubbleDarkText,
                fontFamily: theme.fontBody,
                fontSize: '1.1rem',
                fontWeight: 700,
                padding: '12px 30px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                transition: 'background-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0b00d'; e.currentTarget.style.transform = 'scale(1.05)';}}
              onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)';}}
            >
              Initiate Test
            </button>
          </div>
        ) : isTestStarted && currentQuestion ? (
          <QuestionDisplay
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            tests={tests}
            answers={answers}
            handleAnswerSelect={handleAnswerSelect}
            handleNextQuestion={handleNextQuestion}
            handlePreviousQuestion={handlePreviousQuestion}
            handleSubmit={handleSubmit}
            isTestStarted={isTestStarted}
            showAnimation={showAnimation}
            theme={theme} // Pass theme
          />
        ) : showResults ? (
          // ... (Results Screen - This part will need its own themed component or significant inline styling later)
          <div className={styles.resultsContainer_themed} style={{color: theme.text, textAlign: 'center'}}>
            <h3 style={{fontFamily: theme.fontHeader, fontSize: '2.5rem', color: theme.accent}}>Test Analysis Complete</h3>
            {/* Further styling for results here */}
          </div>
        ) : testResult ? (
          <ResultModal // This modal will need to be passed the theme prop and styled internally
            testResult={testResult}
            currentRank={currentRank}
            pointsEarned={pointsEarned}
            handleResetFilters={handleResetFilters}
            loading={resultLoading}
            error={error}
            theme={theme}
          />
        ) : (
          <div className={styles.messageContainer_themed} style={{ color: theme.text, opacity: 0.7, fontSize: '1.1rem', textAlign: 'center' }}>
            <p className={styles.infoMessage_themed}>No schematics available for selected parameters.</p>
          </div>
        )}
      </div>

      {/* Leaderboard Modal - Pass theme */}
      {showLeaderboard && (
        <Leaderboard
          leaderboard={leaderboard}
          handleViewLeaderboard={handleViewLeaderboard} // This seems to be for closing it, might need renaming
          handleResetFilters={handleResetFilters} // Or a dedicated close handler
          theme={theme}
        />
      )}

      {/* Test Results Modal - Already passing theme (from a previous step if it was done) */}
      {showResultModal && (
        <ResultModal // Ensure this is the one defined to accept theme
          showResultModal={showResultModal}
          setShowResultModal={setShowResultModal}
          testResult={testResult}
          score={score}
          pointsEarned={pointsEarned}
          currentRank={currentRank}
          getScoreColor={getScoreColor} // These helpers might need to use theme colors
          getPointsColor={getPointsColor} // These helpers might need to use theme colors
          loading={resultLoading}
          error={error}
          theme={theme} // Explicitly pass theme
        />
      )}
    </div>
  );
};

export default WeeklyTest;