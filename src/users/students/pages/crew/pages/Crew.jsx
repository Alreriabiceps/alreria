import React, { useState } from 'react';
import styles from './Crew.module.css'; // Import the CSS module

// --- Sample Data (Replace with actual friend data/state) ---
const sampleFriendsData = {
    all: [],
    accepted: [],
    pending: [],
};
// -------------------------------------------------------------


const Crew = () => {
    const [addUsername, setAddUsername] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'accepted', 'pending'
    const [friends] = useState(sampleFriendsData); // Holds counts and lists

    // TODO: useEffect to fetch actual friends data based on activeTab/searchTerm

    // Placeholder handler for sending friend request
    const handleSendRequest = (e) => {
        e.preventDefault();
        if (!addUsername.trim()) return;
        console.log(`Sending friend request to: ${addUsername}`);
        // Add API call logic here
        setAddUsername(''); // Clear input after sending
    };

    // Calculate counts for tabs (replace with real data)
    const counts = {
        all: friends.all.length,
        accepted: friends.accepted.length,
        pending: friends.pending.length,
    };

    // Determine which list to display (implement filtering later)
    const displayList = friends[activeTab] || [];

    return (
        <div className={styles.crewContainer}>

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Friends</h1>
                <p className={styles.pageSubtitle}>Connect with other students and challenge them to duels</p>
            </div>

            {/* Add Friend Panel */}
            <div className={styles.crewPanel}>
                <h2 className={styles.panelHeader}>
                    <span className={styles.panelIcon}>➕</span> {/* Placeholder Icon */}
                    Add Friend
                </h2>
                <form className={styles.addFriendForm} onSubmit={handleSendRequest}>
                    <input
                        type="text"
                        value={addUsername}
                        onChange={(e) => setAddUsername(e.target.value)}
                        className={styles.addFriendInput}
                        placeholder="Enter username..."
                        aria-label="Username to add as friend"
                    />
                    <button type="submit" className={`${styles.gameButton} ${styles.sendRequestButton}`}>
                        Send Request
                    </button>
                </form>
            </div>

            {/* All Friends Panel */}
            <div className={styles.crewPanel}>
                <h2 className={styles.panelHeader}>
                    <span className={styles.panelIcon}>👥</span> {/* Placeholder Icon */}
                    All Friends
                </h2>

                {/* Sub-header with Tabs and Search */}
                <div className={styles.friendListHeader}>
                    <div className={styles.tabContainer}>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
                        >
                             <span className={styles.tabIcon}>🌐</span> {/* Placeholder */}
                             All <span className={styles.tabCount}>{counts.all}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('accepted')}
                            className={`${styles.tabButton} ${activeTab === 'accepted' ? styles.activeTab : ''}`}
                        >
                             <span className={styles.tabIcon}>✔️</span> {/* Placeholder */}
                             Accepted <span className={styles.tabCount}>{counts.accepted}</span>
                        </button>
                         <button
                            onClick={() => setActiveTab('pending')}
                            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
                        >
                              <span className={styles.tabIcon}>⏳</span> {/* Placeholder */}
                             Pending <span className={styles.tabCount}>{counts.pending}</span>
                        </button>
                    </div>
                    {/* Search Input */}
                    <div className={styles.filterInputContainer} style={{ position: 'relative' }}> {/* Ensure relative positioning */}
                         <span className={styles.searchIconContainer} style={{ position: 'absolute' }}> {/* Explicit absolute */}
                             <span className={styles.panelIcon}>🔍</span> {/* Placeholder */}
                         </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchFriendsInput} // Specific class
                            placeholder="Search friends..."
                            aria-label="Search friends list"
                        />
                    </div>
                </div>

                {/* Friend List Area or "No Friends" Message */}
                <div className={styles.friendListArea}>
                    {displayList.length === 0 ? (
                        <div className={styles.noFriendsMessage}>
                            <div className={styles.noFriendsIcon}>👥</div> {/* Placeholder Icon */}
                            <h3 className={styles.noFriendsTitle}>No Friends Found</h3>
                            <p className={styles.noFriendsSubtitle}>
                                {activeTab === 'all' && searchTerm === ''
                                    ? "You don't have any friends yet. Add friends to connect with them."
                                    : `No ${activeTab} friends found${searchTerm ? ' matching your search' : ''}.`}
                            </p>
                        </div>
                    ) : (
                        // TODO: Render the actual list of friends here
                        // e.g., displayList.map(friend => <FriendItem key={friend.id} friend={friend} />)
                        <p>Friend list would appear here.</p> // Placeholder
                    )}
                </div>

            </div> {/* End All Friends Panel */}

        </div> // End Container
    );
};

export default Crew;