import React, { useState, useCallback, useRef, useEffect } from "react";
import "./HackingGame.css";

const API = "https://midwestcosplayclubapi-1.onrender.com";

// ── Difficulty tiers (mirrors RobCo terminal security levels) ──
const DIFFICULTIES = [
  { key: "novice",   label: "Novice",   wordLength: 5, wordCount: 6,  brackets: 4, attempts: 4 },
  { key: "advanced", label: "Advanced", wordLength: 7, wordCount: 8,  brackets: 5, attempts: 4 },
  { key: "expert",   label: "Expert",   wordLength: 9, wordCount: 10, brackets: 6, attempts: 4 },
];

// Cosplay/convention-themed word banks, grouped by letter count so every
// candidate on screen is the same length (just like the real terminal hack).
const WORD_BANK = {
  5: ["PANEL", "PROPS", "ARMOR", "CLOTH", "PAINT", "BADGE", "MODEL", "VINYL",
      "RESIN", "CRAFT", "STAFF", "WEAVE", "VISOR", "PLUSH", "PATCH", "GLOVE"],
  7: ["COSTUME", "COSPLAY", "ARMORED", "PADDING", "LEATHER", "GLITTER",
      "FANDOMS", "PANELED", "VENDORS", "STAGING", "CURATED", "BOOKLET"],
  9: ["CROSSPLAY", "COSPLAYER", "COSTUMERS", "UPHOLSTER", "EMBROIDER",
      "PHOTOSHOP", "GREENROOM", "BACKDROPS", "SEAMSTERS", "REFERENCE",
      "HANDCRAFT", "CHARACTER", "ACCESSORY", "ADHESIVES", "SILICONES"],
};

const GARBAGE_CHARS = "!@#$%^&*-_=+;:,.?~\\|0123456789".split("");
const BRACKET_PAIRS = ["()", "[]", "{}", "<>"];
const LINE_WIDTH = 12;
const LINES_PER_COL = 14;
const TOTAL_LINES = LINES_PER_COL * 2;
const BASE_ADDR = 0xf188;

function rand(n) { return Math.floor(Math.random() * n); }

function randomChar() { return GARBAGE_CHARS[rand(GARBAGE_CHARS.length)]; }

function pickUnique(arr, n) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(rand(pool.length), 1)[0]);
  }
  return out;
}

function likeness(a, b) {
  let count = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) count++;
  return count;
}

function calcScore(diffKey, attemptsRemaining) {
  const base = { novice: 500, advanced: 900, expert: 1400 }[diffKey] ?? 500;
  return base + attemptsRemaining * 150;
}

// ── Board generator ──────────────────────────────────────────
// Places every word and bracket-trick token on its own line, at a random
// offset, so nothing overlaps and nothing wraps mid-token.
function buildBoard(diffKey) {
  const cfg = DIFFICULTIES.find((d) => d.key === diffKey);
  const bank = WORD_BANK[cfg.wordLength];
  const chosenWords = pickUnique(bank, cfg.wordCount);
  const answerIndex = rand(chosenWords.length);

  const words = chosenWords.map((word, i) => ({
    id: `w${i}`,
    kind: "word",
    word,
    isAnswer: i === answerIndex,
    status: "active", // active | wrong | removed
  }));

  const brackets = Array.from({ length: cfg.brackets }, (_, i) => {
    const pair = BRACKET_PAIRS[rand(BRACKET_PAIRS.length)];
    const fillerLen = 2 + rand(4);
    const filler = Array.from({ length: fillerLen }, randomChar).join("");
    return {
      id: `b${i}`,
      kind: "bracket",
      token: pair[0] + filler + pair[1],
      effect: Math.random() < 0.6 ? "dud" : "replenish",
      used: false,
    };
  });

  const items = [...words, ...brackets];
  const lineSlots = pickUnique(
    Array.from({ length: TOTAL_LINES }, (_, i) => i),
    items.length
  );

  const lines = Array.from({ length: TOTAL_LINES }, () =>
    Array.from({ length: LINE_WIDTH }, randomChar)
  );

  items.forEach((item, idx) => {
    const lineIndex = lineSlots[idx];
    const text = item.kind === "word" ? item.word : item.token;
    const maxStart = LINE_WIDTH - text.length;
    const start = rand(maxStart + 1);
    text.split("").forEach((ch, c) => { lines[lineIndex][start + c] = ch; });
    item.lineIndex = lineIndex;
    item.start = start;
    item.end = start + text.length;
  });

  return {
    cfg,
    lines,
    words,
    brackets,
    attempts: cfg.attempts,
    maxAttempts: cfg.attempts,
  };
}

