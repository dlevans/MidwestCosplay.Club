import React, { useState, useEffect, useCallback, useRef } from "react";
import "./SnakeGame.css";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };
const INITIAL_LIVES = 3;
const INITIAL_SCORE = 0;

function generateFoodPosition() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(generateFoodPosition);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(INITIAL_SCORE);
  const scoreRef = useRef(INITIAL_SCORE);

  // "idle" | "submitting" | "submitted" | "error"
  const [submitStatus, setSubmitStatus] = useState("idle");

  const submitScore = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSubmitStatus("error");
      return;
    }
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game: "snake", score: scoreRef.current }),
      });
      setSubmitStatus(res.ok ? "submitted" : "error");
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  const checkCollision = useCallback((head) => {
    return (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE ||
      snake.some((seg) => seg.x === head.x && seg.y === head.y)
    );
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    const newSnake = [...snake];
    const newHead = {
      x: newSnake[0].x + direction.x,
      y: newSnake[0].y + direction.y,
    };

    if (checkCollision(newHead)) {
      if (lives > 1) {
        setLives((l) => l - 1);
        setSnake(INITIAL_SNAKE);
        return;
      } else {
        setIsGameOver(true);
        setIsPaused(true);
        return;
      }
    }

    newSnake.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y) {
      setFood(generateFoodPosition());
      setScore((prev) => {
        const next = prev + 100;
        scoreRef.current = next;
        return next;
      });
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, isPaused, isGameOver, lives, checkCollision]);

  useEffect(() => {
    if (isPaused || isGameOver) return;
    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [moveSnake, isPaused, isGameOver]);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFoodPosition());
    setDirection(INITIAL_DIRECTION);
    setIsGameOver(false);
    setIsPaused(true);
    setLives(INITIAL_LIVES);
    setScore(INITIAL_SCORE);
    scoreRef.current = INITIAL_SCORE;
    setSubmitStatus("idle");
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === " ") {
        if (isGameOver) resetGame();
        else setIsPaused((prev) => !prev);
      }
      switch (e.key) {
        case "ArrowUp":    if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case "ArrowDown":  if (direction.y === 0) setDirection({ x: 0, y: 1 });  break;
        case "ArrowLeft":  if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case "ArrowRight": if (direction.x === 0) setDirection({ x: 1, y: 0 });  break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isGameOver, resetGame]);

  // Touch swipe controls
  useEffect(() => {
    let startX = null;
    let startY = null;
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x === 0) setDirection({ x: 1, y: 0 });
        else if (dx < 0 && direction.x === 0) setDirection({ x: -1, y: 0 });
      } else {
        if (dy > 0 && direction.y === 0) setDirection({ x: 0, y: 1 });
        else if (dy < 0 && direction.y === 0) setDirection({ x: 0, y: -1 });
      }
      startX = null; startY = null;
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [direction]);

  const submitLabel = {
    idle: "Submit score",
    submitting: "Submitting…",
    submitted: "Score submitted!",
    error: "Submission failed — try again",
  }[submitStatus];

  return (
    <div>
      {isGameOver ? (
        <div className="game-over">
          <p>Game over! Final score: {score}</p>
          <button
            className="snake-btn snake-btn--submit"
            onClick={submitScore}
            disabled={submitStatus === "submitting" || submitStatus === "submitted"}
          >
            {submitLabel}
          </button>
          <button className="snake-btn" onClick={resetGame}>Play again</button>
        </div>
      ) : isPaused ? (
        <div className="game-paused">
          <p>Press Space or tap to start</p>
          <button className="snake-btn" onClick={() => setIsPaused(false)}>Start</button>
        </div>
      ) : (
        <div>
          <div className="snake-hud">
            <span className="lives">Lives: {lives}</span>
            <button className="snake-btn snake-btn--pause" onClick={() => setIsPaused(true)}>Pause</button>
            <span className="score">Score: {score}</span>
          </div>
          <div className="grid">
            {Array.from({ length: GRID_SIZE }).map((_, y) => (
              <div key={y} className="row">
                {Array.from({ length: GRID_SIZE }).map((_, x) => {
                  let cls = "cell";
                  if (snake.some((seg) => seg.x === x && seg.y === y)) cls += " snake";
                  if (food.x === x && food.y === y) cls += " food";
                  return <div key={x} className={cls} />;
                })}
              </div>
            ))}
          </div>
          <div className="snake-dpad">
            <div className="dpad-row">
              <button className="dpad-btn" onClick={() => { if (direction.y === 0) setDirection({ x: 0, y: -1 }); }}>▲</button>
            </div>
            <div className="dpad-row">
              <button className="dpad-btn" onClick={() => { if (direction.x === 0) setDirection({ x: -1, y: 0 }); }}>◀</button>
              <button className="dpad-btn dpad-btn--center" disabled>·</button>
              <button className="dpad-btn" onClick={() => { if (direction.x === 0) setDirection({ x: 1, y: 0 }); }}>▶</button>
            </div>
            <div className="dpad-row">
              <button className="dpad-btn" onClick={() => { if (direction.y === 0) setDirection({ x: 0, y: 1 }); }}>▼</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;