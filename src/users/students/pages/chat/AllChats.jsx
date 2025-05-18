import React, { useEffect, useState, useRef } from 'react';
import FloatingStars from '../../components/FloatingStars/FloatingStars';
// import ChatModal from './ChatModal';

const EMOJIS = ['😀','😂','😍','👍','🎉','😎','😭','🔥','🥳','😅','😇','🤔','😡','😱','🙌','🙏','💯','😏','😴','🤩'];
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AllChats({ currentUser, socketRef }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [friendSearchTerm, setFriendSearchTerm] = useState('');

  const theme = {
    bg: '#0D131A',
    panelBg: '#18202b',
    panelBorder: '#232c3a',
    text: '#E0F2F7',
    accent: '#f1c40f',
    fontBody: 'Montserrat, sans-serif',
    fontHeader: 'Bangers, cursive',
    bubbleDarkText: '#0D131A',
  };

  useEffect(() => {
    const fetchFriends = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/friend-requests/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.data) {
        setFriends(data.data.map(f => f.requester._id === currentUser.id ? f.recipient : f.requester));
      }
    };
    if (currentUser?.id) fetchFriends();
  }, [currentUser?.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = ({ message }) => {
      if (!selectedFriend || message.sender._id !== selectedFriend._id) {
        setUnreadCounts(prev => ({ ...prev, [message.sender._id]: (prev[message.sender._id] || 0) + 1 }));
      }
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [selectedFriend, socketRef]);

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setUnreadCounts(prev => ({ ...prev, [friend._id]: 0 }));
  };

  const getInitials = (user) => {
    if (!user) return '';
    const names = [user.firstName, user.lastName].filter(Boolean);
    if (names.length) return names.map(n => n[0]).join('').toUpperCase();
    if (user.username) return user.username.slice(0, 2).toUpperCase();
    return '??';
  };

  const filteredFriends = friends.filter(friend => {
    const name = ((friend.firstName || '') + ' ' + (friend.lastName || '')).toLowerCase();
    const studentId = friend.studentId?.toLowerCase() || '';
    return name.includes(friendSearchTerm.toLowerCase()) || studentId.includes(friendSearchTerm.toLowerCase());
  });

  return (
    <div style={{
      width: '100vw', height: '100vh', boxSizing: 'border-box',
      background: theme.bg,
      display: 'flex',
      fontFamily: theme.fontBody,
      color: theme.text,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <FloatingStars />
      {/* Sidebar - Friends List Panel */}
      <div style={{
        width: 320, height: '100vh',
        background: theme.panelBg,
        borderRight: `1px solid ${theme.panelBorder}`,
        display: 'flex', flexDirection: 'column',
        padding: '0', // No padding here, header and list will manage it
        boxSizing: 'border-box',
      }}>
        <div style={{ // Sidebar Header
          padding: '20px 25px',
          fontFamily: theme.fontHeader, fontSize: '2.2rem', color: theme.accent,
          letterSpacing: '2px',
          borderBottom: `1px solid ${theme.panelBorder}`,
          textAlign: 'center', // Center title
        }}>
          CHATS
        </div>
        <div style={{ padding: '15px 20px' }}> {/* Search bar container */}
          <input
            type="text"
            placeholder="Search friends..."
            value={friendSearchTerm}
            onChange={e => setFriendSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: 8,
              border: `1px solid ${theme.panelBorder}`,
              background: theme.bg,
              color: theme.text,
              fontSize: '0.9rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 0 }}> {/* Friend list items container */}
          {filteredFriends.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40, padding: '0 20px' }}>
              {friends.length === 0 ? "No friends yet." : "No friends match your search."}
            </div>
          ) : filteredFriends.map(friend => {
            const isSelected = selectedFriend && selectedFriend._id === friend._id;
            return (
              <div
                key={friend._id}
                onClick={() => handleSelectFriend(friend)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 15, padding: '15px 25px', cursor: 'pointer',
                  background: isSelected ? theme.accent : 'transparent',
                  color: isSelected ? theme.bubbleDarkText : theme.text,
                  borderBottom: `1px solid ${theme.panelBorder}`, // Separator for items
                  transition: 'background 0.18s, color 0.18s',
                  fontWeight: isSelected ? 700 : 500,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = theme.panelBorder; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: isSelected ? theme.bubbleDarkText : theme.accent,
                  color: isSelected ? theme.accent : theme.bubbleDarkText,
                  fontWeight: 700, fontSize: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  flexShrink: 0,
                }}>{getInitials(friend)}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(friend.firstName || friend.lastName) ? `${friend.firstName || ''} ${friend.lastName || ''}`.trim() : friend.studentId}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: isSelected ? 0.9 : 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {friend.studentId}
                  </div>
                </div>
                {unreadCounts[friend._id] > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 700,
                    padding: '3px 6px', minWidth: 20, height: 20, lineHeight: '14px', textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', marginLeft: 'auto'
                  }}>{unreadCounts[friend._id]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area Panel */}
      <div style={{
        flex: 1, height: '100vh',
        background: theme.panelBg,
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '15px 25px',
              background: theme.panelBg, // Consistent with panel
              borderBottom: `1px solid ${theme.panelBorder}`,
              display: 'flex', alignItems: 'center', gap: 15,
              boxSizing: 'border-box',
            }}>
              <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: theme.accent, color: theme.bubbleDarkText,
                  fontWeight: 700, fontSize: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)', flexShrink: 0,
              }}>{getInitials(selectedFriend)}</div>
              <div>
                <div style={{ fontFamily: theme.fontHeader, fontSize: '1.6rem', color: theme.text, letterSpacing: '1px' }}>
                  {(selectedFriend.firstName || selectedFriend.lastName) ? `${selectedFriend.firstName || ''} ${selectedFriend.lastName || ''}`.trim() : selectedFriend.studentId}
                </div>
                {/* Placeholder for online status or other info */}
                {/* <div style={{ fontSize: '0.8rem', color: '#66fcf1', opacity: 0.8 }}>Online</div> */}
              </div>
            </div>
            {/* ChatPanel messages and input */}
            <ChatPanel
              key={selectedFriend._id} // Ensure ChatPanel re-mounts or fetches new data for new friend
              friend={selectedFriend}
              currentUser={currentUser}
              socketRef={socketRef}
              theme={theme} // Pass theme down
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.2rem', flexDirection: 'column', gap: '20px' }}>
            <span style={{fontFamily: theme.fontHeader, fontSize: '3rem', color: theme.accent, opacity: 0.5}}>Select a Chat</span>
            <p style={{fontSize: '1rem', color: theme.text, opacity: 0.7}}>Choose a friend from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ChatPanel adapted for this page structure
