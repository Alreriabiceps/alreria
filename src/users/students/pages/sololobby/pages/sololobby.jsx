import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Add these constants at the top of the file
const WS_RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

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

const JoinLobbyModal = ({ isOpen, onClose, onSubmit, lobby, isLoading, error }) => {
  if (!isOpen) return null;

  const getLobbyStatus = () => {
    if (!lobby) return '';
    if (lobby.status !== 'waiting') return 'Game in progress';
    if (lobby.players.length >= lobby.maxPlayers) return 'Lobby full';
    return 'Waiting for players';
  };

  const getTimeRemaining = () => {
    if (!lobby?.expiresAt) return '';
    const timeRemaining = Math.max(0, Math.floor((new Date(lobby.expiresAt) - new Date()) / 1000));
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `Expires in: ${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.joinModal}`}>
        <div className={styles.modalHeader}>
          <h2>Join Lobby: {lobby?.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.lobbyInfo}>
            <div className={styles.lobbyDetail}>
              <span className={styles.detailLabel}>Host:</span>
              <span className={styles.detailValue}>
                {lobby?.hostId?.firstName} {lobby?.hostId?.lastName}
              </span>
            </div>
            <div className={styles.lobbyDetail}>
              <span className={styles.detailLabel}>Status:</span>
              <span className={styles.detailValue}>{getLobbyStatus()}</span>
            </div>
            <div className={styles.lobbyDetail}>
              <span className={styles.detailLabel}>Players:</span>
              <span className={styles.detailValue}>
                {lobby?.players?.length || 0}/{lobby?.maxPlayers}
              </span>
            </div>
            {!lobby?.isPrivate && lobby?.expiresAt && (
              <div className={styles.lobbyDetail}>
                <span className={styles.detailLabel}>Time Remaining:</span>
                <span className={styles.detailValue}>{getTimeRemaining()}</span>
              </div>
            )}
            {lobby?.isPrivate && (
              <div className={styles.formGroup}>
                <label htmlFor="lobby-password" className={styles.passwordLabel}>
                  Password Required
                </label>
                <input
                  id="lobby-password"
                  type="password"
                  placeholder="Enter lobby password"
                  className={styles.modalInput}
                  onChange={(e) => onSubmit(e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}
          </div>
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              <p>{error}</p>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button
            className={`${styles.gameButton} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          {!lobby?.isPrivate && (
            <button
              className={`${styles.gameButton} ${styles.submitButton}`}
              onClick={() => onSubmit()}
              disabled={isLoading || lobby?.players?.length >= lobby?.maxPlayers || lobby?.status !== 'waiting'}
            >
              {isLoading ? 'Joining...' : 'Join Lobby'}
            </button>
          )}
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
  const [showJoinLobbyModal, setShowJoinLobbyModal] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const socketRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectAttempts = useRef(0);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const backendurl = import.meta.env.VITE_BACKEND_URL;
    const wsUrl = backendurl.replace(/^http/, 'ws');
    
    try {
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send authentication token
        socketRef.current.send(JSON.stringify({
          type: 'auth',
          token
        }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'lobby:created':
              setLobbies(prev => [...prev, data.lobby]);
              break;
            case 'lobby:updated':
              setLobbies(prev => prev.map(lobby => 
                lobby._id === data.lobby._id ? data.lobby : lobby
              ));
              break;
            case 'game:start':
              if (data.players.some(player => player._id === user._id)) {
                navigate('/student/pvp', { 
                  state: { 
                    lobbyId: data.lobbyId,
                    lobbyName: data.lobbyName
                  }
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(connectWebSocket, WS_RECONNECT_DELAY);
        } else {
          console.error('Max reconnection attempts reached');
          setError('Connection lost. Please refresh the page to reconnect.');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setWsConnected(false);
    }
  }, [token, user, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Define fetchLobbies function
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
      console.log('Fetch lobbies response:', data);

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

  // Fetch Lobbies Effect
  useEffect(() => {
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
          password: lobbyForm.isPrivate ? lobbyForm.password : undefined
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lobby');
      }

      // Close modal and reset form
      setShowCreateLobbyModal(false);
      setLobbyForm({ name: '', isPrivate: false, password: '' });
      
      // Refresh lobbies list
      await fetchLobbies();
      
    } catch (err) {
      console.error('Error creating lobby:', err);
      setError(err.message || 'Failed to create lobby. Please try again later.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleJoinLobby = async (lobbyId, lobbyName, password) => {
    try {
      setIsLoadingAction(true);
      setJoinError(null);
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendurl}/api/lobby/${lobbyId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join lobby');
      }

      setShowJoinLobbyModal(false);
      
      // If lobby is now full (status is in-progress), navigate to game
      if (data.data.status === 'in-progress') {
        navigate('/student/pvp', { state: { lobbyId, lobbyName } });
      } else {
        // Otherwise just refresh the lobby list
        fetchLobbies();
      }
      
    } catch (err) {
      console.error('Error joining lobby:', err);
      setJoinError(err.message || 'Failed to join lobby. Please try again later.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleJoinClick = (lobby) => {
    setSelectedLobby(lobby);
    setShowJoinLobbyModal(true);
    setJoinError(null);
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
      <div className={styles.connectionStatus}>
        <span className={`${styles.statusDot} ${wsConnected ? styles.connected : styles.disconnected}`} />
        {wsConnected ? 'Connected' : 'Disconnected'}
      </div>
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
      </div>
      <CreateLobbyModal
        isOpen={showCreateLobbyModal}
        onClose={() => setShowCreateLobbyModal(false)}
        onSubmit={handleCreateLobby}
        form={lobbyForm}
        setForm={setLobbyForm}
        isLoading={isLoadingAction}
        hasActiveLobby={hasActiveLobby}
      />
      <JoinLobbyModal
        isOpen={showJoinLobbyModal}
        onClose={() => setShowJoinLobbyModal(false)}
        onSubmit={handleJoinLobby}
        lobby={selectedLobby}
        isLoading={isLoadingAction}
        error={joinError}
      />
    </div>
  );
};

export default SoloLobby;