import React from 'react';
import { FaPlus } from 'react-icons/fa';
import styles from '../pages/VersusModeLobby.module.css';

const CreatePanel = ({ lobbyForm, setLobbyForm, showCreateLobbyModal, setShowCreateLobbyModal, handleCreateLobby, isLoadingAction, hasActiveLobby }) => (
  <div className={`${styles.panel} ${styles.createPanel}`}>
    <h3 className={styles.panelHeader}>
      <span className={styles.panelIcon}><FaPlus /></span> Create Lobby
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
        disabled={isLoadingAction}
      >
        {isLoadingAction ? "Creating..." : "Open Lobby"}
      </button>
      <button
        onClick={() => {
          setLobbyForm(prev => ({ ...prev, isPrivate: true }));
          setShowCreateLobbyModal(true);
        }}
        className={`${styles.gameButton} ${styles.createButton}`}
        disabled={isLoadingAction}
      >
        {isLoadingAction ? "Creating..." : "Private Lobby"}
      </button>
    </div>
  </div>
);

export default CreatePanel; 