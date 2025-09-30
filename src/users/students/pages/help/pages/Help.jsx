import React from "react";

const Section = ({ id, title, children, isMobile }) => (
  <section id={id} style={{ marginBottom: 32 }}>
    <h2
      style={{
        fontSize: "1.6rem",
        margin: isMobile ? "0 -8px 10px" : "0 0 10px 0",
        padding: isMobile ? "8px 8px" : 0,
        background: isMobile ? "#0f1823" : "transparent",
        position: isMobile ? "sticky" : "static",
        top: isMobile ? -1 : "auto",
        zIndex: 2,
        borderBottom: isMobile ? "1px solid #223042" : "none",
        color: "#f1c40f",
        fontFamily: "Bangers, cursive",
        letterSpacing: 1,
      }}
    >
      {title}
    </h2>
    <div style={{ lineHeight: 1.7, color: "#E0F2F7" }}>{children}</div>
  </section>
);

const SubTitle = ({ children }) => (
  <h3 style={{ margin: "14px 0 8px 0", color: "#e5e7eb", fontSize: "1.05rem" }}>
    {children}
  </h3>
);

const Pill = ({ text, href, compact, active, onClick }) => (
  <a
    href={href}
    onClick={(e) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    }}
    style={{
      display: compact ? "inline-block" : "block",
      whiteSpace: compact ? "nowrap" : "normal",
      background: active ? "#1e2a39" : "#161d27",
      border: `1px solid ${active ? "#3b82f6" : "#2f3b4f"}`,
      boxShadow: active ? "0 0 0 1px rgba(59,130,246,0.25) inset" : "none",
      borderRadius: compact ? 999 : 8,
      padding: compact ? "8px 12px" : "8px 10px",
      marginBottom: compact ? 0 : 8,
      marginRight: compact ? 8 : 0,
      color: active ? "#ffffff" : "#E0F2F7",
      fontSize: 12,
      fontWeight: 800,
      textDecoration: "none",
      transition:
        "background 120ms ease, border-color 120ms ease, color 120ms ease",
    }}
  >
    {text}
  </a>
);

