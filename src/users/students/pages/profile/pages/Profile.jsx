import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Profile.module.css";
import Modal from 'react-modal';
import { 
  FaLeaf, FaTree, FaMountain, FaShieldAlt, FaMedal, FaTrophy, FaGem, 
  FaBug, FaUserShield, FaCrown, FaStar, FaFistRaised, FaAward,
  FaBookOpen, FaCalendarCheck, FaUsers, FaChartBar, FaCrosshairs, FaFire, FaBolt, FaClock,
  FaChevronDown,
  FaBed, FaPaperclip, FaSearch, FaBookReader, FaMicrophoneAlt, FaBell
} from 'react-icons/fa';
import FloatingStars from '../../../components/FloatingStars/FloatingStars';

const iconComponents = {
  FaLeaf, FaTree, FaMountain, FaShieldAlt, FaMedal, FaTrophy, FaGem,
  FaBug, FaUserShield, FaCrown, FaStar, FaFistRaised, FaAward,
  FaBookOpen, FaCalendarCheck, FaUsers, FaChartBar, FaCrosshairs, FaFire, FaBolt, FaClock,
  FaChevronDown,
  FaBed, FaPaperclip, FaSearch, FaBookReader, FaMicrophoneAlt, FaBell
};

const IconComponent = ({ iconName, ...props }) => {
  const ActualIcon = iconComponents[iconName];
  if (!ActualIcon) {
    console.warn(`Icon "${iconName}" not found in iconComponents.`);
    return null; 
  }
  return <ActualIcon {...props} />;
};

const TAB_OVERVIEW = 'overview';
const TAB_WEEKLY = 'weekly';
const TAB_PVP = 'pvp';
const TAB_ANALYTICS = 'analytics';
const TAB_ACHIEVEMENTS = 'achievements';
const TAB_SETTINGS = 'settings';

