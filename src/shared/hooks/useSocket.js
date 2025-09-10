import { useEffect, useRef } from "react";
import socketManager from "../utils/socketManager";

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      try {
        const socket = await socketManager.getSocket();
        if (isMounted) {
          socketRef.current = socket;
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        if (isMounted) {
          socketRef.current = null;
        }
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
      // Don't disconnect the socket here as it's managed globally
      // The socket manager will handle cleanup when the app unmounts
    };
  }, []);

  return socketRef;
}
