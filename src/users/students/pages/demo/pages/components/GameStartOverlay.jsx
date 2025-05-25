import React, { useEffect, useState } from 'react';

const FADE_DURATION = 500; // ms

const GameStartOverlay = ({ playerName = 'You', opponentName = 'AI Opponent', onStart }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onStart();
      }, FADE_DURATION);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onStart]);

  return (
    <div
      className={`game-start-overlay${visible ? ' fade-in' : ' fade-out'}`}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: `opacity ${FADE_DURATION}ms`,
        opacity: visible ? 1 : 0,
      }}
    >
      <h1 style={{ color: '#f1c40f', fontSize: '3rem', marginBottom: 24, letterSpacing: 2, textShadow: '0 2px 12px #000' }}>Get Ready!</h1>
      <div style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontWeight: 700 }}>{playerName}</span>
        <span style={{ color: '#f1c40f', fontWeight: 900, fontSize: '2rem' }}>vs</span>
        <span style={{ fontWeight: 700 }}>{opponentName}</span>
      </div>
    </div>
  );
};

export default GameStartOverlay; 