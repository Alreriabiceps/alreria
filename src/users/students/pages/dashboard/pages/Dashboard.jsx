import React from "react"; // Add useState, useEffect when fetching data
import { Link } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Dashboard.module.css";

// --- Sample Data (Replace with actual state/props) ---
const userData = {
  username: "eren",
  mmr: 1000,
  rankName: "Gold", // Updated for example data consistency
  currentStreak: 0,
  testsCompleted: 0,
};

const mmrProgressData = {
  currentMmr: userData.mmr,
  currentRankName: userData.rankName,
  nextRankMmr: 1300, // Threshold for next rank (Gold -> Platinum example)
  nextRankName: "Platinum",
  get progressPercent() {
    const rankThresholds = {
      Bronze: 0,
      Silver: 1000,
      Gold: 1300,
      Platinum: 1600,
      Diamond: 2400,
      Master: 3000,
      Grandmaster: 3600,
    };
    const currentRankLowerBound = rankThresholds[this.currentRankName] ?? 0;
    const nextRankLowerBound = this.nextRankMmr;

    if (this.currentRankName === "Grandmaster") return 100;
    if (!this.nextRankName || this.currentMmr >= nextRankLowerBound) return 100;
    if (nextRankLowerBound <= currentRankLowerBound) return 0;

    const totalNeededForNext = nextRankLowerBound - currentRankLowerBound;
    const currentProgressInRank = this.currentMmr - currentRankLowerBound;
    const calculatedPercent = Math.round(
      (currentProgressInRank / totalNeededForNext) * 100
    );
    return Math.min(100, Math.max(0, calculatedPercent));
  },
  get pointsNeeded() {
    if (this.currentRankName === "Grandmaster") return 0;
    return Math.max(0, this.nextRankMmr - this.currentMmr);
  },
};

const weeklyChallengeData = {
  hasActiveTests: false,
  activeTests: [],
};

const dailyStreakData = {
  currentStreakDays: userData.currentStreak, // Use currentStreak from userData
  completedToday: false, // Should come from backend/state
  get nextRewardDays() {
    // Calculate next tier based on current streak
    const tiers = [1, 3, 5, 7, 14, 30];
    return tiers.find((t) => t > this.currentStreakDays) || 30;
  },
  get progressPercent() {
    const tiers = [1, 3, 5, 7, 14, 30];
    let goal = tiers.find((t) => t > this.currentStreakDays) || 30;
    // Calculate progress towards the *next immediate* tier OR max tier
    let prevTier =
      tiers
        .slice()
        .reverse()
        .find((t) => t <= this.currentStreakDays) || 0;
    let progressInTier = this.currentStreakDays - prevTier;
    let neededForTier = goal - prevTier;

    if (this.currentStreakDays >= 30) return 100;
    return neededForTier > 0
      ? Math.min(100, Math.round((progressInTier / neededForTier) * 100))
      : 0;
  },
  rewards: [
    { days: 1, rewardText: "5 MMR Points" },
    { days: 3, rewardText: "15 MMR Points" },
    { days: 5, rewardText: "30 MMR Points" },
    { days: 7, rewardText: "50 MMR Points" },
    { days: 14, rewardText: "100 MMR Points" },
    { days: 30, rewardText: "200 MMR Points + Badge" },
  ],
};

const leaderboardData = {
  subject: [
    {
      id: "user012",
      username: "eren yeager",
      handle: "@eren09",
      mmr: 1000,
      rankName: "Gold",
      avatarInitial: "ey",
    } /* ... */,
  ],
  global: [
    {
      id: "user001",
      username: "ApeeexAlpha",
      handle: "@alpha",
      mmr: 3750,
      rankName: "Grandmaster",
      avatarInitial: "AA",
    },
    {
      id: "user050",
      username: "MasterMind",
      handle: "@mm",
      mmr: 3100,
      rankName: "Master",
      avatarInitial: "MM",
    },
    {
      id: "user012",
      username: "eren yeager",
      handle: "@eren09",
      mmr: 1000,
      rankName: "Gold",
      avatarInitial: "ey",
    } /* ... */,
  ],
};

