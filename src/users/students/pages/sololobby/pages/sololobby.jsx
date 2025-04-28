import React, { useState, useEffect, useRef } from "react";
import styles from "./Sololobby.module.css"; // Import the CSS module
import { useAuth } from '../../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Function to format time (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const CreateLobbyModal = ({ isOpen, onClose, onSubmit, form, setForm, isLoading, hasActiveLobby }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create {form.isPrivate ? 'Private' : 'Open'} Lobby</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          {hasActiveLobby ? (
            <div className={styles.infoMessage}>
              <p>⚠️ You already have an active lobby. Please wait for it to expire before creating a new one.</p>
            </div>
          ) : (
            <>
              {!form.isPrivate ? (
                <div className={styles.infoMessage}>
                  <p>⚠️ Open lobbies expire after 3 minutes. You can only have one active lobby at a time.</p>
                  <p>Click "Create Lobby" to proceed.</p>
                </div>
              ) : (
                <>
                  <div className={styles.infoMessage}>
                    <p>⚠️ Private lobbies expire after 3 minutes. You can only have one active lobby at a time.</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lobby-name">Lobby Name</label>
                    <input
                      id="lobby-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter lobby name"
                      className={styles.modalInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lobby-password">Password</label>
                    <input
                      id="lobby-password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter lobby password"
                      className={styles.modalInput}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button
            className={`${styles.gameButton} ${styles.cancelButton}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`${styles.gameButton} ${styles.submitButton}`}
            onClick={onSubmit}
            disabled={form.isPrivate && (!form.name || !form.password) || isLoading || hasActiveLobby}
          >
            {isLoading ? 'Creating...' : 'Create Lobby'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SoloLobby = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [inviteUsername, setInviteUsername] = useState("");
  const [lobbies, setLobbies] = useState([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [lobbySearchTerm, setLobbySearchTerm] = useState("");
  const [isQueueing, setIsQueueing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const queueIntervalRef = useRef(null);
  const [showCreateLobbyModal, setShowCreateLobbyModal] = useState(false);
  const [lobbyForm, setLobbyForm] = useState({ name: '', isPrivate: false, password: '' });
  const [error, setError] = useState(null);
  const [lobbyTimers, setLobbyTimers] = useState({});
  const [hasActiveLobby, setHasActiveLobby] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of lobbies per page

  // Fetch Lobbies Effect
  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        if (!token) {
          console.error('No token found');
          setError('Please log in to access this feature');
          return;
        }

        setIsLoadingLobbies(true);
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${backendurl}/api/lobby`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();
        console.log('Create lobby response:', data);

        if (response.status === 401) {
          console.error('Authentication failed:', data.error);
          setError('Your session has expired. Please log in again.');
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch lobbies');
        }

        setLobbies(data.data);
        // Check if user has any active lobby
        const userActiveLobby = data.data.find(lobby =>
          lobby.hostId._id === user._id &&
          lobby.status === 'waiting' &&
          lobby.expiresAt > new Date()
        );
        setHasActiveLobby(!!userActiveLobby);
      } catch (err) {
        console.error('Error fetching lobbies:', err);
        setError(err.message || 'Failed to load lobbies. Please try again later.');
      } finally {
        setIsLoadingLobbies(false);
      }
    };

    if (user?.id) {
      fetchLobbies();
    }
  }, [token, user, logout, navigate]);

  // Update lobby timers effect
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setLobbyTimers(prev => {
        const newTimers = { ...prev };
        Object.keys(newTimers).forEach(lobbyId => {
          if (newTimers[lobbyId] > 0) {
            newTimers[lobbyId] -= 1;
          } else {
            delete newTimers[lobbyId];
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Update timers when lobbies change
  useEffect(() => {
    const newTimers = {};
    lobbies.forEach(lobby => {
      if (lobby.timeRemaining) {
        newTimers[lobby._id] = lobby.timeRemaining;
      }
    });
    setLobbyTimers(newTimers);
  }, [lobbies]);

  // Queue Timer Effect
  useEffect(() => {
    if (isQueueing) {
      queueIntervalRef.current = setInterval(() => {
        setQueueTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
      setQueueTime(0);
    }
    return () => {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    };
  }, [isQueueing]);

  // Filter Lobbies
  const filteredLobbies = lobbies.filter(
    (lobby) =>
      lobby.name.toLowerCase().includes(lobbySearchTerm.toLowerCase()) ||
      (lobby.hostId?.firstName?.toLowerCase() || '').includes(lobbySearchTerm.toLowerCase()) ||
      (lobby.hostId?.lastName?.toLowerCase() || '').includes(lobbySearchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastLobby = currentPage * itemsPerPage;
  const indexOfFirstLobby = indexOfLastLobby - itemsPerPage;
  const currentLobbies = filteredLobbies.slice(indexOfFirstLobby, indexOfLastLobby);
  const totalPages = Math.ceil(filteredLobbies.length / itemsPerPage);

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleInviteChange = (e) => setInviteUsername(e.target.value);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim() || isLoadingAction || isQueueing) return;
    setIsLoadingAction(true);
    console.log(`Sending invite to ${inviteUsername}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Invite sent to ${inviteUsername}! (Placeholder)`);
    setInviteUsername("");
    setIsLoadingAction(false);
  };

  const handleCreateLobby = async () => {
    try {
      setIsLoadingAction(true);
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendurl}/api/lobby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: lobbyForm.name || 'Open Lobby',
          isPrivate: lobbyForm.isPrivate,
          password: lobbyForm.password,
          expiresAt: !lobbyForm.isPrivate ? new Date(Date.now() + 3 * 60 * 1000).toISOString() : undefined
        })
      });

      const data = await response.json();
      console.log('Create lobby response:', data);

      if (response.status === 401) {
        console.error('Authentication failed:', data.error);
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lobby');
      }

      setShowCreateLobbyModal(false);
      setLobbyForm({ name: '', isPrivate: false, password: '' });
      // Refresh lobbies
      fetchLobbies();
    } catch (err) {
      console.error('Error creating lobby:', err);
      console.error('Error details:', err.message);
      setError(err.message || 'Failed to create lobby. Please try again later.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleJoinLobby = async (lobbyId, lobbyName) => {
    try {
      setIsLoadingAction(true);
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendurl}/api/lobbies/${lobbyId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.status === 401) {
        console.error('Authentication failed:', data.error);
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join lobby');
      }

      // Navigate to the game page
      navigate('/student/pvp', { state: { lobbyId, lobbyName } });
    } catch (err) {
      console.error('Error joining lobby:', err);
      setError(err.message || 'Failed to join lobby. Please try again later.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleQueueMatchmaking = async () => {
    if (isLoadingAction || isQueueing) return;
    setIsQueueing(true);
    // TODO: Implement matchmaking queue
  };

  const handleCancelQueue = async () => {
    if (!isQueueing) return;
    setIsQueueing(false);
    // TODO: Implement cancel queue
  };

  return (
    <div className={styles.pvpContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Duels & Matchmaking</h1>
        <p className={styles.pageSubtitle}>
          Challenge rivals directly or find a random opponent
        </p>
      </div>
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.errorCloseButton}>
            ×
          </button>
        </div>
      )}
      <div className={styles.actionsGrid}>
        <div className={`${styles.panel} ${styles.invitePanel}`}>
          <h3 className={styles.panelHeader}>
            <span className={styles.panelIcon}>✉️</span> Challenge a Pilot
          </h3>
          <form className={styles.inviteForm} onSubmit={handleInviteSubmit}>
            <label htmlFor="invite-username" className="sr-only">
              Friend's Username
            </label>
            <input
              type="text"
              id="invite-username"
              value={inviteUsername}
              onChange={handleInviteChange}
              className={styles.inviteInput}
              placeholder="Enter Pilot Username..."
              disabled={isLoadingAction || isQueueing}
              required
            />
            <button
              type="submit"
              className={`${styles.gameButton} ${styles.inviteButton}`}
              disabled={isLoadingAction || isQueueing || !inviteUsername.trim()}
            >
              {isLoadingAction ? "Sending..." : "Send Duel Invite"}
            </button>
          </form>
        </div>
        <div className={`${styles.panel} ${styles.createPanel}`}>
          <h3 className={styles.panelHeader}>
            <span className={styles.panelIcon}>➕</span> Create Lobby
          </h3>
          <p className={styles.createDescription}>
            Create a lobby for other pilots to join your challenge!
          </p>
          <div className={styles.lobbyButtons}>
            <button
              onClick={() => {
                setLobbyForm(prev => ({ ...prev, isPrivate: false }));
                setShowCreateLobbyModal(true);
              }}
              className={`${styles.gameButton} ${styles.createButton}`}
              disabled={isLoadingAction || isQueueing}
            >
              {isLoadingAction ? "Creating..." : "Open Lobby"}
            </button>
            <button
              onClick={() => {
                setLobbyForm(prev => ({ ...prev, isPrivate: true }));
                setShowCreateLobbyModal(true);
              }}
              className={`${styles.gameButton} ${styles.createButton}`}
              disabled={isLoadingAction || isQueueing}
            >
              {isLoadingAction ? "Creating..." : "Private Lobby"}
            </button>
          </div>
        </div>
        <div className={`${styles.panel} ${styles.queuePanel}`}>
          <h3 className={styles.panelHeader}>
            <span className={styles.panelIcon}>🛰️</span> Matchmaking Queue
          </h3>
          <div className={styles.queuePanelContent}>
            {isQueueing ? (
              <>
                <p className={styles.queueStatus}>Searching for opponent...</p>
                <p className={styles.queueTime}>{formatTime(queueTime)}</p>
                <button
                  onClick={handleCancelQueue}
                  className={`${styles.gameButton} ${styles.cancelQueueButton}`}
                >
                  Cancel Search
                </button>
              </>
            ) : (
              <>
                <p className={styles.createDescription}>
                  Find a random opponent near your skill level for a quick 1v1
                  duel.
                </p>
                <div className={styles.queueButtons}>
                  <button
                    onClick={handleQueueMatchmaking}
                    className={`${styles.gameButton} ${styles.queueButton}`}
                    disabled={isLoadingAction}
                  >
                    Queue for Match
                  </button>
                  <button
                    onClick={() => navigate('/student/pvp', { state: { isDemo: true } })}
                    className={`${styles.gameButton} ${styles.demoButton}`}
                    disabled={isLoadingAction}
                  >
                    Try Demo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={`${styles.panel} ${styles.joinLobbyPanel}`}>
          <div className={styles.lobbyBrowserHeader}>
            <h3 className={styles.panelHeader}>
              <span className={styles.panelIcon}>🚪</span> Lobby
            </h3>
            <div className={styles.lobbySearchContainer}>
              <span className={styles.lobbySearchIcon}>🔍</span>
              <input
                type="text"
                value={lobbySearchTerm}
                onChange={(e) => setLobbySearchTerm(e.target.value)}
                className={styles.lobbySearchInput}
                placeholder="Search lobbies..."
                aria-label="Search lobbies"
                disabled={isLoadingLobbies || isQueueing}
              />
            </div>
          </div>
          <div className={styles.lobbyListContainer}>
            {isLoadingLobbies ? (
              <p className={styles.noLobbiesMessage}>Loading lobbies...</p>
            ) : currentLobbies.length > 0 ? (
              <>
                <ul className={styles.lobbyList}>
                  {currentLobbies.map((lobby) => (
                    <li key={lobby._id} className={styles.lobbyItem}>
                      <div className={styles.lobbyInfo}>
                        <div className={styles.lobbyHeader}>
                          <span className={styles.lobbyName}>{lobby.name}</span>
                          {lobby.isPrivate && (
                            <span className={styles.privateBadge}>Private</span>
                          )}
                          {lobbyTimers[lobby._id] && (
                            <span className={styles.timerBadge}>
                              {formatTime(lobbyTimers[lobby._id])}
                            </span>
                          )}
                        </div>
                        <div className={styles.lobbyDetails}>
                          <span className={styles.lobbyHost}>
                            Host: {lobby.hostId ? `${lobby.hostId.firstName} ${lobby.hostId.lastName}` : 'Unknown'}
                          </span>
                          <span className={styles.lobbyPlayers}>
                            Players: {lobby.players?.length || 0}/{lobby.maxPlayers}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinLobby(lobby._id, lobby.name)}
                        className={`${styles.gameButton} ${styles.joinButton}`}
                        disabled={isLoadingAction || isQueueing || (lobby.players?.length || 0) >= lobby.maxPlayers}
                      >
                        Join
                      </button>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={`${styles.gameButton} ${styles.pageButton}`}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    <span className={styles.pageInfo}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className={`${styles.gameButton} ${styles.pageButton}`}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.noLobbiesMessage}>
                {lobbySearchTerm ? "No lobbies match your search." : "No active lobbies found."}
              </p>
            )}
          </div>
        </div>
      </div>
      {showCreateLobbyModal && (
        <CreateLobbyModal
          isOpen={showCreateLobbyModal}
          onClose={() => {
            setShowCreateLobbyModal(false);
            setLobbyForm({ name: '', isPrivate: false, password: '' });
          }}
          onSubmit={handleCreateLobby}
          form={lobbyForm}
          setForm={setLobbyForm}
          isLoading={isLoadingAction}
          hasActiveLobby={hasActiveLobby}
        />
      )}
    </div>
  );
};

export default SoloLobby;
