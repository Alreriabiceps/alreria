import React from 'react';
import styles from '../pages/VersusModeLobby.module.css';
import { FaDoorOpen, FaSearch } from 'react-icons/fa';

const JoinLobbyPanel = ({
  lobbySearchTerm,
  setLobbySearchTerm,
  isLoadingLobbies,
  currentLobbies,
  totalPages,
  handlePageChange,
  getUniqueLobbyKey,
  lobbyTimers,
  formatTime,
  handleJoinClick,
  handleDeleteLobby,
  isLoadingAction,
  isQueueing
}) => (
  <div className={`${styles.panel} ${styles.joinLobbyPanel}`}>
    <div className={styles.lobbyBrowserHeader}>
      <h3 className={styles.panelHeader}>
        <span className={styles.panelIcon}><FaDoorOpen /></span> Lobby
      </h3>
      <div className={styles.lobbySearchContainer}>
        <span className={styles.lobbySearchIcon}><FaSearch /></span>
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
                  {lobby.hostId?._id === (window?.user?.id) ? (
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
);

export default JoinLobbyPanel; 