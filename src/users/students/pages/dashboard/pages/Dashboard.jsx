import React, { useState, useEffect } from "react"; // Add useState, useEffect when fetching data
import { Link } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import styles from "./Dashboard.module.css";
import {
  FaFire,
  FaBullseye,
  FaTrophy,
  FaChartBar,
  FaCalendarAlt,
  FaGift,
  FaTasks,
} from "react-icons/fa";
import FloatingStars from "../../../components/FloatingStars/FloatingStars"; // Corrected Import FloatingStars
import ApprovalStatus from "../../../components/ApprovalStatus";

const rankingTiers = [
  { name: "Absent Legend", mmr: "0+", colorClass: styles.rankBronze },
  { name: "The Crammer", mmr: "150+", colorClass: styles.rankSilver },
  { name: "Seatwarmer", mmr: "300+", colorClass: styles.rankGold },
  { name: "Group Project Ghost", mmr: "450+", colorClass: styles.rankPlatinum },
  {
    name: "Google Scholar (Unofficial)",
    mmr: "600+",
    colorClass: styles.rankDiamond,
  },
  { name: "The Lowkey Genius", mmr: "750+", colorClass: styles.rankMaster },
  {
    name: "Almost Valedictorian",
    mmr: "900+",
    colorClass: styles.rankGrandmaster,
  },
  {
    name: "The Valedictornator",
    mmr: "1050+",
    colorClass: styles.rankGrandmaster,
  },
];

// Remove gamified reward text; keep milestones only (empty list shown)
const staticDailyStreakRewards = [];

