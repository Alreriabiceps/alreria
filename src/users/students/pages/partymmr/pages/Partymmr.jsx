import React, { useState, useEffect } from 'react';
import styles from './PartyMMR.module.css';

// --- Sample Data ---
const samplePublicParties = [
    { id: 'p1', name: "Duo Queue Warriors", leader: "SyntaxSavvy", members: [{ id: 'u1', username: 'SyntaxSavvy' }], maxSize: 2 },
    { id: 'p2', name: "Trio Grind", leader: "PixelPioneer", members: [{ id: 'u2', username: 'PixelPioneer' }, { id: 'u3', username: 'CodeConjurer'}], maxSize: 3 },
    { id: 'p3', name: "Chill 5 Stack", leader: "ByteBard", members: [{ id: 'u4', username: 'ByteBard' }], maxSize: 5 },
    { id: 'p4', name: "Need 1 for Squad", leader: "DataDuchess", members: [{ id: 'u5', username: 'DataDuchess'}, { id: 'u6', username: 'LogicLord'}, { id: 'u7', username: 'QuantumLeaper'}, { id: 'u8', username: 'TestUser'}], maxSize: 5 },
];

const sampleUserData = { id: 'user012', username: 'eren' }; // Placeholder
// --------------------

// Function to get party size name
const getPartySizeName = (size) => {
    if (size === 2) return 'Duo';
    if (size === 3) return 'Trio';
    if (size === 5) return 'Squad'; // Or 5-Stack
    return 'Party'; // Fallback
};

