import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      console.log("Socket already connected, reusing existing connection");
      return;
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");

    if (!backendUrl || !token) {
      console.warn("Socket connection skipped - missing backend URL or token");
      return;
    }

    console.log("Initializing socket connection to:", backendUrl);

    // Cleanup existing socket if present
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(backendUrl, {
      path: "/socket.io/",
      auth: { token },
      transports: ["websocket", "polling"], // Allow fallback to polling
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    // Add connection event handlers for debugging
    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketRef.current = socket;

    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef;
}
