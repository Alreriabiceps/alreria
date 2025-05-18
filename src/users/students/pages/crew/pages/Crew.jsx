import React, { useState, useEffect } from 'react';
import styles from './Crew.module.css'; // Import the CSS module
import { 
    FaUserPlus, FaUsers, FaGlobeAmericas, FaCheckCircle, FaHourglassHalf, FaSearch 
} from 'react-icons/fa';
import FloatingStars from '../../../components/FloatingStars/FloatingStars'; // Import FloatingStars
import useSocket from '../../../../../hooks/useSocket';
import ChatModal from './ChatModal';
import FloatingChatBubble from './FloatingChatBubble';

// --- Sample Data (Replace with actual friend data/state) ---
const sampleFriendsData = {
    all: [],
    accepted: [],
    pending: [],
};
// -------------------------------------------------------------

// Helper to get initials from a user object
function getInitials(user) {
    if (!user) return '';
    const names = [user.firstName, user.lastName].filter(Boolean);
    if (names.length) return names.map(n => n[0]).join('').toUpperCase();
    if (user.username) return user.username.slice(0, 2).toUpperCase();
    return '';
}

// Helper to get a color for avatar (based on username hash)
function getAvatarColor(username) {
    if (!username) return '#8884d8';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#f59e42', '#3b82f6', '#10b981', '#f43f5e', '#6366f1', '#fbbf24', '#14b8a6', '#a21caf'];
    return colors[Math.abs(hash) % colors.length];
}