const rankingTiers = [
  { name: "Bronze", mmr: "0+", colorClass: styles.rankBronze },
  { name: "Silver", mmr: "1000+", colorClass: styles.rankSilver },
  { name: "Gold", mmr: "1300+", colorClass: styles.rankGold },
  { name: "Platinum", mmr: "1600+", colorClass: styles.rankPlatinum },
  { name: "Diamond", mmr: "2400+", colorClass: styles.rankDiamond },
  { name: "Master", mmr: "3000+", colorClass: styles.rankMaster },
  { name: "Grandmaster", mmr: "3600+", colorClass: styles.rankGrandmaster }, // Added
];

// Helper function for rank color class
const getRankClass = (rankName) => {
  switch (rankName?.toLowerCase()) {
    case "bronze":
      return styles.rankBronze;
    case "silver":
      return styles.rankSilver;
    case "gold":
      return styles.rankGold;
    case "platinum":
      return styles.rankPlatinum;
    case "diamond":
      return styles.rankDiamond;
    case "master":
      return styles.rankMaster;
    case "grandmaster":
      return styles.rankGrandmaster;
    default:
      return styles.rankBronze; // Default to bronze color or text-muted
  }
};
// ----------------------------------------------------

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className={styles.dashboardContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Welcome,{" "}
          <span className={styles.pageTitleUsername}>{user?.firstName || 'Student'}!</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Track your progress, take tests, and compete with friends
        </p>
      </div>
      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📝</span>
          <span className={styles.statValue}>{userData.testsCompleted}</span>
          <span className={styles.statLabel}>Weekly Tests Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔥</span>
          <span className={styles.statValue}>{userData.currentStreak}</span>
          <span className={styles.statLabel}>Current Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <span className={styles.statValue}>{userData.mmr}</span>
          <span className={styles.statLabel}>MMR Score</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏆</span>
          <span
            className={`${styles.statValue} ${getRankClass(userData.rankName)}`}
          >
            {userData.rankName}
          </span>
          <span className={styles.statLabel}>Rank</span>
        </div>
      </div>
      {/* Dashboard Layout Grid */}
      <div className={styles.dashboardLayoutGrid}>
        {/* Main Content Area */}
        <div className={styles.mainContentArea}>
          {/* MMR Progress Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>
              <span className={styles.panelIcon}>📊</span> MMR Progress
            </h2>
            <div className={styles.mmrProgress}>
              <div className={styles.mmrInfo}>
                <span
                  className={`${styles.currentRankMmr} ${getRankClass(
                    mmrProgressData.currentRankName
                  )}`}
                >
                  {mmrProgressData.currentMmr}{" "}
                  <span className={styles.rankName}>
                    {mmrProgressData.currentRankName}
                  </span>
                </span>
                <span className={styles.nextRank}>
                  {mmrProgressData.nextRankName
                    ? `Next: ${mmrProgressData.nextRankName}`
                    : "Max Rank"}
                </span>
              </div>
              <div className={styles.progressBarContainer}>
                <div
                  className={`${styles.progressBarFill} ${styles.progressBarFillMmr}`}
                  style={{ width: `${mmrProgressData.progressPercent}%` }}
                  aria-valuenow={mmrProgressData.progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className={styles.progressText}>
                <span>
                  {mmrProgressData.pointsNeeded > 0
                    ? `${mmrProgressData.pointsNeeded} points needed`
                    : "Max Rank"}
                </span>
                <span>{mmrProgressData.progressPercent}%</span>
              </div>
            </div>
            <div className={styles.tierInfoGrid}>
              {rankingTiers.map((tier) => (
                <div key={tier.name} className={styles.tierBox}>
                  <span className={styles.tierName}>{tier.name}</span>
                  <span className={`${styles.tierMmr} ${tier.colorClass}`}>
                    {tier.mmr}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Challenges Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>
              <span className={styles.panelIcon}>📅</span> Weekly Challenges
            </h2>
            <div className={styles.weeklyChallengesContent}>
              {!weeklyChallengeData.hasActiveTests ? (
                <div className={styles.noTestsMessage}>
                  No active tests for your program
                </div>
              ) : (
                <p>List of active tests would go here.</p>
              )}
              <Link to="/weekly-tests" className={styles.browseButton}>
                {" "}
                Browse All Tests{" "}
              </Link>
            </div>
          </div>
        </div>
        {/* End Main Content Area */}
        {/* Sidebar Area */}
        <div className={styles.sidebarArea}>
          {/* Daily Streak Panel */}
          <div className={`${styles.panel} ${styles.dailyStreakPanel}`}>
            <h2 className={styles.panelHeader}>
              <span className={styles.panelIcon}>🔥</span> Daily Streak
            </h2>
            <div className={styles.dailyStreakContent}>
              <div className={styles.streakHeader}>
                <span className={styles.streakDays}>
                  {dailyStreakData.currentStreakDays} days
                </span>
                <span
                  className={`${styles.streakStatus} ${dailyStreakData.completedToday
                      ? styles.statusComplete
                      : styles.statusIncomplete
                    }`}
                >
                  {dailyStreakData.completedToday
                    ? "Completed!"
                    : "Not Completed"}
                </span>
              </div>
              <div className={styles.streakProgressBarContainer}>
                <div
                  className={styles.streakProgressBarFill}
                  style={{ width: `${dailyStreakData.progressPercent}%` }}
                  aria-valuenow={dailyStreakData.progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <p className={styles.streakNextReward}>
                {dailyStreakData.currentStreakDays < 30
                  ? `${dailyStreakData.nextRewardDays -
                  dailyStreakData.currentStreakDays
                  } more days until next reward!`
                  : "Maximum streak reached!"}
              </p>
              <ul className={styles.streakRewardList}>
                {dailyStreakData.rewards.map((reward) => (
                  <li key={reward.days} className={styles.streakRewardItem}>
                    <span className={styles.rewardDays}>
                      <span className={styles.rewardDaysIcon}>🎁</span>
                      {reward.days} day{reward.days > 1 ? "s" : ""}
                    </span>
                    <span className={styles.rewardText}>
                      {reward.rewardText}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>{" "}
        {/* End Sidebar Area */}
      </div>{" "}
      {/* End Dashboard Layout Grid */}
      {/* Leaderboards Section */}
      <div className={styles.leaderboardSection}>
        {/* Subject Leaderboard Panel */}
        <div className={`${styles.panel} ${styles.leaderboardPanel}`}>
          <div className={styles.leaderboardHeader}>
            <h3 className={styles.leaderboardTitle}>Subject Leaderboard</h3>
            <Link to="/ranking" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Student</th>
                <th className={styles.mmrHeader}>MMR</th>
                <th className={styles.rankTierHeader}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {/* Render placeholder or empty message if no data */}
              {leaderboardData.subject.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No Subject Data
                  </td>
                </tr>
              )}
              {leaderboardData.subject.slice(0, 3).map((user, index) => (
                <tr key={user.id}>
                  <td className={styles.leaderboardRankNumber}>
                    <span className={styles.leaderboardRankIcon}>🏆</span>
                    {index + 1}
                  </td>
                  <td>
                    <div className={styles.leaderboardStudentCell}>
                      <div className={styles.leaderboardAvatar}>
                        {user.avatarInitial}
                      </div>
                      <div className={styles.leaderboardStudentInfo}>
                        <span className={styles.leaderboardUsername}>
                          {user.username}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.leaderboardMmrValue}>{user.mmr}</td>
                  <td
                    className={`${styles.leaderboardRankTierValue
                      } ${getRankClass(user.rankName)}`}
                  >
                    {user.rankName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Leaderboard Panel */}
        <div className={`${styles.panel} ${styles.leaderboardPanel}`}>
          <div className={styles.leaderboardHeader}>
            <h3 className={styles.leaderboardTitle}>Global Leaderboard</h3>
            <Link to="/ranking?type=global" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Pilot</th>
                <th className={styles.mmrHeader}>MMR</th>
                <th className={styles.rankTierHeader}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.global.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No Global Data
                  </td>
                </tr>
              )}
              {leaderboardData.global.slice(0, 3).map((user, index) => (
                <tr key={user.id}>
                  <td className={styles.leaderboardRankNumber}>
                    <span className={styles.leaderboardRankIcon}>🏆</span>
                    {index + 1}
                  </td>
                  <td>
                    <div className={styles.leaderboardStudentCell}>
                      <div className={styles.leaderboardAvatar}>
                        {user.avatarInitial}
                      </div>
                      <div className={styles.leaderboardStudentInfo}>
                        <span className={styles.leaderboardUsername}>
                          {user.username}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.leaderboardMmrValue}>{user.mmr}</td>
                  <td
                    className={`${styles.leaderboardRankTierValue
                      } ${getRankClass(user.rankName)}`}
                  >
                    {user.rankName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div> // End Container
  );
};

export default Dashboard;
