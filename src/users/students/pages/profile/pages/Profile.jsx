import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Profile.module.css";
import Modal from 'react-modal';

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
  const [showWeeklyRanksModal, setShowWeeklyRanksModal] = useState(false);
  const [showPvpRanksModal, setShowPvpRanksModal] = useState(false);

  // New Rank System
  const RANKS = [
    { min: 0, max: 99, name: 'Grass', emoji: '🌱', description: 'Still growing', color: '#7ec850' },
    { min: 100, max: 199, name: 'Wood', emoji: '🪵', description: 'Getting sturdy', color: '#a67c52' },
    { min: 200, max: 299, name: 'Rock', emoji: '🪨', description: 'Solid start', color: '#b0b0b0' },
    { min: 300, max: 399, name: 'Iron', emoji: '⚒️', description: 'Forged with effort', color: '#8a8a8a' },
    { min: 400, max: 499, name: 'Silver', emoji: '🥈', description: 'Shiny and polished', color: '#c0c0c0' },
    { min: 500, max: 599, name: 'Gold', emoji: '🥇', description: 'Shining like a star', color: '#ffd700' },
    { min: 600, max: 700, name: 'Diamond', emoji: '💎', description: "You're a gem", color: '#b9f2ff' },
  ];

  // PvP Rank System
  const PVP_RANKS = [
    { min: 0, max: 79, name: 'Grasshopper', emoji: '🌱', description: 'Newbie — Just starting out.', color: '#7ec850' },
    { min: 80, max: 159, name: 'Knight', emoji: '⚔️', description: 'Rising Warrior — Showing promise.', color: '#a67c52' },
    { min: 160, max: 239, name: 'Gladiator', emoji: '🛡️', description: 'Skilled Fighter — Battle-ready.', color: '#b0b0b0' },
    { min: 240, max: 319, name: 'Elite', emoji: '💎', description: 'Champion in the Making.', color: '#b9f2ff' },
    { min: 320, max: 399, name: 'Legend', emoji: '🏆', description: 'Feared by many.', color: '#ffd700' },
    { min: 400, max: 479, name: 'Titan', emoji: '🏋️', description: 'Legendary Force — Near unstoppable.', color: '#c0c0c0' },
    { min: 480, max: 500, name: 'Supreme', emoji: '👑', description: 'Absolute Peak — Top of the ranks.', color: '#ffb347' },
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
        const response = await fetch(`${backendurl}/api/weekly-test/results/${user.id}`, {
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

  return (
    <div className={styles.profileContainer}>
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 8 }}>
        <button
          onClick={() => setActiveTab(TAB_OVERVIEW)}
          style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderBottom: activeTab === TAB_OVERVIEW ? '3px solid #00ff9d' : '3px solid transparent',
            background: 'none',
            color: activeTab === TAB_OVERVIEW ? '#00ff9d' : '#80ffce',
            cursor: 'pointer',
            transition: 'color 0.2s, border-bottom 0.2s',
            outline: 'none',
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab(TAB_ANALYTICS)}
          style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderBottom: activeTab === TAB_ANALYTICS ? '3px solid #00ff9d' : '3px solid transparent',
            background: 'none',
            color: activeTab === TAB_ANALYTICS ? '#00ff9d' : '#80ffce',
            cursor: 'pointer',
            transition: 'color 0.2s, border-bottom 0.2s',
            outline: 'none',
          }}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab(TAB_WEEKLY)}
          style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderBottom: activeTab === TAB_WEEKLY ? '3px solid #00ff9d' : '3px solid transparent',
            background: 'none',
            color: activeTab === TAB_WEEKLY ? '#00ff9d' : '#80ffce',
            cursor: 'pointer',
            transition: 'color 0.2s, border-bottom 0.2s',
            outline: 'none',
          }}
        >
          Weekly Tests
        </button>
        <button
          onClick={() => setActiveTab(TAB_PVP)}
          style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderBottom: activeTab === TAB_PVP ? '3px solid #00ff9d' : '3px solid transparent',
            background: 'none',
            color: activeTab === TAB_PVP ? '#00ff9d' : '#80ffce',
            cursor: 'pointer',
            transition: 'color 0.2s, border-bottom 0.2s',
            outline: 'none',
          }}
        >
          PvP History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === TAB_OVERVIEW && (
        <>
          {/* Modern Horizontal Profile Card Layout */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            background: 'linear-gradient(135deg, #181a2e 60%, #00ff9d22 100%)',
            borderRadius: 18,
            boxShadow: '0 8px 32px 0 rgba(0,255,157,0.10), 0 1.5px 8px 0 #00ff9d22',
            padding: '2.5rem 2.5rem 2.5rem 2rem',
            margin: '0 auto 2.5rem auto',
            maxWidth: 700,
            minHeight: 180,
            position: 'relative',
            gap: 36,
            flexWrap: 'wrap',
          }}>
            {/* Avatar + Medal Layered */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
              <div style={{ position: 'relative' }}>
                <div className={styles.profileAvatar} style={{ width: 90, height: 90, fontSize: 38, marginBottom: 0, background: '#23234a', border: '4px solid #222', borderRadius: '50%' }}>
                  <div className={styles.avatarPlaceholder} style={{ width: 90, height: 90, fontSize: 38 }}>
            {studentData.firstName?.[0]}{studentData.lastName?.[0]}
          </div>
        </div>
                {/* Medal/Rank Badge - layered on avatar */}
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
                  border: '3px solid #19122e',
                  zIndex: 2,
                }}>
                  <span style={{ fontSize: 28, filter: 'drop-shadow(0 0 4px #fff8)' }}>{currentRank.emoji}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, color: '#80ffce', marginTop: 12, textAlign: 'center', fontWeight: 700 }}>{currentRank.name}</div>
            </div>
            {/* PR Points, PvP Rank, and Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: currentRank.color, textShadow: '0 0 8px #00ff9d44', letterSpacing: 1, lineHeight: 1 }}>
                  {prPoints} <span style={{ fontSize: 20, color: '#80ffce', fontWeight: 500 }}>PR Points</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, background: pvpRank.color, borderRadius: '50%', padding: 6, boxShadow: `0 0 8px 2px ${pvpRank.color}55`, border: '2px solid #19122e', marginRight: 6 }}>{pvpRank.emoji}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: pvpRank.color }}>{pvpRank.name}</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: pvpRank.color, marginLeft: 8 }}>{pvpStars} <span style={{ fontSize: 14, color: '#80ffce', fontWeight: 500 }}>Stars</span></span>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 2, marginBottom: 2 }}>
            {studentData.firstName} {studentData.lastName}
              </div>
              <div style={{ fontSize: 15, color: '#80ffce', marginBottom: 2 }}>{currentRank.description}</div>
        </div>
      </div>

          {/* Progress Bars Side by Side */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 700, margin: '0 auto 24px auto', width: '100%' }}>
            {/* Weekly Test Progress Bar */}
            <div className={styles.rankProgress} style={{ flex: 1, minWidth: 260, maxWidth: 340, background: '#23234a', borderRadius: 14, padding: '1.2rem 1.2rem', boxShadow: '0 1px 8px #00ff9d22', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, color: currentRank.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{currentRank.emoji} {currentRank.name}</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: currentRank.color, whiteSpace: 'nowrap' }}>{prPoints}</span>
                <button onClick={() => setShowWeeklyRanksModal(true)} style={{ background: '#00ff9d', color: '#19122e', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginLeft: 'auto', marginTop: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>View Ranks</button>
              </div>
              <div style={{ background: '#222', borderRadius: 8, height: 18, margin: '14px 0 0 0', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${currentRank.color} 60%, #00ff9d 100%)`,
                    borderRadius: 8,
                    height: 18,
                    transition: 'width 0.5s',
                    boxShadow: '0 0 8px #00ff9d44',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, color: '#80ffce', marginTop: 6 }}>
                <span>{currentRank.min} pts</span>
                {nextRank && <span>{nextRank.min} pts</span>}
              </div>
              {nextRank && (
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>
                  {pointsToNext} points to next rank
                </div>
              )}
            </div>
            {/* PvP Progress Bar */}
            <div className={styles.rankProgress} style={{ flex: 1, minWidth: 260, maxWidth: 340, background: '#23234a', borderRadius: 14, padding: '1.2rem 1.2rem', boxShadow: '0 1px 8px #00ff9d22', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, color: pvpRank.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{pvpRank.emoji} {pvpRank.name}</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: pvpRank.color, whiteSpace: 'nowrap' }}>{pvpStars}</span>
                <button onClick={() => setShowPvpRanksModal(true)} style={{ background: '#00ff9d', color: '#19122e', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginLeft: 'auto', marginTop: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>View Ranks</button>
              </div>
              <div style={{ background: '#222', borderRadius: 8, height: 18, margin: '14px 0 0 0', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${pvpProgressPercent}%`,
                    background: `linear-gradient(90deg, ${pvpRank.color} 60%, #00ff9d 100%)`,
                    borderRadius: 8,
                    height: 18,
                    transition: 'width 0.5s',
                    boxShadow: '0 0 8px #00ff9d44',
                  }}
                />
        </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13, color: '#80ffce', marginTop: 6 }}>
                <span>{pvpRank.min} stars</span>
                {nextPvpRank && <span>{nextPvpRank.min} stars</span>}
        </div>
              {nextPvpRank && (
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>
                  {pvpStarsToNext} stars to next rank
        </div>
              )}
        </div>
      </div>

          {/* Weekly Ranks Modal */}
          <Modal
            isOpen={showWeeklyRanksModal}
            onRequestClose={() => setShowWeeklyRanksModal(false)}
            style={{
              overlay: { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 },
              content: {
                maxWidth: 420,
                margin: 'auto',
                borderRadius: 16,
                background: '#181a2e',
                color: '#fff',
                padding: '2rem 2.5rem',
                border: 'none',
                boxShadow: '0 8px 32px 0 rgba(0,255,157,0.15), 0 1.5px 8px 0 #00ff9d44',
              }
            }}
            ariaHideApp={false}
          >
            <h2 style={{ color: '#00ff9d', fontWeight: 800, fontSize: 26, textAlign: 'center', marginBottom: 18 }}>Weekly Test Ranks</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {RANKS.map(rank => (
                <div key={rank.name} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#23234a', borderRadius: 10, padding: '12px 18px', boxShadow: '0 1px 6px #00ff9d22' }}>
                  <span style={{ fontSize: 28 }}>{rank.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: rank.color, fontSize: 17 }}>{rank.name}</div>
                    <div style={{ color: '#80ffce', fontSize: 14 }}>{rank.description}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{rank.min} pts</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowWeeklyRanksModal(false)} style={{ margin: '24px auto 0 auto', display: 'block', background: '#00ff9d', color: '#19122e', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Close</button>
          </Modal>

          {/* PvP Ranks Modal */}
          <Modal
            isOpen={showPvpRanksModal}
            onRequestClose={() => setShowPvpRanksModal(false)}
            style={{
              overlay: { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 },
              content: {
                maxWidth: 420,
                margin: 'auto',
                borderRadius: 16,
                background: '#181a2e',
                color: '#fff',
                padding: '2rem 2.5rem',
                border: 'none',
                boxShadow: '0 8px 32px 0 rgba(0,255,157,0.15), 0 1.5px 8px 0 #00ff9d44',
              }
            }}
            ariaHideApp={false}
          >
            <h2 style={{ color: '#00ff9d', fontWeight: 800, fontSize: 26, textAlign: 'center', marginBottom: 18 }}>PvP Ranks</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PVP_RANKS.map(rank => (
                <div key={rank.name} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#23234a', borderRadius: 10, padding: '12px 18px', boxShadow: '0 1px 6px #00ff9d22' }}>
                  <span style={{ fontSize: 28 }}>{rank.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: rank.color, fontSize: 17 }}>{rank.name}</div>
                    <div style={{ color: '#80ffce', fontSize: 14 }}>{rank.description}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{rank.min} stars</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPvpRanksModal(false)} style={{ margin: '24px auto 0 auto', display: 'block', background: '#00ff9d', color: '#19122e', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Close</button>
          </Modal>
        </>
      )}

      {activeTab === TAB_ANALYTICS && (
        <div style={{ maxWidth: 600, margin: '0 auto', marginTop: 24 }}>
          <div style={{ fontSize: 24, color: '#00ff9d', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>Test Analytics</div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            justifyContent: 'center',
            marginBottom: 36,
          }}>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>📝</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Tests</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.totalTests}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>🎯</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Best</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.bestScore ?? '-'}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>📉</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Lowest</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.lowestScore ?? '-'}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>💯</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Accuracy</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.bestAccuracy ? `${testStats.bestAccuracy}%` : '-'}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>🔥</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Streak</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.currentStreak}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>⚡</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Recent PR</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.recentPRChange > 0 ? '+' : ''}{testStats.recentPRChange}</div>
            </div>
            <div style={{ minWidth: 110, background: '#23234a', borderRadius: 32, padding: '12px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 6px #00ff9d22' }}>
              <div style={{ fontSize: 22, color: '#00ff9d' }}>⏰</div>
              <div style={{ fontSize: 13, color: '#80ffce', marginBottom: 2 }}>Last Test</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 19 }}>{testStats.lastTestDate ? new Date(testStats.lastTestDate).toLocaleDateString() : '-'}</div>
            </div>
          </div>
        </div>
      )}
      {activeTab === TAB_WEEKLY && (
        <div style={{ maxWidth: 520, margin: '0 auto', marginTop: 24 }}>
          <div style={{ fontSize: 24, color: '#00ff9d', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>Weekly Test History</div>
          {testResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#80ffce', fontSize: 18, marginTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div>No weekly tests taken yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {testResults.map((test, idx) => (
                <div key={test.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(90deg, #23234a 70%, #00ff9d22 100%)',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #00ff9d22',
                  padding: '14px 18px',
                  gap: 18,
                  borderLeft: `5px solid #00ff9d`,
                }}>
                  <div style={{ fontSize: 28, marginRight: 10 }}>📖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#00ff9d', fontSize: 17 }}>
                      {test.subject || 'Subject'} - Week {test.weekNumber}
                    </div>
                    <div style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>
                      {test.score}/{test.totalQuestions} correct
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontSize: 15, color: '#80ffce', fontWeight: 600 }}>{test.score && test.totalQuestions ? Math.round((test.score / test.totalQuestions) * 100) : 0}%</div>
                    <div style={{ fontSize: 13, color: '#b9f2ff', marginTop: 2 }}>{test.completedAt ? new Date(test.completedAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === TAB_PVP && (
        <div style={{ maxWidth: 520, margin: '0 auto', marginTop: 24 }}>
          <div style={{ fontSize: 24, color: '#00ff9d', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>PvP Match History</div>
          {mockPvpHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#80ffce', fontSize: 18, marginTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
              <div>No PvP matches yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mockPvpHistory.map(match => (
                <div key={match.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(90deg, #23234a 70%, #00ff9d22 100%)',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #00ff9d22',
                  padding: '14px 18px',
                  gap: 18,
                  borderLeft: `5px solid ${match.result === 'win' ? '#00ff9d' : '#ff4d4f'}`,
                }}>
                  <div style={{ fontSize: 28, marginRight: 10 }}>{match.medal}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: match.result === 'win' ? '#00ff9d' : '#ff4d4f', fontSize: 17 }}>
                      {match.result === 'win' ? 'Victory' : 'Defeat'}
                    </div>
                    <div style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>
                      vs <span style={{ color: '#80ffce', fontWeight: 600 }}>{match.opponent}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontSize: 15, color: '#80ffce', fontWeight: 600 }}>{match.myScore} - {match.opponentScore}</div>
                    <div style={{ fontSize: 13, color: '#b9f2ff', marginTop: 2 }}>{new Date(match.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
      </div>
          )}
      </div>
      )}
    </div>
  );
};

export default Profile;