function ChatPanel({ friend, currentUser, socketRef, theme }) { // Accept theme as prop
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // NEW: typing indicator state
  const typingTimeoutRef = useRef(null); // NEW: for clearing typing indicator
  const messagesEndRef = useRef(null);
  
  // Theme is now passed as a prop, no need to redefine it here if AllChats passes it down
  // const theme = { ... }; 

  useEffect(() => {
    if (!friend?._id) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages/${friend._id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => { setMessages(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [friend?._id]);

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

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleTyping = ({ from }) => {
      if (from === friend._id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };
    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [friend._id, socketRef]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Emit 'message:read' when chat is opened (friend changes)
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && friend?._id) {
      socket.emit('message:read', { friendId: friend._id });
    }
  }, [friend?._id, socketRef]);

  // Listen for delivered/read status updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleDelivered = ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? { ...m, status: message.status } : m));
    };
    const handleRead = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    };
    socket.on('message:delivered', handleDelivered);
    socket.on('message:read', handleRead);
    return () => {
      socket.off('message:delivered', handleDelivered);
      socket.off('message:read', handleRead);
    };
  }, [socketRef]);

  // Emit 'message:delivered' for each incoming message not sent by current user and not delivered/read
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    messages.forEach(msg => {
      if (
        msg.recipient._id === currentUser.id &&
        msg.sender._id === friend._id &&
        msg.status === 'sent'
      ) {
        socket.emit('message:delivered', { messageId: msg._id });
      }
    });
  }, [messages, currentUser.id, friend._id, socketRef]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setShowEmoji(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ recipientId: friend._id, content: msg })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]); // Optimistically add the sent message
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const insertEmoji = (emoji) => {
    const el = document.activeElement;
    if (el.tagName === 'INPUT' && el.selectionStart !== undefined) {
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
    // setShowEmoji(false); // Keep emoji picker open if desired, or close
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = socketRef.current;
    if (socket && friend?._id) {
      socket.emit('typing', { to: friend._id });
    }
  };

  // Find the last message sent by the current user
  const lastMineIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender._id === currentUser.id) {
        return i;
      }
    }
    return -1;
  })();

  let lastDate = '';
  const renderedMessages = [];
  messages.forEach((msg, i) => {
    const msgDate = formatDate(msg.timestamp);
    const isMine = msg.sender._id === currentUser.id;
    if (msgDate !== lastDate) {
      renderedMessages.push(
        <div key={'date-' + msgDate + '-' + i} style={{ textAlign: 'center', color: theme.accent, fontWeight: 600, margin: '20px 0 10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
          {msgDate}
        </div>
      );
      lastDate = msgDate;
    }
    renderedMessages.push(
      <div key={msg._id || i} style={{
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        padding: '0 25px', // Add horizontal padding to message rows
      }}>
        <div style={{
          background: isMine ? theme.accent : theme.panelBorder,
          color: isMine ? theme.bubbleDarkText : theme.text,
          borderRadius: 12, // Slightly more rounded bubbles
          padding: '10px 15px', // More padding in bubbles
          maxWidth: '70%', // Bubbles take up to 70% of width
          wordBreak: 'break-word',
          fontSize: '0.95rem',
          lineHeight: 1.5,
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: '0.75rem', color: theme.text, opacity: 0.6, marginTop: 5, textAlign: isMine ? 'right' : 'left', width: '100%', display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 6 }}>
          {isMine && <span style={{marginRight: '5px'}}>You · </span>}
          {formatTime(msg.timestamp)}
          {isMine && lastMineIndex === i && (
            <span style={{ marginLeft: 8, fontSize: '0.85em', color:
              msg.status === 'read' ? theme.accent :
              msg.status === 'delivered' ? '#3b82f6' : '#aaa',
              fontWeight: msg.status === 'read' ? 700 : 500 }}>
              {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}
            </span>
          )}
        </div>
      </div>
    );
  });

  return (
    // This ChatPanel component is now structured to be part of AllChats page
    // Its own header is removed as AllChats provides one
    <>
      <div style={{ flex: 1, overflowY: 'auto', background: theme.bg, paddingTop: '10px' }}> {/* Message list area */}
        {loading ? <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>Loading messages...</div> :
          renderedMessages.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center', padding: '40px 20px', fontSize: '1rem' }}>No messages yet. Say hello!</div> :
            renderedMessages
        }
        {isTyping && (
          <div style={{ color: theme.accent, fontStyle: 'italic', padding: '0 25px 10px', fontSize: '0.95rem' }}>
            {friend.firstName || friend.lastName ? `${friend.firstName || ''} ${friend.lastName || ''}`.trim() : 'User'} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{
        display: 'flex', borderTop: `1px solid ${theme.panelBorder}`, padding: '15px 25px',
        background: theme.panelBg, alignItems: 'center', position: 'relative', // for emoji picker
        boxSizing: 'border-box',
      }}>
        {showEmoji && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 10px)', // Position above input
            left: 25,
            background: theme.panelBg, borderRadius: 8, boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
            padding: '10px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '8px', width: 'calc(100% - 130px)',
            border: `1px solid ${theme.panelBorder}`,
          }}>
            {EMOJIS.map(e => (
              <span key={e} style={{ fontSize: 22, cursor: 'pointer', padding: 5, borderRadius: 4, transition: 'background 0.1s' }} 
                    onClick={() => insertEmoji(e)}
                    onMouseEnter={ev => ev.currentTarget.style.background = theme.panelBorder}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >{e}</span>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setShowEmoji(v => !v)} style={{
          background: 'transparent', border: 'none', fontSize: '1.8rem', marginRight: 10, cursor: 'pointer',
          color: theme.accent, padding: 5,
        }} title="Emoji">😊</button>
        <input
          type="text" value={input} onChange={handleInputChange}
          placeholder="Type a message..."
          style={{
            flex: 1, border: `1px solid ${theme.panelBorder}`, borderRadius: 8, padding: '12px 15px', fontSize: '1rem',
            background: theme.bg, color: theme.text, outline: 'none', fontFamily: theme.fontBody,
          }}
          autoFocus
        />
        <button type="submit" style={{
          marginLeft: 10, background: theme.accent, color: theme.bubbleDarkText,
          border: 'none', borderRadius: 8, padding: '12px 25px',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: theme.fontBody,
          transition: 'background-color 0.2s ease-out',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e0b00d'}
        onMouseLeave={e => e.currentTarget.style.background = theme.accent}
        >Send</button>
      </form>
    </>
  );
} 