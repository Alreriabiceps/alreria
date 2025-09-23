import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import styles from "../../weeklytest/pages/WeeklyTest.module.css";
import FloatingStars from "../../../components/FloatingStars/FloatingStars";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaForward,
  FaBullseye,
} from "react-icons/fa";
import socketManager from "../../../../../shared/utils/socketManager";
import { useAuth } from "../../../../../contexts/AuthContext";

const TeamWeeklyTest = () => {
  const { attemptId } = useParams();
  const backendurl = useMemo(() => import.meta.env.VITE_BACKEND_URL, []);
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const { user } = useAuth();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [refreshing, setRefreshing] = useState(false);
  const useLiveRef = useRef(false);
  const [live, setLive] = useState(false);
  const [finished, setFinished] = useState(false);

  const fetchState = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const res = await fetch(
          `${backendurl}/api/teamtest/state/${attemptId}`,
          {
            headers: authHeaders,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Fetched state update:", {
          turnIndex: data.attempt?.turnIndex,
          currentIndex: data.attempt?.currentIndex,
          activePlayer: data.attempt?.roster?.[data.attempt?.turnIndex],
        });

        setState((prevState) => {
          // For team tests, only consider ended if status is explicitly "ended"
          // or if we've progressed beyond all questions
          const prevIsEnded =
            prevState?.status === "ended" ||
            (prevState &&
              prevState.currentIndex >= (prevState.questions?.length || 0));

          if (prevIsEnded) {
            console.log("State is ended, preserving results - not updating");
            return prevState;
          }

          // Clear selected answer if turn changed and it's no longer your turn
          if (
            prevState &&
            data.attempt &&
            prevState.turnIndex !== data.attempt.turnIndex
          ) {
            console.log(
              "Turn changed from",
              prevState.turnIndex,
              "to",
              data.attempt.turnIndex
            );
            const newMyTurn = Boolean(
              user?.id &&
                data.attempt.roster?.[data.attempt.turnIndex] &&
                String(
                  data.attempt.roster[data.attempt.turnIndex]._id ||
                    data.attempt.roster[data.attempt.turnIndex]
                ) === String(user.id)
            );
            if (!newMyTurn) {
              setSelected(null);
            }
          }
          // Freeze UI if the new attempt is ended
          const newIsEnded =
            data.attempt?.status === "ended" ||
            (data.attempt &&
              data.attempt.currentIndex >=
                (data.attempt.questions?.length || 0));
          if (newIsEnded) setFinished(true);
          return data.attempt;
        });

        setError(null);
      } catch (err) {
        console.error("Failed to fetch state:", err);
        setError(err?.message || "Failed to fetch state");
      } finally {
        if (!silent) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [backendurl, attemptId, authHeaders, user?.id]
  );

  useEffect(() => {
    if (attemptId) fetchState(false);
  }, [attemptId, fetchState]);

  // Polling for updates (kept even when socket is live as a safety net)
  useEffect(() => {
    if (!attemptId) return;
    const isEnded =
      state?.status === "ended" ||
      (state && state.currentIndex >= (state.questions?.length || 0));
    if (isEnded) return;
    console.log("Starting polling fallback");
    const intervalMs = live ? 4000 : 1500;
    const id = setInterval(() => {
      console.log("Polling for state update...");
      fetchState(true);
    }, intervalMs);
    return () => clearInterval(id);
  }, [
    attemptId,
    state?.status,
    state?.currentIndex,
    state?.questions?.length,
    live,
    fetchState,
  ]);

  // Socket live updates
  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      try {
        const socket = await socketManager.getSocket();
        useLiveRef.current = true;
        setLive(Boolean(socket.connected));

        const joinRoom = () => {
          try {
            socket.emit("teamtest:join", { attemptId });
          } catch (err) {
            console.log("Failed to join teamtest room", err);
          }
        };

        // Join immediately and on any reconnects
        joinRoom();
        const onConnect = () => {
          setLive(true);
          joinRoom();
        };
        const onReconnect = () => {
          setLive(true);
          joinRoom();
        };
        const onDisconnect = () => {
          setLive(false);
        };
        socket.on("connect", onConnect);
        socket.on("reconnect", onReconnect);
        socket.on("disconnect", onDisconnect);

        const handler = (payload) => {
          console.log("Received teamtest:state update:", payload);
          // Always update if we get a valid attempt, don't rely on ID matching
          if (payload?.attempt) {
            setState((prevState) => {
              // For team tests, only consider ended if status is explicitly "ended"
              // or if we've progressed beyond all questions
              const prevIsEnded =
                prevState?.status === "ended" ||
                (prevState &&
                  prevState.currentIndex >= (prevState.questions?.length || 0));

              if (prevIsEnded) {
                console.log(
                  "Socket: State is ended, preserving results - not updating"
                );
                return prevState;
              }

              // Force update even if IDs match to ensure turn changes are reflected
              console.log(
                "Updating state from:",
                prevState?.turnIndex,
                "to:",
                payload.attempt.turnIndex
              );
              return payload.attempt;
            });

            // If payload does not include populated question data, rehydrate via HTTP
            try {
              const idx = payload.attempt.currentIndex;
              const q = payload.attempt?.questions?.[idx]?.questionId;
              const hasPopulatedQuestion =
                q && typeof q === "object" && q.questionText;
              const ended =
                payload.attempt.status === "ended" ||
                (payload.attempt &&
                  payload.attempt.currentIndex >=
                    (payload.attempt.questions?.length || 0));
              if (ended) setFinished(true);
              if (!ended && !hasPopulatedQuestion) {
                console.log(
                  "Socket payload missing populated question; fetching hydrated state"
                );
                fetchState(true);
              }
            } catch (err) {
              console.log("Hydration check failed", err);
            }

            // Reset selected answer when turn changes and it's no longer your turn
            // Only do this if the test isn't already ended
            setState((currentState) => {
              const currentIsEnded =
                currentState?.status === "ended" ||
                (currentState &&
                  currentState.currentIndex >=
                    (currentState.questions?.length || 0));

              if (!currentIsEnded) {
                const newState = payload.attempt;
                const newMyTurn = Boolean(
                  user?.id &&
                    newState.roster?.[newState.turnIndex] &&
                    String(
                      newState.roster[newState.turnIndex]._id ||
                        newState.roster[newState.turnIndex]
                    ) === String(user.id)
                );

                if (!newMyTurn) {
                  setSelected(null);
                }
              }
              return currentState; // Return unchanged state for this setState call
            });
          }
        };

        socket.on("teamtest:state", handler);
        cleanup = () => {
          try {
            socket.off("teamtest:state", handler);
            socket.off("connect", onConnect);
            socket.off("reconnect", onReconnect);
            socket.off("disconnect", onDisconnect);
            socket.emit("teamtest:leave", { attemptId });
          } catch (err) {
            console.log("Cleanup error for teamtest socket handlers", err);
          }
        };
      } catch (_err) {
        console.log("Socket connection failed, using polling fallback", _err);
        useLiveRef.current = false;
        setLive(false);
      }
    })();
    return () => cleanup();
  }, [attemptId, user?.id, fetchState]);

  const currentQuestion = useMemo(() => {
    if (!state) return null;
    const idx = state.currentIndex;
    const q = state.questions?.[idx]?.questionId;
    return q || null;
  }, [state]);

  const myTurn = useMemo(() => {
    if (!state || !Array.isArray(state.roster)) return false;
    const active = state.roster[state.turnIndex];
    const activeId = active && (active._id || active);
    const isMyTurn = Boolean(
      user?.id && activeId && String(activeId) === String(user.id)
    );

    console.log("Calculating myTurn:", {
      turnIndex: state.turnIndex,
      activePlayer: active,
      activeId,
      userId: user?.id,
      isMyTurn,
    });

    return isMyTurn;
  }, [state, user]);

  // Watch for turn changes and update UI accordingly
  useEffect(() => {
    if (state) {
      console.log("Turn state changed:", {
        turnIndex: state.turnIndex,
        myTurn,
        currentIndex: state.currentIndex,
        timeLeft,
      });
    }
  }, [state?.turnIndex, myTurn, state?.currentIndex, timeLeft, state]);

  // Compute assignment per question for the top indicator
  const assignIndexForQuestion = useCallback(
    (qIdx) => {
      if (!state) return 0;
      const r = Math.max(1, state.roster.length);
      // turnIndex corresponds to currentIndex question
      const offset = qIdx - state.currentIndex;
      const idx = (((state.turnIndex + offset) % r) + r) % r;
      return idx;
    },
    [state]
  );

  const nextAssigned = useMemo(() => {
    if (!state) return null;
    const idx = assignIndexForQuestion(state.currentIndex + 1);
    return state.roster[idx];
  }, [state, assignIndexForQuestion]);

  const handleAnswer = async () => {
    if (!state || submitting || selected == null || !myTurn) return;

    console.log("Submitting answer:", {
      selected,
      turnIndex: state.turnIndex,
      questionIndex: state.currentIndex,
    });
    setSubmitting(true);

    try {
      const res = await fetch(
        `${backendurl}/api/teamtest/${state._id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ selected }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      console.log("Answer submitted successfully");

      // Immediately fetch updated state
      await fetchState(true);

      // Clear selection
      setSelected(null);

      // Force a second fetch after a brief delay to ensure we get the turn change
      // But only if the test hasn't ended
      setTimeout(() => {
        setState((currentState) => {
          const currentIsEnded =
            currentState?.status === "ended" ||
            (currentState &&
              currentState.currentIndex >=
                (currentState.questions?.length || 0));

          if (!currentIsEnded) {
            console.log(
              "Fetching state again to ensure turn change is reflected"
            );
            fetchState(true);
          } else {
            console.log(
              "Test has ended, not fetching state again to preserve results"
            );
          }
          return currentState; // Return unchanged state
        });
      }, 500);
    } catch (e) {
      console.error("Failed to submit answer:", e);
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Per-turn countdown for active player
  useEffect(() => {
    if (!state || state.status !== "active") return;

    console.log("Resetting timer for turn:", state.turnIndex);
    setTimeLeft(45);

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          console.log("Timer expired for turn:", state.turnIndex);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      console.log("Clearing timer for turn:", state.turnIndex);
      clearInterval(id);
    };
  }, [state?.turnIndex, state?.currentIndex, state?.status, state]);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <FloatingStars />
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Loading team test…</h1>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className={styles.dashboardContainer}>
        <FloatingStars />
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Error</h1>
        </div>
        <p className={styles.noTestsMessage}>{error || "Attempt not found"}</p>
      </div>
    );
  }

  // Check if test should show results - either officially ended or completed all questions
  const isEnded =
    finished ||
    state.status === "ended" ||
    (state && state.currentIndex >= (state.questions?.length || 0));
  const currentDisplayIndex = Math.min(
    (state?.currentIndex || 0) + 1,
    Math.max(1, state?.questions?.length || 1)
  );

  // Debug log to see when results should be shown
  console.log("TeamWeeklyTest render:", {
    status: state.status,
    isEnded: isEnded,
    currentIndex: state.currentIndex,
    questionsLength: state.questions?.length,
    hasReachedEnd: state.currentIndex >= (state.questions?.length || 0),
  });

  const options = Array.isArray(currentQuestion?.choices)
    ? currentQuestion.choices
    : Array.isArray(currentQuestion?.options)
    ? currentQuestion.options
    : [];

  const totalQuestions = state.questions.length;

  return (
    <div className={styles.dashboardContainer}>
      <FloatingStars />
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} ${styles.coopTitle}`}>
          Co‑op Weekly Test
        </h1>
        <p className={styles.pageSubtitle}>
          {isEnded
            ? "Results"
            : `Question ${currentDisplayIndex} of ${state.questions.length}`}
        </p>
      </div>

      {isEnded ? (
        <div className={styles.resultsContainer} style={{ opacity: 1 }}>
          <div className={styles.resultsHeader}>
            <h1 className={styles.resultsTitle}>🏆 Team Test Complete!</h1>
            <p className={styles.resultsSubtitle}>
              Great job working together! Here's how your team performed:
            </p>
          </div>

          {/* Overall Team Stats */}
          <div className={styles.teamStatsContainer}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaCheckCircle />
                </div>
                <div className={styles.statValue}>
                  {state.questions.filter((q) => q.isCorrect).length}
                </div>
                <div className={styles.statLabel}>Correct</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaTimesCircle />
                </div>
                <div className={styles.statValue}>
                  {
                    state.questions.filter((q) => q.selected && !q.isCorrect)
                      .length
                  }
                </div>
                <div className={styles.statLabel}>Wrong</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaForward />
                </div>
                <div className={styles.statValue}>
                  {state.questions.filter((q) => !q.selected).length}
                </div>
                <div className={styles.statLabel}>Skipped</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaBullseye />
                </div>
                <div className={styles.statValue}>
                  {Math.round(
                    (state.questions.filter((q) => q.isCorrect).length /
                      state.questions.length) *
                      100
                  )}
                  %
                </div>
                <div className={styles.statLabel}>Accuracy</div>
              </div>
            </div>
          </div>

          {/* Individual Question Results */}
          <div className={styles.questionsResultsContainer}>
            <h3 className={styles.questionsResultsTitle}>
              Question-by-Question Breakdown
            </h3>
            <div className={styles.questionResultsGrid}>
              {state.questions.map((q, i) => {
                // Find who answered this question using the existing assignment logic
                const questionAnswererIndex = assignIndexForQuestion(i);
                const questionAnswerer = state.roster[questionAnswererIndex];

                const answererId = questionAnswerer?._id || questionAnswerer;
                const answererName =
                  questionAnswerer?.firstName || questionAnswerer?.lastName
                    ? `${questionAnswerer.firstName || ""} ${
                        questionAnswerer.lastName || ""
                      }`.trim()
                    : `Player ${questionAnswererIndex + 1}`;

                const isUserQuestion = String(answererId) === String(user?.id);

                return (
                  <div
                    key={i}
                    className={`${styles.questionResultCard} ${
                      q.isCorrect
                        ? styles.correctCard
                        : q.selected
                        ? styles.wrongCard
                        : styles.skippedCard
                    } ${isUserQuestion ? styles.userQuestionCard : ""}`}
                  >
                    <div className={styles.questionResultHeader}>
                      <div className={styles.questionResultNumber}>
                        Q{i + 1}
                      </div>
                      <div
                        className={`${styles.questionResultStatus} ${
                          q.isCorrect
                            ? styles.correctStatus
                            : q.selected
                            ? styles.wrongStatus
                            : styles.skippedStatus
                        }`}
                      >
                        {q.isCorrect
                          ? "✓ CORRECT"
                          : q.selected
                          ? "✗ WRONG"
                          : "⏭ SKIPPED"}
                      </div>
                    </div>

                    <div className={styles.questionResultContent}>
                      <div className={styles.questionResultText}>
                        {q.questionId?.questionText ||
                          "Question text not available"}
                      </div>

                      <div className={styles.answerDetails}>
                        {q.selected && (
                          <div className={styles.selectedAnswer}>
                            <span className={styles.answerLabel}>
                              Team Answer:
                            </span>
                            <span
                              className={`${styles.answerValue} ${
                                q.isCorrect
                                  ? styles.correctAnswer
                                  : styles.wrongAnswer
                              }`}
                            >
                              {q.selected}
                            </span>
                          </div>
                        )}

                        {q.questionId?.correctAnswer && (
                          <div className={styles.correctAnswerInfo}>
                            <span className={styles.answerLabel}>
                              Correct Answer:
                            </span>
                            <span className={styles.answerValue}>
                              {q.questionId.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.answererInfo}>
                        <div className={styles.answererLabel}>Answered by:</div>
                        <div className={styles.answererDetails}>
                          <div className={styles.answererAvatar}>
                            {(answererName[0] || "?").toUpperCase()}
                          </div>
                          <div className={styles.answererName}>
                            {answererName}{" "}
                            {isUserQuestion && (
                              <span className={styles.youBadge}>YOU</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {q.questionId?.bloomsLevel && (
                        <div className={styles.bloomsInfo}>
                          <span className={styles.bloomsLabel}>
                            Bloom's Level {q.questionId.bloomsLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Performance Summary */}
          <div className={styles.performanceSummary}>
            <h3 className={styles.summaryTitle}>Team Performance Analysis</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h4 className={styles.summaryCardTitle}>🌟 Strengths</h4>
                <div className={styles.summaryContent}>
                  {(() => {
                    const correctCount = state.questions.filter(
                      (q) => q.isCorrect
                    ).length;
                    const totalQuestions = state.questions.length;
                    const accuracy = Math.round(
                      (correctCount / totalQuestions) * 100
                    );

                    if (accuracy >= 80)
                      return "Excellent teamwork! Your team showed strong collaboration and knowledge.";
                    if (accuracy >= 60)
                      return "Good performance! Your team worked well together on most questions.";
                    if (accuracy >= 40)
                      return "Decent effort! There's room for improvement in team coordination.";
                    return "Keep practicing! Focus on better communication and preparation.";
                  })()}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <h4 className={styles.summaryCardTitle}>
                  💡 Areas for Improvement
                </h4>
                <div className={styles.summaryContent}>
                  {(() => {
                    const wrongCount = state.questions.filter(
                      (q) => q.selected && !q.isCorrect
                    ).length;
                    const skippedCount = state.questions.filter(
                      (q) => !q.selected
                    ).length;

                    if (skippedCount > wrongCount && skippedCount > 0) {
                      return "Consider taking more time to attempt questions rather than skipping them.";
                    } else if (wrongCount > 0) {
                      return "Review the topics from incorrect answers to strengthen team knowledge.";
                    } else {
                      return "Perfect execution! Keep up this level of teamwork and preparation.";
                    }
                  })()}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <h4 className={styles.summaryCardTitle}>🎯 Next Steps</h4>
                <div className={styles.summaryContent}>
                  Practice more team tests to improve coordination and
                  communication between team members.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.teamTestContainer}>
          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Compact Turn Progress Indicator */}
            <div className={styles.compactTurnProgress}>
              <div className={styles.compactProgressHeader}>
                <h3 className={styles.compactProgressTitle}>
                  Turn Rotation
                  {refreshing && (
                    <span className={styles.refreshIndicator}>●</span>
                  )}
                </h3>
                <div className={styles.nextPlayerBadge}>
                  Next:{" "}
                  {(() => {
                    const m = nextAssigned;
                    if (!m) return "—";
                    const name =
                      m?.firstName || m?.lastName
                        ? `${m.firstName || ""} ${m.lastName || ""}`.trim()
                        : `Player ${
                            state.roster.findIndex((r) => r === m) + 1
                          }`;
                    return name.split(" ")[0] || name; // First name only for compactness
                  })()}
                </div>
              </div>

              <div className={styles.compactQuestionDots}>
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const rosterIdx = assignIndexForQuestion(i);
                  const member = state.roster[rosterIdx];
                  const memberId = member?._id || member;
                  const isMine = String(memberId) === String(user?.id);
                  const isCurrent = i === state.currentIndex;
                  const isDone = i < state.currentIndex;

                  const memberName =
                    member?.firstName || member?.lastName
                      ? `${member.firstName || ""} ${
                          member.lastName || ""
                        }`.trim()
                      : `Player ${rosterIdx + 1}`;

                  let dotClass = styles.compactQuestionDot;
                  if (isCurrent) dotClass += ` ${styles.compactCurrent}`;
                  else if (isDone) dotClass += ` ${styles.compactCompleted}`;
                  else dotClass += ` ${styles.compactUpcoming}`;

                  if (isMine && !isDone) dotClass += ` ${styles.compactMyTurn}`;

                  return (
                    <div
                      key={i}
                      className={dotClass}
                      title={`Q${i + 1}: ${memberName}${
                        isMine ? " (You)" : ""
                      }`}
                    >
                      <span className={styles.compactDotNumber}>{i + 1}</span>
                      {isCurrent && <div className={styles.compactPulse}></div>}
                      {isMine && !isDone && (
                        <div className={styles.compactMyIndicator}>YOU</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Centered Question Section - Moved Up */}
            <div
              className={styles.centeredQuestionWrapper}
              key={`question-${state.currentIndex}-turn-${state.turnIndex}`}
            >
              <div className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <div className={styles.questionCounter}>
                    <span className={styles.questionLabel}>Question</span>
                    <span className={styles.questionNumber}>
                      {state.currentIndex + 1} of {state.questions.length}
                    </span>
                  </div>
                  {currentQuestion?.bloomsLevel && (
                    <div className={styles.bloomsBadge}>
                      <span className={styles.bloomsText}>
                        Bloom's L{currentQuestion.bloomsLevel}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.questionContent}>
                  <h2 className={styles.questionText}>
                    {currentQuestion?.questionText}
                  </h2>
                </div>

                <div className={styles.answerSection}>
                  <div className={styles.answerGrid}>
                    {options.map((opt, idx) => (
                      <button
                        key={`${idx}-${state.turnIndex}-${myTurn}-${opt}`}
                        className={`${styles.answerOption} ${
                          selected === opt ? styles.selectedOption : ""
                        }`}
                        onClick={() => setSelected(opt)}
                        disabled={submitting || !myTurn}
                      >
                        <div className={styles.optionIndicator}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={styles.optionText}>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.actionArea}>
                  <div className={styles.selectionStatus}>
                    {selected ? (
                      <span className={styles.selectedText}>
                        ✓ Selected: {selected}
                      </span>
                    ) : (
                      <span className={styles.promptText}>
                        Please select an answer
                      </span>
                    )}
                  </div>

                  <button
                    key={`submit-${state.turnIndex}-${myTurn}`}
                    className={`${styles.submitButton} ${
                      selected && myTurn && !submitting
                        ? styles.readyToSubmit
                        : ""
                    }`}
                    onClick={handleAnswer}
                    disabled={selected == null || submitting || !myTurn}
                  >
                    <span className={styles.submitIcon}>🔒</span>
                    <span className={styles.submitText}>
                      {submitting ? "Submitting..." : "Lock Answer"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Team Roster + Status */}
          <div className={styles.rightSidebar}>
            {/* Team Roster */}
            <div className={styles.rosterSection}>
              <h4 className={styles.rosterTitle}>Team Members</h4>
              <div className={styles.rosterGrid}>
                {state.roster.map((member, idx) => {
                  const name =
                    member && (member.firstName || member.lastName)
                      ? `${member.firstName || ""} ${
                          member.lastName || ""
                        }`.trim()
                      : `Player ${idx + 1}`;
                  const active = idx === state.turnIndex;
                  return (
                    <div
                      key={member && member._id ? member._id : String(idx)}
                      className={`${styles.rosterCard} ${
                        active ? styles.activePlayer : styles.waitingPlayer
                      }`}
                    >
                      <div className={styles.playerAvatar}>
                        {(name[0] || String(idx + 1)).toUpperCase()}
                      </div>
                      <div className={styles.playerInfo}>
                        <span className={styles.playerName}>{name}</span>
                        <span className={styles.playerStatus}>
                          {active ? `Active • ${timeLeft}s` : "Waiting"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turn Status */}
            <div className={styles.sidebarTurnStatus}>
              <div className={styles.turnInfo}>
                <div className={styles.turnCounter}>
                  <span className={styles.turnLabel}>Turn</span>
                  <span className={styles.turnValue}>
                    {state.turnIndex + 1} / {state.roster.length}
                  </span>
                </div>
                {currentQuestion?.bloomsLevel && (
                  <div className={styles.bloomsContainer}>
                    <span className={styles.bloomsLabel}>Bloom's</span>
                    <span className={styles.bloomsValue}>
                      Level {currentQuestion.bloomsLevel}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.activePlayerStatus}>
                <div className={styles.statusIndicator}>
                  <div
                    className={`${styles.statusDot} ${
                      myTurn ? styles.active : styles.waiting
                    }`}
                  ></div>
                  <span className={styles.statusText}>
                    {myTurn
                      ? `Your Turn — ${timeLeft}s`
                      : "Waiting for teammate"}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className={styles.sidebarProgressContainer}>
              <div className={styles.sidebarProgressHeader}>
                <span className={styles.sidebarProgressTitle}>
                  Overall Progress
                </span>
                <span className={styles.sidebarProgressPercent}>
                  {Math.round(
                    (state.currentIndex / Math.max(1, state.questions.length)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className={styles.sidebarProgressBar}>
                <div
                  className={styles.sidebarProgressFill}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (state.currentIndex /
                          Math.max(1, state.questions.length)) *
                          100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
              <div className={styles.sidebarProgressStats}>
                <span>
                  {state.currentIndex + 1} of {state.questions.length} questions
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWeeklyTest;
