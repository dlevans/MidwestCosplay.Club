import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "../pages/Enchantedbackground";
import "./SigilStrike.css";

const GAME_KEY = "sigilstrike";
const API_BASE = "https://midwestcosplayclubapi-1.onrender.com/api";

const INITIAL_LIVES = 3;
const MAX_SIGILS = 4;
const RAMP_SCORE = 5000; // score at which difficulty maxes out

const SPAWN_START = 1350; // ms between spawns, easy
const SPAWN_FLOOR = 550; // ms between spawns, hard
const LIFE_START = 1900; // ms a sigil stays alive, easy
const LIFE_FLOOR = 850; // ms a sigil stays alive, hard

const TYPE_WEIGHTS = [
  { type: "normal", weight: 74 },
  { type: "cursed", weight: 16 },
  { type: "gold", weight: 10 },
];

function pickType() {
  const total = TYPE_WEIGHTS.reduce((sum, t) => sum + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TYPE_WEIGHTS) {
    if (r < t.weight) return t.type;
    r -= t.weight;
  }
  return "normal";
}

function lerp(a, b, t) {
  const clamped = Math.min(1, Math.max(0, t));
  return a + (b - a) * clamped;
}

let sigilIdCounter = 0;

const SigilStrike = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | playing | gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sigils, setSigils] = useState([]);
  const [popups, setPopups] = useState([]);
  const [shake, setShake] = useState(false);
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | submitted | error

  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(SPAWN_START);
  const arenaRef = useRef(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // End the ritual whenever lives hit zero mid-play
  useEffect(() => {
    if (status === "playing" && lives <= 0) {
      setStatus("gameover");
    }
  }, [lives, status]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 250);
  };

  const difficultyT = () => Math.min(1, scoreRef.current / RAMP_SCORE);

  const spawnSigil = useCallback(() => {
    const t = difficultyT();
    const life = Math.round(lerp(LIFE_START, LIFE_FLOOR, t));
    const type = pickType();
    const size = type === "gold" ? 74 : type === "cursed" ? 58 : 68;
    const x = 10 + Math.random() * 80;
    const y = 14 + Math.random() * 70;
    sigilIdCounter += 1;
    const id = sigilIdCounter;
    setSigils((prev) => {
      if (prev.length >= MAX_SIGILS) return prev;
      return [...prev, { id, x, y, size, type, life, remaining: life }];
    });
  }, []);

  const addPopup = (x, y, text, kind) => {
    const id = `p${Date.now()}-${Math.random()}`;
    setPopups((prev) => [...prev, { id, x, y, text, kind }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 700);
  };

  // Main game loop
  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      const t = difficultyT();
      const spawnInterval = lerp(SPAWN_START, SPAWN_FLOOR, t);
      spawnTimerRef.current -= 100;
      if (spawnTimerRef.current <= 0) {
        spawnSigil();
        spawnTimerRef.current = spawnInterval;
      }

      setSigils((prev) => {
        const next = [];
        let missedNormal = false;
        for (const s of prev) {
          const remaining = s.remaining - 100;
          if (remaining <= 0) {
            if (s.type === "normal") missedNormal = true;
            continue;
          }
          next.push({ ...s, remaining });
        }
        if (missedNormal) {
          setCombo(0);
          setLives((l) => Math.max(0, l - 1));
          triggerShake();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [status, spawnSigil]);

  const startGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setBestCombo(0);
    setSigils([]);
    setPopups([]);
    setSubmitState("idle");
    spawnTimerRef.current = 350;
    setStatus("playing");
  };

  const handleHit = (sigil) => {
    setSigils((prev) => prev.filter((s) => s.id !== sigil.id));
    const frac = sigil.remaining / sigil.life;

    if (sigil.type === "cursed") {
      setCombo(0);
      setLives((l) => Math.max(0, l - 1));
      triggerShake();
      addPopup(sigil.x, sigil.y, "CURSED", "bad");
      return;
    }

    setCombo((c) => {
      const nc = c + 1;
      setBestCombo((b) => Math.max(b, nc));
      const multiplier = Math.min(3, 1 + Math.floor(nc / 5) * 0.5);
      const base = sigil.type === "gold" ? lerp(300, 500, frac) : lerp(50, 150, frac);
      const points = Math.round(base * multiplier);
      setScore((s) => s + points);
      addPopup(sigil.x, sigil.y, `+${points}`, sigil.type === "gold" ? "gold" : "good");
      return nc;
    });
  };

  const handleArenaMiss = (e) => {
    if (status !== "playing") return;
    if (e.target !== arenaRef.current) return;
    setCombo(0);
  };

  const submitScore = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setSubmitState("error"); return; }
    setSubmitState("submitting");
    try {
      const res = await fetch(`${API_BASE}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game: GAME_KEY, score: scoreRef.current }),
      });
      setSubmitState(res.ok ? "submitted" : "error");
    } catch {
      setSubmitState("error");
    }
  }, []);

  const submitLabel = {
    idle: "Submit score",
    submitting: "Submitting…",
    submitted: "Score submitted!",
    error: "Submission failed — try again",
  }[submitState];

  const multiplier = Math.min(3, 1 + Math.floor(combo / 5) * 0.5);
  const bestMultiplier = Math.min(3, 1 + Math.floor(bestCombo / 5) * 0.5);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Sigil Strike — MidwestCosplay Club</title>
        <meta
          name="description"
          content="Strike the sigils before they fade. Avoid the cursed ones. How high can your score climb?"
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content sigil-page">
        <header className="sigil-header">
          <p className="sigil-eyebrow">Club Arcade</p>
          <h1 className="sigil-headline">Sigil Strike</h1>
          <p className="sigil-subhead">Strike the sigils before they fade. The cursed ones bite back.</p>
        </header>

        <div className={`sigil-hud ${shake ? "sigil-hud--shake" : ""}`}>
          <div className="sigil-hud-item">
            <span className="sigil-hud-label">Score</span>
            <span className="sigil-hud-value">{score.toLocaleString()}</span>
          </div>
          <div className="sigil-hud-item">
            <span className="sigil-hud-label">Combo</span>
            <span className="sigil-hud-value">x{multiplier.toFixed(1)}</span>
          </div>
          <div className="sigil-hud-item sigil-hud-lives" aria-label={`${lives} lives remaining`}>
            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
              <span
                key={i}
                className={`sigil-life ${i < lives ? "sigil-life--full" : "sigil-life--lost"}`}
                aria-hidden="true"
              >
                ◆
              </span>
            ))}
          </div>
        </div>

        <div
          className={`sigil-arena ${shake ? "sigil-arena--shake" : ""}`}
          ref={arenaRef}
          onPointerDown={handleArenaMiss}
        >
          {status === "idle" && (
            <div className="sigil-overlay">
              <p className="sigil-overlay-title">Begin the Ritual</p>
              <p className="sigil-overlay-text">
                Sigils bloom across the circle — strike them before they fade. Faster strikes earn more, and
                chaining hits raises your multiplier. Crimson sigils are cursed: leave them be. Three mistakes
                ends the ritual.
              </p>
              <button className="sigil-btn" onClick={startGame}>
                Start
              </button>
            </div>
          )}

          {status === "gameover" && (
            <div className="sigil-overlay">
              <p className="sigil-overlay-title">The Circle Fades</p>
              <p className="sigil-overlay-score">{score.toLocaleString()}</p>
              <p className="sigil-overlay-text">Best combo x{bestMultiplier.toFixed(1)}</p>
              <div className="sigil-overlay-actions">
                <button
                  className="sigil-btn"
                  onClick={submitScore}
                  disabled={submitState === "submitting" || submitState === "submitted"}
                >
                  {submitLabel}
                </button>
                <button className="sigil-btn" onClick={startGame}>
                  Try Again
                </button>
                <Link to="/games" className="sigil-btn sigil-btn--ghost">
                  Back to Arcade
                </Link>
              </div>
            </div>
          )}

          {sigils.map((s) => {
            const frac = s.remaining / s.life;
            const radius = 26;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference * (1 - frac);
            const label =
              s.type === "cursed" ? "Cursed sigil, avoid" : s.type === "gold" ? "Rare gold sigil" : "Sigil";
            return (
              <button
                key={s.id}
                type="button"
                aria-label={label}
                className={`sigil sigil--${s.type}`}
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleHit(s);
                }}
              >
                <svg viewBox="0 0 60 60" className="sigil-ring" aria-hidden="true">
                  <circle className="sigil-ring-track" cx="30" cy="30" r={radius} />
                  <circle
                    className="sigil-ring-progress"
                    cx="30"
                    cy="30"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <span className="sigil-glyph" aria-hidden="true">
                  {s.type === "gold" ? "✦" : s.type === "cursed" ? "☠" : "◈"}
                </span>
              </button>
            );
          })}

          {popups.map((p) => (
            <span
              key={p.id}
              className={`sigil-popup sigil-popup--${p.kind}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-hidden="true"
            >
              {p.text}
            </span>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SigilStrike;