const Profile = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [testStats, setTestStats] = useState({
    totalTests: 0,
    averageAccuracy: 0,
    currentStreak: 0,
    prPoints: 0,
    bestScore: 0,
    lowestScore: null,
    bestAccuracy: 0,
    recentPRChange: 0,
    lastTestDate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [testResults, setTestResults] = useState([]);
  const [showWeeklyRanks, setShowWeeklyRanks] = useState(false);
  const [showPvpRanks, setShowPvpRanks] = useState(false);

  // New Rank System - Updated to match WeeklyTest.jsx (8-Tier Funny School Ranking)
  const RANKS = [
    { min: 0, max: 149, name: 'Absent Legend', prIcon: 'FaBed', description: 'Technically enrolled.', color: 'var(--blueprint-text-muted)' }, // Using FaBed for 🛌
    { min: 150, max: 299, name: 'The Crammer', prIcon: 'FaClock', description: 'Studies best under extreme pressure—like 5 minutes before class.', color: '#FFC107' }, // FaClock for ⏰
    { min: 300, max: 449, name: 'Seatwarmer', prIcon: 'FaBookOpen', description: 'Physically present, mentally... buffering.', color: '#A0522D' }, // FaBookOpen for 📖
    { min: 450, max: 599, name: 'Group Project Ghost', prIcon: 'FaPaperclip', description: 'Appears only during final presentation day.', color: '#B0C4DE' }, // FaPaperclip for 📎
    { min: 600, max: 749, name: 'Google Scholar (Unofficial)', prIcon: 'FaSearch', description: 'Master of Ctrl+F and "Quizlet."' , color: 'var(--blueprint-success)'}, // FaSearch for 🔍
    { min: 750, max: 899, name: 'The Lowkey Genius', prIcon: 'FaBookReader', description: 'Never recites, still gets the highest score.', color: 'var(--blueprint-accent-secondary)' }, // FaBookReader for 📚 (FaBook is taken)
    { min: 900, max: 1049, name: 'Almost Valedictorian', prIcon: 'FaMedal', description: 'Always 0.01 short—every time.', color: 'var(--blueprint-accent)' }, // FaMedal for 🏅
    { min: 1050, max: Infinity, name: 'The Valedictornator', prIcon: 'FaMicrophoneAlt', description: 'Delivers speeches, aces tests, and might run the school.', color: 'var(--blueprint-danger)' } // FaMicrophoneAlt for 🎤
  ];

  // PvP Rank System - Updated Colors
  const PVP_RANKS = [
    { min: 0, max: 79, name: 'Grasshopper', pvpIcon: 'FaBug', description: 'Newbie — Just starting out.', color: 'var(--blueprint-success)' },
    { min: 80, max: 159, name: 'Knight', pvpIcon: 'FaUserShield', description: 'Rising Warrior — Showing promise.', color: '#B0C4DE' },
    { min: 160, max: 239, name: 'Gladiator', pvpIcon: 'FaShieldAlt', description: 'Skilled Fighter — Battle-ready.', color: '#C0C0C0' },
    { min: 240, max: 319, name: 'Elite', pvpIcon: 'FaCrown', description: 'Champion in the Making.', color: 'var(--blueprint-accent)' },
    { min: 320, max: 399, name: 'Legend', pvpIcon: 'FaStar', description: 'Feared by many.', color: 'var(--blueprint-accent-secondary)' },
    { min: 400, max: 479, name: 'Titan', pvpIcon: 'FaFistRaised', description: 'Legendary Force — Near unstoppable.', color: '#D8A2FF' },
    { min: 480, max: 500, name: 'Supreme', pvpIcon: 'FaAward', description: 'Absolute Peak — Top of the ranks.', color: 'var(--blueprint-danger)' },
  ];

  const getRank = (totalPoints) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (totalPoints >= RANKS[i].min) {
        return RANKS[i];
      }
    }
    return RANKS[0];
  };

  const getNextRank = (totalPoints) => {
    for (let i = 0; i < RANKS.length; i++) {
      if (totalPoints < RANKS[i].min) {
        return RANKS[i];
      }
    }
    return null;
  };

  // Calculate PvP stars from match history
  const getPvpStars = () => {
    let stars = 0;
    for (const match of mockPvpHistory) {
      if (match.result === 'win') stars += 7;
      else if (match.result === 'loss') stars -= 7;
    }
    return Math.max(0, Math.min(500, stars));
  };

  const getPvpRank = (stars) => {
    for (let i = PVP_RANKS.length - 1; i >= 0; i--) {
      if (stars >= PVP_RANKS[i].min) {
        return PVP_RANKS[i];
      }
    }
    return PVP_RANKS[0];
  };

  const getNextPvpRank = (stars) => {
    for (let i = 0; i < PVP_RANKS.length; i++) {
      if (stars < PVP_RANKS[i].min) {
        return PVP_RANKS[i];
      }
    }
    return null;
  };

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
        const response = await fetch(`${backendurl}/api/weekly-test/results/student/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch test results');
        }

        const data = await response.json();
        // Save results for history tab
        setTestResults(data.data.results || []);

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

        // Calculate PR Points as the sum of all pointsEarned from weekly tests
        const prPoints = results.reduce((acc, result) => acc + (result.pointsEarned || 0), 0);

        // Best score, lowest score, best accuracy, recent PR points change, last test date
        let bestScore = 0;
        let lowestScore = null;
        let bestAccuracy = 0;
        let recentPRChange = 0;
        let lastTestDate = null;
        if (results.length > 0) {
          bestScore = Math.max(...results.map(r => r.score));
          lowestScore = Math.min(...results.map(r => r.score));
          bestAccuracy = Math.max(...results.map(r => ((r.score / r.totalQuestions) * 100).toFixed(1)));
          recentPRChange = results[results.length - 1].pointsEarned || 0;
          lastTestDate = results[results.length - 1].completedAt;
        }

        setTestStats({
          totalTests,
          averageAccuracy,
          currentStreak,
          prPoints,
          bestScore,
          lowestScore,
          bestAccuracy,
          recentPRChange,
          lastTestDate
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

  // Use PR Points from testStats for rank and progress
  const prPoints = testStats.prPoints || 0;
  const currentRank = getRank(prPoints);
  const nextRank = getNextRank(prPoints);
  const progressPercent = nextRank
    ? Math.min(100, Math.round(((prPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100))
    : 100;
  const pointsToNext = nextRank ? nextRank.min - prPoints : 0;

  // Mock PvP match history data (replace with real fetch later)
  const mockPvpHistory = [
    {
      id: 'match1',
      date: '2024-06-01T14:30:00Z',
      opponent: 'Alex Cruz',
      result: 'win',
      myScore: 3,
      opponentScore: 1,
      medal: '🥇',
    },
    {
      id: 'match2',
      date: '2024-05-28T19:10:00Z',
      opponent: 'Jamie Lee',
      result: 'loss',
      myScore: 2,
      opponentScore: 3,
      medal: '🥈',
    },
    {
      id: 'match3',
      date: '2024-05-25T16:45:00Z',
      opponent: 'Sam Rivera',
      result: 'win',
      myScore: 3,
      opponentScore: 0,
      medal: '🥇',
    },
    {
      id: 'match4',
      date: '2024-05-20T13:00:00Z',
      opponent: 'Taylor Kim',
      result: 'loss',
      myScore: 1,
      opponentScore: 3,
      medal: '🥉',
    },
  ];

  // Calculate PvP stars from match history
  const pvpStars = getPvpStars();
  const pvpRank = getPvpRank(pvpStars);
  const nextPvpRank = getNextPvpRank(pvpStars);
  const pvpProgressPercent = nextPvpRank
    ? Math.min(100, Math.round(((pvpStars - pvpRank.min) / (nextPvpRank.min - pvpRank.min)) * 100))
    : 100;
  const pvpStarsToNext = nextPvpRank ? nextPvpRank.min - pvpStars : 0;

  const CurrentRankIcon = currentRank && iconComponents[currentRank.prIcon];
  const PvpRankIcon = pvpRank && iconComponents[pvpRank.pvpIcon];

  return (
    <div className={styles.profileContainer}>
      <FloatingStars />
      {/* Top Navigation Tabs - Using CSS Module Styles */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab(TAB_OVERVIEW)}
          className={`${styles.tabButton} ${activeTab === TAB_OVERVIEW ? styles.tabButtonActive : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab(TAB_ANALYTICS)}
          className={`${styles.tabButton} ${activeTab === TAB_ANALYTICS ? styles.tabButtonActive : ''}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab(TAB_WEEKLY)}
          className={`${styles.tabButton} ${activeTab === TAB_WEEKLY ? styles.tabButtonActive : ''}`}
        >
          Weekly Tests
        </button>
        <button
          onClick={() => setActiveTab(TAB_PVP)}
          className={`${styles.tabButton} ${activeTab === TAB_PVP ? styles.tabButtonActive : ''}`}
        >
          PvP History
        </button>
        <button
          onClick={() => setActiveTab(TAB_ACHIEVEMENTS)}
          className={`${styles.tabButton} ${activeTab === TAB_ACHIEVEMENTS ? styles.tabButtonActive : ''}`}
        >
          Achievements
        </button>
        <button
          onClick={() => setActiveTab(TAB_SETTINGS)}
          className={`${styles.tabButton} ${activeTab === TAB_SETTINGS ? styles.tabButtonActive : ''}`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === TAB_OVERVIEW && (
        <div key={TAB_OVERVIEW} className={`${styles.profileSection} ${styles.overviewSection}`} style={{ animationDelay: '0.1s' }}>
          {/* Modern Compact Profile Header */}
          <div className={styles.modernProfileHeader}>
            <div className={styles.profileAvatarSection}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatarPlaceholder}>
                  {studentData.firstName?.[0]}{studentData.lastName?.[0]}
                </div>
                <div className={styles.avatarBadge} style={{ backgroundColor: currentRank.color }}>
                  {CurrentRankIcon && <CurrentRankIcon />}
                </div>
              </div>
            </div>
            
            <div className={styles.profileHeaderInfo}>
              <h1 className={styles.profileName}>
                {studentData.firstName} {studentData.lastName}
              </h1>
              <div className={styles.profileRanks}>
                <div className={styles.rankBadge} style={{ borderColor: currentRank.color, color: currentRank.color }}>
                  {CurrentRankIcon && <CurrentRankIcon />}
                  <span>{currentRank.name}</span>
                </div>
                <div className={styles.rankBadge} style={{ borderColor: pvpRank.color, color: pvpRank.color }}>
                  {PvpRankIcon && <PvpRankIcon />}
                  <span>{pvpRank.name}</span>
                </div>
              </div>
            </div>

            <div className={styles.profileStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue} style={{ color: currentRank.color }}>{prPoints}</div>
                <div className={styles.statLabel}>PR Points</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} style={{ color: pvpRank.color }}>{pvpStars}</div>
                <div className={styles.statLabel}>PvP Stars</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{testStats.totalTests}</div>
                <div className={styles.statLabel}>Tests</div>
              </div>
            </div>
          </div>

          {/* Progress Cards Grid */}
          <div className={styles.progressGrid}>
            <div className={styles.progressCardModern} style={{ animationDelay: '0.2s' }}>
              <div className={styles.progressCardHeader}>
                <div className={styles.progressCardTitle}>
                  {CurrentRankIcon && <CurrentRankIcon style={{ color: currentRank.color }} />}
                  <span>Weekly Progress</span>
                </div>
                <div className={styles.progressCardValue} style={{ color: currentRank.color }}>
                  {prPoints} / {nextRank ? nextRank.min : '∞'}
                </div>
              </div>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: currentRank.color 
                  }}
                />
              </div>
              <div className={styles.progressCardFooter}>
                <span className={styles.currentRank}>{currentRank.name}</span>
                {nextRank && (
                  <span className={styles.nextRank}>Next: {nextRank.name}</span>
                )}
              </div>
            </div>

            <div className={styles.progressCardModern} style={{ animationDelay: '0.3s' }}>
              <div className={styles.progressCardHeader}>
                <div className={styles.progressCardTitle}>
                  {PvpRankIcon && <PvpRankIcon style={{ color: pvpRank.color }} />}
                  <span>PvP Progress</span>
                </div>
                <div className={styles.progressCardValue} style={{ color: pvpRank.color }}>
                  {pvpStars} / {nextPvpRank ? nextPvpRank.min : '500'}
                </div>
              </div>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${pvpProgressPercent}%`,
                    backgroundColor: pvpRank.color 
                  }}
                />
              </div>
              <div className={styles.progressCardFooter}>
                <span className={styles.currentRank}>{pvpRank.name}</span>
                {nextPvpRank && (
                  <span className={styles.nextRank}>Next: {nextPvpRank.name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className={styles.quickStatsGrid}>
            <div className={styles.quickStatCard} style={{ animationDelay: '0.4s' }}>
              <FaFire className={styles.quickStatIcon} />
              <div className={styles.quickStatValue}>{testStats.currentStreak}</div>
              <div className={styles.quickStatLabel}>Current Streak</div>
            </div>
            <div className={styles.quickStatCard} style={{ animationDelay: '0.5s' }}>
              <FaStar className={styles.quickStatIcon} />
              <div className={styles.quickStatValue}>{testStats.averageAccuracy}%</div>
              <div className={styles.quickStatLabel}>Avg Accuracy</div>
            </div>
            <div className={styles.quickStatCard} style={{ animationDelay: '0.6s' }}>
              <FaTrophy className={styles.quickStatIcon} />
              <div className={styles.quickStatValue}>{testStats.bestScore}</div>
              <div className={styles.quickStatLabel}>Best Score</div>
            </div>
            <div className={styles.quickStatCard} style={{ animationDelay: '0.7s' }}>
              <FaClock className={styles.quickStatIcon} />
              <div className={styles.quickStatValue}>
                {testStats.lastTestDate ? new Date(testStats.lastTestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
              </div>
              <div className={styles.quickStatLabel}>Last Test</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className={styles.actionCardsGrid}>
            <div className={styles.actionCard} style={{ animationDelay: '0.8s' }}>
              <FaBookOpen className={styles.actionCardIcon} />
              <div className={styles.actionCardTitle}>Weekly Tests</div>
              <div className={styles.actionCardDescription}>Take new tests and improve your rank</div>
              <button 
                className={styles.actionCardButton}
                onClick={() => setActiveTab(TAB_WEEKLY)}
              >
                View Tests
              </button>
            </div>
            <div className={styles.actionCard} style={{ animationDelay: '0.9s' }}>
              <FaUsers className={styles.actionCardIcon} />
              <div className={styles.actionCardTitle}>PvP Arena</div>
              <div className={styles.actionCardDescription}>Challenge other students in duels</div>
              <button 
                className={styles.actionCardButton}
                onClick={() => setActiveTab(TAB_PVP)}
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === TAB_ANALYTICS && (
        <div key={TAB_ANALYTICS} className={styles.profileSection} style={{ maxWidth: 700, margin: '0 auto', animationDelay: '0.5s' }}>
          <h2 className={styles.sectionTitle}>Test Analytics</h2>
          <div className={styles.analyticsGrid}>
            {[testStats.totalTests, testStats.bestScore, testStats.lowestScore, testStats.bestAccuracy, testStats.currentStreak, testStats.recentPRChange, testStats.lastTestDate].map((stat, index) => {
              const labels = ['Tests', 'Best Score', 'Lowest Score', 'Best Accuracy', 'Streak', 'Recent PR', 'Last Test'];
              const icons = [FaBookOpen, FaCrosshairs, FaChartBar, FaStar, FaFire, FaBolt, FaClock];
              const IconComponent = icons[index];
              let displayValue = stat;
              if (index === 1 || index === 2) displayValue = stat ?? '-';
              if (index === 3) displayValue = stat ? `${stat}%` : '-';
              if (index === 5 && stat > 0) displayValue = `+${stat}`;
              if (index === 6) displayValue = stat ? new Date(stat).toLocaleDateString() : '-';

              return (
                <div key={labels[index]} className={styles.statCard} style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                  <div className={styles.statCardIcon}><IconComponent /></div>
                  <div className={styles.statCardLabel}>{labels[index]}</div>
                  <div className={styles.statCardValue}>{displayValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeTab === TAB_WEEKLY && (
        <div key={TAB_WEEKLY} className={styles.profileSection} style={{ maxWidth: 600, margin: '0 auto', animationDelay: '0.5s' }}>
          <h2 className={styles.sectionTitle}>Weekly Test History</h2>
          {testResults.length === 0 ? (
            <div className={styles.noHistoryMessage} style={{ opacity: 0, animation: `${styles.fadeInSlideUp} 0.5s ease-out 0.2s forwards`}}>
              <FaCalendarCheck className={styles.noHistoryEmoji} />
              <div>No weekly tests taken yet.</div>
            </div>
          ) : (
            <div className={styles.historyListContainer}>
              {testResults.map((test, idx) => (
                <div key={test.id || idx} className={styles.historyItem} style={{ borderLeft: `5px solid var(--blueprint-accent)`, animationDelay: `${0.2 + idx * 0.1}s`}}>
                  <FaBookOpen className={styles.historyItemIcon} style={{color: 'var(--blueprint-accent)'}}/>
                  <div className={styles.historyItemDetails}>
                    <div className={styles.historyItemTitle} style={{ color: 'var(--blueprint-accent)' }}>
                      {test.subject || 'Subject'} - Week {test.weekNumber}
                    </div>
                    <div className={styles.historyItemSubtitle}>
                      {test.score}/{test.totalQuestions} correct
                    </div>
                  </div>
                  <div className={styles.historyItemMeta}>
                    <div className={styles.historyItemScorePercent}>{test.score && test.totalQuestions ? Math.round((test.score / test.totalQuestions) * 100) : 0}%</div>
                    <div className={styles.historyItemDate}>{test.completedAt ? new Date(test.completedAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === TAB_PVP && (
        <div key={TAB_PVP} className={styles.profileSection} style={{ maxWidth: 600, margin: '0 auto', animationDelay: '0.5s' }}>
          <h2 className={styles.sectionTitle}>PvP Match History</h2>
          {mockPvpHistory.length === 0 ? (
            <div className={styles.noHistoryMessage} style={{ opacity: 0, animation: `${styles.fadeInSlideUp} 0.5s ease-out 0.2s forwards`}}>
              <FaUsers className={styles.noHistoryEmoji} />
              <div>No PvP matches yet.</div>
            </div>
          ) : (
            <div className={styles.historyListContainer}>
              {mockPvpHistory.map((match, idx) => {
                const MedalIcon = iconComponents[match.medalIcon] || FaMedal;
                let displayMedal;
                if (match.medalIcon && iconComponents[match.medalIcon]) {
                  const SpecificMedalIcon = iconComponents[match.medalIcon];
                  displayMedal = <SpecificMedalIcon />;
                } else {
                  displayMedal = match.medal; 
                }

                return (
                  <div key={match.id} className={styles.historyItem} style={{ borderLeft: `5px solid ${match.result === 'win' ? 'var(--blueprint-success)' : 'var(--blueprint-danger)'}`, animationDelay: `${0.2 + idx * 0.1}s`}}>
                    <div className={styles.historyItemIcon} style={{color: match.result === 'win' ? 'var(--blueprint-success)' : 'var(--blueprint-danger)'}}>{displayMedal}</div>
                    <div className={styles.historyItemDetails}>
                      <div className={styles.historyItemTitle} style={{ color: match.result === 'win' ? 'var(--blueprint-success)' : 'var(--blueprint-danger)' }}>
                        {match.result === 'win' ? 'Victory' : 'Defeat'}
                      </div>
                      <div className={styles.historyItemSubtitle}>
                        vs <span style={{ color: 'var(--blueprint-text-muted)', fontWeight: 600 }}>{match.opponent}</span>
                      </div>
                    </div>
                    <div className={styles.historyItemMeta}>
                      <div className={styles.historyItemScorePercent}>{match.myScore} - {match.opponentScore}</div>
                      <div className={styles.historyItemDate}>{new Date(match.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === TAB_ACHIEVEMENTS && (
        <div key={TAB_ACHIEVEMENTS} className={styles.profileSection} style={{ maxWidth: 800, margin: '0 auto', animationDelay: '0.5s' }}>
          <h2 className={styles.sectionTitle}>Achievements & Ranks</h2>
          
          {/* Weekly Progress Ranks */}
          <div className={styles.achievementSection}>
            <h3 className={styles.achievementSectionTitle}>
              <FaBookOpen /> Weekly Progress Ranks
            </h3>
            <div className={styles.rankGrid}>
              {RANKS.map((rank, index) => {
                const Icon = iconComponents[rank.prIcon];
                const isUnlocked = prPoints >= rank.min;
                return (
                  <div 
                    key={rank.name} 
                    className={`${styles.rankCard} ${isUnlocked ? styles.rankCardUnlocked : styles.rankCardLocked}`}
                    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  >
                    {Icon && <Icon className={styles.rankCardIcon} style={{ color: isUnlocked ? rank.color : 'var(--blueprint-text-muted)' }} />}
                    <div className={styles.rankCardName} style={{ color: isUnlocked ? rank.color : 'var(--blueprint-text-muted)' }}>
                      {rank.name}
                    </div>
                    <div className={styles.rankCardDescription}>{rank.description}</div>
                    <div className={styles.rankCardPoints}>{rank.min} pts</div>
                    {isUnlocked && <div className={styles.rankCardUnlockedBadge}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PvP Arena Ranks */}
          <div className={styles.achievementSection}>
            <h3 className={styles.achievementSectionTitle}>
              <FaUsers /> PvP Arena Ranks
            </h3>
            <div className={styles.rankGrid}>
              {PVP_RANKS.map((rank, index) => {
                const Icon = iconComponents[rank.pvpIcon];
                const isUnlocked = pvpStars >= rank.min;
                return (
                  <div 
                    key={rank.name} 
                    className={`${styles.rankCard} ${isUnlocked ? styles.rankCardUnlocked : styles.rankCardLocked}`}
                    style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  >
                    {Icon && <Icon className={styles.rankCardIcon} style={{ color: isUnlocked ? rank.color : 'var(--blueprint-text-muted)' }} />}
                    <div className={styles.rankCardName} style={{ color: isUnlocked ? rank.color : 'var(--blueprint-text-muted)' }}>
                      {rank.name}
                    </div>
                    <div className={styles.rankCardDescription}>{rank.description}</div>
                    <div className={styles.rankCardPoints}>{rank.min} stars</div>
                    {isUnlocked && <div className={styles.rankCardUnlockedBadge}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {activeTab === TAB_SETTINGS && (
        <div key={TAB_SETTINGS} className={styles.profileSection} style={{ maxWidth: 600, margin: '0 auto', animationDelay: '0.5s' }}>
          <h2 className={styles.sectionTitle}>Profile Settings</h2>
          
          <div className={styles.settingsGrid}>
            <div className={styles.settingCard} style={{ animationDelay: '0.2s' }}>
              <div className={styles.settingCardHeader}>
                <FaUserShield className={styles.settingCardIcon} />
                <div className={styles.settingCardTitle}>Account Information</div>
              </div>
              <div className={styles.settingCardContent}>
                <div className={styles.settingItem}>
                  <label>Name:</label>
                  <span>{studentData.firstName} {studentData.lastName}</span>
                </div>
                <div className={styles.settingItem}>
                  <label>Student ID:</label>
                  <span>{studentData.id}</span>
                </div>
                <div className={styles.settingItem}>
                  <label>Email:</label>
                  <span>{studentData.email || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className={styles.settingCard} style={{ animationDelay: '0.3s' }}>
              <div className={styles.settingCardHeader}>
                <FaBell className={styles.settingCardIcon} />
                <div className={styles.settingCardTitle}>Preferences</div>
              </div>
              <div className={styles.settingCardContent}>
                <div className={styles.settingItem}>
                  <label>Theme:</label>
                  <span>Blueprint Dark</span>
                </div>
                <div className={styles.settingItem}>
                  <label>Notifications:</label>
                  <span>Enabled</span>
                </div>
                <div className={styles.settingItem}>
                  <label>Language:</label>
                  <span>English</span>
                </div>
              </div>
            </div>

            <div className={styles.settingCard} style={{ animationDelay: '0.4s' }}>
              <div className={styles.settingCardHeader}>
                <FaChartBar className={styles.settingCardIcon} />
                <div className={styles.settingCardTitle}>Privacy & Data</div>
              </div>
              <div className={styles.settingCardContent}>
                <div className={styles.settingItem}>
                  <label>Profile Visibility:</label>
                  <span>Public</span>
                </div>
                <div className={styles.settingItem}>
                  <label>Data Export:</label>
                  <button className={styles.settingButton}>Download Data</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;