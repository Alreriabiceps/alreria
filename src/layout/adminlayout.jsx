import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from '../components/SideMenu';
import { useGuideMode } from '../contexts/GuideModeContext';
import botLogo from '/BOT.jpg';

const AdminLayout = () => {
  const { guideMode, setGuideMode } = useGuideMode();
  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "admin", text: chatInput }]);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin-chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: chatInput })
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { sender: "alreria", text: data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: "alreria", text: "Sorry, I couldn't get a response." }]);
    } finally {
      setIsLoading(false);
      setChatInput("");
    }
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <SideMenu />
      <div className="drawer-content flex flex-col">
        {/* Guide Mode Toggle */}
        <div className="flex items-center justify-end p-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="font-medium text-primary">Guide Mode</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={guideMode}
              onChange={() => setGuideMode((prev) => !prev)}
            />
          </label>
        </div>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
        {/* Messenger-style Chatbot Widget */}
        <div className="fixed bottom-6 right-6 z-50" style={{ minWidth: minimized ? 320 : 360, maxWidth: 400 }}>
          {showChatbot ? (
            <div className="bg-base-100 rounded-lg shadow-lg flex flex-col border border-base-300" style={{ width: minimized ? 320 : 360, transition: 'width 0.2s' }}>
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-accent rounded-t-lg cursor-pointer select-none" onClick={() => setMinimized(m => !m)}>
                <div className="flex items-center gap-2">
                  <img src={botLogo} alt="Alreria bot logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <span className="font-bold text-accent-content">Alreria</span>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-xs btn-ghost text-accent-content" onClick={e => { e.stopPropagation(); setMinimized(m => !m); }} title={minimized ? 'Expand' : 'Minimize'}>
                    {minimized ? <span>&#9650;</span> : <span>&#8211;</span>}
                  </button>
                  <button className="btn btn-xs btn-ghost text-accent-content" onClick={e => { e.stopPropagation(); setShowChatbot(false); setMinimized(false); }} title="Close">
                    ✕
                  </button>
                </div>
              </div>
              {/* Chat Body */}
              {!minimized && (
                <>
                  <div className="flex-1 overflow-y-auto mb-2 bg-base-200 rounded-b p-2" style={{ minHeight: 120, maxHeight: 300 }}>
                    {chatHistory.length === 0 ? (
                      <div className="text-base-content/70 text-sm">Ask me anything about the admin system!</div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div key={idx} className={`mb-2 flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                          <div className={`px-3 py-2 rounded-lg max-w-[80%] ${msg.sender === "admin" ? "bg-primary text-primary-content" : "bg-accent text-accent-content"}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && <div className="text-xs text-base-content/60">Alreria is typing...</div>}
                  </div>
                  <div className="flex gap-2 p-2 border-t border-base-300 bg-base-100 rounded-b-lg">
                    <input
                      className="input input-bordered flex-1"
                      type="text"
                      placeholder="Type your question..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleSendChat}
                      disabled={isLoading || !chatInput.trim()}
                    >Send</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="fixed bottom-6 right-6 z-50"
              style={{ width: 64, height: 64, borderRadius: '50%', padding: 0, border: 'none', background: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
              onClick={() => setShowChatbot(true)}
              aria-label="Open Alreria chatbot"
            >
              <img src={botLogo} alt="Alreria bot logo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;