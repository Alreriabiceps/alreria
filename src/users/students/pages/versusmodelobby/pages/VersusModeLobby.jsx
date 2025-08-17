import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./VersusModeLobby.module.css"; // Import the CSS module
import { useAuth } from "../../../../../contexts/AuthContext";
import { io } from "socket.io-client";
import CreateLobbyModal from "../components/CreateLobbyModal";
import JoinLobbyModal from "../components/JoinLobbyModal";
import InvitePanel from "../components/InvitePanel";
import CreatePanel from "../components/CreatePanel";
import QueuePanel from "../components/QueuePanel";
import JoinLobbyPanel from "../components/JoinLobbyPanel";
import FloatingStars from "../../../components/FloatingStars/FloatingStars"; // Import FloatingStars
import {
  FaUserFriends,
  FaPlus,
  FaSearch,
  FaUsers,
  FaExclamationTriangle,
  FaSyncAlt,
  FaRedo,
  FaBook,
} from "react-icons/fa";

// Function to format time (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Socket reconnect configuration
const WS_RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

const VersusModeLobby = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("lobby");

  const [inviteUsername, setInviteUsername] = useState("");
  const [lobbies, setLobbies] = useState([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [lobbySearchTerm, setLobbySearchTerm] = useState("");
  const [isQueueing, setIsQueueing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const queueIntervalRef = useRef(null);
  const [showCreateLobbyModal, setShowCreateLobbyModal] = useState(false);
  const [lobbyForm, setLobbyForm] = useState({
    name: "",
    isPrivate: false,
    password: "",
  });
  const [error, setError] = useState(null);
  const [lobbyTimers, setLobbyTimers] = useState({});
  const [hasActiveLobby, setHasActiveLobby] = useState(false);
  const [userCreatedLobby, setUserCreatedLobby] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of lobbies per page
  const [showJoinLobbyModal, setShowJoinLobbyModal] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const socketRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const navigate = useNavigate();
  const isGameInitHandledRef = useRef(false);
  const isMountedRef = useRef(false);

  // Backend URL helper
  const getBackendUrl = () =>
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Unified API helper
  const apiFetch = useCallback(
    async (path, options = {}) => {
      const backendurl = getBackendUrl();
      const resp = await fetch(`${backendurl}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "include",
      });
      return resp;
    },
    [token]
  );

  // Check if user has a created lobby (host or player)
  const checkUserCreatedLobby = useCallback(async () => {
    try {
      if (!token) return;
      const response = await apiFetch("/api/lobby/my-lobby", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          setUserCreatedLobby(data.data);
          setHasActiveLobby(true);
        } else {
          setUserCreatedLobby(null);
          setHasActiveLobby(false);
        }
      } else if (response.status === 404) {
        setUserCreatedLobby(null);
        setHasActiveLobby(false);
      } else {
        setUserCreatedLobby(null);
        setHasActiveLobby(false);
      }
    } catch (error) {
      console.error("Error checking user created lobby:", error);
    }
  }, [token, apiFetch]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const backendurl = getBackendUrl();
    if (!backendurl) {
      console.error("Backend URL is not defined");
      setError("Server configuration error. Please contact support.");
      return;
    }

    // If there's an existing connection, disconnect it first
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners?.();
        socketRef.current.disconnect();
      } catch (_) {}
    }

    try {
      console.log("Connecting to WebSocket:", backendurl);
      socketRef.current = io(backendurl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: WS_RECONNECT_DELAY,
        transports: ["websocket", "polling"],
        withCredentials: true,
        timeout: 20000,
        forceNew: true,
        path: "/socket.io/",
        autoConnect: true,
      });

      const socket = socketRef.current;

      // Clear any previous listeners to avoid duplicates
      socket.removeAllListeners();

      socket.on("connect", () => {
        console.log("WebSocket connected successfully");
        setWsConnected(true);
        reconnectAttempts.current = 0;
        setError(null);
      });

      // Lobby created
      socket.on("lobby:created", (lobby) => {
        console.log("Received lobby:created event:", lobby);
        setLobbies((prev) => {
          const exists = prev.some((l) => l._id === lobby._id);
          return exists ? prev : [...prev, lobby];
        });
      });

      // Lobby updated
      socket.on("lobby:updated", (lobby) => {
        console.log("Received lobby:updated event:", lobby);
        setLobbies((prev) =>
          prev.map((l) => (l._id === lobby._id ? { ...l, ...lobby } : l))
        );
      });

      // Lobby deleted
      socket.on("lobby:deleted", ({ lobbyId }) => {
        console.log("Received lobby:deleted event:", lobbyId);
        setLobbies((prev) => prev.filter((l) => l._id !== lobbyId));
      });

      // Game start (only handle once)
      socket.on("game:start", async (data) => {
        console.log("Received game:start event:", data);
        const isPlayerInGame = data.players.some((player) => {
          const playerId = player._id || player.id || player;
          return String(playerId) === String(user.id);
        });
        if (!isPlayerInGame) return;

        if (isGameInitHandledRef.current) {
          console.log("Game initialization already handled. Ignoring.");
          return;
        }
        isGameInitHandledRef.current = true;

        try {
          // Normalize players
          const formattedPlayers = data.players.map((player) => {
            if (typeof player === "object" && player._id) {
              return {
                userId: player._id,
                username: `${player.firstName || "Player"} ${
                  player.lastName || ""
                }`.trim(),
              };
            } else if (typeof player === "string") {
              return { userId: player, username: "Player" };
            } else {
              return {
                userId: player.id || player._id,
                username:
                  player.username ||
                  `${player.firstName || "Player"} ${
                    player.lastName || ""
                  }`.trim(),
              };
            }
          });

          const sortedPlayerIds = formattedPlayers.map((p) => p.userId).sort();
          const isFirstPlayer = String(user.id) === String(sortedPlayerIds[0]);

          let gameData;
          if (isFirstPlayer) {
            // Initialize game
            const response = await apiFetch("/api/game/initialize", {
              method: "POST",
              body: JSON.stringify({
                lobbyId: data.lobbyId,
                players: formattedPlayers,
              }),
            });
            gameData = await response.json();
          } else {
            // Wait for game data
            gameData = await new Promise((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error("Timeout waiting for game data")),
                15000
              );
              const handler = (initData) => {
                clearTimeout(timeout);
                socket.off("game:initialized", handler);
                resolve(initData);
              };
              socket.on("game:initialized", handler);
            });
          }

          if (gameData && gameData.success) {
            setError(null);
            navigate("/student/demo", {
              state: {
                gameId: gameData.data.gameState.gameId,
                players: data.players,
                currentPlayer: user.id,
                roomId: gameData.data.roomId,
                gameMode: "pvp",
                lobbyId: data.lobbyId,
              },
            });
          } else {
            setError(
              `Failed to initialize game: ${gameData?.error || "Unknown error"}`
            );
            isGameInitHandledRef.current = false;
          }
        } catch (err) {
          console.error("Error initializing game:", err);
          setError(`Failed to start game: ${err.message}`);
          isGameInitHandledRef.current = false;
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
        setWsConnected(false);
        setError(
          "Failed to connect to server. Please try refreshing the page."
        );
      });

      socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
        setError("Connection error. Please try refreshing the page.");
      });

      socket.on("disconnect", (reason) => {
        setWsConnected(false);
        isGameInitHandledRef.current = false;
        if (reason === "io server disconnect") {
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });
    } catch (error) {
      console.error("Error creating Socket.IO connection:", error);
      setWsConnected(false);
    }
  }, [token, user, navigate, apiFetch]);

  // Initialize WebSocket connection
  useEffect(() => {
    isMountedRef.current = true;
    if (token) connectWebSocket();
    return () => {
      isMountedRef.current = false;
      try {
        socketRef.current?.removeAllListeners?.();
        socketRef.current?.disconnect?.();
      } catch (_) {}
      socketRef.current = null;
      isGameInitHandledRef.current = false;
    };
  }, [connectWebSocket, token, navigate]);

  // Fetch lobbies
  const fetchLobbies = useCallback(async () => {
    try {
      if (!token) {
        setError("Please log in to access this feature");
        return;
      }
      setIsLoadingLobbies(true);
      const response = await apiFetch("/api/lobby", { method: "GET" });
      const data = await response.json();
      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lobbies");
      }
      // Ensure unique lobbies
      const uniqueLobbies = data.data.reduce((acc, current) => {
        const x = acc.find((item) => item._id === current._id);
        return x ? acc : acc.concat([current]);
      }, []);
      setLobbies(uniqueLobbies);
      const userActiveLobby = uniqueLobbies.find(
        (lobby) =>
          (lobby.hostId._id === user.id ||
            lobby.players?.some((p) => p._id === user.id)) &&
          lobby.status === "waiting" &&
          lobby.expiresAt > new Date()
      );
      setHasActiveLobby(!!userActiveLobby);
    } catch (err) {
      console.error("Error fetching lobbies:", err);
      setError(
        err.message || "Failed to load lobbies. Please try again later."
      );
    } finally {
      setIsLoadingLobbies(false);
    }
  }, [token, user, logout, apiFetch]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchLobbies();
      checkUserCreatedLobby();
    }
  }, [user, token, fetchLobbies, checkUserCreatedLobby]);

  // Queue timer
  useEffect(() => {
    if (isQueueing) {
      queueIntervalRef.current = setInterval(
        () => setQueueTime((t) => t + 1),
        1000
      );
    } else {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
      setQueueTime(0);
    }
    return () => {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    };
  }, [isQueueing]);

  // Pagination helpers
  const filteredLobbies = lobbies.filter(
    (lobby) =>
      lobby.name.toLowerCase().includes(lobbySearchTerm.toLowerCase()) ||
      (lobby.hostId?.firstName?.toLowerCase() || "").includes(
        lobbySearchTerm.toLowerCase()
      ) ||
      (lobby.hostId?.lastName?.toLowerCase() || "").includes(
        lobbySearchTerm.toLowerCase()
      )
  );
  const indexOfLastLobby = currentPage * itemsPerPage;
  const indexOfFirstLobby = indexOfLastLobby - itemsPerPage;
  const currentLobbies = filteredLobbies.slice(
    indexOfFirstLobby,
    indexOfLastLobby
  );
  const totalPages = Math.ceil(filteredLobbies.length / itemsPerPage);

  // Actions
  const handleInviteChange = (e) => setInviteUsername(e.target.value);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (isLoadingAction || isQueueing || !inviteUsername.trim()) return;
    try {
      setIsLoadingAction(true);
      setError(null);
      const response = await apiFetch("/api/lobby/invite", {
        method: "POST",
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout();
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Failed to send duel invite");
      setInviteUsername("");
    } catch (err) {
      console.error("Error sending duel invite:", err);
      setError(
        err.message || "Failed to send duel invite. Please try again later."
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCreateLobby = async () => {
    try {
      setIsLoadingAction(true);
      setError(null);
      const response = await apiFetch("/api/lobby", {
        method: "POST",
        body: JSON.stringify({
          name: lobbyForm.name || "Open Lobby",
          isPrivate: lobbyForm.isPrivate,
          password: lobbyForm.isPrivate ? lobbyForm.password : undefined,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout();
        return;
      }
      if (response.status === 400) {
        setError(data.error || "Failed to create lobby");
        if (
          data.error ===
          "You already have an active lobby. Please wait for it to expire before creating a new one."
        ) {
          setHasActiveLobby(true);
        }
        return;
      }
      if (!response.ok) throw new Error(data.error || "Failed to create lobby");
      setShowCreateLobbyModal(false);
      setLobbyForm({ name: "", isPrivate: false, password: "" });
      setHasActiveLobby(true);
      setUserCreatedLobby(data.data);
      await fetchLobbies();
    } catch (err) {
      console.error("Error creating lobby:", err);
      setError(
        err.message || "Failed to create lobby. Please try again later."
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleJoinLobby = async (lobbyId, lobbyName, password) => {
    try {
      setIsLoadingAction(true);
      setJoinError(null);
      const response = await apiFetch(`/api/lobby/${lobbyId}/join`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.status === 401) {
        if (data.error === "Invalid password") setJoinError("Invalid password");
        else {
          setError("Your session has expired. Please log in again.");
          logout();
        }
        return;
      }
      if (response.status === 400) {
        setJoinError(data.error || "Failed to join lobby");
        if (data.error === "You already have an active lobby")
          setHasActiveLobby(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Failed to join lobby");
      setShowJoinLobbyModal(false);
      await fetchLobbies();
    } catch (err) {
      console.error("Error joining lobby:", err);
      setJoinError(
        err.message || "Failed to join lobby. Please try again later."
      );
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
  };

  const handleCancelQueue = async () => {
    if (!isQueueing) return;
    setIsQueueing(false);
  };

  const handleDeleteLobby = async (lobbyId) => {
    try {
      setIsLoadingAction(true);
      setError(null);
      const response = await apiFetch(`/api/lobby/${lobbyId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        logout();
        return;
      }
      if (!response.ok) throw new Error(data.error || "Failed to delete lobby");
      setHasActiveLobby(false);
      setUserCreatedLobby(null);
      await fetchLobbies();
    } catch (err) {
      console.error("Error deleting lobby:", err);
      setError(
        err.message || "Failed to delete lobby. Please try again later."
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  const tabs = [
    {
      id: "lobby",
      label: "Lobby Browser",
      icon: <FaSearch />,
      component: (
        <JoinLobbyPanel
          lobbySearchTerm={lobbySearchTerm}
          setLobbySearchTerm={setLobbySearchTerm}
          isLoadingLobbies={isLoadingLobbies}
          currentLobbies={currentLobbies}
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={setCurrentPage}
          getUniqueLobbyKey={(lobby) =>
            `${lobby._id}-${lobby.status}-${lobby.players?.length || 0}`
          }
          lobbyTimers={lobbyTimers}
          formatTime={formatTime}
          handleJoinClick={handleJoinClick}
          handleDeleteLobby={handleDeleteLobby}
          isLoadingAction={isLoadingAction}
          isQueueing={isQueueing}
          currentUserId={user?._id || user?.id}
          hasActiveLobby={hasActiveLobby}
        />
      ),
    },
    {
      id: "create",
      label: "Create Lobby",
      icon: <FaPlus />,
      component: (
        <CreatePanel
          lobbyForm={lobbyForm}
          setLobbyForm={setLobbyForm}
          showCreateLobbyModal={showCreateLobbyModal}
          setShowCreateLobbyModal={setShowCreateLobbyModal}
          handleCreateLobby={handleCreateLobby}
          isLoadingAction={isLoadingAction}
          hasActiveLobby={hasActiveLobby}
          userCreatedLobby={userCreatedLobby}
          handleDeleteLobby={handleDeleteLobby}
        />
      ),
    },
    {
      id: "challenge",
      label: "Challenge Pilot",
      icon: <FaUserFriends />,
      component: (
        <InvitePanel
          inviteUsername={inviteUsername}
          handleInviteChange={handleInviteChange}
          handleInviteSubmit={handleInviteSubmit}
          isLoadingAction={isLoadingAction}
          isQueueing={isQueueing}
        />
      ),
    },
    {
      id: "queue",
      label: "Matchmaking",
      icon: <FaUsers />,
      component: (
        <QueuePanel
          isQueueing={isQueueing}
          handleQueueMatchmaking={handleQueueMatchmaking}
          handleCancelQueue={handleCancelQueue}
        />
      ),
    },
  ];

  // Update lobby timers when lobbies change
  useEffect(() => {
    const newTimers = {};
    lobbies.forEach((lobby) => {
      if (lobby.timeRemaining) newTimers[lobby._id] = lobby.timeRemaining;
    });
    setLobbyTimers(newTimers);
  }, [lobbies]);

  // Queue Timer Effect
  useEffect(() => {
    if (isQueueing) {
      queueIntervalRef.current = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
      setQueueTime(0);
    }
    return () => {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    };
  }, [isQueueing]);

  return (
    <div className={styles.pvpContainer}>
      <FloatingStars />
      <div className={styles.floatingShapes}>
        <div className={styles.floatingShape1}></div>
        <div className={styles.floatingShape2}></div>
        <div className={styles.floatingShape3}></div>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Duels & Matchmaking
          {!wsConnected && (
            <span className={styles.connectionStatus}>
              <span
                className={`${styles.statusDot} ${styles.disconnected}`}
              ></span>
              Offline
            </span>
          )}
        </h1>
        <p className={styles.pageSubtitle}>
          Challenge rivals directly or find a random opponent
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className={styles.errorCloseButton}
          >
            ×
          </button>
        </div>
      )}

      {/* Connection Status Panel */}
      {!wsConnected && (
        <div className={styles.connectionPanel}>
          <div className={styles.connectionContent}>
            <FaExclamationTriangle className={styles.connectionIcon} />
            <div className={styles.connectionInfo}>
              <h3>Connection Issue</h3>
              <p>
                Unable to connect to the game server. Some features may be
                limited.
              </p>
            </div>
            <button className={styles.retryBtn} onClick={fetchLobbies}>
              <FaRedo /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      <div className={styles.statsPanel}>
        <div className={styles.statsContent}>
          <span className={styles.statItem}>
            <FaUsers /> Active Lobbies: <strong>{lobbies.length}</strong>
          </span>
          {hasActiveLobby && (
            <span className={styles.statItem}>
              <FaBook /> You have an active lobby
            </span>
          )}
          {isQueueing && (
            <span className={styles.statItem}>
              <FaSyncAlt className={styles.spinning} /> In Queue:{" "}
              {formatTime(queueTime)}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.contentPanel}>
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <div className={styles.tabNavigation}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateLobbyModal && (
        <CreateLobbyModal
          isOpen={showCreateLobbyModal}
          onClose={() => {
            setShowCreateLobbyModal(false);
            setLobbyForm({ name: "", isPrivate: false, password: "" });
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
          onSubmit={(password) =>
            handleJoinLobby(selectedLobby._id, selectedLobby.name, password)
          }
          lobby={selectedLobby}
          isLoading={isLoadingAction}
          error={joinError}
        />
      )}
    </div>
  );
};

export default VersusModeLobby;
