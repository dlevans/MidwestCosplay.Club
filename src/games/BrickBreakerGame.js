import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BrickBreaker.css';

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;

const BrickBreaker = () => {
  const canvasRef = useRef(null);
  const gameLoop = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [lives, setLives] = useState(3);

  // "idle" | "submitting" | "submitted" | "error"
  const [submitStatus, setSubmitStatus] = useState("idle");

  const ball = useRef({ x: 300, y: 400, dx: 4, dy: -4, radius: 8 });
  const paddle = useRef({ width: 100, height: 15, x: 300 });
  const bricks = useRef([]);

  const initializeBricks = useCallback(() => {
    const arr = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      arr[c] = [];
      for (let r = 0; r < BRICK_ROWS; r++) {
        arr[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
    bricks.current = arr;
  }, []);

  const resetBall = useCallback(() => {
    ball.current = { x: 300, y: 400, dx: 4, dy: -4, radius: 8 };
  }, []);

  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setIsPlaying(false);
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    setSubmitStatus("idle");
    initializeBricks();
    resetBall();
  }, [initializeBricks, resetBall]);

  const submitScore = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setSubmitStatus("error"); return; }
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game: "brickbreaker", score: scoreRef.current }),
      });
      setSubmitStatus(res.ok ? "submitted" : "error");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  // livesRef so handleBallLost inside the interval always sees the current value
  const livesRef = useRef(3);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const handleBallLost = useCallback(() => {
    if (livesRef.current <= 1) {
      setLives(0);
      setIsGameOver(true);
      setIsPlaying(false);
      clearInterval(gameLoop.current);
    } else {
      setLives((l) => { livesRef.current = l - 1; return l - 1; });
      resetBall();
    }
  }, [resetBall]);

  // Initialize bricks on mount
  useEffect(() => { initializeBricks(); }, [initializeBricks]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft')  paddle.current.x = Math.max(0, paddle.current.x - 20);
      if (e.key === 'ArrowRight') paddle.current.x = Math.min(600 - paddle.current.width, paddle.current.x + 20);
      if (e.key === ' ') {
        if (isGameOver) resetGame();
        else setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, resetGame]);

  // Mouse & touch paddle control
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

  // Responsive canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const w = Math.min(600, window.innerWidth - 32);
      canvas.style.width = w + 'px';
      canvas.style.height = w + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Game loop
  useEffect(() => {
    if (isGameOver) { clearInterval(gameLoop.current); return; }

    const ctx = canvasRef.current.getContext('2d');

    const checkBrickCollisions = () => {
      for (let c = 0; c < BRICK_COLS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
          const brick = bricks.current[c][r];
          if (brick.status !== 1) continue;
          const bx = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_TOP;
          const by = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          if (
            ball.current.x > bx && ball.current.x < bx + BRICK_WIDTH &&
            ball.current.y > by && ball.current.y < by + BRICK_HEIGHT
          ) {
            ball.current.dy = -ball.current.dy;
            brick.status = 0;
            setScore((s) => { const n = s + 100; scoreRef.current = n; return n; });
          }
        }
      }
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
      // Paddle
      if (ball.current.y + ball.current.dy > 600 - paddle.current.height - ball.current.radius) {
        if (ball.current.x > paddle.current.x && ball.current.x < paddle.current.x + paddle.current.width) {
          ball.current.dy = -ball.current.dy;
          ball.current.dx += (Math.random() - 0.5) * 2;
        } else {
          handleBallLost();
        }
      }

      checkBrickCollisions();

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
      ctx.closePath();

      // Draw paddle
      ctx.fillStyle = '#44ff44';
      ctx.fillRect(paddle.current.x, 600 - paddle.current.height, paddle.current.width, paddle.current.height);

      // Draw bricks
      bricks.current.forEach((col, c) => {
        col.forEach((brick, r) => {
          if (brick.status !== 1) return;
          const bx = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_TOP;
          const by = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          ctx.fillStyle = '#4444ff';
          ctx.fillRect(bx, by, BRICK_WIDTH, BRICK_HEIGHT);
        });
      });
    }, 16);

    return () => clearInterval(gameLoop.current);
  }, [isPlaying, isGameOver, handleBallLost]);

  const submitLabel = {
    idle: "Submit score",
    submitting: "Submitting…",
    submitted: "Score submitted!",
    error: "Submission failed — try again",
  }[submitStatus];

  return (
    <div className="game-container">
      <div className="game-info">
        <div>Score: {score}</div>
        <div>Lives: {lives}</div>
      </div>
      <canvas ref={canvasRef} width="600" height="600" className="game-canvas" />
      {isGameOver && (
        <div className="game-overlay">
          <h2>GAME OVER</h2>
          <p>Final score: {score}</p>
          <button
            className="bb-btn"
            onClick={submitScore}
            disabled={submitStatus === "submitting" || submitStatus === "submitted"}
          >
            {submitLabel}
          </button>
          <button className="bb-btn bb-btn--secondary" onClick={resetGame}>Play again</button>
        </div>
      )}
      {!isPlaying && !isGameOver && (
        <div className="game-overlay">
          <h2>BRICK BREAKER</h2>
          <p>Arrow keys or drag to move</p>
          <button className="bb-btn" onClick={() => setIsPlaying(true)}>Start</button>
        </div>
      )}
    </div>
  );
};

export default BrickBreaker;