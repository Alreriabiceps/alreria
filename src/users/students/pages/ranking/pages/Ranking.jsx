import React, { useState, useEffect } from 'react';
import styles from './Ranking.module.css'; // Import CSS module
import {
    FaFilter, FaListOl, FaSearch, FaTrophy, // Existing icons
    FaBed, FaClock, FaBookOpen, FaPaperclip, FaBookReader, FaMedal, FaMicrophoneAlt, // Weekly rank icons
    FaBug, FaUserShield, FaShieldAlt, FaCrown, FaStar, FaFistRaised, FaAward // PvP rank icons
} from 'react-icons/fa';
import FloatingStars from '../../../components/FloatingStars/FloatingStars'; // Import FloatingStars

// --- Icon Components (copied from Profile.jsx) ---
const iconComponents = {
    FaBed, FaClock, FaBookOpen, FaPaperclip, FaSearch, FaBookReader, FaMedal, FaMicrophoneAlt,
    FaBug, FaUserShield, FaShieldAlt, FaCrown, FaStar, FaFistRaised, FaAward
};

const IconComponent = ({ iconName, ...props }) => {
    const ActualIcon = iconComponents[iconName];
    if (!ActualIcon) {
        // console.warn(`Icon "${iconName}" not found in iconComponents for Ranking page.`);
        return null; 
    }
    return <ActualIcon {...props} />;
};
// --- End Icon Components ---

// --- Copied Rank Systems from Profile.jsx ---
// Weekly Progress Ranks (formerly RANKS in Profile.jsx)
const weeklyRanks = [
    { min: 0, max: 149, name: 'Absent Legend', prIcon: 'FaBed', description: 'Technically enrolled.', color: 'var(--blueprint-text-muted)' },
    { min: 150, max: 299, name: 'The Crammer', prIcon: 'FaClock', description: 'Studies best under extreme pressure—like 5 minutes before class.', color: '#FFC107' },
    { min: 300, max: 449, name: 'Seatwarmer', prIcon: 'FaBookOpen', description: 'Physically present, mentally... buffering.', color: '#A0522D' },
    { min: 450, max: 599, name: 'Group Project Ghost', prIcon: 'FaPaperclip', description: 'Appears only during final presentation day.', color: '#B0C4DE' },
    { min: 600, max: 749, name: 'Google Scholar (Unofficial)', prIcon: 'FaSearch', description: 'Master of Ctrl+F and "Quizlet."' , color: 'var(--blueprint-success)'},
    { min: 750, max: 899, name: 'The Lowkey Genius', prIcon: 'FaBookReader', description: 'Never recites, still gets the highest score.', color: 'var(--blueprint-accent-secondary)' },
    { min: 900, max: 1049, name: 'Almost Valedictorian', prIcon: 'FaMedal', description: 'Always 0.01 short—every time.', color: 'var(--blueprint-accent)' },
    { min: 1050, max: Infinity, name: 'The Valedictornator', prIcon: 'FaMicrophoneAlt', description: 'Delivers speeches, aces tests, and might run the school.', color: 'var(--blueprint-danger)' }
];

// PvP Arena Ranks (formerly PVP_RANKS in Profile.jsx)
const pvpRanks = [
    { min: 0, max: 79, name: 'Grasshopper', pvpIcon: 'FaBug', description: 'Newbie — Just starting out.', color: 'var(--blueprint-success)' },
    { min: 80, max: 159, name: 'Knight', pvpIcon: 'FaUserShield', description: 'Rising Warrior — Showing promise.', color: '#B0C4DE' },
    { min: 160, max: 239, name: 'Gladiator', pvpIcon: 'FaShieldAlt', description: 'Skilled Fighter — Battle-ready.', color: '#C0C0C0' },
    { min: 240, max: 319, name: 'Elite', pvpIcon: 'FaCrown', description: 'Champion in the Making.', color: 'var(--blueprint-accent)' },
    { min: 320, max: 399, name: 'Legend', pvpIcon: 'FaStar', description: 'Feared by many.', color: 'var(--blueprint-accent-secondary)' },
    { min: 400, max: 479, name: 'Titan', pvpIcon: 'FaFistRaised', description: 'Legendary Force — Near unstoppable.', color: '#D8A2FF' },
    { min: 480, max: 500, name: 'Supreme', pvpIcon: 'FaAward', description: 'Absolute Peak — Top of the ranks.', color: 'var(--blueprint-danger)' },
];
// --- End Copied Rank Systems ---

