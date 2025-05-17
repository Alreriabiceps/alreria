import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./VersusModeLobby.module.css"; // Import the CSS module
import { useAuth } from '../../../../../contexts/AuthContext';
import { io } from 'socket.io-client';
import CreateLobbyModal from '../components/CreateLobbyModal';
import JoinLobbyModal from '../components/JoinLobbyModal';
import InvitePanel from '../components/InvitePanel';
import CreatePanel from '../components/CreatePanel';
import QueuePanel from '../components/QueuePanel';
import JoinLobbyPanel from '../components/JoinLobbyPanel';

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

const VersusModeLobby = () => {
  const { user, token, logout } = useAuth();
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
          // Placeholder for game start
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
  }, [token, user]);

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
  }, [token, user, logout]);

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
    if (isLoadingAction || isQueueing || !inviteUsername.trim()) return;

    try {
    setIsLoadingAction(true);
      setError(null);
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendurl) {
        throw new Error('Backend URL is not configured');
      }

      const response = await fetch(`${backendurl}/api/lobby/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username: inviteUsername.trim() })
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send duel invite');
      }

      // Clear the input after successful invite
      setInviteUsername('');
      
    } catch (err) {
      console.error('Error sending duel invite:', err);
      setError(err.message || 'Failed to send duel invite. Please try again later.');
    } finally {
    setIsLoadingAction(false);
    }
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
        // Placeholder for game start
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
      <div className={styles.floatingShapes}>
        <div className={styles.floatingShape1}></div>
        <div className={styles.floatingShape2}></div>
        <div className={styles.floatingShape3}></div>
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
        <InvitePanel
          inviteUsername={inviteUsername}
          handleInviteChange={handleInviteChange}
          handleInviteSubmit={handleInviteSubmit}
          isLoadingAction={isLoadingAction}
          isQueueing={isQueueing}
        />
        <CreatePanel
          lobbyForm={lobbyForm}
          setLobbyForm={setLobbyForm}
          showCreateLobbyModal={showCreateLobbyModal}
          setShowCreateLobbyModal={setShowCreateLobbyModal}
          handleCreateLobby={handleCreateLobby}
          isLoadingAction={isLoadingAction}
          hasActiveLobby={hasActiveLobby}
        />
        <QueuePanel
          isQueueing={isQueueing}
          handleQueueMatchmaking={handleQueueMatchmaking}
          handleCancelQueue={handleCancelQueue}
        />
        <JoinLobbyPanel
          lobbySearchTerm={lobbySearchTerm}
          setLobbySearchTerm={setLobbySearchTerm}
          isLoadingLobbies={isLoadingLobbies}
          currentLobbies={currentLobbies}
          totalPages={totalPages}
          handlePageChange={handlePageChange}
          getUniqueLobbyKey={getUniqueLobbyKey}
          lobbyTimers={lobbyTimers}
          formatTime={formatTime}
          handleJoinClick={handleJoinClick}
          handleDeleteLobby={handleDeleteLobby}
          isLoadingAction={isLoadingAction}
          isQueueing={isQueueing}
        />
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

export default VersusModeLobby;