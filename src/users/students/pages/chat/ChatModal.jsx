import React, { useEffect, useRef, useState } from 'react';

// Minimal emoji picker for MVP
const EMOJIS = ['😀','😂','😍','👍','🎉','😎','😭','🔥','🥳','😅','😇','🤔','😡','😱','🙌','🙏','💯','😏','😴','🤩'];

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ChatModal({ open, onClose, friend, currentUser, socketRef, fixedToBubble, modalOffset = 0, onMinimize }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  // Dashboard theme variables (simplified)
  const theme = {
    bg: '#0D131A', // --blueprint-bg
    panelBg: '#18202b', // --blueprint-panel-bg (solid equivalent)
    panelBorder: '#232c3a', // Existing dark border, or dashboard's var(--blueprint-grid-line-strong)
    text: '#E0F2F7', // --blueprint-text
    accent: '#f1c40f', // Dashboard's yellow accent
    fontBody: 'Montserrat, sans-serif',
    fontHeader: 'Bangers, cursive', // For panel titles
    bubbleDarkText: '#0D131A', // For text on yellow accent bubbles
  };

  useEffect(() => {
    if (!open || !friend?._id) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${friend._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, friend?._id]);

  // Real-time incoming messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = ({ message }) => {
      if (
        (message.sender._id === friend._id && message.recipient._id === currentUser.id) ||
        (message.sender._id === currentUser.id && message.recipient._id === friend._id)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [friend?._id, currentUser.id, socketRef]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setShowEmoji(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: friend._id, content: msg })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
      }
    } catch {}
  };

  // Insert emoji at cursor
  const insertEmoji = (emoji) => {
    const el = document.activeElement;
    if (el && el.selectionStart !== undefined) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      setInput(input.slice(0, start) + emoji + input.slice(end));
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setInput(input + emoji);
    }
    setShowEmoji(false);
  };

  if (!open) return null;

  // Position modal to the left of the fixed bubble at bottom right
  const modalWidth = 350;
  const modalHeight = 480;
  let modalStyle = {
    position: 'fixed',
    width: modalWidth,
    maxWidth: '95vw',
    minHeight: 420,
    maxHeight: modalHeight,
    background: theme.panelBg, // Dashboard panel background
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)', // Dashboard shadow
    zIndex: 2001,
    border: `1px solid ${theme.panelBorder}`, // Dashboard panel border
    color: theme.text, // Dashboard text color
    fontFamily: theme.fontBody, // Dashboard font
  };
  if (fixedToBubble) {
    modalStyle.right = 104 + modalOffset * (modalWidth + 16);
    modalStyle.bottom = 32;
  } else {
    modalStyle.left = 40;
    modalStyle.top = 40;
  }

  // Render messages with date separators
  let lastDate = '';
  const renderedMessages = [];
  messages.forEach((msg, i) => {
    const msgDate = formatDate(msg.timestamp);
    const isMine = msg.sender._id === currentUser.id;
    if (msgDate !== lastDate) {
      renderedMessages.push(
        <div key={'date-' + msgDate + '-' + i} style={{ textAlign: 'center', color: theme.accent, fontWeight: 600, margin: '18px 0 8px', fontSize: 13 }}>
          {msgDate}
        </div>
      );
      lastDate = msgDate;
    }
    renderedMessages.push(
      <div key={msg._id || i} style={{
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start'
      }}>
        <div style={{
          background: isMine ? theme.accent : theme.panelBorder, // Updated bubble backgrounds
          color: isMine ? theme.bubbleDarkText : theme.text, // Updated bubble text colors
          borderRadius: 8,
          padding: '7px 13px',
          maxWidth: 220,
          wordBreak: 'break-word',
          fontSize: 15,
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 11, color: '#7da0b8', marginTop: 2, textAlign: isMine ? 'right' : 'left', width: '100%' }}>
          {formatTime(msg.timestamp)}
        </div>
        <div style={{ fontSize: 11, color: '#7da0b8', marginTop: 0 }}>
          {isMine ? 'You' : (msg.sender.firstName || msg.sender.studentId)}
        </div>
      </div>
    );
  });

  return (
    <>
      {/* Backdrop for click-away close */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          zIndex: 1999,
        }}
        onClick={onClose}
      />
      <div
        style={modalStyle}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${theme.panelBorder}`,
          fontWeight: 700, fontSize: 18, color: theme.accent, // Theme accent
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: theme.fontHeader, // Panel header font
          background: theme.panelBg, // Consistent panel background
          borderTopLeftRadius: 11, // Match parent modal rounding
          borderTopRightRadius: 11,
        }}>
          <span>Chat with {(friend.firstName || friend.lastName) ? `${friend.firstName || ''} ${friend.lastName || ''}`.trim() : friend.studentId}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onMinimize && (
              <button onClick={onMinimize} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer', marginRight: 4 }} title="Minimize">–</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer' }}>&times;</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: theme.bg /* Reverted to theme.bg for better modal contrast */ }}>
          {loading ? <div style={{ color: '#aaa' }}>Loading...</div> :
            renderedMessages.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center' }}>No messages yet.</div> :
              renderedMessages
          }
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} style={{
          display: 'flex', borderTop: `1px solid ${theme.panelBorder}`,
          padding: 10, background: theme.panelBg, // Consistent panel background
          alignItems: 'center',
          borderBottomLeftRadius: 11, // Match parent modal rounding
          borderBottomRightRadius: 11,
        }}>
          <button type="button" onClick={() => setShowEmoji(v => !v)} style={{ background: 'none', border: 'none', fontSize: 22, marginRight: 6, cursor: 'pointer', color: theme.accent }} title="Emoji">😊</button>
          {showEmoji && (
            <div style={{
              position: 'absolute', bottom: 60,
              left: fixedToBubble ? 'auto' : 18, // Adjust based on modal position
              right: fixedToBubble ? 18 : 'auto',
              background: '#232c3a', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              padding: 8, zIndex: 3000, display: 'flex', flexWrap: 'wrap', gap: 4
            }}>
              {EMOJIS.map(e => (
                <span key={e} style={{ fontSize: 22, cursor: 'pointer', padding: 2 }} onClick={() => insertEmoji(e)}>{e}</span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1, border: 'none', borderRadius: 6, padding: 10, fontSize: 15,
              background: theme.bg, // Darker input background
              color: theme.text, // Theme text color
              outline: 'none',
              fontFamily: theme.fontBody,
            }}
            autoFocus
          />
          <button type="submit" style={{
            marginLeft: 8, background: theme.accent, color: theme.bg, // Accent bg, dark text
            border: 'none', borderRadius: 6, padding: '10px 18px', // Adjusted padding
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            fontFamily: theme.fontBody, // Theme font
            transition: 'background-color 0.2s ease-out',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e0b00d'} // Slightly different yellow on hover
          onMouseLeave={e => e.currentTarget.style.background = theme.accent}
          >Send</button>
        </form>
      </div>
    </>
  );
} 