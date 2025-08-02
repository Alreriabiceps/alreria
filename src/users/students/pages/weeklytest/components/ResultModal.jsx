import React, { useState, useRef } from "react";
import styles from "../pages/WeeklyTest.module.css";
import html2canvas from "html2canvas";
import {
  FaCrown,
  FaMedal,
  FaStar,
  FaUserGraduate,
  FaRegSadTear,
  FaRegClock,
  FaFacebookMessenger,
  FaWhatsapp,
  FaDiscord,
  FaCopy,
  FaDownload,
  FaShareAlt,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";

const ResultModal = ({
  showResultModal,
  setShowResultModal,
  testResult,
  score,
  pointsEarned,
  currentRank,
  loading,
  error,
  user,
  selectedSubject,
  selectedWeek,
}) => {
  // Share modal state - moved before early return
  const [shareModal, setShareModal] = useState({
    open: false,
    type: null,
    imageUrl: null,
  });
  const imageBlobRef = useRef(null);

  if (!showResultModal) return null;

  // Generate share/challenge link
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  if (testResult && selectedSubject && selectedWeek && user) {
    params.set("challenge", "1");
    params.set("score", score);
    params.set("week", selectedWeek.number);
    params.set("subject", selectedSubject.id);
    params.set(
      "from",
      user.displayName || user.name || user.email || "A Student"
    );
  }
  const challengeLink = `${baseUrl}?${params.toString()}`;

  // Share handlers
  const handleCopy = () => {
    navigator.clipboard
      .writeText(challengeLink)
      .then(() => {
        alert("Challenge link copied to clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = challengeLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Challenge link copied to clipboard!");
      });
  };

  const handleShareChallenge = () => {
    setShareModal({ open: true, type: "link", imageUrl: null });
  };

  // Download image handler
  const handleDownloadImage = () => {
    if (imageBlobRef.current) {
      const url = URL.createObjectURL(imageBlobRef.current);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-test-score-${score}-${
        selectedSubject?.name || "Subject"
      }-week${selectedWeek?.number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Copy image to clipboard
  const handleCopyImage = async () => {
    if (imageBlobRef.current) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": imageBlobRef.current }),
        ]);
        alert("Score image copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy image:", err);
        alert(
          "Could not copy image to clipboard. Please try downloading instead."
        );
      }
    }
  };

  // Messenger/WhatsApp share links
  const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
    challengeLink
  )}&app_id=123456789&redirect_uri=${encodeURIComponent(window.location.href)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `🎯 I just scored ${score}/${testResult?.totalQuestions} on ${selectedSubject?.name} Week ${selectedWeek?.number}! Can you beat my score? ${challengeLink}`
  )}`;

  // Map rank names to icons
  const rankIcons = {
    "Absent Legend": (
      <FaRegSadTear color="#888" size={24} title="Absent Legend" />
    ),
    "The Crammer": <FaRegClock color="#e67e22" size={24} title="The Crammer" />,
    Seatwarmer: <FaUserGraduate color="#2980b9" size={24} title="Seatwarmer" />,
    "Group Project Ghost": (
      <FaMedal color="#8e44ad" size={24} title="Group Project Ghost" />
    ),
    "Google Scholar (Unofficial)": (
      <FaStar color="#27ae60" size={24} title="Google Scholar" />
    ),
    "The Lowkey Genius": (
      <FaStar color="#f1c40f" size={24} title="Lowkey Genius" />
    ),
    "Almost Valedictorian": (
      <FaMedal color="#f39c12" size={24} title="Almost Valedictorian" />
    ),
    "The Valedictornator": (
      <FaCrown color="#e67e22" size={28} title="Valedictornator" />
    ),
  };

  // Share as image handler
  const handleShareImage = async () => {
    const card = document.getElementById("score-share-card");
    if (!card) return;

    try {
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        imageBlobRef.current = blob;

        // Try native sharing first (mobile devices)
        if (
          navigator.canShare &&
          navigator.canShare({
            files: [new File([blob], "score.png", { type: blob.type })],
          })
        ) {
          try {
            await navigator.share({
              files: [new File([blob], "score.png", { type: blob.type })],
              title: "My Weekly Test Score",
              text: `Check out my score: ${score}/${testResult?.totalQuestions}!`,
            });
            return;
          } catch {
            console.log("Native sharing failed, showing modal");
          }
        }

        // Fallback: show modal with download/copy options
        const url = URL.createObjectURL(blob);
        setShareModal({ open: true, type: "image", imageUrl: url });
      }, "image/png");
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate score image. Please try again.");
    }
  };

  // Get score color based on percentage
  const getScoreColorClass = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "#27ae60"; // Green
    if (percentage >= 70) return "#f39c12"; // Orange
    if (percentage >= 50) return "#f1c40f"; // Yellow
    return "#e74c3c"; // Red
  };

  // Redesigned Share Modal component
  const ShareModal = ({ type, onClose, imageUrl }) => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.9)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)",
          color: "#fff",
          borderRadius: 20,
          padding: 32,
          minWidth: 340,
          maxWidth: 500,
          boxShadow: "0 0 30px rgba(241, 196, 15, 0.3)",
          textAlign: "center",
          border: "3px solid var(--dbz-orange)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            cursor: "pointer",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={onClose}
        >
          <FaTimes size={16} color="#fff" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <FaShareAlt size={24} color="var(--dbz-orange)" />
          <h2
            style={{
              fontSize: "1.6rem",
              margin: 0,
              color: "var(--dbz-orange)",
              letterSpacing: 1,
              fontWeight: 800,
              fontFamily: "var(--font-header)",
            }}
          >
            Share {type === "image" ? "Score Image" : "Challenge"}
          </h2>
        </div>

        {type === "link" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: "#ccc", marginBottom: 16, fontSize: "1rem" }}>
              Challenge your friends to beat your score!
            </p>
            <button
              className={styles.leaderboardButton}
              onClick={handleCopy}
              style={{ width: "100%" }}
            >
              <FaCopy /> Copy Challenge Link
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.leaderboardButton}
              style={{ width: "100%", textDecoration: "none" }}
            >
              <FaWhatsapp color="#25d366" /> Share on WhatsApp
            </a>
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.leaderboardButton}
              style={{ width: "100%", textDecoration: "none" }}
            >
              <FaFacebookMessenger color="#0084ff" /> Share on Messenger
            </a>
            <input
              type="text"
              value={challengeLink}
              readOnly
              style={{
                width: "100%",
                marginTop: 12,
                fontSize: "0.9rem",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #555",
                background: "#2a2a2a",
                color: "#fff",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Challenge link will appear here"
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Score Card"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  marginBottom: 16,
                  border: "2px solid var(--dbz-orange)",
                }}
              />
            )}
            <button
              className={styles.leaderboardButton}
              onClick={handleDownloadImage}
              style={{ width: "100%" }}
            >
              <FaDownload /> Download Image
            </button>
            <button
              className={styles.leaderboardButton}
              onClick={handleCopyImage}
              style={{ width: "100%" }}
            >
              <FaCopy /> Copy to Clipboard
            </button>
            <p style={{ color: "#aaa", fontSize: "0.9rem", marginTop: 8 }}>
              Save and share this image on your favorite social platform!
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className={styles.closeButton}
          style={{ marginTop: 20 }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.resultModalOverlay}>
      <div className={styles.resultModal}>
        {/* Hidden Score Card for Sharing as Image */}
        <div
          id="score-share-card"
          style={{
            width: 400,
            minHeight: 300,
            background:
              "linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)",
            color: "#fff",
            borderRadius: 20,
            padding: 32,
            position: "absolute",
            left: "-9999px",
            top: 0,
            fontFamily: '"Bangers", cursive',
            display: testResult ? "block" : "none",
            border: "3px solid var(--dbz-orange)",
            boxShadow: "0 0 30px rgba(241, 196, 15, 0.3)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "var(--dbz-orange)",
                letterSpacing: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                textShadow: "2px 2px 0 #000",
              }}
            >
              <FaTrophy size={28} color="var(--dbz-orange)" />
              TEST RESULTS
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div
              style={{
                fontSize: "4rem",
                fontWeight: 900,
                color: getScoreColorClass(score, testResult?.totalQuestions),
                textShadow: "3px 3px 0 #000",
                lineHeight: 1,
              }}
            >
              {score}
              <span style={{ fontSize: "2rem", color: "#fff", marginLeft: 8 }}>
                / {testResult?.totalQuestions}
              </span>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "1.2rem",
              marginBottom: 12,
              color: "var(--dbz-orange)",
            }}
          >
            <strong>{user?.displayName || user?.name || "Student"}</strong>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              marginBottom: 12,
              color: "#fff",
            }}
          >
            {selectedSubject?.name || "Subject"} • Week {selectedWeek?.number}
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "var(--dbz-orange)",
            }}
          >
            {currentRank?.name && rankIcons[currentRank.name]}
            <strong>{currentRank?.name}</strong>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "1rem",
              margin: "16px 0",
              color: "#ccc",
            }}
          >
            Points: {pointsEarned > 0 ? "+" : ""}
            {pointsEarned}
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "1rem",
              marginTop: 20,
              color: "#888",
            }}
          >
            Can you beat this score?
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "0.9rem",
              marginTop: 16,
              color: "#666",
            }}
          >
            GLEAS • Gamified Learning System
          </div>
        </div>

        {/* Modal Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <FaTrophy size={32} color="var(--dbz-orange)" />
          <h2 className={styles.resultTitle}>Test Results</h2>
        </div>

        {loading && !testResult ? (
          <div style={{ textAlign: "center", padding: "2em" }}>
            <div className={styles.loadingMessage}>
              Calculating your results...
            </div>
            <div
              className={styles.spinner}
              style={{ marginTop: "1.5em" }}
            ></div>
          </div>
        ) : !loading && !testResult && error ? (
          <div style={{ textAlign: "center", padding: "2em" }}>
            <h3 style={{ color: "var(--dbz-red)", marginBottom: "1em" }}>
              Error
            </h3>
            <p
              className={styles.errorMessage}
              style={{ marginBottom: "1.5em" }}
            >
              {error}
            </p>
            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
            >
              Close
            </button>
          </div>
        ) : testResult ? (
          <>
            <div className={styles.resultContent}>
              {/* Score Display */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 24,
                  padding: "20px 0",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 15,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 900,
                    color: getScoreColorClass(score, testResult.totalQuestions),
                    textShadow: "2px 2px 0 #000",
                    lineHeight: 1,
                    fontFamily: "var(--font-header)",
                  }}
                >
                  {score}
                  <span
                    style={{ fontSize: "1.8rem", color: "#fff", marginLeft: 8 }}
                  >
                    / {testResult.totalQuestions}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    marginTop: 8,
                    color: "#ccc",
                  }}
                >
                  {Math.round((score / testResult.totalQuestions) * 100)}%
                  Accuracy
                </div>
              </div>

              {/* Stats */}
              <div className={styles.resultRow}>
                <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  Points:
                </span>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: pointsEarned >= 0 ? "#27ae60" : "#e74c3c",
                  }}
                >
                  {pointsEarned > 0 ? "+" : ""}
                  {pointsEarned}
                </span>
              </div>

              <div className={styles.resultRow}>
                <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  Rank:
                </span>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--dbz-orange)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {currentRank?.name && rankIcons[currentRank.name]}
                  {currentRank?.name}
                </span>
              </div>

              <div className={styles.resultRow}>
                <span style={{ fontSize: "1rem", color: "#ccc" }}>
                  Subject:
                </span>
                <span style={{ fontSize: "1rem", color: "#fff" }}>
                  {selectedSubject?.name || "Subject"}
                </span>
              </div>

              <div className={styles.resultRow}>
                <span style={{ fontSize: "1rem", color: "#ccc" }}>Week:</span>
                <span style={{ fontSize: "1rem", color: "#fff" }}>
                  Week {selectedWeek?.number}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                className={styles.leaderboardButton}
                onClick={handleShareChallenge}
                style={{ width: "100%" }}
              >
                <FaShareAlt /> Challenge a Friend
              </button>

              <button
                className={styles.leaderboardButton}
                onClick={handleShareImage}
                style={{ width: "100%" }}
              >
                <FaDownload /> Share Your Score (as Image)
              </button>
            </div>

            {/* Share Modal */}
            {shareModal.open && (
              <ShareModal
                type={shareModal.type}
                onClose={() => {
                  setShareModal({ open: false, type: null, imageUrl: null });
                  if (shareModal.imageUrl) {
                    URL.revokeObjectURL(shareModal.imageUrl);
                  }
                }}
                imageUrl={shareModal.imageUrl}
              />
            )}

            <button
              className={styles.closeButton}
              onClick={() => setShowResultModal(false)}
              style={{ marginTop: 24, width: "100%" }}
            >
              Close
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "2em" }}>
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
