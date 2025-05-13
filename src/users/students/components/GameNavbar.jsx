import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./GameNavbar.module.css";

const Icons = {
  Dashboard: "📊",
  Challenges: "⚔️",
  WeeklyTest: "📅",
  Duels: "🤺",
  PartyQueue: "🤝",
  Reviewers: "📚",
  Rankings: "🏆",
  Crew: "👥",
  Profile: "👤",
  Logout: "🚪",
  MenuOpen: "☰",
  MenuClose: "✕",
  Mute: "🔊",
  Unmute: "🔇",
};

const MUSIC_MAP = {
  dashboard: [
    "/student/dashboard",
    "/student/reviewers",
    "/student/ranking",
    "/student/profile",
    "/student/crew",
  ],
  weekly: ["/student/weeklytest"],
  pvp: ["/student/pvp", "/student/playervsplayer", "/student/partymmr"],
};

const getMusicTrack = (path) => {
  if (MUSIC_MAP.dashboard.includes(path)) return "/dashboard.mp3";
  if (MUSIC_MAP.weekly.includes(path)) return "/weekly-test.mp3";
  if (MUSIC_MAP.pvp.includes(path)) return "/pvp.mp3";
  return "/default.mp3";
};

const BURGER_BREAKPOINT = 1200;

const GameNavbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChallengesOpen, setChallengesOpen] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTrack, setCurrentTrack] = useState(
    getMusicTrack(location.pathname)
  );
  const [isDragging, setIsDragging] = useState(false);
  const volumeBoxRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();
  const audioRef = useRef(null);
  const challengesRef = useRef();
  const menuRef = useRef();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    setChallengesOpen(false);
  };

  const toggleChallenges = (e) => {
    e.stopPropagation();
    setChallengesOpen((prev) => !prev);
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setChallengesOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    navigate("/");
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
        audioRef.current.volume = newMuted ? 0.5 : volume / 100;
      }
      return newMuted;
    });
  };

  const handleVolumeBoxClick = (e) => {
    if (volumeBoxRef.current) {
      const rect = volumeBoxRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = (clickPosition / rect.width) * 100;
      const newVolume = Math.min(100, Math.max(0, Math.round(percentage)));
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
    }
  };

  const handleVolumeBoxDrag = (e) => {
    if (isDragging && volumeBoxRef.current) {
      const rect = volumeBoxRef.current.getBoundingClientRect();
      const dragPosition = e.clientX - rect.left;
      const percentage = (dragPosition / rect.width) * 100;
      const newVolume = Math.min(100, Math.max(0, Math.round(percentage)));
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const newTrack = getMusicTrack(location.pathname);
    if (newTrack !== currentTrack) {
      const audio = audioRef.current;
      audio.pause();
      audio.src = newTrack;
      audio.load();
      audio.volume = 0;
      setCurrentTrack(newTrack);
      const delay = 500;
      const fadeDuration = 2000;

      setTimeout(() => {
        audio.play().then(() => {
          let vol = 0;
          const step = 0.05;
          const interval = setInterval(() => {
            vol += step;
            if (vol >= volume / 100) {
              vol = volume / 100;
              clearInterval(interval);
            }
            audio.volume = vol;
          }, fadeDuration * step);
        });
      }, delay);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (challengesRef.current && !challengesRef.current.contains(e.target)) {
        setChallengesOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinkClass = ({ isActive }) =>
    isActive ? `${styles.navbarLink} ${styles.activeLink}` : styles.navbarLink;

  const dropdownItemClass = ({ isActive }) =>
    isActive
      ? `${styles.dropdownItem} ${styles.activeLink}`
      : styles.dropdownItem;

  const NavLinks = ({ isMobile }) => (
    <>
      <NavLink
        to="/student/dashboard"
        className={navLinkClass}
        onClick={closeMenus}
      >
        {isMobile && (
          <span className={styles.panelIcon}>{Icons.Dashboard}</span>
        )}{" "}
        Dashboard
      </NavLink>
      <div
        className={`${styles.dropdown} ${isChallengesOpen ? styles.open : ""}`}
        ref={challengesRef}
      >
        <button
          type="button"
          className={styles.dropdownToggle}
          onClick={toggleChallenges}
        >
          {isMobile && (
            <span className={styles.panelIcon}>{Icons.Challenges}</span>
          )}{" "}
          Challenges
        </button>
        {isChallengesOpen && (
          <div className={styles.dropdownMenu}>
            <NavLink
              to="/student/weeklytest"
              className={dropdownItemClass}
              onClick={closeMenus}
            >
              <span className={styles.panelIcon}>{Icons.WeeklyTest}</span>{" "}
              Weekly Test
            </NavLink>
            <NavLink
              to="/student/sololobby"
              className={dropdownItemClass}
              onClick={closeMenus}
            >
              <span className={styles.panelIcon}>{Icons.Duels}</span> 1v1 Duels
            </NavLink>
            <NavLink
              to="/student/partymmr"
              className={dropdownItemClass}
              onClick={closeMenus}
            >
              <span className={styles.panelIcon}>{Icons.PartyQueue}</span> Party
              Queue
            </NavLink>
          </div>
        )}
      </div>
      <NavLink
        to="/student/reviewers"
        className={navLinkClass}
        onClick={closeMenus}
      >
        {isMobile && (
          <span className={styles.panelIcon}>{Icons.Reviewers}</span>
        )}{" "}
        Reviewers
      </NavLink>
      <NavLink
        to="/student/ranking"
        className={navLinkClass}
        onClick={closeMenus}
      >
        {isMobile && <span className={styles.panelIcon}>{Icons.Rankings}</span>}{" "}
        Rankings
      </NavLink>
      <NavLink to="/student/crew" className={navLinkClass} onClick={closeMenus}>
        {isMobile && <span className={styles.panelIcon}>{Icons.Crew}</span>}{" "}
        Crew
      </NavLink>
      <NavLink
        to="/student/profile"
        className={navLinkClass}
        onClick={closeMenus}
      >
        {isMobile && <span className={styles.panelIcon}>{Icons.Profile}</span>}{" "}
        Profile
      </NavLink>
      <NavLink to="/student/pvp" className={navLinkClass} onClick={closeMenus}>
        {isMobile && (
          <span className={styles.panelIcon}>{Icons.Reviewers}</span>
        )}{" "}
        Demo
      </NavLink>
      <button className={styles.navbarLink} onClick={handleLogout}>
        {isMobile && <span className={styles.panelIcon}>{Icons.Logout}</span>}{" "}
        Logout
      </button>
    </>
  );

  return (
    <nav className={styles.navbar} ref={menuRef}>
      <div className={styles.navbarBrand}>
        <Link
          to="/student/dashboard"
          className={styles.navbarLogo}
          onClick={closeMenus}
        >
          GLEAS
        </Link>
      </div>
      {windowWidth >= BURGER_BREAKPOINT && (
        <div className={styles.desktopNavLinks}>
          <NavLinks isMobile={false} />
        </div>
      )}
      <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? Icons.MenuClose : Icons.MenuOpen}
      </button>
      {isMobileMenuOpen && windowWidth < BURGER_BREAKPOINT && (
        <div className={`${styles.mobileNavLinks} ${styles.open}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,5,25,0.98)', zIndex: 999, overflowY: 'auto', paddingTop: 70 }}>
          <NavLinks isMobile={true} />
        </div>
      )}
      <div className={styles.volumeControls}>
        <button className={styles.muteButton} onClick={toggleMute}>
          {isMuted ? Icons.Unmute : Icons.Mute}
        </button>
        {!isMuted && (
          <div
            className={styles.volumeBox}
            ref={volumeBoxRef}
            onClick={handleVolumeBoxClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleVolumeBoxDrag}
          >
            <div
              className={styles.volumeFill}
              style={{ width: `${volume}%` }}
            />
            <div className={styles.volumePercentage}>{volume}%</div>
          </div>
        )}
      </div>
      <audio ref={audioRef} autoPlay loop>
        <source src={currentTrack} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </nav>
  );
};

export default GameNavbar;
