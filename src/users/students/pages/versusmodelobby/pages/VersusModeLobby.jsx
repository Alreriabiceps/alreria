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
import MatchFoundModal from "../components/MatchFoundModal";
import MatchConfirmModal from "../components/MatchConfirmModal";
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
  FaTimes,
  FaPlay,
  FaLock,
  FaUserCircle,
  FaArrowLeft,
  FaArrowRight,
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
  const [showMatchFoundModal, setShowMatchFoundModal] = useState(false);
  const [showMatchConfirmModal, setShowMatchConfirmModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log("🔍 Modal state changed:", { showMatchFoundModal, matchData });
  }, [showMatchFoundModal, matchData]);
  const socketRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const navigate = useNavigate();
  const isGameInitHandledRef = useRef(false);
  const isMountedRef = useRef(false);

  // Backend URL helper
  const getBackendUrl = () =>
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Calculate active players count from lobbies
  const getActivePlayersCount = () => {
    if (!lobbies || lobbies.length === 0) return 0;
    return lobbies.reduce((total, lobby) => {
      return total + (lobby.players?.length || 0);
    }, 0);
  };

  // Start queue timer - removed duplicate timer logic
  const startQueueTimer = () => {
    setQueueTime(0);
    // Timer is now handled by the useEffect below
  };

  // Handle match found event
  const handleMatchFound = (data) => {
    console.log("🎮 Match found via socket!", data);
    setIsQueueing(false);
    setQueueTime(0);
    // Timer is automatically cleared by the useEffect when isQueueing becomes false

    // Show confirm modal first
    const confirmModalData = {
      lobbyId: data.lobbyId,
      opponentName: data.opponentName || "Opponent",
    };
    console.log(
      "🔍 Socket event - Setting confirm modal data:",
      confirmModalData
    );
    setConfirmData(confirmModalData);
    setShowMatchConfirmModal(true);
  };

  // Handle match ready event (both players accepted)
  const handleMatchReady = (data) => {
    console.log("🎮 Match ready via socket!", data);

    // Show the vs modal
    const vsModalData = {
      lobbyId: data.lobbyId,
      player1Name: user.firstName + " " + user.lastName,
      player2Name: data.opponentName || confirmData?.opponentName || "Opponent",
    };
    setMatchData(vsModalData);
    setShowMatchConfirmModal(false);
    setIsWaitingForOpponent(false);
    setShowMatchFoundModal(true);
  };

  // Navigate to game
  const navigateToGame = (lobbyId) => {
    console.log("🚀 Navigating to game with lobby:", lobbyId);
    navigate("/student/demo", {
      state: {
        gameMode: "pvp",
        roomId: lobbyId,
        // Other game data will be loaded by the game component
      },
    });
  };

  // Handle match confirmation
  const handleMatchAccept = async () => {
    console.log("✅ Match accepted");

    try {
      // Send acceptance to backend
      const response = await apiFetch("/api/match/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.id,
          lobbyId: confirmData.lobbyId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Accept response:", data);

        if (data.ready) {
          // Both players accepted, show VS modal
          console.log("🎮 Both players accepted, showing VS modal");
          setShowMatchConfirmModal(false);

          const vsModalData = {
            lobbyId: confirmData.lobbyId,
            player1Name: user.firstName + " " + user.lastName,
            player2Name: confirmData.opponentName,
          };
          setMatchData(vsModalData);
          setShowMatchFoundModal(true);
        } else if (data.accepted) {
          // Player accepted, waiting for opponent
          console.log("⏳ Waiting for opponent to accept...");
          setIsWaitingForOpponent(true);
          // Keep the confirm modal open but show waiting state
          // We'll listen for socket events for when opponent accepts
        }
      } else {
        console.error("❌ Failed to accept match");
        // Handle error - maybe show error message
      }
    } catch (error) {
      console.error("❌ Error accepting match:", error);
    }
  };

  const handleMatchDecline = useCallback(() => {
    console.log("❌ Match declined");
    setShowMatchConfirmModal(false);
    setConfirmData(null);
    setIsWaitingForOpponent(false);
    // Could add logic here to notify the opponent
  }, []);

  // Handle proceeding from match found modal
  const handleProceedToGame = useCallback(() => {
    setShowMatchFoundModal(false);
    if (matchData) {
      navigateToGame(matchData.lobbyId);
    }
  }, [matchData]);

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

        // Update userCreatedLobby if this is the user's lobby
        if (userCreatedLobby && userCreatedLobby._id === lobby._id) {
          console.log("🔄 Updating userCreatedLobby with new data:", lobby);
          setUserCreatedLobby(lobby);

          // If lobby is now full and in-progress, trigger game start check
          if (
            lobby.status === "in-progress" &&
            lobby.players?.length >= lobby.maxPlayers
          ) {
            console.log(
              "🎮 Lobby is full and in-progress, checking if game should start..."
            );
            // The game:start event should be emitted by the backend
          }
        }
      });

      // Lobby deleted
      socket.on("lobby:deleted", ({ lobbyId }) => {
        console.log("Received lobby:deleted event:", lobbyId);
        setLobbies((prev) => prev.filter((l) => l._id !== lobbyId));
      });

      // Match found event
      socket.on("match_found", (data) => {
        console.log("🎮 Received match_found event:", data);
        console.log("🔍 Socket event details:", {
          socketId: socket.id,
          userId: socket.userId,
          data: data,
        });
        handleMatchFound(data);
      });

      // Game start (only handle once)
      socket.on("game:start", async (data) => {
        console.log("🎮 RECEIVED game:start EVENT");
        console.log("📦 Event data:", data);
        console.log("📊 Players data structure:", {
          playersCount: data.players?.length || 0,
          players: data.players?.map((p) => ({
            type: typeof p,
            keys: typeof p === "object" ? Object.keys(p) : "N/A",
            _id: p._id,
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            username: p.username,
            raw: p,
          })),
        });
        const isPlayerInGame = data.players.some((player) => {
          const playerId = player.userId || player._id || player.id || player;
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
            if (typeof player === "object" && player.userId) {
              return {
                userId: player.userId,
                username:
                  player.name ||
                  player.username ||
                  `${player.firstName || "Player"} ${
                    player.lastName || ""
                  }`.trim(),
              };
            } else if (typeof player === "string") {
              return { userId: player, username: "Player" };
            } else {
              return {
                userId: player.userId || player.id || player._id,
                username:
                  player.name ||
                  player.username ||
                  `${player.firstName || "Player"} ${
                    player.lastName || ""
                  }`.trim(),
              };
            }
          });

          console.log("🔧 Formatted players result:", {
            original: data.players,
            formatted: formattedPlayers,
            userInfo: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            },
          });

          const sortedPlayerIds = formattedPlayers.map((p) => p.userId).sort();
          const isFirstPlayer = String(user.id) === String(sortedPlayerIds[0]);

          let gameData;
          if (isFirstPlayer) {
            // Initialize game
            console.log("🎮 FIRST PLAYER - INITIALIZING GAME");
            console.log("📦 Sending data:", {
              lobbyId: data.lobbyId,
              players: formattedPlayers,
            });

            try {
              const response = await apiFetch("/api/game/initialize", {
                method: "POST",
                body: JSON.stringify({
                  lobbyId: data.lobbyId,
                  players: formattedPlayers,
                }),
              });

              console.log("📡 Response status:", response.status);
              gameData = await response.json();
              console.log("🎯 Game data received:", gameData);
            } catch (error) {
              console.error("❌ Game initialization failed:", error);
              throw error;
            }
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

            // Format players data properly for the Demo component
            const demoPlayers = data.players.map((player) => ({
              userId: player.userId || player._id || player.id,
              name:
                player.name ||
                player.username ||
                `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
                "Player",
              username:
                player.username ||
                player.name ||
                `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
                "Player",
              firstName: player.firstName,
              lastName: player.lastName,
            }));

            console.log("🎮 Sending formatted players to Demo:", demoPlayers);

            navigate("/student/demo", {
              state: {
                gameId: gameData.data.gameState.gameId,
                players: demoPlayers,
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
        // Clean up match_found listener specifically
        if (socketRef.current) {
          socketRef.current.off("match_found", handleMatchFound);
          socketRef.current.removeAllListeners?.();
          socketRef.current.disconnect?.();
        }
      } catch (_) {}
      socketRef.current = null;
      isGameInitHandledRef.current = false;
    };
  }, [token]); // Remove connectWebSocket dependency to prevent recreation

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

  // Queue timer - removed duplicate effect (kept the one below)

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
    if (isLoadingAction || isQueueing) {
      console.log("⚠️ Already queuing or loading, ignoring request");
      return;
    }

    try {
      setIsLoadingAction(true);
      setError(null);

      console.log("🎯 Joining matchmaking queue...");

      // Add to backend matchmaking queue
      const response = await apiFetch("/api/match/queue", {
        method: "POST",
        body: JSON.stringify({ studentId: user.id || user._id }),
      });

      console.log("📡 Matchmaking response:", {
        status: response.status,
        ok: response.ok,
        url: response.url,
      });

      const data = await response.json();
      console.log("📦 Matchmaking response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to join matchmaking queue");
      }

      if (data.matched) {
        // Found opponent immediately - show confirm modal
        console.log("🎮 Match found immediately!", data);
        setIsQueueing(false);

        // Show confirm modal immediately
        const confirmModalData = {
          lobbyId: data.lobbyId,
          opponentName: data.opponentName || "Opponent",
        };
        console.log("🔍 Setting confirm modal data:", confirmModalData);
        setConfirmData(confirmModalData);
        setShowMatchConfirmModal(true);

        // Also listen for socket event to ensure synchronization
        if (socketRef.current) {
          socketRef.current.off("match_found", handleMatchFound);
          socketRef.current.off("match_ready", handleMatchReady);
          socketRef.current.on("match_found", handleMatchFound);
          socketRef.current.on("match_ready", handleMatchReady);
        }
      } else {
        // Added to queue, start waiting
        console.log("⏳ Added to queue, waiting for opponent...");
        console.log("📊 Queue status:", data);

        // Double-check we're not already queuing
        if (isQueueing) {
          console.log("⚠️ Already queuing, ignoring duplicate request");
          return;
        }

        setIsQueueing(true);
        startQueueTimer();

        // Listen for match found event
        if (socketRef.current) {
          // Remove any existing listener first to prevent duplicates
          socketRef.current.off("match_found", handleMatchFound);
          socketRef.current.off("match_ready", handleMatchReady);
          socketRef.current.on("match_found", handleMatchFound);
          socketRef.current.on("match_ready", handleMatchReady);
        }
      }
    } catch (error) {
      console.error("❌ Error joining matchmaking queue:", error);
      setError(error.message || "Failed to join matchmaking queue");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!isQueueing) return;

    try {
      console.log("❌ Cancelling matchmaking queue...");

      // Remove from backend matchmaking queue
      const response = await apiFetch("/api/match/cancel", {
        method: "POST",
        body: JSON.stringify({ studentId: user.id || user._id }),
      });

      if (!response.ok) {
        console.warn("Warning: Failed to remove from backend queue");
      }

      // Clean up local state
      setIsQueueing(false);
      setQueueTime(0);
      // Timer is automatically cleared by the useEffect when isQueueing becomes false

      // Remove match found listener
      if (socketRef.current) {
        socketRef.current.off("match_found", handleMatchFound);
      }

      console.log("✅ Successfully cancelled matchmaking");
    } catch (error) {
      console.error("❌ Error cancelling queue:", error);
      // Still clean up local state even if backend fails
      setIsQueueing(false);
      setQueueTime(0);
    }
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

      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>
            <FaUserFriends className={styles.titleIcon} />
            Battle Arena
          </h1>
          <p className={styles.pageSubtitle}>
            Challenge friends or find worthy opponents in epic duels
          </p>
        </div>

        <div className={styles.statusSection}>
          <div className={styles.connectionIndicator}>
            <div
              className={`${styles.statusDot} ${
                wsConnected ? styles.connected : styles.disconnected
              }`}
            ></div>
            <span className={styles.statusText}>
              {wsConnected ? "Connected" : "Offline"}
            </span>
          </div>
          <div className={styles.quickStats}>
            <div className={styles.statBadge}>
              <FaUsers />
              <span>{getActivePlayersCount()} Players Online</span>
            </div>
            {isQueueing && (
              <div className={styles.statBadge}>
                <FaSyncAlt className={styles.spinning} />
                <span>In Queue: {formatTime(queueTime)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <div className={styles.errorContent}>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className={styles.errorClose}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Connection Warning */}
      {!wsConnected && (
        <div className={styles.warningBanner}>
          <FaExclamationTriangle className={styles.warningIcon} />
          <div className={styles.warningContent}>
            <h4>Connection Issue</h4>
            <p>
              Unable to connect to game server. Some features may be limited.
            </p>
          </div>
          <button className={styles.retryButton} onClick={fetchLobbies}>
            <FaRedo />
            Retry
          </button>
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className={styles.quickActions}>
        <button
          className={`${styles.quickActionBtn} ${styles.createBtn}`}
          onClick={() => setShowCreateLobbyModal(true)}
          disabled={hasActiveLobby || isLoadingAction}
        >
          <FaPlus />
          <span>Create Lobby</span>
        </button>

        <button
          className={`${styles.quickActionBtn} ${styles.queueBtn}`}
          onClick={isQueueing ? handleCancelQueue : handleQueueMatchmaking}
          disabled={isLoadingAction}
        >
          {isQueueing ? (
            <>
              <FaTimes />
              <span>Cancel Queue</span>
            </>
          ) : (
            <>
              <FaUsers />
              <span>Quick Match</span>
            </>
          )}
        </button>

        <div className={styles.inviteSection}>
          <form onSubmit={handleInviteSubmit} className={styles.inviteForm}>
            <input
              type="text"
              placeholder="Challenge a friend by username..."
              value={inviteUsername}
              onChange={handleInviteChange}
              className={styles.inviteInput}
              disabled={isLoadingAction || isQueueing}
            />
            <button
              type="submit"
              className={`${styles.quickActionBtn} ${styles.inviteBtn}`}
              disabled={isLoadingAction || isQueueing || !inviteUsername.trim()}
            >
              <FaUserFriends />
              <span>Challenge</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Lobby Browser */}
        <div className={styles.lobbySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FaSearch />
              Available Lobbies
            </h2>
            <div className={styles.lobbyControls}>
              <input
                type="text"
                placeholder="Search lobbies..."
                value={lobbySearchTerm}
                onChange={(e) => setLobbySearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <button
                className={styles.refreshBtn}
                onClick={fetchLobbies}
                disabled={isLoadingLobbies}
              >
                <FaSyncAlt
                  className={isLoadingLobbies ? styles.spinning : ""}
                />
              </button>
            </div>
          </div>

          {/* Lobby List */}
          <div className={styles.lobbyGrid}>
            {isLoadingLobbies ? (
              <div className={styles.loadingState}>
                <FaSyncAlt className={styles.spinning} />
                <p>Loading lobbies...</p>
              </div>
            ) : currentLobbies.length === 0 ? (
              <div className={styles.emptyState}>
                <FaUsers />
                <h3>No lobbies found</h3>
                <p>
                  Be the first to create a lobby or try searching with different
                  terms.
                </p>
              </div>
            ) : (
              currentLobbies.map((lobby) => (
                <div key={lobby._id} className={styles.lobbyCard}>
                  <div className={styles.lobbyHeader}>
                    <h3 className={styles.lobbyName}>{lobby.name}</h3>
                    {lobby.isPrivate && (
                      <span className={styles.privateBadge}>
                        <FaLock /> Private
                      </span>
                    )}
                  </div>

                  <div className={styles.lobbyInfo}>
                    <div className={styles.lobbyHost}>
                      <FaUserCircle />
                      <span>
                        {lobby.hostId?.firstName} {lobby.hostId?.lastName}
                      </span>
                    </div>
                    <div className={styles.lobbyPlayers}>
                      <FaUsers />
                      <span>{lobby.players?.length || 0}/2 players</span>
                    </div>
                  </div>

                  <div className={styles.lobbyActions}>
                    {lobby.hostId?._id === user?.id ? (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteLobby(lobby._id)}
                        disabled={isLoadingAction}
                      >
                        <FaTimes />
                        Delete
                      </button>
                    ) : (
                      <button
                        className={styles.joinBtn}
                        onClick={() => handleJoinClick(lobby)}
                        disabled={
                          isLoadingAction || isQueueing || hasActiveLobby
                        }
                      >
                        <FaPlay />
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaArrowLeft />
              </button>

              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className={styles.pageBtn}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>

        {/* Active Lobby Status */}
        {userCreatedLobby && (
          <div className={styles.activeLobby}>
            <div className={styles.activeLobbyHeader}>
              <h3>Your Active Lobby</h3>
              <span className={styles.statusBadge}>
                {userCreatedLobby.status}
              </span>
            </div>

            <div className={styles.activeLobbyInfo}>
              <p>
                <strong>Name:</strong> {userCreatedLobby.name}
              </p>
              <p>
                <strong>Players:</strong>{" "}
                {userCreatedLobby.players?.length || 0}/2
              </p>
              <p>
                <strong>Status:</strong> {userCreatedLobby.status}
              </p>
            </div>

            <button
              className={styles.deleteLobbyBtn}
              onClick={() => handleDeleteLobby(userCreatedLobby._id)}
              disabled={isLoadingAction}
            >
              <FaTimes />
              Close Lobby
            </button>
          </div>
        )}
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

      {/* Match Confirm Modal */}
      {showMatchConfirmModal && confirmData && (
        <MatchConfirmModal
          isOpen={showMatchConfirmModal}
          opponentName={confirmData.opponentName}
          lobbyId={confirmData.lobbyId}
          onAccept={handleMatchAccept}
          onDecline={handleMatchDecline}
          timeout={30}
          isWaitingForOpponent={isWaitingForOpponent}
        />
      )}

      {/* Match Found Modal */}
      {showMatchFoundModal && matchData && (
        <MatchFoundModal
          isOpen={showMatchFoundModal}
          player1Name={matchData.player1Name}
          player2Name={matchData.player2Name}
          lobbyId={matchData.lobbyId}
          onProceed={handleProceedToGame}
        />
      )}
    </div>
  );
};

export default VersusModeLobby;
