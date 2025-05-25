import React, { useState, useRef } from 'react';
import styles from '../pages/WeeklyTest.module.css';
import html2canvas from 'html2canvas';
import { FaCrown, FaMedal, FaStar, FaUserGraduate, FaRegSadTear, FaRegClock, FaFacebookMessenger, FaWhatsapp, FaDiscord, FaCopy, FaDownload, FaShareAlt } from 'react-icons/fa';

const ResultModal = ({
  showResultModal,
  setShowResultModal,
  testResult,
  score,
  pointsEarned,
  currentRank,
  getScoreColor,
  getPointsColor,
  loading,
  error,
  user,
  selectedSubject,
  selectedWeek
}) => {
  if (!showResultModal) return null;

  // Generate share/challenge link
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  if (testResult && selectedSubject && selectedWeek && user) {
    params.set('challenge', '1');
    params.set('score', score);
    params.set('week', selectedWeek.number);
    params.set('subject', selectedSubject.id);
    params.set('from', user.displayName || user.name || user.email || 'A Student');
  }
  const challengeLink = `${baseUrl}?${params.toString()}`;

  // Share modal state
  const [shareModal, setShareModal] = useState({ open: false, type: null, imageUrl: null });
  const imageBlobRef = useRef(null);

  // Share handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(challengeLink);
    alert('Link copied to clipboard!');
  };

  // Messenger/WhatsApp/Discord share links
  const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(challengeLink)}&app_id=123456789&redirect_uri=${encodeURIComponent(window.location.href)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Try to beat my score! ' + challengeLink)}`;
  const discordUrl = `https://discord.com/channels/@me`;

  // Map rank names to icons
  const rankIcons = {
    'Absent Legend': <FaRegSadTear color="#888" size={28} title="Absent Legend" />,
    'The Crammer': <FaRegClock color="#e67e22" size={28} title="The Crammer" />,
    'Seatwarmer': <FaUserGraduate color="#2980b9" size={28} title="Seatwarmer" />,
    'Group Project Ghost': <FaMedal color="#8e44ad" size={28} title="Group Project Ghost" />,
    'Google Scholar (Unofficial)': <FaStar color="#27ae60" size={28} title="Google Scholar" />,
    'The Lowkey Genius': <FaStar color="#f1c40f" size={28} title="Lowkey Genius" />,
    'Almost Valedictorian': <FaMedal color="#f39c12" size={28} title="Almost Valedictorian" />,
    'The Valedictornator': <FaCrown color="#e67e22" size={32} title="Valedictornator" />,
  };

  // Share as image handler
  const handleShareImage = async () => {
    const card = document.getElementById('score-share-card');
    if (!card) return;
    const canvas = await html2canvas(card, { backgroundColor: null, scale: 2 });
    canvas.toBlob(async (blob) => {
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'score.png', { type: blob.type })] })) {
        // Web Share API with files (mobile)
        try {
          await navigator.share({
            files: [new File([blob], 'score.png', { type: blob.type })],
            title: 'My Weekly Test Score',
            text: `Check out my score!`
          });
          return;
        } catch (e) { /* fallback below */ }
      }
      // fallback: show modal with download/copy
      const url = URL.createObjectURL(blob);
      imageBlobRef.current = blob;
      setShareModal({ open: true, type: 'image', imageUrl: url });
    }, 'image/png');
  };

  // Share challenge link handler
  const handleShareChallenge = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Weekly Test Challenge',
        text: `Can you beat my score of ${score}?`,
        url: challengeLink
      });
    } else {
      setShareModal({ open: true, type: 'link', imageUrl: null });
    }
  };

  // Copy image to clipboard (if supported)
  const handleCopyImage = async () => {
    if (navigator.clipboard && window.ClipboardItem && imageBlobRef.current) {
      try {
        await navigator.clipboard.write([
          new window.ClipboardItem({ [imageBlobRef.current.type]: imageBlobRef.current })
        ]);
        alert('Image copied to clipboard!');
      } catch (e) {
        alert('Copy to clipboard failed.');
      }
    } else {
      alert('Copy image to clipboard is not supported in this browser.');
    }
  };

  // Download image
  const handleDownloadImage = () => {
    if (shareModal.imageUrl) {
      const a = document.createElement('a');
      a.href = shareModal.imageUrl;
      a.download = 'score.png';
      a.click();
    }
  };

  // Redesigned Share Modal component
  const ShareModal = ({ type, onClose, imageUrl }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#181c22', color: '#fff', borderRadius: 18, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center', border: '2px solid #f1c40f', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer' }} onClick={onClose}><FaShareAlt size={22} color="#f1c40f" title="Close" /></div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 18, color: '#f1c40f', letterSpacing: 1, fontWeight: 800 }}>Share {type === 'image' ? 'Your Score' : 'Challenge'}</h2>
        {type === 'link' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className={styles.leaderboardButton} onClick={handleCopy} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaCopy /> Copy Link</button>
            <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className={styles.leaderboardButton} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaFacebookMessenger color="#0084ff" /> Messenger</a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.leaderboardButton} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaWhatsapp color="#25d366" /> WhatsApp</a>
            <a href={discordUrl} target="_blank" rel="noopener noreferrer" className={styles.leaderboardButton} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaDiscord color="#7289da" /> Discord</a>
            <input type="text" value={challengeLink} readOnly style={{ width: '100%', marginTop: 8, fontSize: '0.95rem', padding: 6, borderRadius: 6, border: '1px solid #ccc', background: '#232c3a', color: '#fff' }} onFocus={e => e.target.select()} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {imageUrl && <img src={imageUrl} alt="Score Card" style={{ width: '100%', borderRadius: 12, marginBottom: 4, border: '1.5px solid #f1c40f' }} />}
            <button className={styles.leaderboardButton} onClick={handleDownloadImage} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaDownload /> Download Image</button>
            <button className={styles.leaderboardButton} onClick={handleCopyImage} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaCopy /> Copy Image</button>
            <div style={{ color: '#aaa', fontSize: '0.95rem', marginTop: 8 }}>Share this image on your favorite app!</div>
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 22, padding: '10px 28px', borderRadius: 8, background: '#f1c40f', color: '#232c3a', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
      </div>
    </div>
  );

  return (
    <div className={styles.resultModalOverlay}>
      <div className={styles.resultModal} style={{ background: '#181c22', borderRadius: 18, border: '2px solid #f1c40f', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 340, maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
          <FaStar size={28} color="#f1c40f" />
          <h2 className={styles.resultTitle} style={{ color: '#f1c40f', fontWeight: 800, fontSize: '2rem', letterSpacing: 1, margin: 0 }}>Test Results</h2>
        </div>
        {/* Hidden Score Card for Sharing as Image */}
        <div id="score-share-card" style={{
          width: 350, minHeight: 260, background: '#232c3a', color: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          padding: 28, position: 'absolute', left: '-9999px', top: 0, fontFamily: 'Montserrat, sans-serif',
          display: testResult ? 'block' : 'none',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f1c40f', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FaStar size={24} color="#f1c40f" /> Weekly Test Score</span>
          </div>
          <div style={{ textAlign: 'center', margin: '18px 0 10px 0' }}>
            <span style={{ fontSize: '3.2rem', fontWeight: 900, color: '#27ae60', textShadow: '0 2px 8px #0008' }}>{score} <span style={{ fontSize: '1.5rem', color: '#fff' }}>/ {testResult?.totalQuestions}</span></span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: 8 }}>
            <span style={{ color: '#f1c40f', fontWeight: 700 }}>{user?.displayName || user?.name || 'A Student'}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.05rem', marginBottom: 8 }}>
            <span style={{ color: '#fff' }}>{selectedSubject?.name || 'Subject'} | Week {selectedWeek?.number}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: 8 }}>
            <span style={{ color: '#f1c40f', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{currentRank?.name && rankIcons[currentRank.name]} {currentRank?.name}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.05rem', margin: '10px 0 0 0', color: '#e0e0e0' }}>
            Can you beat my score?
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.95rem', marginTop: 18, color: '#888' }}>
            gleas | gamified learnings
          </div>
        </div>
        {loading && !testResult ? (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <div className={styles.loadingMessage}>Calculating your results...</div>
            <div className={styles.spinner} style={{marginTop: '1.5em'}}></div>
          </div>
        ) : !loading && !testResult && error ? (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <h2 className={styles.resultTitle} style={{color: 'var(--blueprint-danger-text)'}}>Error</h2>
            <p className={styles.errorMessage} style={{marginTop: '1em', marginBottom: '1.5em'}}>{error}</p>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        ) : !loading && testResult ? (
          <>
            <div className={styles.resultContent} style={{ marginBottom: 18 }}>
              <div className={styles.resultRow} style={{ fontSize: '1.15rem', fontWeight: 700, color: '#27ae60' }}>
                <span>Score:</span>
                <span className={getScoreColor(score, testResult.totalQuestions)} style={{ marginLeft: 8 }}>{score} / {testResult.totalQuestions}</span>
              </div>
              <div className={styles.resultRow} style={{ fontSize: '1.1rem', fontWeight: 600, color: pointsEarned > 0 ? '#27ae60' : '#e74c3c' }}>
                <span>Points:</span>
                <span className={getPointsColor(pointsEarned)} style={{ marginLeft: 8 }}>{pointsEarned > 0 ? '+' : ''}{pointsEarned}</span>
              </div>
              <div className={styles.resultRow} style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1c40f', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Rank:</span>
                <span style={{ color: currentRank?.color, display: 'flex', alignItems: 'center', gap: 6 }}>{currentRank?.name && rankIcons[currentRank.name]} {currentRank?.name}</span>
              </div>
              <div className={styles.resultRow} style={{ fontSize: '1.05rem', color: '#fff', marginTop: 6 }}>
                <span>{selectedSubject?.name || 'Subject'} | Week {selectedWeek?.number}</span>
              </div>
              <div className={styles.resultRow} style={{ fontSize: '1.05rem', color: '#fff', marginTop: 2 }}>
                <span>{user?.displayName || user?.name || 'A Student'}</span>
              </div>
            </div>
            {/* Social/Competitive Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '18px 0 0 0', gap: 10 }}>
              <button className={styles.leaderboardButton} onClick={handleShareChallenge} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaShareAlt /> Challenge a Friend</button>
              <button className={styles.leaderboardButton} onClick={handleShareImage} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><FaShareAlt /> Share Your Score (as Image)</button>
            </div>
            {/* Share Modal Fallback */}
            {shareModal.open && (
              <ShareModal type={shareModal.type} onClose={() => setShareModal({ open: false, type: null, imageUrl: null })} imageUrl={shareModal.imageUrl} />
            )}
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
              style={{ marginTop: 18, background: '#27ae60', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: 8 }}
            >
              Close
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2em' }}>
            <p className={styles.infoMessage}>No results to display.</p>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultModal; 