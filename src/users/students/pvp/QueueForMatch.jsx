import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const QueueForMatch = () => {
  const [status, setStatus] = useState('idle'); // idle | searching | matched
  const [opponent, setOpponent] = useState(null);
  const [lobbyId, setLobbyId] = useState(null);
  const [error, setError] = useState('');
  const [queueTime, setQueueTime] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTimer, setConfirmTimer] = useState(30);
  const [banInfo, setBanInfo] = useState(null);
  const [waitingForOther, setWaitingForOther] = useState(false);
  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  const confirmTimerRef = useRef(null);
  const acceptPollRef = useRef(null);
  const navigate = useNavigate();

  // Get studentId from localStorage
  let studentId = null;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    studentId = user?.studentId;
  } catch {}

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Check ban status on mount
  useEffect(() => {
    if (!studentId) return;
    fetch(`${backendUrl}/api/match/ban-status?studentId=${studentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.banned) setBanInfo(data.ban);
        else setBanInfo(null);
      });
  }, [studentId, backendUrl]);

  const startQueue = async () => {
    setError('');
    setStatus('searching');
    setOpponent(null);
    setLobbyId(null);
    setQueueTime(0);
    setBanInfo(null);
    setWaitingForOther(false);
    try {
      const res = await fetch(`${backendUrl}/api/match/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      if (data.banned) {
        setBanInfo(data.ban);
        setStatus('idle');
        return;
      }
      if (data.matched) {
        setStatus('matched');
        setOpponent(data.opponent);
        setLobbyId(data.lobbyId || data.matchId || null);
        setShowConfirm(true);
        setConfirmTimer(30);
        setWaitingForOther(false);
      } else {
        pollStatus();
      }
    } catch (err) {
      setError('Failed to queue for match.');
      setStatus('idle');
    }
  };

  const pollStatus = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/match/status?studentId=${studentId}`);
        const data = await res.json();
        if (data.banned) {
          setBanInfo(data.ban);
          setStatus('idle');
          clearInterval(pollingRef.current);
          return;
        }
        if (data.matched) {
          setStatus('matched');
          setOpponent(data.opponent);
          setLobbyId(data.lobbyId || data.matchId || null);
          setShowConfirm(true);
          setConfirmTimer(30);
          setWaitingForOther(false);
          clearInterval(pollingRef.current);
        }
      } catch {}
    }, 2000);
  };

  const cancelQueue = async () => {
    setError('');
    setStatus('idle');
    setOpponent(null);
    setLobbyId(null);
    setQueueTime(0);
    setShowConfirm(false);
    setConfirmTimer(30);
    setWaitingForOther(false);
    clearInterval(pollingRef.current);
    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    if (acceptPollRef.current) clearInterval(acceptPollRef.current);
    try {
      await fetch(`${backendUrl}/api/match/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
    } catch {}
  };

  // Timer effect for queue
  useEffect(() => {
    if (status === 'searching') {
      timerRef.current = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
    } else {
      setQueueTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Timer effect for confirm modal
  useEffect(() => {
    if (showConfirm) {
      confirmTimerRef.current = setInterval(() => {
        setConfirmTimer((prev) => {
          if (prev <= 1) {
            clearInterval(confirmTimerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setConfirmTimer(30);
      if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    }
    return () => {
      if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    };
    // eslint-disable-next-line
  }, [showConfirm]);

  // Accept match
  const handleAccept = async () => {
    if (!lobbyId) return;
    try {
      const res = await fetch(`${backendUrl}/api/match/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, lobbyId })
      });
      const data = await res.json();
      if (data.banned) {
        setBanInfo(data.ban);
        setShowConfirm(false);
        setStatus('idle');
        return;
      }
      if (data.ready) {
        setShowConfirm(false);
        setWaitingForOther(false);
        if (acceptPollRef.current) clearInterval(acceptPollRef.current);
        navigate('/student/pvp', { state: { lobbyId, opponent } });
      } else if (data.accepted) {
        setWaitingForOther(true);
      }
    } catch (err) {
      setError('Failed to accept match.');
      setShowConfirm(false);
      setStatus('idle');
    }
  };

  // Poll for ready if waitingForOther is true
  useEffect(() => {
    if (waitingForOther) {
      if (acceptPollRef.current) clearInterval(acceptPollRef.current);
      acceptPollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${backendUrl}/api/match/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, lobbyId })
          });
          const pollData = await pollRes.json();
          if (pollData.ready) {
            setShowConfirm(false);
            setWaitingForOther(false);
            clearInterval(acceptPollRef.current);
            navigate('/student/pvp', { state: { lobbyId, opponent } });
          }
        } catch {}
      }, 2000);
    } else {
      if (acceptPollRef.current) clearInterval(acceptPollRef.current);
    }
    return () => {
      if (acceptPollRef.current) clearInterval(acceptPollRef.current);
    };
  }, [waitingForOther, studentId, lobbyId, opponent, navigate]);

  // Timeout handler
  const handleTimeout = async () => {
    if (!lobbyId) return;
    if (acceptPollRef.current) clearInterval(acceptPollRef.current);
    try {
      const res = await fetch(`${backendUrl}/api/match/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, lobbyId, timeout: true })
      });
      const data = await res.json();
      if (data.banned) {
        setBanInfo(data.ban);
        setShowConfirm(false);
        setStatus('idle');
        return;
      }
      setShowConfirm(false);
      setStatus('idle');
    } catch (err) {
      setError('Failed to process timeout.');
      setShowConfirm(false);
      setStatus('idle');
    }
  };

  // Ban modal live countdown
  const [banSeconds, setBanSeconds] = useState(banInfo ? banInfo.seconds : 0);
  useEffect(() => {
    if (banInfo && banInfo.seconds > 0) {
      setBanSeconds(banInfo.seconds);
      const banTimer = setInterval(() => {
        setBanSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(banTimer);
            setBanInfo(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(banTimer);
    }
  }, [banInfo]);

  if (!studentId) {
    return <div>Please log in to queue for a match.</div>;
  }

  // Ban modal
  if (banInfo) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ background: '#222', color: '#ff4f7a', padding: 24, borderRadius: 8, display: 'inline-block', fontSize: '1.1rem', fontWeight: 600 }}>
          <div style={{ marginBottom: 12 }}>You are banned from matchmaking.</div>
          <div style={{ marginBottom: 12 }}>Time remaining: <b>{formatTime(banSeconds)}</b></div>
          <div style={{ fontSize: '0.95rem', color: '#ffbaba' }}>Ban escalates with each failed accept.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      {status === 'idle' && (
        <button onClick={startQueue} style={{ padding: '12px 32px', fontSize: '1.1rem', background: '#00ff9d', color: '#222', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
          Queue for Match
        </button>
      )}
      {status === 'searching' && (
        <div>
          <div style={{ marginBottom: '0.7rem', fontSize: '1.1rem' }}>Searching for opponent...</div>
          <div style={{ marginBottom: '1.2rem', fontSize: '1.3rem', color: '#00ff9d', fontFamily: 'monospace' }}>{formatTime(queueTime)}</div>
          <button onClick={cancelQueue} style={{ padding: '8px 24px', fontSize: '1rem', background: '#ff4f7a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
        </div>
      )}
      {showConfirm && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        }}>
          <div style={{
            background: '#181c2f',
            color: '#00ff9d',
            padding: '20px 18px',
            borderRadius: 12,
            minWidth: 220,
            maxWidth: '90vw',
            width: '100%',
            boxSizing: 'border-box',
            textAlign: 'center',
            boxShadow: '0 4px 24px #000a',
            border: '2px solid #00ff9d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>Match Found!</div>
            <div style={{ fontSize: '1.05rem', marginBottom: 14 }}>Accept match?</div>
            <div style={{ fontSize: '1.5rem', color: '#ff4f7a', marginBottom: 16 }}>{formatTime(confirmTimer)}</div>
            <button
              onClick={handleAccept}
              disabled={waitingForOther}
              style={{
                padding: '10px 24px',
                fontSize: '1rem',
                background: waitingForOther ? '#888' : '#00ff9d',
                color: '#222',
                border: 'none',
                borderRadius: 5,
                cursor: waitingForOther ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                marginBottom: 8,
                transition: 'background 0.2s',
              }}
            >
              Accept
            </button>
            {waitingForOther && <div style={{ fontSize: '0.98rem', color: '#ffbaba', marginTop: 10 }}>Waiting for other player to accept...</div>}
            <div style={{ fontSize: '0.92rem', color: '#ffbaba', marginTop: 7 }}>You must accept within 30 seconds.</div>
          </div>
        </div>,
        document.body
      )}
      {status === 'matched' && !lobbyId && !showConfirm && (
        <div>
          <div style={{ marginBottom: '1.2rem', fontSize: '1.1rem', color: '#00ff9d' }}>Match found!</div>
          <div style={{ marginBottom: '1.2rem' }}>Opponent ID: <b>{opponent}</b></div>
          <button onClick={cancelQueue} style={{ padding: '8px 24px', fontSize: '1rem', background: '#ff4f7a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            Leave Match
          </button>
        </div>
      )}
      {error && <div style={{ color: '#ff4f7a', marginTop: '1rem' }}>{error}</div>}
    </div>
  );
};

export default QueueForMatch; 