const Crew = () => {
    const [addStudentId, setAddStudentId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'accepted', 'pending'
    const [feedback, setFeedback] = useState(null); // For success/error messages
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [acceptedFriends, setAcceptedFriends] = useState([]);
    const [loadingAccepted, setLoadingAccepted] = useState(false);
    const socketRef = useSocket();
    const [chatOpen, setChatOpen] = useState(false);
    const [chatFriend, setChatFriend] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    // --- Multiple chat bubbles state ---
    const [activeChats, setActiveChats] = useState([]); // Array of { friend, open, unreadCount }
    // --- Alert for max chats ---
    const [maxChatAlert, setMaxChatAlert] = useState(false);

    // TODO: useEffect to fetch actual friends data based on activeTab/searchTerm

    // Fetch pending requests when 'pending' tab is active
    useEffect(() => {
        if (activeTab === 'pending') {
            const fetchPending = async () => {
                setLoadingPending(true);
                setFeedback(null);
                try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL;
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${backendUrl}/api/friend-requests/pending`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to fetch pending requests');
                    setPendingRequests(data.data || []);
                } catch (err) {
                    setFeedback({ type: 'error', message: err.message });
                    setPendingRequests([]);
                } finally {
                    setLoadingPending(false);
                }
            };
            fetchPending();
        }
    }, [activeTab]);

    // Fetch accepted friends when 'all' or 'accepted' tab is active
    useEffect(() => {
        if (activeTab === 'accepted' || activeTab === 'all') {
            const fetchAccepted = async () => {
                setLoadingAccepted(true);
                setFeedback(null);
                try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL;
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${backendUrl}/api/friend-requests/friends`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Failed to fetch friends');
                    setAcceptedFriends(data.data || []);
                } catch (err) {
                    setFeedback({ type: 'error', message: err.message });
                    setAcceptedFriends([]);
                } finally {
                    setLoadingAccepted(false);
                }
            };
            fetchAccepted();
        }
    }, [activeTab]);

    // Real-time updates with Socket.IO
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;
        // When you receive a new friend request
        socket.on('friend:requestReceived', ({ request }) => {
            setPendingRequests(prev => [...prev, request]);
        });
        // When you send a request (optional: could show feedback)
        socket.on('friend:requestSent', ({ request }) => {
            setPendingRequests(prev => [...prev, request]);
        });
        // When a request is accepted (update both lists)
        socket.on('friend:requestAccepted', ({ request }) => {
            setAcceptedFriends(prev => [...prev, request]);
            setPendingRequests(prev => prev.filter(r => r._id !== request._id));
        });
        // When a friend is removed
        socket.on('friend:removed', ({ friendId }) => {
            setAcceptedFriends(prev => prev.filter(f => f._id !== friendId));
        });
        // When a pending request is cancelled
        socket.on('friend:requestCancelled', ({ requestId }) => {
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        });
        return () => {
            socket.off('friend:requestReceived');
            socket.off('friend:requestSent');
            socket.off('friend:requestAccepted');
            socket.off('friend:removed');
            socket.off('friend:requestCancelled');
        };
    }, [socketRef]);

    // Listen for incoming messages and update unread counts
    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;
      const handler = ({ message }) => {
        setActiveChats(prev => {
          const idx = prev.findIndex(c =>
            (c.friend._id === message.sender._id || c.friend._id === message.recipient._id)
          );
          if (idx === -1) return prev;
          // If chat is not open, increment unread
          if (!prev[idx].open) {
            return prev.map((c, i) => i === idx ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c);
          }
          return prev;
        });
      };
      socket.on('chat:message', handler);
      return () => socket.off('chat:message', handler);
    }, [socketRef]);

    // Handler for sending friend request
    const handleSendRequest = async (e) => {
        e.preventDefault();
        setFeedback(null);
        if (!addStudentId.trim()) return;
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/api/friend-requests/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ studentId: addStudentId.trim() })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send request');
            setFeedback({ type: 'success', message: 'Friend request sent!' });
            setAddStudentId(''); // Clear input after sending
        } catch (err) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    // Accept a friend request
    const handleAcceptRequest = async (requestId) => {
        setFeedback(null);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/api/friend-requests/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ requestId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to accept request');
            setFeedback({ type: 'success', message: 'Friend request accepted!' });
            // Remove accepted request from list
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (err) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    // Remove a friend
    const handleRemoveFriend = async (friendId) => {
        setFeedback(null);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/api/friend-requests/friend/${friendId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to remove friend');
            setFeedback({ type: 'success', message: 'Friend removed.' });
            setAcceptedFriends(prev => prev.filter(f => f._id !== friendId));
        } catch (err) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    // Cancel a pending request sent by the user
    const handleCancelRequest = async (requestId) => {
        setFeedback(null);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/api/friend-requests/request/${requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to cancel request');
            setFeedback({ type: 'success', message: 'Request cancelled.' });
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (err) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    // Calculate counts for tabs (use real data)
    const counts = {
        all: acceptedFriends.length,
        accepted: acceptedFriends.length,
        pending: pendingRequests.length,
    };

    // Determine which list to display (implement filtering later)
    let displayList;
    if (activeTab === 'pending') {
        displayList = pendingRequests;
    } else if (activeTab === 'accepted' || activeTab === 'all') {
        displayList = acceptedFriends.filter(friend => {
            // Show the other user (not self)
            const user = JSON.parse(localStorage.getItem('user'));
            const other = friend.requester._id === user?.id ? friend.recipient : friend.requester;
            return !searchTerm || (other.username && other.username.toLowerCase().includes(searchTerm.toLowerCase()));
        });
    } else {
        displayList = [];
    }

    // Helper: open a chat with a friend
    const openChatWith = (friend) => {
      setActiveChats((prev) => {
        // If already present, just open it and reset unread
        const idx = prev.findIndex(c => c.friend._id === friend._id);
        if (idx !== -1) {
          return prev.map((c, i) => i === idx ? { ...c, open: true, unreadCount: 0 } : c);
        }
        // Limit to 3 open chats
        const openCount = prev.filter(c => c.open).length;
        if (openCount >= 3) {
          setMaxChatAlert(true);
          return prev;
        }
        // Add new chat at the end
        return [...prev, { friend, open: true, unreadCount: 0 }];
      });
    };
    // Helper: close a chat
    const closeChatWith = (friendId) => {
      setActiveChats((prev) => prev.map(c => c.friend._id === friendId ? { ...c, open: false } : c));
    };
    // Helper: remove a chat (e.g. close bubble)
    const removeChatWith = (friendId) => {
      setActiveChats((prev) => prev.filter(c => c.friend._id !== friendId));
    };
    // Helper: toggle chat open/close and reset unread if opening
    const toggleChatOpen = (i) => {
      setActiveChats(prev => prev.map((c, idx) => idx === i ? { ...c, open: !c.open, unreadCount: !c.open ? 0 : c.unreadCount } : c));
    };

    return (
        <div className={styles.crewContainer}>
            <FloatingStars /> {/* Add FloatingStars component here */}

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Friends</h1>
                <p className={styles.pageSubtitle}>Connect with other students and challenge them to duels</p>
            </div>

            {/* Add Friend Panel */}
            <div className={styles.crewPanel} style={{ animationDelay: '0.8s' }}>
                <h2 className={styles.panelHeader}>
                    {/* <span className={styles.panelIcon}>➕</span> Placeholder Icon */}
                    <FaUserPlus className={styles.panelIcon} />
                    Add Friend
                </h2>
                <form className={styles.addFriendForm} onSubmit={handleSendRequest}>
                    <input
                        type="text"
                        value={addStudentId}
                        onChange={(e) => setAddStudentId(e.target.value)}
                        className={styles.addFriendInput}
                        placeholder="Enter student ID..."
                        aria-label="Student ID to add as friend"
                    />
                    <button type="submit" className={`${styles.gameButton} ${styles.sendRequestButton}`}>
                        Send Request
                    </button>
                </form>
                {feedback && (
                    <div className={feedback.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {feedback.message}
                    </div>
                )}
            </div>

            {/* All Friends Panel */}
            <div className={styles.crewPanel} style={{ animationDelay: '1.0s' }}>
                <h2 className={styles.panelHeader}>
                    {/* <span className={styles.panelIcon}>👥</span> Placeholder Icon */}
                    <FaUsers className={styles.panelIcon} />
                    All Friends
                </h2>

                {/* Sub-header with Tabs and Search */}
                <div className={styles.friendListHeader}>
                    <div className={styles.tabContainer}>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
                        >
                             {/* <span className={styles.tabIcon}>🌐</span> Placeholder */}
                             <FaGlobeAmericas className={styles.tabIcon} />
                             All <span className={styles.tabCount}>{counts.all}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('accepted')}
                            className={`${styles.tabButton} ${activeTab === 'accepted' ? styles.activeTab : ''}`}
                        >
                             {/* <span className={styles.tabIcon}>✔️</span> Placeholder */}
                             <FaCheckCircle className={styles.tabIcon} />
                             Accepted <span className={styles.tabCount}>{counts.accepted}</span>
                        </button>
                        <button
    onClick={() => setActiveTab('pending')}
    className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
>
    <FaHourglassHalf className={styles.tabIcon} />
    Pending <span className={styles.tabCount}>{counts.pending}</span>
</button>
                    </div>
                    {/* Search Input */}
                    <div className={styles.filterInputContainer} style={{ position: 'relative' }}> {/* Ensure relative positioning */}
                         <span className={styles.searchIconContainer} style={{ position: 'absolute' }}> {/* Explicit absolute */}
                             {/* <span className={styles.panelIcon}>🔍</span> Placeholder */}
                             <FaSearch className={styles.panelIcon} />
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
                            {/* <div className={styles.noFriendsIcon}>👥</div> Placeholder Icon */}
                            <FaUsers className={styles.noFriendsIcon} /> 
                            <h3 className={styles.noFriendsTitle}>No Friends Found</h3>
                            <p className={styles.noFriendsSubtitle}>
                                {activeTab === 'all' && searchTerm === ''
                                    ? "You don't have any friends yet. Add friends to connect with them."
                                    : `No ${activeTab} friends found${searchTerm ? ' matching your search' : ''}.`}
                            </p>
                        </div>
                    ) : (
                        activeTab === 'pending' ? (
                            loadingPending ? <p>Loading...</p> : (
                                <ul className={styles.pendingList}>
                                    {displayList.map(request => {
                                        const user = JSON.parse(localStorage.getItem('user'));
                                        const isSentByMe = request.requester?._id === user?.id;
                                        const other = isSentByMe ? request.recipient : request.requester;
                                        return (
                                            <li key={request._id} className={styles.pendingItem}>
                                                <span
                                                    className={styles.avatar}
                                                    style={{ backgroundColor: getAvatarColor(other?.studentId?.toString() || '') }}
                                                >
                                                    {getInitials(other)}
                                                </span>
                                                <span className={styles.friendInfo}>
                                                    <span className={styles.friendUsername}>
                                                      {(other.firstName || other.lastName)
                                                        ? `${other.firstName || ''} ${other.lastName || ''}`.trim()
                                                        : (other.studentId || 'Unknown User')}
                                                    </span>
                                                    {other.studentId ? (
                                                        <span className={styles.friendFullName}>{other.studentId}</span>
                                                    ) : null}
                                                </span>
                                                {isSentByMe ? (
                                                    <button
                                                        className={styles.cancelButton}
                                                        onClick={() => handleCancelRequest(request._id)}
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={styles.acceptButton}
                                                        onClick={() => handleAcceptRequest(request._id)}
                                                    >
                                                        Accept
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )
                        ) : (activeTab === 'accepted' || activeTab === 'all') ? (
                            loadingAccepted ? <p>Loading...</p> : (
                                <ul className={styles.acceptedList}>
                                    {displayList.map(friend => {
                                        const user = currentUser;
                                        const other = friend.requester._id === user?.id ? friend.recipient : friend.requester;
                                        return (
                                            <li key={friend._id} className={styles.acceptedItem}>
                                                <span
                                                    className={styles.avatar}
                                                    style={{ backgroundColor: getAvatarColor(other?.studentId?.toString() || '') }}
                                                >
                                                    {getInitials(other)}
                                                </span>
                                                <span className={styles.friendInfo}>
                                                    <span className={styles.friendUsername}>
                                                      {(other.firstName || other.lastName)
                                                        ? `${other.firstName || ''} ${other.lastName || ''}`.trim()
                                                        : (other.studentId || 'Unknown User')}
                                                    </span>
                                                    {other.studentId ? (
                                                        <span className={styles.friendFullName}>{other.studentId}</span>
                                                    ) : null}
                                                </span>
                                                <button
                                                    className={styles.removeButton}
                                                    onClick={() => handleRemoveFriend(friend._id)}
                                                >
                                                    Remove
                                                </button>
                                                <button
                                                    className={styles.acceptButton}
                                                    style={{ marginLeft: 8 }}
                                                    onClick={() => openChatWith(other)}
                                                >
                                                    Chat
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )
                        ) : (
                            // TODO: Render the actual list of friends here
                            // e.g., displayList.map(friend => <FriendItem key={friend.id} friend={friend} />)
                            <p>Friend list would appear here.</p> // Placeholder
                        )
                    )}
                </div>

            </div> {/* End All Friends Panel */}

            {/* Render chat bubbles and modals for each active chat */}
            {activeChats.map((chat, i) => (
              <React.Fragment key={chat.friend._id}>
                <FloatingChatBubble
                  onClick={() => toggleChatOpen(i)}
                  unreadCount={chat.unreadCount || 0}
                  style={{ bottom: 32 + i * 68, right: 32, zIndex: 2000 + i }}
                  friend={chat.friend}
                  onCloseBubble={() => removeChatWith(chat.friend._id)}
                />
                {chat.open && (
                  <ChatModal
                    open={chat.open}
                    onClose={() => closeChatWith(chat.friend._id)}
                    onMinimize={() => closeChatWith(chat.friend._id)}
                    friend={chat.friend}
                    currentUser={currentUser}
                    socketRef={socketRef}
                    fixedToBubble={true}
                    modalOffset={i}
                  />
                )}
              </React.Fragment>
            ))}

            {maxChatAlert && (
              <div style={{ position: 'fixed', bottom: 120, right: 32, background: '#232c3a', color: '#fff', padding: '12px 20px', borderRadius: 8, zIndex: 3000, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                You can only have 3 chats open at once. Please close one to open another.
                <button style={{ marginLeft: 16, background: '#82DFFF', color: '#0D131A', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setMaxChatAlert(false)}>OK</button>
              </div>
            )}

        </div> // End Container
    );
};

export default Crew;