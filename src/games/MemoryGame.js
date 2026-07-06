import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import "./MemoryGame.css";

const API = "https://midwestcosplayclubapi-1.onrender.com";

const DIFFICULTIES = [
  { key: "easy",   label: "Easy",   pairs: 6,  cols: 4 },
  { key: "medium", label: "Medium", pairs: 8,  cols: 4 },
  { key: "hard",   label: "Hard",   pairs: 12, cols: 6 },
];

// Score formula: higher is better. Fewer moves + faster time = more points.
function calcScore(pairs, moves, seconds, difficulty) {
  const base = pairs * 1000;
  const movePenalty = Math.max(0, moves - pairs) * 50;
  const timePenalty = seconds * 10;
  const diffBonus = { easy: 1, medium: 1.5, hard: 2 }[difficulty] ?? 1;
  return Math.max(0, Math.round((base - movePenalty - timePenalty) * diffBonus));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────
const Card = ({ card, onClick, disabled }) => {
  const isFlipped = card.flipped || card.matched;
  return (
    <div
      className={`memory-card${isFlipped ? " memory-card--flipped" : ""}${card.matched ? " memory-card--matched" : ""}`}
      onClick={() => !disabled && !isFlipped && onClick(card.id)}
      role="button"
      aria-label={isFlipped ? card.label : "Hidden card"}
    >
      <div className="memory-card-inner">
        <div className="memory-card-back" />
        <div className="memory-card-front">
          {card.image ? (
            <img src={card.image} alt={card.label} loading="lazy" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem" }}>
              {card.type === "group" ? "👥" : "👤"}
            </div>
          )}
          <span className="card-label">{card.label}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const MemoryGame = () => {
  const token = localStorage.getItem("token");

  // Pool of available images fetched from the API
  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError]   = useState(null);

  // Game state
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards]           = useState([]);
  const [flipped, setFlipped]       = useState([]); // up to 2 card IDs
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves]           = useState(0);
  const [seconds, setSeconds]       = useState(0);
  const [running, setRunning]       = useState(false);
  const [paused, setPaused]         = useState(false);
  const [gameOver, setGameOver]     = useState(false);
  const [started, setStarted]       = useState(false);

  // Submit state
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | submitting | submitted | error
  const scoreRef = useRef(0);

  const timerRef = useRef(null);

  // ── Fetch pool ──────────────────────────────
  useEffect(() => {
    const fetchPool = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [usersRes, groupsRes] = await Promise.all([
          fetch(`${API}/users?limit=100&page=1`, { headers }),
          fetch(`${API}/groups`, { headers }),
        ]);

        const usersData  = usersRes.ok  ? await usersRes.json()  : { users: [] };
        const groupsData = groupsRes.ok ? await groupsRes.json() : [];

        const users = (usersData.users || [])
          .filter((u) => u.image)
          .map((u) => ({ id: `u-${u.id}`, image: u.image, label: u.username, type: "user" }));

        // groups endpoint returns an array or { groups: [] } depending on route
        const groupArr = Array.isArray(groupsData) ? groupsData : (groupsData.groups || []);
        const groups = groupArr
          .filter((g) => g.groupimage)
          .map((g) => ({ id: `g-${g.groupid}`, image: g.groupimage, label: g.groupname, type: "group" }));

        const combined = shuffle([...users, ...groups]);
        setPool(combined);
      } catch (err) {
        setPoolError("Couldn't load images. Check your connection.");
      } finally {
        setPoolLoading(false);
      }
    };
    fetchPool();
  }, [token]);

  // ── Build board ──────────────────────────────
  const buildBoard = useCallback((diff = difficulty) => {
    const config = DIFFICULTIES.find((d) => d.key === diff);
    if (!config || pool.length < config.pairs) return;

    const picked = shuffle(pool).slice(0, config.pairs);
    const cardPairs = shuffle(
      picked.flatMap((item, i) => [
        { ...item, id: `${item.id}-a`, pairId: item.id, flipped: false, matched: false },
        { ...item, id: `${item.id}-b`, pairId: item.id, flipped: false, matched: false },
      ])
    );

    setCards(cardPairs);
    setFlipped([]);
    setMatchedCount(0);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setPaused(false);
    setGameOver(false);
    setStarted(false);
    setSubmitStatus("idle");
    scoreRef.current = 0;
    clearInterval(timerRef.current);
  }, [difficulty, pool]);

  // Build board when pool loads or difficulty changes
  useEffect(() => {
    if (pool.length > 0) buildBoard(difficulty);
  }, [pool, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ────────────────────────────────────
  useEffect(() => {
    if (running && !paused) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, paused]);

  // ── Card click ───────────────────────────────
  const handleCardClick = useCallback((cardId) => {
    if (flipped.length >= 2) return;

    // Start timer on first flip
    if (!started) { setStarted(true); setRunning(true); }

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c))
    );

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped.map((id) => cards.find((c) => c.id === id));

      if (a && b && a.pairId === b.pairId) {
        // Match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a.id || c.id === b.id ? { ...c, matched: true, flipped: true } : c
            )
          );
          setMatchedCount((mc) => {
            const next = mc + 1;
            const config = DIFFICULTIES.find((d) => d.key === difficulty);
            if (next === config.pairs) {
              // Game complete
              setRunning(false);
              setGameOver(true);
              setSeconds((s) => {
                const score = calcScore(config.pairs, moves + 1, s, difficulty);
                scoreRef.current = score;
                return s;
              });
            }
            return next;
          });
          setFlipped([]);
        }, 400);
      } else {
        // No match — flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a?.id || c.id === b?.id ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
        }, 900);
      }
    }
  }, [flipped, cards, started, difficulty, moves]);

  // ── Submit score ─────────────────────────────
  const submitScore = useCallback(async () => {
    if (!token) { setSubmitStatus("error"); return; }
    setSubmitStatus("submitting");
    try {
      const res = await fetch(`${API}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game: "memory", score: scoreRef.current }),
      });
      setSubmitStatus(res.ok ? "submitted" : "error");
    } catch {
      setSubmitStatus("error");
    }
  }, [token]);

  const submitLabel = {
    idle: "Submit score",
    submitting: "Submitting…",
    submitted: "Score submitted!",
    error: "Submission failed — try again",
  }[submitStatus];

  const config = DIFFICULTIES.find((d) => d.key === difficulty);
  const total = config?.pairs ?? 0;
  const blockClicks = flipped.length >= 2 || paused;

  // ── Format time ──────────────────────────────
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Render ───────────────────────────────────
  if (poolLoading) {
    return (
      <div className="memory-game">
        <div className="memory-loading">Loading club members…</div>
      </div>
    );
  }

  if (poolError) {
    return (
      <div className="memory-game">
        <div className="memory-loading" style={{ color: "#f87171" }}>{poolError}</div>
      </div>
    );
  }

  if (pool.length < 6) {
    return (
      <div className="memory-game">
        <div className="memory-loading" style={{ color: "#f87171" }}>
          Not enough member images to play yet.
        </div>
      </div>
    );
  }

  return (
    <div className="memory-game">
      {/* Header */}
      <header className="memory-header">
        <p className="memory-eyebrow">Club Arcade</p>
        <h1 className="memory-headline">Memory Match</h1>
        <p className="memory-subhead">Find every pair. Spend as few moves as you can.</p>
      </header>

      {/* Difficulty */}
      <div className="memory-difficulty">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            className={`diff-btn${difficulty === d.key ? " diff-btn--active" : ""}`}
            onClick={() => {
              setDifficulty(d.key);
              buildBoard(d.key);
            }}
          >
            {d.label} <span style={{ color: "#7c3aed", fontSize: "0.75rem" }}>({d.pairs} pairs)</span>
          </button>
        ))}
      </div>

      {/* HUD */}
      {started && (
        <div className="memory-hud">
          <div className="memory-hud-stat">
            <span className="memory-hud-label">Pairs</span>
            <span className="memory-hud-value">{matchedCount}/{total}</span>
          </div>
          <div className="memory-hud-stat">
            <span className="memory-hud-label">Moves</span>
            <span className="memory-hud-value">{moves}</span>
          </div>
          <div className="memory-hud-stat">
            <span className="memory-hud-label">Time</span>
            <span className="memory-hud-value">{formatTime(seconds)}</span>
          </div>
          <button
            className="memory-pause-btn"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      )}

      {/* Grid */}
      <div className={`memory-grid memory-grid--${difficulty}`}>
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={handleCardClick}
            disabled={blockClicks}
          />
        ))}
      </div>

      {/* Pause overlay */}
      {paused && !gameOver && (
        <div className="memory-overlay">
          <div className="memory-overlay-box">
            <h2>Paused</h2>
            <p>{matchedCount} of {total} pairs found</p>
            <button className="memory-btn" onClick={() => setPaused(false)}>Resume</button>
            <button className="memory-btn memory-btn--secondary" onClick={() => buildBoard(difficulty)}>
              New game
            </button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div className="memory-overlay">
          <div className="memory-overlay-box">
            <h2>You matched them all!</h2>
            <div className="memory-score-big">{scoreRef.current.toLocaleString()}</div>
            <p>{moves} moves · {formatTime(seconds)} · {config.label}</p>
            <button
              className="memory-btn"
              onClick={submitScore}
              disabled={submitStatus === "submitting" || submitStatus === "submitted"}
            >
              {submitLabel}
            </button>
            <button
              className="memory-btn memory-btn--secondary"
              onClick={() => buildBoard(difficulty)}
            >
              Play again
            </button>
            <Link to="/games" className="memory-btn memory-btn--secondary">
              Back to Arcade
            </Link>
          </div>
        </div>
      )}

      {/* Start hint (before first flip) */}
      {!started && !gameOver && (
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: "0.85rem", marginTop: "1rem" }}>
          Tap any card to begin
        </p>
      )}
    </div>
  );
};

export default MemoryGame;