import React, { useState, useEffect } from "react"; // Add useState, useEffect when fetching data
import { Link } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Dashboard.module.css";
import { MdAssignment } from 'react-icons/md';
import { FaFire, FaBullseye, FaTrophy, FaChartBar, FaCalendarAlt, FaGift, FaTasks } from 'react-icons/fa';
import FloatingStars from "../../../components/FloatingStars/FloatingStars"; // Corrected Import FloatingStars

const rankingTiers = [
  { name: "Trainee Technician", mmr: "0+", colorClass: styles.rankBronze },
  { name: "Junior Technician", mmr: "1000+", colorClass: styles.rankSilver },
  { name: "Senior Technician", mmr: "1300+", colorClass: styles.rankGold },
  { name: "Lead Engineer", mmr: "1600+", colorClass: styles.rankPlatinum },
  { name: "Project Director", mmr: "2400+", colorClass: styles.rankDiamond },
  { name: "Chief Innovator", mmr: "3000+", colorClass: styles.rankMaster },
  { name: "Capsule Corp Visionary", mmr: "3600+", colorClass: styles.rankGrandmaster },
];

// Static definition for daily streak rewards
const staticDailyStreakRewards = [
  { days: 1, rewardText: "5 Upgrade Blueprints" },
  { days: 3, rewardText: "15 Upgrade Blueprints" },
  { days: 5, rewardText: "10 Data Crystals" },
  { days: 7, rewardText: "Small Particle Accelerator" },
  { days: 14, rewardText: "Advanced AI Core Schematics" },
  { days: 30, rewardText: "Miniature Fusion Reactor + Capsule Corp Certification" },
];

