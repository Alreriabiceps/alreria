import React, { useState } from 'react';
import styles from './Ranking.module.css'; // Import CSS module

// --- Sample Data & Constants (Keep as is) ---
const leaderboardData = [
    { id: 'user005', username: 'QuantumLeaper', handle: '@qleap', mmr: 2150, rankName: 'Platinum', avatarInitial: 'QL' },
    { id: 'user012', username: 'eren yeager', handle: '@eren09', mmr: 1000, rankName: 'Gold', avatarInitial: 'ey' },
    { id: 'user003', username: 'BitMasher', handle: '@bitty', mmr: 1380, rankName: 'Gold', avatarInitial: 'BM' },
    { id: 'user021', username: 'SyntaxSavvy', handle: '@syn', mmr: 1120, rankName: 'Silver', avatarInitial: 'SS' },
    { id: 'user009', username: 'PixelPioneer', handle: '@pix', mmr: 980, rankName: 'Bronze', avatarInitial: 'PP' },
    { id: 'user015', username: 'LogicLord', handle: '@logic', mmr: 850, rankName: 'Bronze', avatarInitial: 'LL' },
    { id: 'user007', username: 'CodeConjurer', handle: '@code', mmr: 760, rankName: 'Bronze', avatarInitial: 'CC' },
    { id: 'user030', username: 'DataDuchess', handle: '@data', mmr: 1600, rankName: 'Platinum', avatarInitial: 'DD' },
    { id: 'user042', username: 'ScriptSorcerer', handle: '@script', mmr: 2450, rankName: 'Diamond', avatarInitial: 'SS' },
    { id: 'user011', username: 'ByteBard', handle: '@byte', mmr: 910, rankName: 'Bronze', avatarInitial: 'BB' },
    { id: 'user050', username: 'MasterMind', handle: '@mm', mmr: 3100, rankName: 'Master', avatarInitial: 'MM'},
    { id: 'user001', username: 'ApexAlpha', handle: '@alpha', mmr: 3750, rankName: 'Grandmaster', avatarInitial: 'AA'}
].sort((a, b) => b.mmr - a.mmr);

const currentUserId = 'user012';

const rankingTiers = [
    { name: 'Bronze', mmr: '0+', colorVar: '--color-rank-bronze', colorClass: styles.rankBronze },
    { name: 'Silver', mmr: '1000+', colorVar: '--color-rank-silver', colorClass: styles.rankSilver },
    { name: 'Gold', mmr: '1300+', colorVar: '--color-rank-gold', colorClass: styles.rankGold },
    { name: 'Platinum', mmr: '1600+', colorVar: '--color-rank-platinum', colorClass: styles.rankPlatinum },
    { name: 'Diamond', mmr: '2400+', colorVar: '--color-rank-diamond', colorClass: styles.rankDiamond },
    { name: 'Master', mmr: '3000+', colorVar: '--color-rank-master', colorClass: styles.rankMaster },
    { name: 'Grandmaster', mmr: '3600+', colorVar: '--color-rank-grandmaster', colorClass: styles.rankGrandmaster },
];

const getRankClass = (rankName) => { /* ... Keep helper as is ... */
    switch (rankName?.toLowerCase()) {
        case 'bronze': return styles.rankBronze;
        case 'silver': return styles.rankSilver;
        case 'gold': return styles.rankGold;
        case 'platinum': return styles.rankPlatinum;
        case 'diamond': return styles.rankDiamond;
        case 'master': return styles.rankMaster;
        case 'grandmaster': return styles.rankGrandmaster;
        default: return '';
    }
};
// ----------------------------------------------------

const Ranking = () => {
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = leaderboardData.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Apply CSS Module classes - no structural changes needed from previous CSS module version
    <div className={styles.rankingContainer}>
      <div className={styles.rankingPanel}>

        <h1 className={styles.rankingTitle}>Leaderboards</h1>

        {/* Filters Section */}
        <div className={styles.filterSection}>
          <h2 className={styles.filterHeader}>
            <span className={styles.filterHeaderIcon}>🏆</span> Leaderboards
          </h2>
          <div className={styles.filterControls}>
            {/* Leaderboard Type Dropdown */}
            <div className={styles.filterGroup}>
              <label htmlFor="leaderboard-type" className={styles.filterLabel}>Leaderboard Type</label>
              <div className={styles.filterInputContainer}>
                 <span className={styles.filterInputIcon}>🏆</span>
                <select id="leaderboard-type" name="leaderboard-type" value={leaderboardType} onChange={(e) => setLeaderboardType(e.target.value)} className={styles.filterSelect}>
                  <option value="global">Global Ranking</option>
                  <option value="program">Subject Ranking</option>
                  <option value="class">Class Ranking</option>
                </select>
              </div>
            </div>
            {/* Search Input */}
            <div className={styles.filterGroup}>
              <label htmlFor="search" className={styles.filterLabel}>Search</label>
              <div className={styles.filterInputContainer}>
                 <span className={styles.filterInputIcon}>🔍</span>
                <input type="text" name="search" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.filterInput} placeholder="Search by name or username..."/>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        {/* Add the wrapper div for scrolling */}
        <div className={styles.tableContainer}>
          <table className={styles.rankingTable}>
            <thead>
              <tr>
                <th scope="col" className={styles.rankHeader}>Rank</th>
                <th scope="col">Student</th>
                <th scope="col" className={styles.mmrHeader}>MMR</th>
                <th scope="col" className={styles.rankTierHeader}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((user, index) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id} className={isCurrentUser ? styles.currentUserRow : ''}>
                    <td className={styles.rankNumber}>
                      <span className={styles.rankIcon}>🏆</span>{index + 1}
                    </td>
                    <td>
                        <div className={styles.studentCell}>
                            <div className={styles.avatar}>{user.avatarInitial}</div>
                            <div className={styles.studentInfo}>
                                <span className={styles.username}>{user.username}</span>
                                <span className={styles.handle}>{user.handle}</span>
                            </div>
                            {isCurrentUser && (<span className={styles.youTag}>You</span>)}
                        </div>
                    </td>
                    <td className={styles.mmrValue}>{user.mmr}</td>
                    <td className={`${styles.rankTierValue} ${getRankClass(user.rankName)}`}>{user.rankName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
           {filteredData.length === 0 && ( <div className="text-center py-6 text-[var(--color-text-muted)] font-body text-lg">No matching students found.</div>)}
        </div>

        {/* Ranking Tiers Section */}
        <div className={styles.tiersSection}>
          <h3 className={styles.tiersTitle}>Ranking Tiers</h3>
          <div className={styles.tiersGrid}>
            {rankingTiers.map(tier => (
              <div key={tier.name} className={styles.tierBox}>
                <span className={styles.tierName}>{tier.name}</span>
                <span className={`${styles.tierMmr} ${tier.colorClass}`}>{tier.mmr}</span>
              </div>
            ))}
          </div>
        </div>

      </div> {/* End Panel */}
    </div> // End Container
  );
};

export default Ranking;