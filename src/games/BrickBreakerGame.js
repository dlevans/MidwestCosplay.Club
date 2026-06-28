import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BrickBreaker.css';

// ── Layout constants (canvas is always 600×600) ──────────────────────────────
const BRICK_WIDTH   = 70;
const BRICK_HEIGHT  = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP  = 60;
const BRICK_OFFSET_LEFT = 30;   // horizontal centering handled per-level

// Map color index → hex (must match the level editor palette)
const BRICK_COLORS = [
  null,          // 0 = empty
  '#4c7eff',    // 1 blue
  '#ff4c6e',    // 2 red
  '#4cff9f',    // 3 green
  '#ffd94c',    // 4 yellow
  '#c84cff',    // 5 purple
  '#ff8c4c',    // 6 orange
];

// ── Load all level JSON files from /levels/ folder ───────────────────────────
// Files must be named level-1.json, level-2.json, … and served statically.
async function loadLevels() {
  const levels = [];
  let i = 1;
  while (true) {
    try {
      const res = await fetch(`/levels/level-${i}.json`);
      if (!res.ok) break;
      const data = await res.json();
      levels.push(data);
      i++;
    } catch {
      break;
    }
  }
  // Fallback: one hard-coded default level so the game always works
  if (levels.length === 0) {
    levels.push(defaultLevel());
  }
  return levels;
}

