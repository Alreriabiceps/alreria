import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Start.module.css";

const BACKGROUND_MUSIC_SRC = "/shs.mp3";
const INITIAL_VOLUME = 1;
const SFX_VOLUME = 0.5;
const SFX_CORRECT_SRC = "/sfx/correct.wav";
const SFX_INCORRECT_SRC = "/sfx/incorrect.wav";
const SFX_LAUNCH_SRC = "/sfx/launch.wav";

const playSound = (src, volume = SFX_VOLUME) => {
  try {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.play().catch((e) => console.warn(`SFX play failed: ${e.message}`));
  } catch (e) {
    console.error("Error playing sound:", e);
  }
};

const Start = () => {
  const navigate = useNavigate();
  const [stars, setStars] = useState([]);
  const [buttonPosition, setButtonPosition] = useState({
    top: "70%",
    left: "50%",
  });
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [screenFlash, setScreenFlash] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // New state to track if music is playing

  const audioRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // --- Background Music Setup and Autoplay Attempt ---
  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(BACKGROUND_MUSIC_SRC);
    audioRef.current.loop = true;
    audioRef.current.volume = INITIAL_VOLUME;
    audioRef.current.preload = "auto";

    // Add error handler
    const handleError = (e) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    // Add loadeddata handler to attempt autoplay once audio is ready
    const handleLoaded = () => {
      console.log("Audio loaded and ready to play");
      if (!isMuted) {
        audioRef.current.play()
          .then(() => {
            console.log("Autoplay started successfully");
            setIsPlaying(true);
          })
          .catch(e => {
            console.warn("Autoplay blocked:", e.message);
            setIsPlaying(false);
          });
      }
    };

    // Event listeners for play/pause state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Attach all event listeners
    audioRef.current.addEventListener("loadeddata", handleLoaded);
    audioRef.current.addEventListener("play", handlePlay);
    audioRef.current.addEventListener("pause", handlePause);
    audioRef.current.addEventListener("error", handleError);

    // Attempt to play on first user interaction with the page
    const handleFirstInteraction = () => {
      if (audioRef.current && audioRef.current.paused && !isMuted) {
        audioRef.current.play()
          .then(() => console.log("Audio started after user interaction"))
          .catch(e => console.warn("Audio still failed after interaction:", e));
      }

      // Remove the event listeners after first interaction
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("loadeddata", handleLoaded);
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("pause", handlePause);
        audioRef.current.removeEventListener("error", handleError);
        audioRef.current = null;
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isMuted]); // Only re-run if muted state changes

  // Effect to handle mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else if (!audioRef.current.paused || isPlaying) {
        // Only attempt to play if it was previously playing or isPlaying is true
        audioRef.current.play().catch(e => console.warn("Play on unmute failed:", e));
      }
    }
  }, [isMuted, isPlaying]);

  // Separate effect for other initial setups like stars and event listeners
  useEffect(() => {
    const initialStars = Array.from({ length: isMobile ? 100 : 100 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * (isMobile ? 1.2 : 1.8) + 0.8,
      opacity: Math.random() * 0.5 + 0.3,
    }));
    setStars(initialStars);

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Keep window event listener cleanup here
    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(flashTimeoutRef.current); // Also clear flash timeout
    };
  }, [isMobile]);

  // Handler for the new "Play Anthem" button
  const handlePlayAnthem = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      // Only attempt to play if currently paused
      audioRef.current.volume = INITIAL_VOLUME; // Ensure volume is set
      audioRef.current
        .play()
        .then(() => {
          // isPlaying state will be updated by the 'play' event listener
        })
        .catch((e) => {
          console.error("Failed to play anthem via button:", e);
          // Optionally give user feedback if play fails
        });
    }
  }, []); // Dependencies are stable functions/refs

  // Handler for the mute button
  const handleMuteToggle = useCallback(() => {
    if (audioRef.current) {
      setIsMuted((prev) => !prev);
      // The useEffect hook listening to isMuted will handle pausing/playing the audio element
    }
  }, []); // Depends only on audioRef.current stability

  const handleLaunchClick = useCallback(() => {
    if (isCorrect && !isAnimating) {
      playSound(SFX_LAUNCH_SRC);
      setFeedbackMessage("Initializing Warp Sequence...");
      setIsAnimating(true);

      // Fade out music if it's currently playing and not muted
      if (audioRef.current && !audioRef.current.paused && !isMuted) {
        let currentVolume = audioRef.current.volume;
        const fadeOutInterval = setInterval(() => {
          currentVolume -= 0.02;
          if (currentVolume <= 0) {
            clearInterval(fadeOutInterval);
            audioRef.current?.pause();
            audioRef.current.volume = INITIAL_VOLUME; // Reset volume
          } else if (audioRef.current) {
            audioRef.current.volume = Math.max(0, currentVolume);
          } else {
            clearInterval(fadeOutInterval);
          }
        }, 50);
      } else {
        // If music wasn't playing or was muted, just ensure it's paused
        audioRef.current?.pause();
      }

      setTimeout(() => {
        navigate("/student/dashboard");
      }, 1200);
    } else if (!isCorrect) {
      playSound(SFX_INCORRECT_SRC);
      setFeedbackMessage("ACCESS DENIED. Complete the security check!");
      const securityBox = containerRef.current?.querySelector(
        `.${styles["security-check-box"]}`
      );
      securityBox?.classList.add(styles["shake-animation-box"]);
      setTimeout(() => {
        securityBox?.classList.remove(styles["shake-animation-box"]);
      }, 400);
    }
  }, [isCorrect, isAnimating, navigate, isMuted]); // Depends on relevant states/functions

  // Keydown event listener (now in its own effect)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key.toLowerCase() === "m") handleMuteToggle();
      if (
        (event.key === "Enter" || event.key === " ") &&
        isCorrect &&
        !isAnimating
      ) {
        event.preventDefault();
        handleLaunchClick();
      }
      // Add 'A' key to play anthem if not currently playing
      if (
        event.key.toLowerCase() === "a" &&
        !isPlaying &&
        audioRef.current?.paused
      ) {
        event.preventDefault();
        handlePlayAnthem(); // Use the new handler
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCorrect,
    isAnimating,
    handleLaunchClick,
    handleMuteToggle,
    handlePlayAnthem,
    isPlaying,
  ]); // Depends on relevant states/functions

  const handleMouseMove = (e) => {
    let didStarsMove = false;
    const updatedStars = stars.map((star) => {
      const dx = e.clientX - (window.innerWidth * star.left) / 100;
      const dy = e.clientY - (window.innerHeight * star.top) / 100;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const maxDistance = isMobile ? 100 : 180;
      const baseMoveStrength = isMobile ? 1.5 : 3;
      const starMoveStrength = baseMoveStrength * (star.opacity * 1.2 + 0.4);

      let newLeft = star.left;
      let newTop = star.top;

      if (distance < maxDistance && distance > 0) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = (dx / distance) * force * starMoveStrength;
        const moveY = (dy / distance) * force * starMoveStrength;

        let potentialLeft = star.left - (moveX / window.innerWidth) * 100;
        let potentialTop = star.top - (moveY / window.innerHeight) * 100;

        potentialLeft = Math.max(0, Math.min(100, potentialLeft));
        potentialTop = Math.max(0, Math.min(100, potentialTop));

        if (
          Math.abs(potentialLeft - star.left) > 0.02 ||
          Math.abs(potentialTop - star.top) > 0.02
        ) {
          newLeft = potentialLeft;
          newTop = potentialTop;
          didStarsMove = true;
        }
      }
      return { ...star, left: newLeft, top: newTop };
    });

    if (didStarsMove) {
      setStars(updatedStars);
    }

    // Only enable button movement if music is NOT playing and other conditions met
    if (!isMobile && !isCorrect && !isAnimating && !isPlaying) {
      const buttonElement = document.getElementById("launch-button");
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const distanceX = Math.abs(e.clientX - (rect.left + rect.width / 2));
        const distanceY = Math.abs(e.clientY - (rect.top + rect.height / 2));
        const avoidDistance = 120;
        if (distanceX < avoidDistance && distanceY < avoidDistance) {
          let newLeftPercent = parseFloat(buttonPosition.left);
          let newTopPercent = parseFloat(buttonPosition.top);
          const moveFactor = 5;
          if (e.clientX < rect.left + rect.width / 2)
            newLeftPercent += moveFactor;
          else newLeftPercent -= moveFactor;
          if (e.clientY < rect.top + rect.height / 2)
            newTopPercent += moveFactor;
          else newTopPercent -= moveFactor;
          newLeftPercent = Math.max(10, Math.min(90, newLeftPercent));
          newTopPercent = Math.max(15, Math.min(85, newTopPercent));
          setButtonPosition({
            top: `${newTopPercent}%`,
            left: `${newLeftPercent}%`,
          });
        }
      }
    }
  };

  const handleAnswer = (answer) => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    if (isCorrect || isAnimating) return;

    const correct = answer === "correct";
    const message = correct
      ? "Security Cleared. Target Acquired!"
      : "Incorrect Sequence. Try Again.";

    setScreenFlash(answer); // Use 'correct' or 'wrong' for flash class
    setIsCorrect(correct);
    setFeedbackMessage(message);
    // Reset button position when an answer is given, especially if correct
    // We only need to reset if the button was previously evading the mouse
    if (!isPlaying) {
      // Only reset if music wasn't playing (button might have been evading)
      setButtonPosition({ top: isMobile ? "65%" : "65%", left: "50%" });
    }

    if (correct) {
      playSound(SFX_CORRECT_SRC);
    } else {
      playSound(SFX_INCORRECT_SRC);
      const securityBox = containerRef.current?.querySelector(
        `.${styles["security-check-box"]}`
      );
      securityBox?.classList.add(styles["shake-animation-box"]);
      setTimeout(() => {
        securityBox?.classList.remove(styles["shake-animation-box"]);
      }, 400);
    }

    flashTimeoutRef.current = setTimeout(() => setScreenFlash(""), 200);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles["start-screen-container"]} ${isAnimating ? styles["slide-up-animation"] : ""
        }`}
      onMouseMove={handleMouseMove}
    >
      <div
        className={`${styles["screen-flash-overlay"]} ${screenFlash ? styles[`flash-${screenFlash}`] : ""
          }`}
      ></div>
      {/* Music playing message */}
      {isPlaying && (
        <div className={styles["music-playing-message"]}>
          <span className={styles["music-icon"]}>♪</span>
          <span className={styles["music-text"]}>GLEAS POP ANTHEM PLAYING</span>
          <span className={styles["music-icon"]}>♪</span>
        </div>
      )}

      {/* Mute Button - Always show once audio has loaded */}
      <button
        onClick={handleMuteToggle}
        className={`${styles["game-button-small"]} ${styles["mute-button"]}`}
        aria-label={
          isMuted ? "Unmute Background Music" : "Mute Background Music"
        }
        title={isMuted ? "Unmute (M)" : "Mute (M)"}
      >
        {isMuted ? "[Unmute]" : "[Mute]"}
      </button>

      <div className={styles["content-wrapper"]}>
        {/* Logo image above the title */}

        <h1 className={`${styles["title-text"]} ${styles["text-shadow-glow"]}`}>
          READY PLAYER?
        </h1>

        {/* New Play Anthem Button - Show only if music is NOT playing */}
        {!isPlaying && (
          <button
            onClick={handlePlayAnthem}
            className={`${styles["game-button"]} ${styles["play-anthem-button"]}`}
            title="Play The Gleas Anthem (A)"
          >
            Play The Gleas Anthem
          </button>
        )}

        {!isCorrect && (
          <div className={styles["security-check-box"]}>
            <h2 className={styles["security-title"]}>Security Check:</h2>
            <p className={styles["security-question"]}>
              Engage Thrusters: 2 + 2 = ?
            </p>
            <div className={styles["answers-container"]}>
              <button
                onClick={() => handleAnswer("wrong")}
                className={`${styles["game-button"]} ${styles["answer-button"]} ${styles["wrong-button"]}`}
              >
                3
              </button>
              <button
                onClick={() => handleAnswer("correct")}
                className={`${styles["game-button"]} ${styles["answer-button"]} ${styles["correct-button"]}`}
              >
                4
              </button>
              <button
                onClick={() => handleAnswer("wrong")}
                className={`${styles["game-button"]} ${styles["answer-button"]} ${styles["wrong-button"]}`}
              >
                5
              </button>
            </div>
          </div>
        )}

        {feedbackMessage && (
          <p
            className={`${styles["feedback-message"]} ${isCorrect
              ? styles["feedback-correct"]
              : styles["feedback-incorrect"]
              }`}
          >
            {feedbackMessage}
          </p>
        )}
      </div>

      <button
        id="launch-button"
        onClick={handleLaunchClick}
        className={`${styles["game-button"]} ${styles["launch-button"]} ${isCorrect ? styles["button-ready"] : styles["button-waiting"]
          } ${isAnimating ? styles["button-animating"] : ""}`}
        style={{
          top: buttonPosition.top,
          left: buttonPosition.left,
          transform: "translate(-50%, -50%)",
          // Button movement transition only when not correct, not animating, and not playing music
          transition:
            !isCorrect && !isAnimating && !isPlaying
              ? "top 0.3s linear, left 0.3s linear"
              : "none",
        }}
        disabled={!isCorrect || isAnimating}
        title={
          isCorrect
            ? "Launch Application (Enter/Space)"
            : "Complete Security Check First"
        }
      >
        LAUNCH
      </button>

      <div className={styles["starfield"]}>
        {stars.map((star, index) => (
          <div
            key={index}
            className={styles["star-particle"]}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              transition: "left 0.8s linear, top 0.8s linear",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Start;
