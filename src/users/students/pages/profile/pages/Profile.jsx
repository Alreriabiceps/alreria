import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Profile.module.css";

const Profile = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [testStats, setTestStats] = useState({
    totalTests: 0,
    averageAccuracy: 0,
    currentStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${backendurl}/api/students/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }

        const { data } = await response.json();
        setStudentData(data);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTestStats = async () => {
      try {
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        // First get all test results for the student
        const response = await fetch(`${backendurl}/api/weeklytest/results/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch test results');
        }

        const data = await response.json();

        // Calculate statistics from the results
        const results = data.data.results;
        const totalTests = results.length;

        // Calculate average accuracy
        const totalAccuracy = results.reduce((acc, result) => {
          return acc + (result.score / result.totalQuestions) * 100;
        }, 0);
        const averageAccuracy = totalTests > 0 ? (totalAccuracy / totalTests).toFixed(1) : 0;

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        for (let i = results.length - 1; i >= 0; i--) {
          const testDate = new Date(results[i].completedAt);
          if (testDate >= lastWeek) {
            currentStreak++;
          } else {
            break;
          }
        }

        setTestStats({
          totalTests,
          averageAccuracy,
          currentStreak
        });
      } catch (err) {
        console.error('Error fetching test statistics:', err);
        setError(err.message);
      }
    };

    if (user?.id) {
      fetchStudentData();
      fetchTestStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingMessage}>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.errorMessage}>No student data found</div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          <div className={styles.avatarPlaceholder}>
            {studentData.firstName?.[0]}{studentData.lastName?.[0]}
          </div>
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>
            {studentData.firstName} {studentData.lastName}
          </h1>
          <p className={styles.profileRank}>{studentData.currentRank || 'Apprentice'}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>PR Points</h3>
          <p className={styles.statValue}>{studentData.totalPoints || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Tests Taken</h3>
          <p className={styles.statValue}>{testStats.totalTests}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Average Accuracy</h3>
          <p className={styles.statValue}>{testStats.averageAccuracy}%</p>
        </div>
        <div className={styles.statCard}>
          <h3>Week Streak</h3>
          <p className={styles.statValue}>{testStats.currentStreak}</p>
        </div>
      </div>

      <div className={styles.rankProgress}>
        <h2>Rank Progress</h2>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${(studentData.totalPoints / 850) * 100}%`,
              backgroundColor: getRankColor(studentData.currentRank)
            }}
          />
        </div>
        <div className={styles.rankThresholds}>
          <span>Apprentice (100)</span>
          <span>Scholar (250)</span>
          <span>Honor Student (400)</span>
          <span>High Honors (550)</span>
          <span>Dean's Lister (700)</span>
          <span>Valedictorian (850)</span>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        {/* Add recent test results here */}
      </div>
    </div>
  );
};

// Helper function to get rank color
const getRankColor = (rank) => {
  switch (rank) {
    case 'Apprentice':
      return '#808080'; // Gray
    case 'Scholar':
      return '#CD7F32'; // Bronze
    case 'Honor Student':
      return '#C0C0C0'; // Silver
    case 'High Honors':
      return '#FFD700'; // Gold
    case "Dean's Lister":
      return '#E5E4E2'; // Platinum
    case 'Valedictorian':
      return '#B9F2FF'; // Diamond
    default:
      return '#808080';
  }
};

export default Profile;