function defaultLevel() {
  return {
    name: 'Level 1',
    ballSpeed: 4,
    cols: 8,
    rows: 5,
    bricks: [
      [1,1,1,1,1,1,1,1],
      [2,2,2,2,2,2,2,2],
      [3,3,3,3,3,3,3,3],
      [4,4,4,4,4,4,4,4],
      [5,5,5,5,5,5,5,5],
    ],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
const BrickBreaker = () => {
  const canvasRef = useRef(null);
  const gameLoop  = useRef(null);

  const [levels, setLevels]       = useState([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin]         = useState(false);
  const [score, setScore]         = useState(0);
  const scoreRef = useRef(0);
  const [lives, setLives]         = useState(3);
  const livesRef = useRef(3);

  const [submitStatus, setSubmitStatus] = useState('idle');

  const ball   = useRef({ x: 300, y: 400, dx: 4, dy: -4, radius: 8 });
  const paddle = useRef({ width: 100, height: 15, x: 300 });
  const bricks = useRef([]);

  // ── Build brick grid from a level object ────────────────────────────────────
  const initLevel = useCallback((level) => {
    const arr = [];
    for (let c = 0; c < level.cols; c++) {
      arr[c] = [];
      for (let r = 0; r < level.rows; r++) {
        const colorIdx = level.bricks[r]?.[c] ?? 0;
        arr[c][r] = { colorIdx, status: colorIdx > 0 ? 1 : 0 };
      }
    }
    bricks.current = arr;
  }, []);

  const resetBall = useCallback((speed = 4) => {
    const s = speed;
    ball.current = { x: 300, y: 400, dx: s, dy: -s, radius: 8 };
  }, []);

  // Full game reset back to level 1
  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setIsWin(false);
    setIsPlaying(false);
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setLevelIndex(0);
    setSubmitStatus('idle');
    setCheatActive(false);
    konamiProgress.current = 0;
    if (levels.length > 0) {
      initLevel(levels[0]);
      resetBall(levels[0].ballSpeed ?? 4);
    }
  }, [levels, initLevel, resetBall]);

  // Advance to the next level (keeps score & lives)
  const advanceLevel = useCallback((nextIdx) => {
    if (nextIdx >= levels.length) {
      // All levels cleared — total win!
      setIsWin(true);
      setIsPlaying(false);
      return;
    }
    setLevelIndex(nextIdx);
    const level = levels[nextIdx];
    initLevel(level);
    resetBall(level.ballSpeed ?? 4);
    // Brief pause so the player sees the level transition
    setIsPlaying(false);
  }, [levels, initLevel, resetBall]);

  // ── Score submission ────────────────────────────────────────────────────────
  const submitScore = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setSubmitStatus('error'); return; }
    setSubmitStatus('submitting');
    try {
      const res = await fetch('https://midwestcosplayclubapi-1.onrender.com/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: 'brickbreaker', score: scoreRef.current }),
      });
      setSubmitStatus(res.ok ? 'submitted' : 'error');
    } catch {
      setSubmitStatus('error');
    }
  }, []);

  // ── Load levels on mount ────────────────────────────────────────────────────
  useEffect(() => {
    loadLevels().then((loaded) => {
      setLevels(loaded);
      initLevel(loaded[0]);
      resetBall(loaded[0].ballSpeed ?? 4);
    });
  }, [initLevel, resetBall]);

  // ── Konami code cheat ───────────────────────────────────────────────────────
  const KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'b','a',
  ];
  const konamiProgress = useRef(0);
  const [cheatActive, setCheatActive] = useState(false);

  // ── Keyboard controls ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Konami code tracker (runs before anything else)
      if (e.key === KONAMI[konamiProgress.current]) {
        konamiProgress.current += 1;
        if (konamiProgress.current === KONAMI.length) {
          konamiProgress.current = 0;
          livesRef.current = 99;
          setLives(99);
          setCheatActive(true);
        }
      } else {
        // Partial mismatch — restart, but check if this key starts the sequence
        konamiProgress.current = e.key === KONAMI[0] ? 1 : 0;
      }

      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft')  paddle.current.x = Math.max(0, paddle.current.x - 20);
      if (e.key === 'ArrowRight') paddle.current.x = Math.min(600 - paddle.current.width, paddle.current.x + 20);
      if (e.key === ' ') {
        if (isGameOver || isWin) resetGame();
        else setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isWin, resetGame]);

  // ── Mouse & touch paddle ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      return (clientX - rect.left) * (600 / rect.width);
    };
    const moveTo = (clientX) => {
      paddle.current.x = Math.max(0, Math.min(600 - paddle.current.width, getX(clientX) - paddle.current.width / 2));
    };
    const onMouseMove = (e) => moveTo(e.clientX);
    const onTouchMove = (e) => { e.preventDefault(); moveTo(e.touches[0].clientX); };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // ── Responsive canvas ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const w = Math.min(600, window.innerWidth - 32);
      canvas.style.width  = w + 'px';
      canvas.style.height = w + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Ball lost ───────────────────────────────────────────────────────────────
  const handleBallLost = useCallback(() => {
    const level = levels[levelIndex];
    if (livesRef.current <= 1) {
      setLives(0);
      setIsGameOver(true);
      setIsPlaying(false);
      clearInterval(gameLoop.current);
    } else {
      const next = livesRef.current - 1;
      livesRef.current = next;
      setLives(next);
      resetBall(level?.ballSpeed ?? 4);
    }
  }, [levels, levelIndex, resetBall]);

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isGameOver || isWin || levels.length === 0) {
      clearInterval(gameLoop.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const level = levels[levelIndex];
    const { cols, rows } = level;

    // Compute horizontal offset so the brick field is centred
    const fieldWidth = cols * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING;
    const offsetLeft = Math.max(BRICK_OFFSET_LEFT, (600 - fieldWidth) / 2);

    const checkBrickCollisions = () => {
      let remaining = 0;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const brick = bricks.current[c]?.[r];
          if (!brick || brick.status !== 1) continue;
          remaining++;
          const bx = c * (BRICK_WIDTH + BRICK_PADDING) + offsetLeft;
          const by = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          if (
            ball.current.x > bx && ball.current.x < bx + BRICK_WIDTH &&
            ball.current.y > by && ball.current.y < by + BRICK_HEIGHT
          ) {
            ball.current.dy = -ball.current.dy;
            brick.status = 0;
            remaining--;
            setScore((s) => { const n = s + 100; scoreRef.current = n; return n; });
          }
        }
      }
      return remaining;
    };

    gameLoop.current = setInterval(() => {
      if (!isPlaying) return;

      ctx.clearRect(0, 0, 600, 600);

      ball.current.x += ball.current.dx;
      ball.current.y += ball.current.dy;

      // Wall collisions
      if (ball.current.x + ball.current.dx > 600 - ball.current.radius ||
          ball.current.x + ball.current.dx < ball.current.radius) {
        ball.current.dx = -ball.current.dx;
      }
      // Ceiling
      if (ball.current.y + ball.current.dy < ball.current.radius) {
        ball.current.dy = -ball.current.dy;
      }
      // Bottom / paddle
      if (ball.current.y + ball.current.dy > 600 - paddle.current.height - ball.current.radius) {
        if (ball.current.x > paddle.current.x && ball.current.x < paddle.current.x + paddle.current.width) {
          ball.current.dy = -ball.current.dy;
          ball.current.dx += (Math.random() - 0.5) * 2;
        } else {
          handleBallLost();
        }
      }

      const remaining = checkBrickCollisions();
      if (remaining === 0) {
        clearInterval(gameLoop.current);
        advanceLevel(levelIndex + 1);
        return;
      }

      // ── Draw ──────────────────────────────────────────────────────────────

      // Ball
      ctx.beginPath();
      ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
      ctx.closePath();

      // Paddle
      ctx.fillStyle = '#44ff44';
      ctx.fillRect(paddle.current.x, 600 - paddle.current.height, paddle.current.width, paddle.current.height);

      // Bricks
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const brick = bricks.current[c]?.[r];
          if (!brick || brick.status !== 1) continue;
          const bx = c * (BRICK_WIDTH + BRICK_PADDING) + offsetLeft;
          const by = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          ctx.fillStyle = BRICK_COLORS[brick.colorIdx] ?? '#4444ff';
          ctx.fillRect(bx, by, BRICK_WIDTH, BRICK_HEIGHT);
        }
      }
    }, 16);

    return () => clearInterval(gameLoop.current);
  }, [isPlaying, isGameOver, isWin, levels, levelIndex, handleBallLost, advanceLevel]);

  // ── Sync livesRef ────────────────────────────────────────────────────────────
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const levelName = levels[levelIndex]?.name ?? '';

  const submitLabel = {
    idle:       'Submit score',
    submitting: 'Submitting…',
    submitted:  'Score submitted!',
    error:      'Submission failed — try again',
  }[submitStatus];

  return (
    <div className="game-container">
      <div className="game-info">
        <div>Score: {score}</div>
        <div>{levelName}</div>
        <div>Lives: {lives}{cheatActive && <span className="cheat-badge"> ★ CHEAT</span>}</div>
      </div>

      <canvas ref={canvasRef} width="600" height="600" className="game-canvas" />

      {/* ── Game over overlay ── */}
      {isGameOver && (
        <div className="game-overlay">
          <h2>GAME OVER</h2>
          <p>Final score: {score}</p>
          <button
            className="bb-btn"
            onClick={submitScore}
            disabled={submitStatus === 'submitting' || submitStatus === 'submitted'}
          >
            {submitLabel}
          </button>
          <button className="bb-btn bb-btn--secondary" onClick={resetGame}>Play again</button>
        </div>
      )}

      {/* ── Total win overlay ── */}
      {isWin && (
        <div className="game-overlay">
          <h2>YOU WIN!</h2>
          <p>All {levels.length} levels cleared!</p>
          <p>Final score: {score}</p>
          <button
            className="bb-btn"
            onClick={submitScore}
            disabled={submitStatus === 'submitting' || submitStatus === 'submitted'}
          >
            {submitLabel}
          </button>
          <button className="bb-btn bb-btn--secondary" onClick={resetGame}>Play again</button>
        </div>
      )}

      {/* ── Start / level transition overlay ── */}
      {!isPlaying && !isGameOver && !isWin && (
        <div className="game-overlay">
          {levelIndex === 0 ? (
            <>
              <h2>BRICK BREAKER</h2>
              <p>Arrow keys or drag to move</p>
            </>
          ) : (
            <>
              <h2>{levelName}</h2>
              <p>Level {levelIndex + 1} of {levels.length}</p>
            </>
          )}
          <button className="bb-btn" onClick={() => setIsPlaying(true)}>
            {levelIndex === 0 ? 'Start' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BrickBreaker;