const currentUserId = 'user012'; // Eren Yeager is now a Seatwarmer

// Updated getRankClass function
// It will attempt to return a class like styles.rankTheCrammer
// These classes would need to be defined in Ranking.module.css
const getRankClass = (rankName) => {
    if (!rankName) return '';
    // Create a camelCase or PascalCase class name from the rank name
    const className = 'rank' + rankName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return styles[className] || ''; // Fallback to empty string if class doesn't exist
};
// ----------------------------------------------------

const Ranking = () => {
  const [leaderboardType, setLeaderboardType] = useState('global'); // global, program (pvp), class
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState([]); // State for fetched data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError(null);
      let endpoint = '';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''; // Ensure backendUrl is defined

      if (leaderboardType === 'global' || leaderboardType === 'class') {
        endpoint = `${backendUrl}/api/leaderboard/weekly`; // Assumed endpoint
      } else if (leaderboardType === 'program') {
        endpoint = `${backendUrl}/api/leaderboard/pvp`; // Assumed endpoint
      }

      if (!endpoint) {
        setError('Invalid leaderboard type selected.');
        setIsLoading(false);
        setDataSource([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Failed to fetch leaderboard (${response.status})`);
        }

        const data = await response.json();
        // Assuming API returns data in a property, e.g., data.leaderboard or data.users or just data itself if it's an array
        const rawLeaderboard = Array.isArray(data) ? data : data.leaderboard || data.users || [];
        
        const processedLeaderboard = rawLeaderboard.map(user => ({
          ...user,
          // Ensure avatarInitial exists, derive from username if not present
          avatarInitial: user.avatarInitial || (user.username ? user.username.substring(0, 2).toUpperCase() : '??')
        }));
        
        setDataSource(processedLeaderboard);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setError(err.message);
        setDataSource([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [leaderboardType]); // Re-fetch when leaderboardType changes

  const isPvpLeaderboard = leaderboardType === 'program';
  const isWeeklyLeaderboard = leaderboardType === 'global' || leaderboardType === 'class'; // Added for clarity

  const activeLeaderboardData = isPvpLeaderboard ? dataSource : dataSource;
  const scoreField = isPvpLeaderboard ? 'stars' : 'mmr';
  const scoreLabel = isPvpLeaderboard ? 'Stars' : 'MMR';

  const filteredData = activeLeaderboardData.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.handle && user.handle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    // Apply CSS Module classes - no structural changes needed from previous CSS module version
    <div className={styles.rankingContainer}>
      <FloatingStars />
      <div className={styles.rankingPanel}>
        {/* No main title here, it moves to the right column or could be a global page title if needed */}
        
        <div className={styles.layoutGrid}> {/* Main grid for two columns */}
          
          {/* Left Column: Filters and Tiers */}
          <div className={styles.leftColumn}>
            <div className={styles.filterSection}>
              <h2 className={styles.filterHeader}>
                <span className={styles.filterHeaderIcon}><FaFilter /></span> Filters
              </h2>
              <div className={styles.filterControls}>
                {/* Leaderboard Type Dropdown */}
                <div className={styles.filterGroup}>
                  <label htmlFor="leaderboard-type" className={styles.filterLabel}>Leaderboard Type</label>
                  <div className={styles.filterInputContainer}>
                    <span className={styles.filterInputIcon}><FaListOl /></span> {/* Was [TypeIcon] */}
                    <select id="leaderboard-type" name="leaderboard-type" value={leaderboardType} onChange={(e) => setLeaderboardType(e.target.value)} className={styles.filterSelect}>
                      <option value="global">Global Ranking (Weekly)</option>
                      <option value="program">PvP Arena Ranking</option>
                      <option value="class">Class Ranking (Weekly)</option>
                    </select>
                  </div>
                </div>
                {/* Search Input */}
                <div className={styles.filterGroup}>
                  <label htmlFor="search" className={styles.filterLabel}>Search</label>
                  <div className={styles.filterInputContainer}>
                    <span className={styles.filterInputIcon}><FaSearch /></span> {/* Was [SearchIcon] */}
                    <input type="text" name="search" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.filterInput} placeholder="Search by name or username..."/>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tiersSection}>
              {isWeeklyLeaderboard && (
                <>
                  <h3 className={styles.tiersTitle}>Weekly Progress Tiers</h3>
                  <div className={styles.tiersGrid}> 
                    {weeklyRanks.map(tier => (
                      <div key={tier.name} className={styles.tierBox}>
                        <IconComponent iconName={tier.prIcon} className={styles.tierIcon} style={{ color: tier.color }} />
                        <div className={styles.tierInfo}> 
                            <span className={styles.tierName} style={{ color: tier.color }}>{tier.name}</span>
                            <span className={styles.tierMmr} style={{ color: tier.color }}>{tier.min}+ pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {isPvpLeaderboard && (
                <>
                  <h3 className={`${styles.tiersTitle} ${styles.pvpTiersTitle}`}>PvP Arena Tiers</h3>
                  <div className={styles.tiersGrid}> 
                    {pvpRanks.map(tier => (
                      <div key={tier.name} className={styles.tierBox}>
                        <IconComponent iconName={tier.pvpIcon} className={styles.tierIcon} style={{ color: tier.color }} />
                        <div className={styles.tierInfo}> 
                            <span className={styles.tierName} style={{ color: tier.color }}>{tier.name}</span>
                            <span className={styles.tierMmr} style={{ color: tier.color }}>{tier.min}+ stars</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Title and Leaderboard Table */}
          <div className={styles.rightColumn}>
            <h1 className={styles.rankingTitle}>Leaderboards</h1>
            
            {isLoading && <div className={styles.loadingMessage}>Loading leaderboard...</div>} {/* Loading state */}
            {error && <div className={styles.errorMessage}>Error: {error}</div>} {/* Error state */}
            {!isLoading && !error && (
              <div className={styles.tableContainer}>
                <table className={styles.rankingTable}>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.rankHeader}>Rank</th>
                      <th scope="col">Student</th>
                      <th scope="col" className={styles.mmrHeader}>{scoreLabel}</th>
                      <th scope="col" className={styles.rankTierHeader}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? filteredData.map((user, index) => {
                      const isCurrentUser = user.id === currentUserId;
                      return (
                        <tr key={user.id || index} className={isCurrentUser ? styles.currentUserRow : ''}>
                          <td className={styles.rankNumber}>
                            <span className={styles.rankIcon}><FaTrophy /></span>{index + 1} {/* Was [RankIcon] */}
                          </td>
                          <td>
                              <div className={styles.studentCell}>
                                  <div className={styles.avatar}>{user.avatarInitial}</div>
                                  <div className={styles.studentInfo}>
                                      <span className={styles.username}>{user.username}</span>
                                      <span className={styles.handle}>{user.handle || '@' + user.username.toLowerCase().replace(/\s+/g, '')}</span>
                                  </div>
                                  {isCurrentUser && (<span className={styles.youTag}>You</span>)}
                              </div>
                          </td>
                          <td className={styles.mmrValue}>{user[scoreField]}</td>
                          <td className={`${styles.rankTierValue} ${getRankClass(user.rankName)}`}>{user.rankName}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="4" className={styles.noResultsMessage}>
                          {dataSource.length === 0 ? "No data available for this leaderboard." : "No matching students found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div> {/* End layoutGrid */} 

      </div> {/* End rankingPanel */} 
    </div> // End rankingContainer
  );
};

export default Ranking;