// ── Terminal line renderer ──────────────────────────────────
function TerminalLine({ lineIndex, chars, words, brackets, hoveredId, status, onHover, onWordClick, onBracketClick }) {
  const tokens = [...words, ...brackets]
    .filter((t) => t.lineIndex === lineIndex && !(t.kind === "word" && t.status === "removed"))
    .sort((a, b) => a.start - b.start);

  const nodes = [];
  let cursor = 0;
  let key = 0;

  const flushPlain = (end) => {
    if (end > cursor) {
      nodes.push(
        <span key={`p${key++}`} className="hack-plain">
          {chars.slice(cursor, end).join("")}
        </span>
      );
    }
  };

  tokens.forEach((tok) => {
    flushPlain(tok.start);
    if (tok.kind === "word") {
      const revealAsAnswer = status === "lost" && tok.isAnswer;
      const clickable = status === "playing" && tok.status === "active";
      const cls = [
        "hack-token",
        "hack-token--word",
        tok.status === "wrong" ? "hack-token--wrong" : "",
        revealAsAnswer ? "hack-token--answer-reveal" : "",
        hoveredId === tok.id ? "hack-token--hover" : "",
      ].filter(Boolean).join(" ");
      nodes.push(
        <span
          key={`t${key++}`}
          className={cls}
          onClick={() => clickable && onWordClick(tok.id)}
          onMouseEnter={() => clickable && onHover(tok.id)}
          onMouseLeave={() => onHover(null)}
        >
          {tok.word}
        </span>
      );
    } else {
      const clickable = status === "playing" && !tok.used;
      const cls = [
        "hack-token",
        "hack-token--bracket",
        tok.used ? "hack-token--used" : "",
        hoveredId === tok.id ? "hack-token--hover" : "",
      ].filter(Boolean).join(" ");
      nodes.push(
        <span
          key={`t${key++}`}
          className={cls}
          onClick={() => clickable && onBracketClick(tok.id)}
          onMouseEnter={() => clickable && onHover(tok.id)}
          onMouseLeave={() => onHover(null)}
        >
          {tok.token}
        </span>
      );
    }
    cursor = tok.end;
  });

  flushPlain(chars.length);

  const addr = "0x" + (BASE_ADDR + lineIndex * LINE_WIDTH).toString(16).toUpperCase().padStart(4, "0");
  return (
    <div className="hack-line">
      <span className="hack-addr">{addr}</span>
      <span>{nodes}</span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
const HackingGame = () => {
  const [difficulty, setDifficulty] = useState("novice");
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [log, setLog] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const scoreRef = useRef(0);
  const logEndRef = useRef(null);

  const newGame = useCallback((diffKey = difficulty) => {
    setBoard(buildBoard(diffKey));
    setStatus("playing");
    setLog([
      "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
      "ENTER PASSWORD NOW",
    ]);
    setSubmitStatus("idle");
    scoreRef.current = 0;
  }, [difficulty]);

  useEffect(() => { newGame(difficulty); }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
  }, [log]);

  const appendLog = useCallback((lines) => {
    setLog((prev) => [...prev, ...(Array.isArray(lines) ? lines : [lines])]);
  }, []);

  const handleWordClick = useCallback((wordId) => {
    if (!board || status !== "playing") return;
    const word = board.words.find((w) => w.id === wordId);
    if (!word || word.status !== "active") return;

    appendLog(`>${word.word}`);

    if (word.isAnswer) {
      const score = calcScore(difficulty, board.attempts);
      scoreRef.current = score;
      setStatus("won");
      appendLog(["Entry granted.", "ACCESS GRANTED"]);
      return;
    }

    const answer = board.words.find((w) => w.isAnswer);
    const match = likeness(word.word, answer.word);
    const nextAttempts = board.attempts - 1;

    setBoard((prev) => ({
      ...prev,
      attempts: nextAttempts,
      words: prev.words.map((w) => (w.id === wordId ? { ...w, status: "wrong" } : w)),
    }));

    if (nextAttempts <= 0) {
      setStatus("lost");
      appendLog([
        `Entry denied. Likeness=${match}/${word.word.length}`,
        "TERMINAL LOCKED",
        `>>PASSWORD WAS: ${answer.word}`,
      ]);
    } else {
      appendLog(`Entry denied. Likeness=${match}/${word.word.length}`);
    }
  }, [board, status, difficulty, appendLog]);

  const handleBracketClick = useCallback((bracketId) => {
    if (!board || status !== "playing") return;
    const bracket = board.brackets.find((b) => b.id === bracketId);
    if (!bracket || bracket.used) return;

    const activeDuds = board.words.filter((w) => w.status === "active" && !w.isAnswer);
    let effect = bracket.effect;
    if (effect === "dud" && activeDuds.length === 0) effect = "replenish";

    if (effect === "dud") {
      const target = activeDuds[rand(activeDuds.length)];
      setBoard((prev) => {
        const newLines = prev.lines.map((line, li) =>
          li === target.lineIndex
            ? line.map((ch, ci) => (ci >= target.start && ci < target.end ? randomChar() : ch))
            : line
        );
        return {
          ...prev,
          lines: newLines,
          words: prev.words.map((w) => (w.id === target.id ? { ...w, status: "removed" } : w)),
          brackets: prev.brackets.map((b) => (b.id === bracketId ? { ...b, used: true } : b)),
        };
      });
      appendLog([`>${bracket.token}`, "Dud removed."]);
    } else {
      setBoard((prev) => ({
        ...prev,
        attempts: prev.maxAttempts,
        brackets: prev.brackets.map((b) => (b.id === bracketId ? { ...b, used: true } : b)),
      }));
      appendLog([`>${bracket.token}`, "Allowance replenished."]);
    }
  }, [board, status, appendLog]);

  const submitScore = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setSubmitStatus("error"); return; }
    setSubmitStatus("submitting");
    try {
      const res = await fetch(`${API}/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "hacking", score: scoreRef.current }),
      });
      setSubmitStatus(res.ok ? "submitted" : "error");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  const submitLabel = {
    idle: "Submit score",
    submitting: "Submitting…",
    submitted: "Score submitted!",
    error: "Submission failed — try again",
  }[submitStatus];

  if (!board) {
    return (
      <div className="hack-game">
        <div className="hack-loading">Booting terminal…</div>
      </div>
    );
  }

  const { cfg } = board;

  return (
    <div className="hack-game">
      <header className="hack-header">
        <p className="hack-eyebrow">Club Arcade</p>
        <h1 className="hack-headline">Terminal Hack</h1>
        <p className="hack-subhead">Find the password before you're locked out.</p>
      </header>

      <div className="hack-difficulty">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            className={`hack-diff-btn${difficulty === d.key ? " hack-diff-btn--active" : ""}`}
            onClick={() => setDifficulty(d.key)}
          >
            {d.label} <span style={{ color: "#7c3aed", fontSize: "0.75rem" }}>({d.wordLength}-char)</span>
          </button>
        ))}
      </div>

      <div className="hack-hud">
        <div className="hack-hud-stat">
          <span className="hack-hud-label">Security</span>
          <span className="hack-hud-value">{cfg.label}</span>
        </div>
        <div className="hack-hud-stat">
          <span className="hack-hud-label">Attempts</span>
          <div className="hack-pips">
            {Array.from({ length: board.maxAttempts }).map((_, i) => (
              <span key={i} className={`hack-pip${i < board.attempts ? "" : " hack-pip--empty"}`} />
            ))}
          </div>
        </div>
        <button className="hack-reboot-btn" onClick={() => newGame(difficulty)}>
          Reboot
        </button>
      </div>

      <div className="hack-screen">
        <div className="hack-crt hack-flicker">
          <p className="hack-intro">
            {`Welcome to ROBCO Industries (TM) Termlink\nPassword Required to Continue > `}
            <span className="hack-cursor" />
          </p>
          <div className="hack-columns">
            <div>
              {board.lines.slice(0, LINES_PER_COL).map((chars, i) => (
                <TerminalLine
                  key={i}
                  lineIndex={i}
                  chars={chars}
                  words={board.words}
                  brackets={board.brackets}
                  hoveredId={hoveredId}
                  status={status}
                  onHover={setHoveredId}
                  onWordClick={handleWordClick}
                  onBracketClick={handleBracketClick}
                />
              ))}
            </div>
            <div>
              {board.lines.slice(LINES_PER_COL).map((chars, i) => (
                <TerminalLine
                  key={i + LINES_PER_COL}
                  lineIndex={i + LINES_PER_COL}
                  chars={chars}
                  words={board.words}
                  brackets={board.brackets}
                  hoveredId={hoveredId}
                  status={status}
                  onHover={setHoveredId}
                  onWordClick={handleWordClick}
                  onBracketClick={handleBracketClick}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hack-log" ref={logEndRef}>
          {log.map((line, i) => {
            const cls = line.startsWith(">>") || line === "ACCESS GRANTED" || line === "Entry granted."
              ? "hack-log-entry hack-log-entry--good"
              : line === "TERMINAL LOCKED"
              ? "hack-log-entry hack-log-entry--bad"
              : "hack-log-entry";
            return <p key={i} className={cls}>{line}</p>;
          })}
        </div>
      </div>

      {status === "won" && (
        <div className="hack-overlay">
          <div className="hack-overlay-box">
            <h2 className="hack-overlay-good">Access Granted</h2>
            <div className="hack-score-big">{scoreRef.current.toLocaleString()}</div>
            <p>{board.attempts} attempt(s) left · {cfg.label}</p>
            <button
              className="hack-btn"
              onClick={submitScore}
              disabled={submitStatus === "submitting" || submitStatus === "submitted"}
            >
              {submitLabel}
            </button>
            <button className="hack-btn hack-btn--secondary" onClick={() => newGame(difficulty)}>
              Hack another terminal
            </button>
          </div>
        </div>
      )}

      {status === "lost" && (
        <div className="hack-overlay">
          <div className="hack-overlay-box">
            <h2 className="hack-overlay-bad">Terminal Locked</h2>
            <p>Password was <strong>{board.words.find((w) => w.isAnswer).word}</strong></p>
            <button className="hack-btn hack-btn--secondary" onClick={() => newGame(difficulty)}>
              Try another terminal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HackingGame;