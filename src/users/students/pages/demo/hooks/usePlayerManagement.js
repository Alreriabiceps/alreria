import { useEffect, useCallback } from "react";
import {
  getCurrentUserName,
  fetchOpponentData,
  getOpponentName,
  updatePlayerName,
  shouldUpdatePlayerName,
} from "../utils/playerUtils";

// Custom hook for managing player data and names
export const usePlayerManagement = ({
  user,
  myPlayerId,
  myPlayerIndex,
  players,
  setPlayers,
  initialPlayers,
  backendUrl,
}) => {
  // Update current player name when user data changes
  useEffect(() => {
    if (user && myPlayerIndex !== -1) {
      const currentUserName = getCurrentUserName(user);

      console.log(
        `🔄 Immediate update - Setting current player name to: ${currentUserName}`
      );

      // Force update the current player's name
      setPlayers((prev) => {
        if (prev.length > 0 && prev[myPlayerIndex]) {
          return prev.map((p, index) =>
            index === myPlayerIndex
              ? { ...p, name: currentUserName, username: currentUserName }
              : p
          );
        }
        return prev;
      });
    }
  }, [user, myPlayerIndex, setPlayers]);

  // Fetch and update opponent data
  const updateOpponentData = useCallback(
    async (opponentUserId) => {
      if (!opponentUserId || !backendUrl) return;

      try {
        const opponentData = await fetchOpponentData(
          opponentUserId,
          backendUrl
        );
        if (opponentData && opponentData.firstName) {
          const opponentName = `${opponentData.firstName} ${
            opponentData.lastName || ""
          }`.trim();

          setPlayers((prev) => {
            const opponentIndex = prev.findIndex(
              (p) => String(p.userId) === String(opponentUserId)
            );
            if (opponentIndex !== -1) {
              return updatePlayerName(prev, opponentIndex, opponentName);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error updating opponent data:", error);
      }
    },
    [backendUrl, setPlayers]
  );

  // Update player names from initial data
  const updatePlayerNamesFromInitial = useCallback(() => {
    if (!initialPlayers || initialPlayers.length === 0) return;

    setPlayers((prev) => {
      return prev.map((player, index) => {
        const initialPlayer = initialPlayers[index];
        if (!initialPlayer) return player;

        // For current user, use real name
        if (String(player.userId) === String(myPlayerId)) {
          const currentUserName = getCurrentUserName(user);
          return {
            ...player,
            name: currentUserName,
            username: currentUserName,
          };
        }

        // For opponent, use initial data or fetch if needed
        const opponentName = getOpponentName(
          player,
          initialPlayers,
          myPlayerId
        );
        if (opponentName && opponentName !== player.name) {
          return { ...player, name: opponentName, username: opponentName };
        }

        return player;
      });
    });
  }, [initialPlayers, myPlayerId, user, setPlayers]);

  // Initialize player names when component mounts
  useEffect(() => {
    updatePlayerNamesFromInitial();
  }, [updatePlayerNamesFromInitial]);

  return {
    updateOpponentData,
    updatePlayerNamesFromInitial,
  };
};