export default function Help() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [activeId, setActiveId] = React.useState("getting-started");
  const [showTop, setShowTop] = React.useState(false);

  const tocItems = React.useMemo(
    () => [
      { id: "getting-started", label: "1. Getting Started" },
      { id: "dashboard", label: "2. Dashboard" },
      { id: "weekly-test", label: "3. Weekly Test" },
      { id: "party-queue", label: "4. Party Queue" },
      { id: "party-queue", label: "5. Team Weekly" },
      { id: "pvp", label: "6. PvP Arena" },
      { id: "ranking", label: "7. Ranking" },
      { id: "profile", label: "8. Profile" },
      { id: "reviewers", label: "9. Reviewers" },
      { id: "messenger", label: "10. Messenger" },
      { id: "shortcuts", label: "11. Shortcuts" },
      { id: "troubleshooting", label: "12. Troubleshooting" },
      { id: "faq", label: "13. FAQ" },
      { id: "glossary", label: "14. Glossary" },
    ],
    []
  );

  const handleNavigate = React.useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        window.history.replaceState(null, "", `#${id}`);
      } catch (_) {}
    }
  }, []);

  const handleScrollTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  React.useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        const top = visible[0].target.getAttribute("id");
        if (top && top !== activeId) setActiveId(top);
      }
    }, options);

    const sections = tocItems
      .map((t) => document.getElementById(t.id))
      .filter(Boolean);
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [tocItems, activeId]);

  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveId(id);
        }, 50);
      }
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#0D131A",
        color: "#E0F2F7",
        fontFamily: "Montserrat, sans-serif",
        padding: isMobile ? "18px 10px 64px" : "28px 12px 80px",
        scrollBehavior: "smooth",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: isMobile ? 12 : 18 }}>
          <h1
            style={{
              fontSize: isMobile ? "1.9rem" : "2.4rem",
              margin: 0,
              color: "#f1c40f",
              fontFamily: "Bangers, cursive",
              letterSpacing: 2,
              textShadow:
                "2px 2px 0 #0D131A, -1px -1px 0 #0D131A, 1px -1px 0 #0D131A, -1px 1px 0 #0D131A, 1px 1px 0 #0D131A",
            }}
          >
            Student Manual
          </h1>
          <p
            style={{ opacity: 0.9, marginTop: 6, fontSize: isMobile ? 12 : 14 }}
          >
            Everything you need to know to use AGILA: navigation, features,
            gameplay, ranks, and tips.
          </p>
        </header>

        {isMobile ? (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                gap: 8,
                padding: "6px 2px",
                border: "1px solid #263244",
                borderRadius: 12,
                background: "#0f1620",
              }}
            >
              {tocItems.map((t) => (
                <Pill
                  key={t.id}
                  text={t.label}
                  href={`#${t.id}`}
                  compact
                  active={activeId === t.id}
                  onClick={() => handleNavigate(t.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: isMobile ? "block" : "grid",
            gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
            gap: 16,
          }}
        >
          {!isMobile ? (
            <aside
              style={{
                position: "sticky",
                top: 12,
                alignSelf: "start",
                height: "calc(100vh - 24px)",
                overflow: "auto",
                background: "#0f1620",
                border: "1px solid #263244",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 800, opacity: 0.9 }}>
                Contents
              </div>
              {tocItems.map((t) => (
                <Pill
                  key={t.id}
                  text={t.label}
                  href={`#${t.id}`}
                  active={activeId === t.id}
                  onClick={() => handleNavigate(t.id)}
                />
              ))}
            </aside>
          ) : null}

          <main>
            <div
              style={{
                background: "#0f1620",
                border: "1px solid #263244",
                borderRadius: 12,
                padding: isMobile ? 12 : 16,
              }}
            >
              <Section
                id="getting-started"
                title="1. Getting Started"
                isMobile={isMobile}
              >
                <SubTitle>Sign-in</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Use your provided student account to log in.</li>
                  <li>
                    If you forgot your password, use “Forgot Password” or
                    contact your teacher.
                  </li>
                </ul>
                <SubTitle>Navigation</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Top navigation contains: Dashboard, Challenges (Weekly Test,
                    Versus, Party Queue), Reviewers, Rankings, Crew, Messenger,
                    Profile, Help, Logout.
                  </li>
                  <li>On mobile, open the menu using the burger icon.</li>
                </ul>
              </Section>

              <Section id="dashboard" title="2. Dashboard" isMobile={isMobile}>
                <SubTitle>What You See</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Total Points (Weekly Test points), Day Streak, Average
                    Score, PvP Stars.
                  </li>
                  <li>
                    Current Weekly Rank (Bagito → Legendaryo) and PvP tier
                    (Buhangin → Perlas).
                  </li>
                  <li>Quick links to Weekly Tests and PvP History.</li>
                </ul>
                <SubTitle>Progress Bars</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Weekly Progress shows points toward the next Weekly rank.
                  </li>
                  <li>PvP Progress shows stars toward the next PvP tier.</li>
                </ul>
              </Section>

              <Section
                id="weekly-test"
                title="3. Weekly Test (Solo)"
                isMobile={isMobile}
              >
                <SubTitle>Taking a Test</SubTitle>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Select Subject and Week (only active schedules appear).
                  </li>
                  <li>
                    Read the question carefully; pick your answer; finish all
                    questions.
                  </li>
                  <li>
                    Timer runs for the whole test; auto-submits on time out.
                  </li>
                </ol>
                <SubTitle>Scoring & Lock</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Points: 90%+=+30, 70–89%=+20, 50–69%=+10, below 50%=-10.
                  </li>
                  <li>
                    One attempt per week per student. The lock persists (solo or
                    team shares the same lock).
                  </li>
                </ul>
                <SubTitle>Results</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Simple modal shows score and points; Weekly rank updates.
                  </li>
                  <li>History is visible in your Profile.</li>
                </ul>
              </Section>

              <Section
                id="party-queue"
                title="4–5. Party Queue & Team Weekly Test"
                isMobile={isMobile}
              >
                <SubTitle>Creating/Joining a Party</SubTitle>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Open Challenges → Party Queue. Create or join an existing
                    party.
                  </li>
                  <li>
                    Leader selects an active week and starts the Team Weekly
                    Test.
                  </li>
                </ol>
                <SubTitle>Gameplay</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Turn-based: each question assigned to the active teammate.
                  </li>
                  <li>
                    Team’s final score = each member’s weekly score for that
                    week.
                  </li>
                  <li>
                    Unified lock: a solo attempt blocks team and vice versa for
                    that week.
                  </li>
                </ul>
              </Section>

              <Section
                id="pvp"
                title="6. PvP Arena (Real-time Duels)"
                isMobile={isMobile}
              >
                <SubTitle>Goal & Flow</SubTitle>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Reduce opponent HP to 0 by correct answers and card plays.
                  </li>
                  <li>
                    On your turn: choose a card → preview → submit challenge.
                    Opponent answers; correct answer deals damage.
                  </li>
                </ol>
                <SubTitle>Power-ups</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Health Potion:</b> recover HP up to max.
                  </li>
                  <li>
                    <b>Discard & Draw 5:</b> replace your hand with new cards.
                  </li>
                  <li>
                    <b>Double Damage:</b> your next damage is multiplied.
                  </li>
                  <li>
                    <b>Damage Roulette:</b> random (1–15) damage immediately.
                  </li>
                  <li>
                    <b>HP Swap:</b> swap your HP with opponent.
                  </li>
                  <li>
                    <b>Barrier:</b> absorb incoming damage once.
                  </li>
                  <li>
                    <b>Safety Net:</b> prevent lethal damage once (stay at 1
                    HP).
                  </li>
                  <li>
                    <b>Emoji Taunt:</b> cosmetic only.
                  </li>
                </ul>
                <SubTitle>Stars & Tiers</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Win +8, Loss −8. Tiers: Buhangin, Bato, Kahoy, Bakal, Ginto,
                    Diamante, Perlas.
                  </li>
                </ul>
                <SubTitle>Tips</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Use Double Damage ahead of a likely-hit card.</li>
                  <li>
                    Use Barrier if you expect to take damage on opponent’s turn.
                  </li>
                  <li>Pay attention to turn indicators and timer.</li>
                </ul>
              </Section>

              <Section id="ranking" title="7. Ranking Page" isMobile={isMobile}>
                <SubTitle>Weekly Test Ranking</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Shows <b>all students</b> (even with 0 points), merged with
                    roster.
                  </li>
                  <li>Rank names follow Weekly tiers (Bagito → Legendaryo).</li>
                </ul>
                <SubTitle>PvP Arena Ranking</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Sorted by stars with tier names (Buhangin → Perlas).</li>
                </ul>
                <SubTitle>Tools</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Filters, search and “Jump to My Position”.</li>
                </ul>
              </Section>

              <Section
                id="profile"
                title="8. Profile & History"
                isMobile={isMobile}
              >
                <SubTitle>Overview</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Weekly Points, PvP Stars, streaks, and current ranks with
                    colors.
                  </li>
                </ul>
                <SubTitle>Weekly Tests</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Chronological results with score, accuracy and date.</li>
                </ul>
                <SubTitle>PvP History</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Match list with scores and star changes; win rate summary.
                  </li>
                </ul>
                <SubTitle>Achievements</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Rank cards indicate unlocked tiers and next milestones.
                  </li>
                </ul>
              </Section>

              <Section
                id="reviewers"
                title="9. Reviewers (Study Materials)"
                isMobile={isMobile}
              >
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Browse curated reviewer content by subject or topic.</li>
                  <li>
                    Use prior to weekly tests to improve accuracy and points.
                  </li>
                </ul>
              </Section>

              <Section
                id="messenger"
                title="10. Messenger (Chats)"
                isMobile={isMobile}
              >
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Message classmates or teammates for coordination.</li>
                  <li>Use before team tests or when forming a party.</li>
                </ul>
              </Section>

              <Section
                id="shortcuts"
                title="11. Keyboard Shortcuts"
                isMobile={isMobile}
              >
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Alt + 1</b>: Dashboard
                  </li>
                  <li>
                    <b>Alt + 2</b>: Weekly Test
                  </li>
                  <li>
                    <b>Alt + 3</b>: Party Queue
                  </li>
                  <li>
                    <b>Alt + 4</b>: PvP Arena
                  </li>
                  <li>
                    <b>Alt + R</b>: Rankings
                  </li>
                  <li>
                    <b>Alt + P</b>: Profile
                  </li>
                </ul>
              </Section>

              <Section
                id="troubleshooting"
                title="12. Troubleshooting"
                isMobile={isMobile}
              >
                <SubTitle>Common Issues</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Weekly test locked</b>: You already took this week (solo
                    or team). Choose another subject/week.
                  </li>
                  <li>
                    <b>Can’t start team test</b>: Someone in your party already
                    completed that week.
                  </li>
                  <li>
                    <b>PvP stars incorrect</b>: Refresh Ranking; stars update
                    after each match is saved.
                  </li>
                </ul>
                <SubTitle>Network Tips</SubTitle>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Use a stable connection for PvP; avoid switching networks
                    mid-game.
                  </li>
                  <li>Reload the page if socket disconnects persist.</li>
                </ul>
              </Section>

              <Section id="faq" title="13. FAQ" isMobile={isMobile}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Q:</b> Can I retake a weekly test? <b>A:</b> No—one
                    attempt per week.
                  </li>
                  <li>
                    <b>Q:</b> Do team results count to my points? <b>A:</b> Yes,
                    team score becomes your weekly score.
                  </li>
                  <li>
                    <b>Q:</b> Do PvP stars affect Weekly rank? <b>A:</b> No,
                    they’re separate systems.
                  </li>
                </ul>
              </Section>

              <Section id="glossary" title="14. Glossary" isMobile={isMobile}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Weekly Points</b>: Points gained from weekly tests.
                  </li>
                  <li>
                    <b>PvP Stars</b>: Score from duels, used for PvP ranking.
                  </li>
                  <li>
                    <b>Delta Update</b>: Leaderboard updates only the difference
                    when a result changes.
                  </li>
                </ul>
              </Section>

              <footer style={{ marginTop: 24, opacity: 0.8, fontSize: 12 }}>
                Need more help? Contact your teacher or admin. Good luck!
              </footer>
            </div>
          </main>
        </div>
      </div>

      {showTop ? (
        <button
          onClick={handleScrollTop}
          aria-label="Back to top"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 50,
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 800,
            fontSize: 12,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          }}
        >
          ↑ Top
        </button>
      ) : null}
    </div>
  );
}
