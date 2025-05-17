import React from 'react';
import { FaSatelliteDish } from 'react-icons/fa';
import styles from '../pages/VersusModeLobby.module.css';

const QueuePanel = ({ isQueueing, handleQueueMatchmaking, handleCancelQueue }) => (
  <div className={`${styles.panel} ${styles.queuePanel}`}>
    <h3 className={styles.panelHeader}>
      <span className={styles.panelIcon}><FaSatelliteDish /></span> Matchmaking Queue
    </h3>
    <div className={styles.queuePanelContent}>
      <div className={styles.matchmakingQueueBox}>
        <h2>Matchmaking Queue</h2>
        {/* Placeholder for matchmaking queue */}
      </div>
    </div>
  </div>
);

export default QueuePanel; 