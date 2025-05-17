import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Profile.module.css";
import Modal from 'react-modal';
import { 
  FaLeaf, FaTree, FaMountain, FaShieldAlt, FaMedal, FaTrophy, FaGem, 
  FaBug, FaUserShield, FaCrown, FaStar, FaFistRaised, FaAward,
  FaBookOpen, FaCalendarCheck, FaUsers, FaChartBar, FaCrosshairs, FaFire, FaBolt, FaClock,
  FaChevronDown,
  FaBed, FaPaperclip, FaSearch, FaBookReader, FaMicrophoneAlt
} from 'react-icons/fa';

const iconComponents = {
  FaLeaf, FaTree, FaMountain, FaShieldAlt, FaMedal, FaTrophy, FaGem,
  FaBug, FaUserShield, FaCrown, FaStar, FaFistRaised, FaAward,
  FaBookOpen, FaCalendarCheck, FaUsers, FaChartBar, FaCrosshairs, FaFire, FaBolt, FaClock,
  FaChevronDown,
  FaBed, FaPaperclip, FaSearch, FaBookReader, FaMicrophoneAlt
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
      </div>

      {/* Tab Content */}
      {activeTab === TAB_OVERVIEW && (
        <div
            key={TAB_OVERVIEW} 
            className={`${styles.profileSection} ${styles.overviewLayoutContainer}`}
            style={{ animationDelay: '0.1s' }} 
        >
            {/* Weekly Ranks - Left Side */}
            <div 
              className={styles.rankSidePanel}
              style={{ animationDelay: '0.3s' }} 
            >
              <div className={styles.rankPanelToggleHeader} onClick={() => setShowWeeklyRanks(!showWeeklyRanks)}>
                <span className={styles.rankPanelTitleText}>
                  <IconComponent iconName={currentRank.prIcon || 'FaLeaf'} /> Weekly Progress Ranks
                </span>
                <FaChevronDown className={`${styles.rankPanelToggleIcon} ${showWeeklyRanks ? styles.rankPanelToggleIconOpen : ''}`} />
              </div>

              {showWeeklyRanks && (
                <div className={styles.rankListScrollable}>
                  {RANKS.map((rank, index) => {
                    const Icon = iconComponents[rank.prIcon];
                    return (
                      <div 
                        key={rank.name} 
                        className={styles.modalListItem}
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }} // Staggered animation
                      >
                        {Icon && <Icon className={styles.modalListItemEmoji} style={{color: rank.color }} />}                    
                        <div className={styles.modalListItemInfo}>
                          <div className={styles.modalListItemName} style={{ color: rank.color }}>{rank.name}</div>
                          <div className={styles.modalListItemDescription}>{rank.description}</div>
                        </div>
                        <div className={styles.modalListItemPoints}>{rank.min} pts</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center Content: Main Profile Card + Progress Bars */}
            <div 
              className={styles.overviewCenterContent}
              style={{ animationDelay: '0.4s' }} // Stagger after left panel
            >
              {/* Modern Horizontal Profile Card Layout */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                background: `linear-gradient(135deg, var(--blueprint-panel-bg-opaque) 60%, ${getComputedStyle(document.documentElement).getPropertyValue('--blueprint-accent').trim()}22 100%)`,
                borderRadius: 18,
                padding: '2.5rem 2.5rem 2.5rem 2rem',
                margin: '0 auto 2.5rem auto',
                maxWidth: 700,
                minHeight: 180,
                position: 'relative',
                gap: 36,
                flexWrap: 'wrap',
                opacity: 0,
                animation: `${styles.panelFlyIn} 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                animationDelay: '0.1s',
                border: '1px solid var(--blueprint-panel-border)',
                boxShadow: 'var(--blueprint-panel-shadow)'
              }}>
                {/* Avatar + Medal Layered */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, opacity: 0, animation: `${styles.fadeInSlideUp} 0.5s ease-out 0.3s forwards` }}>
                  <div style={{ position: 'relative' }}>
                    <div className={styles.avatarPlaceholder} style={{
                      width: 90, height: 90, fontSize: 38, marginBottom: 0, 
                      backgroundColor: 'var(--blueprint-input-bg)',
                      border: '4px solid var(--blueprint-bg)',
                      borderRadius: '50%' }}>
                      {studentData.firstName?.[0]}{studentData.lastName?.[0]}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: -14,
                      right: -14,
                      background: currentRank.color,
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 8px 2px ${currentRank.color}55`,
                      border: '3px solid var(--blueprint-panel-bg-opaque)',
                      zIndex: 2,
                    }}>
                      {CurrentRankIcon && <CurrentRankIcon style={{ fontSize: 28, filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }} />}
                    </div>
                  </div>
                </div>
                {/* INFO BLOCK - Redesigned */}
                <div className={styles.profileInfoContainer} style={{ flex: 1, opacity: 0, animation: `${styles.fadeInSlideUp} 0.5s ease-out 0.5s forwards` }}>
                  
                  <div className={styles.profileNameLarge}>
                    {studentData.firstName} {studentData.lastName}
                  </div>

                  <div className={styles.profileStatsRow}>
                    {/* PR Stats Block */}
                    <div className={styles.statBlock}>
                      <div className={styles.statPointsHighlight} style={{ color: currentRank.color }}>{prPoints}</div>
                      <div className={styles.statLabelWithIcon}>
                        {CurrentRankIcon && <CurrentRankIcon style={{ color: currentRank.color }} className={styles.statRankIcon} />}
                        <span className={styles.statRankName}>{currentRank.name}</span>
                      </div>
                      <div className={styles.statSubLabel}>PR Points</div>
                    </div>

                    {/* PvP Stats Block */}
                    <div className={styles.statBlock}>
                      <div className={styles.statPointsHighlight} style={{ color: pvpRank.color }}>{pvpStars}</div>
                      <div className={styles.statLabelWithIcon}>
                        {PvpRankIcon && <PvpRankIcon style={{ color: pvpRank.color }} className={styles.statRankIcon} />}
                        <span className={styles.statRankName}>{pvpRank.name}</span>
                      </div>
                      <div className={styles.statSubLabel}>Stars</div>
                    </div>
                  </div>

                  <div className={styles.profileDescription}>
                    {currentRank.description} {/* This is PR rank description */}
                  </div>

                </div>
                {/* END INFO BLOCK */}
              </div>

              {/* Progress Bars Side by Side */}
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 700, margin: '0 auto 24px auto', width: '100%' }}>
                {/* Weekly Test Progress Bar - Using CSS Modules */}
                <div className={styles.progressCard} style={{ animationDelay: '0.3s'}}>
                  <div className={styles.progressCardHeader}>
                    {CurrentRankIcon && <CurrentRankIcon style={{ color: currentRank.color, marginRight: 8, fontSize: '1.2em' }} />}
                    <span className={styles.progressCardRankName} style={{ color: currentRank.color }}>{currentRank.name}</span>
                    <span className={styles.progressCardPoints} style={{ color: currentRank.color }}>{prPoints}</span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${currentRank.color} 60%, var(--blueprint-accent) 100%)`,
                      }}
                    />
                  </div>
                  <div className={styles.progressTextContainer}>
                    <span>{currentRank.min} pts</span>
                    {nextRank && <span>{nextRank.min} pts</span>}
                  </div>
                  {nextRank && (
                    <div className={styles.progressNextRankText}>
                      {pointsToNext} points to next rank
                    </div>
                  )}
                </div>

                {/* PvP Progress Bar - Using CSS Modules */}
                <div className={styles.progressCard} style={{ animationDelay: '0.5s'}}>
                  <div className={styles.progressCardHeader}>
                    {PvpRankIcon && <PvpRankIcon style={{ color: pvpRank.color, marginRight: 8, fontSize: '1.2em' }} />}
                    <span className={styles.progressCardRankName} style={{ color: pvpRank.color }}>{pvpRank.name}</span>
                    <span className={styles.progressCardPoints} style={{ color: pvpRank.color }}>{pvpStars}</span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${pvpProgressPercent}%`,
                        background: `linear-gradient(90deg, ${pvpRank.color} 60%, var(--blueprint-accent) 100%)`,
                      }}
                    />
                  </div>
                  <div className={styles.progressTextContainer}>
                    <span>{pvpRank.min} stars</span>
                    {nextPvpRank && <span>{nextPvpRank.min} stars</span>}
                  </div>
                  {nextPvpRank && (
                    <div className={styles.progressNextRankText}>
                      {pvpStarsToNext} stars to next rank
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: PvP Ranks */}
            <div 
              className={styles.rankSidePanel}
              style={{ animationDelay: '0.5s' }} 
            >
              <div className={styles.rankPanelToggleHeader} onClick={() => setShowPvpRanks(!showPvpRanks)}>
                <span className={styles.rankPanelTitleText}>
                  <IconComponent iconName={pvpRank.pvpIcon || 'FaStar'} /> PvP Arena Ranks
                </span>
                <FaChevronDown className={`${styles.rankPanelToggleIcon} ${showPvpRanks ? styles.rankPanelToggleIconOpen : ''}`} />
              </div>

              {showPvpRanks && (
                <div className={styles.rankListScrollable}>
                  {PVP_RANKS.map((rank, index) => {
                    const Icon = iconComponents[rank.pvpIcon];
                    return (
                      <div 
                        key={rank.name} 
                        className={styles.modalListItem}
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }} // Staggered animation
                      >
                        {Icon && <Icon className={styles.modalListItemEmoji} style={{color: rank.color }} />}                    
                        <div className={styles.modalListItemInfo}>
                          <div className={styles.modalListItemName} style={{ color: rank.color }}>{rank.name}</div>
                          <div className={styles.modalListItemDescription}>{rank.description}</div>
                        </div>
                        <div className={styles.modalListItemPoints}>{rank.min} stars</div>
                      </div>
                    );
                  })}
                </div>
              )}
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
    </div>
  );
};

export default Profile;