// Helper function for rank color class
const getRankClass = (rankName) => {
  switch (rankName?.toLowerCase()) {
    case "absent legend":
      return styles.rankBronze;
    case "the crammer":
      return styles.rankSilver;
    case "seatwarmer":
      return styles.rankGold;
    case "group project ghost":
      return styles.rankPlatinum;
    case "google scholar (unofficial)":
      return styles.rankDiamond;
    case "the lowkey genius":
      return styles.rankMaster;
    case "almost valedictorian":
    case "the valedictornator":
      return styles.rankGrandmaster;
    default:
      return styles.rankBronze;
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  // Initialize state for all dashboard data
  const [userDataState, setUserDataState] = useState({
    username: "Student",
    mmr: 0,
    rankName: "",
    testsCompleted: 0,
  });

  const [weeklyRankProgressDataState, setWeeklyRankProgressDataState] =
    useState({
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
    weekly: [],
    pvp: [],
  });

  useEffect(() => {
    const backendurl = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Helpers
    const getTierNameFromMmr = (mmr) => {
      const thresholds = [
        { name: "The Valedictornator", min: 1050 },
        { name: "Almost Valedictorian", min: 900 },
        { name: "The Lowkey Genius", min: 750 },
        { name: "Google Scholar (Unofficial)", min: 600 },
        { name: "Group Project Ghost", min: 450 },
        { name: "Seatwarmer", min: 300 },
        { name: "The Crammer", min: 150 },
        { name: "Absent Legend", min: 0 },
      ];
      for (let i = 0; i < thresholds.length; i++) {
        if (mmr >= thresholds[i].min) return thresholds[i].name;
      }
      return "Absent Legend";
    };

    const computeDailyStreak = (results) => {
      const daysSet = new Set(
        results
          .map((r) => r.completedAt)
          .filter(Boolean)
          .map((d) => new Date(d))
          .map((dt) =>
            new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
          )
      );
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const day = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - i
        ).getTime();
        if (daysSet.has(day)) streak++;
        else break;
      }
      // Progress toward next reward tier
      const tiers = [1, 3, 5, 7, 14, 30];
      const nextRewardDays = tiers.find((t) => t > streak) || 30;
      const prevTier = [...tiers].reverse().find((t) => t <= streak) || 0;
      const progressPercentStreak =
        nextRewardDays > prevTier
          ? Math.min(
              100,
              Math.round(
                ((streak - prevTier) / (nextRewardDays - prevTier)) * 100
              )
            )
          : 100;
      const completedToday = daysSet.has(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).getTime()
      );
      return { streak, nextRewardDays, progressPercentStreak, completedToday };
    };

    const fetchAll = async () => {
      try {
        // Parallel fetches
        const [studentRes, resultsRes, weeksRes, weeklyLbRes, pvpLbRes] =
          await Promise.all([
            fetch(`${backendurl}/api/students/${user.id}`, {
              headers: authHeaders,
            }),
            fetch(`${backendurl}/api/weekly-test/results/student/${user.id}`, {
              headers: authHeaders,
            }),
            fetch(`${backendurl}/api/weeks/active`, { headers: authHeaders }),
            fetch(`${backendurl}/api/leaderboard/global?timeFrame=weekly`),
            fetch(`${backendurl}/api/leaderboard/pvp`, {
              headers: authHeaders,
            }),
          ]);

        // Student data
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          const sd = studentData.data || {};
          setUserDataState((prev) => ({
            ...prev,
            username: sd.firstName || user?.firstName || "Innovator",
          }));
        }

        // Weekly test results
        let results = [];
        if (resultsRes.ok) {
          const resData = await resultsRes.json();
          results = resData.data?.results || [];
          const testsCompleted = results.length;
          const prPoints = results.reduce(
            (acc, r) => acc + (r.pointsEarned || 0),
            0
          );
          const tierName = getTierNameFromMmr(prPoints);

          setUserDataState((prev) => ({
            ...prev,
            mmr: prPoints,
            rankName: tierName,
            testsCompleted,
          }));

          // Update weekly rank progress
          const thresholdsMap = {
            "Trainee Technician": 0,
            "Junior Technician": 1000,
            "Senior Technician": 1300,
            "Lead Engineer": 1600,
            "Project Director": 2400,
            "Chief Innovator": 3000,
            "Capsule Corp Visionary": 3600,
          };
          const currentMin = thresholdsMap[tierName] ?? 0;
          const nextTier = rankingTiers.find(
            (t) => thresholdsMap[t.name] > currentMin
          );
          const nextMin = nextTier ? thresholdsMap[nextTier.name] : currentMin;
          const progressPercent =
            nextTier && nextMin > currentMin
              ? Math.min(
                  100,
                  Math.round(
                    ((prPoints - currentMin) / (nextMin - currentMin)) * 100
                  )
                )
              : 100;
          const pointsNeeded = nextTier ? Math.max(0, nextMin - prPoints) : 0;

          setWeeklyRankProgressDataState({
            currentMmr: prPoints,
            currentRankName: tierName,
            nextRankMmr: nextMin,
            nextRankName: nextTier ? nextTier.name : "",
            progressPercent,
            pointsNeeded,
          });

          // Daily streak
          const {
            streak,
            nextRewardDays,
            progressPercentStreak,
            completedToday,
          } = computeDailyStreak(results);
          setDailyStreakDataState({
            currentStreakDays: streak,
            completedToday,
            nextRewardDays,
            progressPercent: progressPercentStreak,
            rewards: staticDailyStreakRewards,
          });
        }

        // Weekly challenges from active weeks
        if (weeksRes.ok) {
          const weeksData = await weeksRes.json();
          const scheduleArray = Array.isArray(weeksData) ? weeksData : [];
          const activeTests = scheduleArray.slice(0, 5).map((w) => ({
            id: w._id,
            name: `Week ${w.weekNumber} — ${w.subjectId?.subject || "Subject"}`,
          }));
          setWeeklyChallengeDataState({
            hasActiveTests: scheduleArray.length > 0,
            activeTests,
          });
        }

        // Weekly test leaderboard
        if (weeklyLbRes.ok) {
          const lbData = await weeklyLbRes.json();
          const leaderboard = lbData.leaderboard || [];
          setLeaderboardDataState((prev) => ({
            ...prev,
            weekly: leaderboard,
          }));
        }

        // PvP leaderboard
        if (pvpLbRes.ok) {
          const pvpData = await pvpLbRes.json();
          const leaderboard = pvpData.leaderboard || [];
          setLeaderboardDataState((prev) => ({
            ...prev,
            pvp: leaderboard,
          }));
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      }
    };

    if (user?.id) {
      fetchAll();
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
          <span className={styles.pageTitleUsername}>
            {userDataState.username || "Innovator"}!
          </span>
        </h1>
        <p className={styles.pageSubtitle}>
          Your recent activity and progress.
        </p>
      </div>
      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <FaTasks />
          </span>
          <span className={styles.statValue}>
            {weeklyChallengeDataState.activeTests.length}
          </span>
          <span className={styles.statLabel}>Active Projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <FaFire />
          </span>{" "}
          <span className={styles.statValue}>
            {dailyStreakDataState.currentStreakDays}
          </span>
          <span className={styles.statLabel}>Learning Streak</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <FaBullseye />
          </span>{" "}
          {/* Consider FaMicrochip or FaBrain for Tech Level */}
          <span className={styles.statValue}>{userDataState.mmr}</span>
          <span className={styles.statLabel}>Total Points</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <FaTrophy />
          </span>{" "}
          {/* Consider FaIdBadge or FaUserTie for Designation */}
          <span
            className={`${styles.statValue} ${getRankClass(
              userDataState.rankName
            )}`}
          >
            {userDataState.rankName}
          </span>
          <span className={styles.statLabel}>Rank</span>
        </div>
      </div>
      {/* Dashboard Layout Grid */}
      <div className={styles.dashboardLayoutGrid}>
        {/* Main Content Area */}
        <div className={styles.mainContentArea}>
          {/* Approval Status */}
          <ApprovalStatus
            isApproved={user?.isApproved}
            isActive={user?.isActive}
          />

          {/* MMR Progress Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>
              <span className={styles.panelIcon}>
                <FaChartBar />
              </span>{" "}
              Points Progress
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
                  style={{
                    width: `${weeklyRankProgressDataState.progressPercent}%`,
                  }}
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
              <span className={styles.panelIcon}>
                <FaBullseye />
              </span>{" "}
              Weekly Challenges
            </h2>
            <div className={styles.weeklyChallengesContent}>
              {weeklyChallengeDataState.hasActiveTests ? (
                <ul className={styles.activeTestsList}>
                  {weeklyChallengeDataState.activeTests.map((test) => (
                    <li
                      key={test.id || test.name}
                      className={styles.activeTestItem}
                    >
                      <Link
                        to={`/student/weeklytest`}
                        className={styles.activeTestLink}
                      >
                        {test.name || test.projectName || "Unnamed Project"}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noTestsMessage}>
                  No active weeks. Check back later!
                </p>
              )}
              <Link to="/student/weeklytest" className={styles.browseButton}>
                Go to Weekly Tests
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
              <span className={styles.panelIcon}>
                <FaCalendarAlt />
              </span>{" "}
              Learning Streak
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
                  {dailyStreakDataState.completedToday
                    ? "Did a test today!"
                    : "Do a test today!"}
                </span>
              </div>
              <div
                className={`${styles.progressBarContainer} ${styles.streakProgressBarContainer}`}
              >
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
                  ? "Max streak achieved!"
                  : `Reach ${dailyStreakDataState.nextRewardDays} days for a new reward!`}
              </div>
              <ul className={styles.streakRewardList}>
                {dailyStreakDataState.rewards.map((reward) => (
                  <li key={reward.days} className={styles.streakRewardItem}>
                    <span className={styles.rewardDays}>
                      <span className={styles.rewardDaysIcon}>
                        <FaGift />
                      </span>
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
        {/* Weekly Test Rankings */}
        <div className={`${styles.panel} ${styles.leaderboardPanel}`}>
          <div className={styles.leaderboardHeader}>
            <h2 className={`${styles.panelHeader} ${styles.leaderboardTitle}`}>
              <span className={styles.panelIcon}>
                <FaTrophy />
              </span>{" "}
              Weekly Test Rankings
            </h2>
            <Link to="/leaderboard/global" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Student</th>
                <th className={styles.mmrHeader}>Points (Week)</th>
                <th className={styles.rankTierHeader}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardDataState.weekly.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No Weekly Rankings
                  </td>
                </tr>
              )}
              {leaderboardDataState.weekly.slice(0, 3).map((u, index) => {
                const displayName =
                  u.username || u.name || u.user?.username || "Student";
                const avatarInitial = (
                  u.avatarInitial || displayName.charAt(0)
                ).toUpperCase();
                const weeklyPoints = u.pointsThisWeek ?? u.points ?? u.mmr ?? 0;
                const rankName = u.rankName || "-";
                return (
                  <tr key={u.id || u._id || displayName + index}>
                    <td className={styles.leaderboardRankNumber}>
                      <span className={styles.leaderboardRankIcon}>
                        <FaTrophy />
                      </span>
                      {index + 1}
                    </td>
                    <td>
                      <div className={styles.leaderboardStudentCell}>
                        <div className={styles.leaderboardAvatar}>
                          {avatarInitial}
                        </div>
                        <div className={styles.leaderboardStudentInfo}>
                          <span className={styles.leaderboardUsername}>
                            {displayName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.leaderboardMmrValue}>
                      {weeklyPoints}
                    </td>
                    <td
                      className={`${
                        styles.leaderboardRankTierValue
                      } ${getRankClass(rankName)}`}
                    >
                      {rankName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PvP Rankings */}
        <div className={`${styles.panel} ${styles.leaderboardPanel}`}>
          <div className={styles.leaderboardHeader}>
            <h2 className={`${styles.panelHeader} ${styles.leaderboardTitle}`}>
              <span className={styles.panelIcon}>
                <FaTrophy />
              </span>{" "}
              PvP Rankings
            </h2>
          </div>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th className={styles.rankHeader}>#</th>
                <th>Student</th>
                <th className={styles.mmrHeader}>Stars</th>
                <th className={styles.rankTierHeader}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardDataState.pvp.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No PvP Rankings
                  </td>
                </tr>
              )}
              {leaderboardDataState.pvp.slice(0, 3).map((u, index) => {
                const displayName =
                  u.username || u.name || u.user?.username || "Student";
                const avatarInitial = (
                  u.avatarInitial || displayName.charAt(0)
                ).toUpperCase();
                const stars = u.stars ?? u.points ?? u.mmr ?? 0;
                const rankName = u.rankName || "-";
                return (
                  <tr key={u.id || u._id || displayName + index}>
                    <td className={styles.leaderboardRankNumber}>
                      <span className={styles.leaderboardRankIcon}>
                        <FaTrophy />
                      </span>
                      {index + 1}
                    </td>
                    <td>
                      <div className={styles.leaderboardStudentCell}>
                        <div className={styles.leaderboardAvatar}>
                          {avatarInitial}
                        </div>
                        <div className={styles.leaderboardStudentInfo}>
                          <span className={styles.leaderboardUsername}>
                            {displayName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.leaderboardMmrValue}>{stars}</td>
                    <td className={styles.leaderboardRankTierValue}>
                      {rankName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
