import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Sololobby.module.css"; // Import the CSS module
import { useAuth } from '../../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import QueueForMatch from '../../../pvp/QueueForMatch';

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

  // Add this helper function at the top level
  const getUniqueLobbyKey = (lobby) => {
    return `${lobby._id}-${lobby.status}-${lobby.players?.length || 0}-${Date.now()}`;
  };

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const backendurl = import.meta.env.VITE_BACKEND_URL;
    if (!backendurl) {
      console.error('Backend URL is not defined');
      setError('Server configuration error. Please contact support.');
      return;
    }

    // If there's an existing connection, disconnect it first
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      socketRef.current = io(backendurl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: WS_RECONNECT_DELAY,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        timeout: 45000,
        forceNew: true,
        path: '/socket.io/',
        extraHeaders: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      });

      socketRef.current.on('connect', () => {
        setWsConnected(true);
        reconnectAttempts.current = 0;
      });

      socketRef.current.on('lobby:created', (lobby) => {
        setLobbies(prev => {
          // Check if lobby already exists
          const exists = prev.some(l => l._id === lobby._id);
          if (!exists) {
            return [...prev, lobby];
          }
          return prev;
        });
      });

      socketRef.current.on('lobby:updated', (lobby) => {
        setLobbies(prev => prev.map(l => 
          l._id === lobby._id ? { ...l, ...lobby } : l
        ));
      });

      socketRef.current.on('lobby:deleted', ({ lobbyId }) => {
        setLobbies(prev => prev.filter(l => l._id !== lobbyId));
      });

      socketRef.current.on('game:start', (data) => {
        if (data.players.some(player => player._id === user.id)) {
          navigate('/student/pvp', { 
            state: { 
              lobbyId: data.lobbyId,
              lobbyName: data.lobbyName
            }
          });
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setWsConnected(false);
        setError('Failed to connect to server. Please try refreshing the page.');
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket.IO error:', error);
        setError('Connection error. Please try refreshing the page.');
      });

      socketRef.current.on('disconnect', (reason) => {
        setWsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect();
            }
          }, 1000);
        }
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      setWsConnected(false);
    }
  }, [token, user, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      if (mounted && token) {
        connectWebSocket();
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      if (socketRef.current) {
        // Only disconnect if the socket is actually connected
        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }
        socketRef.current = null;
      }
    };
  }, [connectWebSocket, token]);

  // Define fetchLobbies function
  const fetchLobbies = useCallback(async () => {
    try {
      if (!token) {
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

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lobbies');
      }

      // Ensure unique lobbies by filtering out duplicates
      const uniqueLobbies = data.data.reduce((acc, current) => {
        const x = acc.find(item => item._id === current._id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setLobbies(uniqueLobbies);
      const userActiveLobby = uniqueLobbies.find(lobby =>
        lobby.hostId._id === user.id &&
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
  }, [token, user, logout, navigate]);

  // Fetch Lobbies Effect
  useEffect(() => {
    if (user?.id) {
      fetchLobbies();
    }
  }, [user?.id, fetchLobbies]);

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
      setError(null);
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendurl) {
        throw new Error('Backend URL is not configured');
      }

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
      console.log('Create lobby response:', data);

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
        return;
      }

      if (response.status === 400) {
        setError(data.error || 'Failed to create lobby');
        if (data.error === 'You already have an active lobby. Please wait for it to expire before creating a new one.') {
          setHasActiveLobby(true);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lobby');
      }

      // Close modal and reset form
      setShowCreateLobbyModal(false);
      setLobbyForm({ name: '', isPrivate: false, password: '' });
      setHasActiveLobby(true);
      
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
      
      if (!backendurl) {
        throw new Error('Backend URL is not configured');
      }

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
      console.log('Join lobby response:', data);

      if (response.status === 401) {
        if (data.error === 'Invalid password') {
          setJoinError('Invalid password');
        } else {
          setError('Your session has expired. Please log in again.');
          logout();
          navigate('/login');
        }
        return;
      }

      if (response.status === 400) {
        setJoinError(data.error || 'Failed to join lobby');
        if (data.error === 'You already have an active lobby') {
          setHasActiveLobby(true);
        }
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
        await fetchLobbies();
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

  const handleDeleteLobby = async (lobbyId) => {
    try {
        setIsLoadingAction(true);
        setError(null);
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        
        if (!backendurl) {
            throw new Error('Backend URL is not configured');
        }

        const response = await fetch(`${backendurl}/api/lobby/${lobbyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 401) {
            setError('Your session has expired. Please log in again.');
            logout();
            navigate('/login');
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete lobby');
        }

        setHasActiveLobby(false);
        
    } catch (err) {
        console.error('Error deleting lobby:', err);
        setError(err.message || 'Failed to delete lobby. Please try again later.');
    } finally {
        setIsLoadingAction(false);
    }
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
            <div className={styles.matchmakingQueueBox}>
              <h2>Matchmaking Queue</h2>
              <QueueForMatch />
            </div>
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
                    <li key={getUniqueLobbyKey(lobby)} className={styles.lobbyItem}>
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
                      <div className={styles.lobbyActions}>
                        {lobby.hostId?._id === user?.id ? (
                            <button
                                onClick={() => handleDeleteLobby(lobby._id)}
                                className={`${styles.gameButton} ${styles.deleteButton}`}
                                disabled={isLoadingAction}
                            >
                                {isLoadingAction ? 'Deleting...' : 'Delete'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleJoinClick(lobby)}
                                className={`${styles.gameButton} ${styles.joinButton}`}
                                disabled={isLoadingAction || isQueueing || (lobby.players?.length || 0) >= lobby.maxPlayers}
                            >
                                Join
                            </button>
                        )}
                      </div>
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
      {showJoinLobbyModal && (
        <JoinLobbyModal
          isOpen={showJoinLobbyModal}
          onClose={() => {
            setShowJoinLobbyModal(false);
            setSelectedLobby(null);
            setJoinError(null);
          }}
          onSubmit={(password) => handleJoinLobby(selectedLobby._id, selectedLobby.name, password)}
          lobby={selectedLobby}
          isLoading={isLoadingAction}
          error={joinError}
        />
      )}
    </div>
  );
};

export default SoloLobby;