const Partymmr = () => {
    // --- State ---
    const [currentParty, setCurrentParty] = useState(null); // null or { id, name, leader, members: [{id, username}], maxSize }
    const [publicParties, setPublicParties] = useState([]);
    const [inviteInput, setInviteInput] = useState('');
    const [partySearchTerm, setPartySearchTerm] = useState('');
    const [isLoadingParties, setIsLoadingParties] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false); // For create/invite/join/leave/queue
    const [isQueueing, setIsQueueing] = useState(false); // Separate state for queue

    // TODO: useEffect to fetch public parties & user's current party status
    useEffect(() => {
        setIsLoadingParties(true);
        // Fetch current party status & public parties
        setTimeout(() => {
            setPublicParties(samplePublicParties);
            // setCurrentParty(null); // Or set to a sample party if testing that view
             setCurrentParty({ id: 'myParty1', name: "Eren's Duo", leader: sampleUserData.id, members: [{id: 'user012', username: 'eren'}, {id: 'user009', username: 'PixelPioneer'}], maxSize: 2 }); // Example: User is in a party
            setIsLoadingParties(false);
        }, 800);
    }, []);

    // Filter Public Parties
    const filteredPublicParties = publicParties.filter(party =>
        party.name.toLowerCase().includes(partySearchTerm.toLowerCase()) ||
        party.leader.toLowerCase().includes(partySearchTerm.toLowerCase())
    );

    // --- Handlers ---
    const handleCreateParty = async (size) => {
        if (isLoadingAction || currentParty) return;
        setIsLoadingAction(true);
        console.log(`Creating a ${getPartySizeName(size)} party...`);
        // --- TODO: API Call to Create Party ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        // On Success: update currentParty state with the new party data from backend
        const newParty = { id: `party_${Date.now()}`, name: `${sampleUserData.username}'s ${getPartySizeName(size)}`, leader: sampleUserData.id, members: [sampleUserData], maxSize: size };
        setCurrentParty(newParty);
        console.log("Party created:", newParty);
        // ---
        setIsLoadingAction(false);
    };

    const handleInviteFriend = async (e) => {
        e.preventDefault();
        if (!inviteInput.trim() || !currentParty || isLoadingAction) return;
        setIsLoadingAction(true);
        console.log(`Inviting ${inviteInput} to party ${currentParty.id}...`);
        // --- TODO: API Call to Invite Friend ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(`Invite sent to ${inviteInput}! (Placeholder - update party state on success)`);
        // ---
        setInviteInput('');
        setIsLoadingAction(false);
    };

     const handleLeaveParty = async () => {
        if (!currentParty || isLoadingAction) return;
        setIsLoadingAction(true);
        console.log(`Leaving party ${currentParty.id}...`);
        // --- TODO: API Call to Leave Party ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentParty(null); // Clear current party state
        console.log("Left party.");
        // ---
        setIsLoadingAction(false);
    };

     const handleJoinParty = async (partyId, partyName) => {
        if (currentParty || isLoadingAction) return; // Can't join if already in one or busy
        setIsLoadingAction(true);
        console.log(`Joining party ${partyId} (${partyName})...`);
        // --- TODO: API Call to Join Party ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        // On Success: Fetch updated party details and set currentParty state
        const joinedParty = samplePublicParties.find(p => p.id === partyId); // Find from sample for now
        if (joinedParty) {
            // Simulate adding self - backend should handle this properly
             setCurrentParty({ ...joinedParty, members: [...joinedParty.members, sampleUserData] });
             console.log("Joined party:", joinedParty.name);
             alert(`Joined party: ${partyName}! (Placeholder)`);
        } else {
             console.error("Failed to find party to join (sample data)");
             alert("Error joining party.");
        }
        // ---
        setIsLoadingAction(false);
    };

    const handleStartQueue = async () => {
        if (!currentParty || isLoadingAction || isQueueing) return;
        // Optional: Check if party is full? (Backend should handle this)
        // if (currentParty.members.length < currentParty.maxSize) {
        //     alert(`Party not full! Need ${currentParty.maxSize} members.`);
        //     return;
        // }
        setIsLoadingAction(true); // Use general action lock OR specific queue lock
        setIsQueueing(true); // Start queue state
        console.log(`Starting queue for party ${currentParty.id}...`);
        // --- TODO: API Call / WebSocket to Start Queue ---
        // Simulate finding match
        // setTimeout(() => { setIsQueueing(false); setIsLoadingAction(false); alert("Match Found!"); }, 5000);
    };

     const handleCancelQueue = async () => {
         // This might need a different loading state if cancelling is separate
        if (!isQueueing) return;
        console.log("Cancelling queue...");
        // --- TODO: API Call / WebSocket to Cancel Queue ---
        setIsQueueing(false); // Stop queue state
        setIsLoadingAction(false); // Release general lock if used
    };

    // Simplified kick handler (replace with API call)
     const handleKickMember = (memberId) => {
         if (!currentParty || currentParty.leader !== sampleUserData.id || memberId === sampleUserData.id) return; // Only leader can kick others
         console.log(`Kicking member ${memberId}...`);
         alert(`Kicked member ${memberId}! (Placeholder)`);
         // TODO: API Call & update currentParty state
         setCurrentParty(prev => ({
             ...prev,
             members: prev.members.filter(m => m.id !== memberId)
         }));
     }

    return (
        <div className={styles.partyContainer}>
             <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Party Queue</h1>
                <p className={styles.pageSubtitle}>Team up with friends for ranked challenges</p>
            </div>

            <div className={styles.actionsGrid}>

                 {/* --- My Party / Create Panel --- */}
                <div className={`${styles.panel} ${styles.myPartyPanel}`}>
                    <h2 className={styles.panelHeader}>
                        <span className={styles.panelIcon}>🤝</span> My Party
                    </h2>

                    {!currentParty ? (
                        // Not in a party - Show Create Options
                        <div className={styles.createPartyPrompt}>
                            <p className={styles.createPartyText}>You are not currently in a party. Create one!</p>
                            <div className={styles.createPartyButtons}>
                                <button onClick={() => handleCreateParty(2)} className={`${styles.gameButton} ${styles.partySizeButton}`} disabled={isLoadingAction}>Create Duo</button>
                                <button onClick={() => handleCreateParty(3)} className={`${styles.gameButton} ${styles.partySizeButton}`} disabled={isLoadingAction}>Create Trio</button>
                                <button onClick={() => handleCreateParty(5)} className={`${styles.gameButton} ${styles.partySizeButton}`} disabled={isLoadingAction}>Create Squad</button>
                            </div>
                        </div>
                    ) : (
                        // In a party - Show Party Details
                        <div className={styles.partyContent}>
                             <p className={styles.createPartyText} style={{textAlign: 'center', marginBottom: '15px'}}>
                                Lobby: <span style={{color: 'var(--color-accent)'}}>{currentParty.name}</span> ({currentParty.members.length}/{currentParty.maxSize})
                             </p>
                            {/* Member List */}
                            <ul className={styles.memberList}>
                                {currentParty.members.map(member => (
                                    <li key={member.id} className={styles.memberItem}>
                                        <div className={styles.memberAvatar}>{member.username.substring(0,2)}</div>
                                        <span className={styles.memberUsername}>{member.username} {member.id === currentParty.leader ? '(Leader)' : ''}</span>
                                        {/* Kick Button (only if leader and not self) */}
                                        {currentParty.leader === sampleUserData.id && member.id !== sampleUserData.id && (
                                            <button onClick={() => handleKickMember(member.id)} className={styles.kickButton} title="Kick Member" disabled={isLoadingAction}>✕</button>
                                        )}
                                    </li>
                                ))}
                            </ul>

                             {/* Invite Section (only if party not full and user is leader?) */}
                            {currentParty.members.length < currentParty.maxSize && (
                                <div className={styles.inviteSection}>
                                    <form className={styles.inviteForm} onSubmit={handleInviteFriend}>
                                         <label htmlFor="invite-username-party" className="sr-only">Friend's Username</label>
                                        <input
                                            type="text" id="invite-username-party" value={inviteInput}
                                            className={styles.inviteInput} placeholder="Invite username..."
                                            disabled={isLoadingAction || isQueueing} required
                                        />
                                        <button
                                            type="submit" className={`${styles.gameButton} ${styles.inviteButton}`}
                                            disabled={isLoadingAction || isQueueing || !inviteInput.trim()}
                                        >
                                            {isLoadingAction ? '...' : 'Invite'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Party Actions */}
                            <div className={styles.partyActions}>
                                <button onClick={handleLeaveParty} className={`${styles.gameButton} ${styles.leavePartyButton}`} disabled={isLoadingAction || isQueueing}>
                                    Leave Party
                                </button>
                                {isQueueing ? (
                                     <button onClick={handleCancelQueue} className={`${styles.gameButton} ${styles.cancelQueueButton}`} disabled={isLoadingAction}>
                                        Cancel Queue
                                    </button>
                                ) : (
                                     <button
                                        onClick={handleStartQueue}
                                        className={`${styles.gameButton} ${styles.startQueueButton}`}
                                        // Disable if party isn't full? (optional)
                                        // disabled={isLoadingAction || currentParty.members.length < currentParty.maxSize}
                                        disabled={isLoadingAction}
                                        // title={currentParty.members.length < currentParty.maxSize ? `Need ${currentParty.maxSize} members to queue` : "Start Queue"}
                                        title="Start Queue"
                                    >
                                        Start Queue
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                {/* --- Public Parties Panel --- */}
                <div className={`${styles.panel} ${styles.publicPartiesPanel}`}>
                     <div className={styles.lobbyBrowserHeader}> {/* Reuse styles */}
                         <h3 className={styles.panelHeader} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                            <span className={styles.panelIcon}>🌐</span> Browse Parties
                        </h3>
                        <div className={styles.lobbySearchContainer}> {/* Reuse styles */}
                             <span className={styles.lobbySearchIcon}>🔍</span>
                            <input
                                type="text" value={partySearchTerm} onChange={(e) => setPartySearchTerm(e.target.value)}
                                className={styles.lobbySearchInput} /* Reuse styles */
                                placeholder="Search by name or leader..."
                                disabled={isLoadingParties || !!currentParty} /* Disable if loading or in party */
                            />
                        </div>
                    </div>
                    {/* Party List Container */}
                    <div className={styles.lobbyListContainer}> {/* Reuse styles */}
                        {isLoadingParties ? (
                            <p className={styles.noPartiesMessage}>Loading public parties...</p> // Reuse style
                        ) : filteredPublicParties.length > 0 ? (
                            <ul className={styles.lobbyList}> {/* Reuse styles */}
                                {filteredPublicParties.map((party) => (
                                    <li key={party.id} className={styles.partyItem}>
                                        <div className="flex-grow overflow-hidden mr-4">
                                            <span className={styles.partyName}>{party.name}</span>
                                            <span className={styles.partyMembersInfo}> {/* Use specific class */}
                                                Leader: {party.leader} | {getPartySizeName(party.maxSize)}
                                            </span>
                                        </div>
                                        <div className={styles.partyInfo}>
                                            <span className={styles.partySize}>
                                                {party.members.length}/{party.maxSize}
                                            </span>
                                            <button
                                                onClick={() => handleJoinParty(party.id, party.name)}
                                                className={`${styles.gameButton} ${styles.joinPartyButton}`} // Use specific class or reuse joinButton
                                                disabled={isLoadingAction || !!currentParty} // Disable if busy or already in party
                                            > Join </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.noPartiesMessage}> {/* Reuse styles */}
                                {partySearchTerm ? 'No parties match search.' : 'No public parties found.'}
                            </p>
                        )}
                    </div>
                </div>

            </div>{/* End Actions Grid */}
        </div> // End Container
    );
};

export default Partymmr;