// Helper function for rank color class
const getRankClass = (rankName) => {
  switch (rankName?.toLowerCase()) {
    case "trainee technician":
      return styles.rankBronze;
    case "junior technician":
      return styles.rankSilver;
    case "senior technician":
      return styles.rankGold;
    case "lead engineer":
      return styles.rankPlatinum;
    case "project director":
      return styles.rankDiamond;
    case "chief innovator":
      return styles.rankMaster;
    case "capsule corp visionary":
      return styles.rankGrandmaster;
    default:
      return styles.rankBronze; 
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  // Initialize state for all dashboard data
  const [userDataState, setUserDataState] = useState({
    username: "eren", // Default/loading state
    mmr: 0,
    rankName: "Loading...",
    currentStreak: 0,
    testsCompleted: 0,
  });

  const [weeklyRankProgressDataState, setWeeklyRankProgressDataState] = useState({
    currentMmr: 0,
    currentRankName: "Loading...",
    nextRankMmr: 0,
    nextRankName: "Loading...",
    progressPercent: 0,
    pointsNeeded: 0,
  });

  const [weeklyChallengeDataState, setWeeklyChallengeDataState] = useState({
    hasActiveTests: false,
    activeTests: [],
  });

  const [dailyStreakDataState, setDailyStreakDataState] = useState({
    currentStreakDays: 0,
    completedToday: false,
    nextRewardDays: 0,
    progressPercent: 0,
    rewards: staticDailyStreakRewards, // Assuming rewards structure is static
  });

  const [leaderboardDataState, setLeaderboardDataState] = useState({
    subject: [],
    global: [],
  });


  useEffect(() => {
    // --- Fetch User Data ---
    const fetchUserData = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch("/api/dashboard/user-stats");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUserDataState({
            username: data.username || user?.firstName || "Innovator", // Fallback to auth context then generic
            mmr: data.mmr ?? 0, // Default to 0 if API returns null/undefined
            rankName: data.rankName || "Unranked", // If API returns falsy (null, undefined, empty), show "Unranked"
            currentStreak: data.currentStreak ?? 0, // Default to 0
            testsCompleted: data.projectsCompleted ?? 0, // Default to 0
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Set state to reflect error for user stats
        setUserDataState({
            username: user?.firstName || "Innovator", // Keep username if available from auth, else generic
            mmr: 0, // Reset to default or indicate error
            rankName: "Fetch Error", // Clearly indicate data couldn't be fetched for rank
            currentStreak: 0, // Reset to default or indicate error
            testsCompleted: 0, // Reset to default or indicate error
        });
      }
    };

    // --- Fetch MMR Progress Data ---
    // This might depend on userDataState, or be a separate call
    const fetchWeeklyRankProgress = async () => {
        try {
            // Replace with your actual API endpoint for weekly rank progress
            const response = await fetch(`/api/dashboard/weekly-rank-progress?userId=${user?.id}`); // Example: pass userId
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Calculate progressPercent and pointsNeeded based on fetched data
            // This logic might need to be adjusted based on your API response
            const rankThresholds = {
                "Trainee Technician": 0,
                "Junior Technician": 1000,
                "Senior Technician": 1300,
                "Lead Engineer": 1600,
                "Project Director": 2400,
                "Chief Innovator": 3000,
                "Capsule Corp Visionary": 3600,
            };
            const currentRankLowerBound = rankThresholds[data.currentRankName] ?? 0;
            const nextRankLowerBound = data.nextRankMmr;
            let progressPercent = 0;
            if (data.currentRankName === "Capsule Corp Visionary") {
                progressPercent = 100;
            } else if (!data.nextRankName || data.currentMmr >= nextRankLowerBound) {
                progressPercent = 100;
            } else if (nextRankLowerBound > currentRankLowerBound) {
                const totalNeededForNext = nextRankLowerBound - currentRankLowerBound;
                const currentProgressInRank = data.currentMmr - currentRankLowerBound;
                progressPercent = Math.round((currentProgressInRank / totalNeededForNext) * 100);
            }
            progressPercent = Math.min(100, Math.max(0, progressPercent));

            const pointsNeeded = data.currentRankName === "Capsule Corp Visionary" ? 0 : Math.max(0, data.nextRankMmr - data.currentMmr);

            setWeeklyRankProgressDataState({
                currentMmr: data.currentMmr,
                currentRankName: data.currentRankName,
                nextRankMmr: data.nextRankMmr,
                nextRankName: data.nextRankName,
                progressPercent: progressPercent,
                pointsNeeded: pointsNeeded,
            });
        } catch (error) {
            console.error("Failed to fetch weekly rank progress:", error);
        }
    };
    
    // --- Fetch Weekly Challenge Data ---
    const fetchWeeklyChallenges = async () => {
        try {
            // Replace with your actual API endpoint
            const response = await fetch(`/api/dashboard/weekly-challenges?userId=${user?.id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setWeeklyChallengeDataState({
                hasActiveTests: data.hasActiveProjects, // Assuming API returns hasActiveProjects
                activeTests: data.activeProjects, // Assuming API returns activeProjects
            });
        } catch (error) {
            console.error("Failed to fetch weekly challenges:", error);
        }
    };

    // --- Fetch Daily Streak Data ---
    const fetchDailyStreak = async () => {
        try {
            // Replace with your actual API endpoint
            const response = await fetch(`/api/dashboard/daily-streak?userId=${user?.id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Calculate nextRewardDays and progressPercent for streak
            const tiers = [1, 3, 5, 7, 14, 30];
            const nextRewardDays = tiers.find((t) => t > data.currentStreakDays) || 30;
            let progressPercentStreak = 0;
            if (data.currentStreakDays >= 30) {
                progressPercentStreak = 100;
            } else {
                let prevTier = tiers.slice().reverse().find((t) => t <= data.currentStreakDays) || 0;
                let progressInTier = data.currentStreakDays - prevTier;
                let neededForTier = nextRewardDays - prevTier;
                progressPercentStreak = neededForTier > 0 ? Math.min(100, Math.round((progressInTier / neededForTier) * 100)) : 0;
            }

            setDailyStreakDataState({
                currentStreakDays: data.currentStreakDays,
                completedToday: data.completedToday,
                nextRewardDays: nextRewardDays,
                progressPercent: progressPercentStreak,
                rewards: staticDailyStreakRewards, // Assuming rewards structure is static for now
            });
        } catch (error) {
            console.error("Failed to fetch daily streak:", error);
        }
    };

    // --- Fetch Leaderboard Data ---
    const fetchLeaderboards = async () => {
        try {
            // Replace with your actual API endpoint
            const subjectResponse = await fetch("/api/leaderboard/subject"); // Or pass courseId etc.
            const globalResponse = await fetch("/api/leaderboard/global");

            if (!subjectResponse.ok || !globalResponse.ok) {
                console.error("Failed to fetch one or more leaderboards");
                // Handle partial data or error state as needed
                return;
            }
            const subjectData = await subjectResponse.json();
            const globalData = await globalResponse.json();

            setLeaderboardDataState({
                subject: subjectData.leaderboard || [], // Assuming API returns { leaderboard: [] }
                global: globalData.leaderboard || [], // Assuming API returns { leaderboard: [] }
            });
        } catch (error) {
            console.error("Failed to fetch leaderboard data:", error);
        }
    };
    
    if (user?.id) { // Ensure user context is available before fetching
        fetchUserData();
        fetchWeeklyRankProgress();
        fetchWeeklyChallenges();
        fetchDailyStreak();
        fetchLeaderboards();
    }
    // Add user.id to dependency array if it's critical for re-fetching on user change
  }, [user]); 


  return (
    <div className={styles.dashboardContainer}>
      <FloatingStars /> {/* Add FloatingStars component here */}
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Welcome,{" "}
          <span className={styles.pageTitleUsername}>{userDataState.username || 'Innovator'}!</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Monitor your project progress and system efficiency.
        </p>
      </div>
      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}><FaTasks /></span>
          <span className={styles.statValue}>{weeklyChallengeDataState.activeTests.length}</span>
          <span className={styles.statLabel}>Active Projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}><FaFire /></span> {/* Consider changing icon to FaServer or FaNetworkWired for uptime */}
          <span className={styles.statValue}>{userDataState.currentStreak}</span>
          <span className={styles.statLabel}>Uptime Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}><FaBullseye /></span> {/* Consider FaMicrochip or FaBrain for Tech Level */}
          <span className={styles.statValue}>{userDataState.mmr}</span>
          <span className={styles.statLabel}>Tech Level</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}><FaTrophy /></span> {/* Consider FaIdBadge or FaUserTie for Designation */}
          <span className={`${styles.statValue} ${getRankClass(userDataState.rankName)}`}>{userDataState.rankName}</span>
          <span className={styles.statLabel}>Designation</span>
        </div>
      </div>
      {/* Dashboard Layout Grid */}
      <div className={styles.dashboardLayoutGrid}>
        {/* Main Content Area */}
        <div className={styles.mainContentArea}>
          {/* MMR Progress Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>
              <span className={styles.panelIcon}><FaChartBar /></span> Weekly Rank Progression
            </h2>
            <div className={styles.mmrProgress}>
              <div className={styles.mmrInfo}>
                <span
                  className={`${styles.currentRankMmr} ${getRankClass(
                    weeklyRankProgressDataState.currentRankName
                  )}`}
                >
                  {weeklyRankProgressDataState.currentMmr}{" "}
                  <span className={styles.rankName}>
                    {weeklyRankProgressDataState.currentRankName}
                  </span>
                </span>
                <span className={styles.nextRank}>
                  {weeklyRankProgressDataState.nextRankName
                    ? `Next: ${weeklyRankProgressDataState.nextRankName}`
                    : "MAX EFFICIENCY"}
                </span>
              </div>
              <div className={styles.progressBarContainer}>
                <div
                  className={`${styles.progressBarFill} ${styles.progressBarFillMmr}`}
                  style={{ width: `${weeklyRankProgressDataState.progressPercent}%` }}
                  aria-valuenow={weeklyRankProgressDataState.progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className={styles.progressText}>
                <span>
                  {weeklyRankProgressDataState.pointsNeeded > 0
                    ? `${weeklyRankProgressDataState.pointsNeeded} Data Points needed for next designation`
                    : "You've reached MAX EFFICIENCY!"}
                </span>
                <span>{weeklyRankProgressDataState.progressPercent}%</span>
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
              <span className={styles.panelIcon}><FaBullseye /></span> Innovation Lab (Challenges)
            </h2>
            <div className={styles.weeklyChallengesContent}>
              {weeklyChallengeDataState.hasActiveTests ? (
                <ul className={styles.activeTestsList}>
                  {weeklyChallengeDataState.activeTests.map((test) => (
                    <li key={test.id || test.name} className={styles.activeTestItem}>
                      {/* Adjust Link destination and test property for name as needed */}
                      <Link to={`/tests/${test.id || test.projectId}`} className={styles.activeTestLink}>
                        {test.name || test.projectName || 'Unnamed Project'}
                      </Link>
                      {/* You can add more details here, e.g., test.dueDate, test.status */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noTestsMessage}>
                  No active projects. Time for R&D!
                </p>
              )}
              <Link to="/tests" className={styles.browseButton}> {/* Assuming /tests is the path */}
                Launch a Project
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
              <span className={styles.panelIcon}><FaCalendarAlt /></span> System Check Streak
            </h2>
            <div className={styles.dailyStreakContent}>
              <div className={styles.streakHeader}>
                <span className={styles.streakDays}>
                  {dailyStreakDataState.currentStreakDays} Day
                  {dailyStreakDataState.currentStreakDays !== 1 ? "s" : ""}
                </span>
                <span
                  className={`${styles.streakStatus} ${
                    dailyStreakDataState.completedToday
                      ? styles.statusComplete
                      : styles.statusIncomplete
                  }`}
                >
                  {dailyStreakDataState.completedToday ? "System Check Complete!" : "Run System Check!"}
                </span>
              </div>
              <div className={`${styles.progressBarContainer} ${styles.streakProgressBarContainer}`}>
                <div
                  className={`${styles.progressBarFill} ${styles.streakProgressBarFill}`}
                  style={{ width: `${dailyStreakDataState.progressPercent}%` }}
                  aria-valuenow={dailyStreakDataState.progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className={styles.streakNextReward}>
                Next Reward:{" "}
                {dailyStreakDataState.currentStreakDays >= 30
                  ? "Maximum system stability achieved!"
                  : `Reach ${dailyStreakDataState.nextRewardDays} days for a new component!`}
              </div>
              <ul className={styles.streakRewardList}>
                {dailyStreakDataState.rewards.map((reward) => (
                  <li key={reward.days} className={styles.streakRewardItem}>
                    <span className={styles.rewardDays}>
                      <span className={styles.rewardDaysIcon}><FaGift /></span>
                      {reward.days} day{reward.days > 1 ? "s" : ""}
                    </span>
                    <span className={styles.rewardText}>{reward.rewardText}</span>
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
            <h2 className={`${styles.panelHeader} ${styles.leaderboardTitle}`}>
              <span className={styles.panelIcon}><FaTrophy /></span> Top Innovators {/* Local Leaderboard */}
            </h2>
            <Link to="/leaderboard/subject" className={styles.viewAllLink}>View All</Link>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Innovator</th>
                <th className={styles.mmrHeader}>Tech Level</th>
                <th className={styles.rankTierHeader}>Designation</th>
              </tr>
            </thead>
            <tbody>
              {/* Render placeholder or empty message if no data */}
              {leaderboardDataState.subject.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No Local Innovators Data
                  </td>
                </tr>
              )}
              {leaderboardDataState.subject.slice(0, 3).map((user, index) => (
                <tr key={user.id}>
                  <td className={styles.leaderboardRankNumber}>
                    <span className={styles.leaderboardRankIcon}><FaTrophy /></span>
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
            <h2 className={`${styles.panelHeader} ${styles.leaderboardTitle}`}>
              <span className={styles.panelIcon}><FaTrophy /></span> Global Tech Leaders
            </h2>
            <Link to="/leaderboard/global" className={styles.viewAllLink}>View All</Link>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Innovator</th>
                <th className={styles.mmrHeader}>Tech Level</th>
                <th className={styles.rankTierHeader}>Designation</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardDataState.global.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No Global Innovators Data
                  </td>
                </tr>
              )}
              {leaderboardDataState.global.slice(0, 3).map((user, index) => (
                <tr key={user.id}>
                  <td className={styles.leaderboardRankNumber}>
                    <span className={styles.leaderboardRankIcon}><FaTrophy /></span>
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
