import React, { useState, useEffect, useCallback, useRef } from "react";
import "./SnakeGame.css";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };
const INITIAL_LIVES = 3; // Initial number of lives
const INITIAL_SCORE = 0; // Initial score

const SnakeGame = ({ onGameOver }) => {
  console.log("SnakeGame.js");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(generateFoodPosition());
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [lives, setLives] = useState(INITIAL_LIVES); // Lives state
  const [score, setScore] = useState(INITIAL_SCORE); // Score state
  const scoreRef = useRef(INITIAL_SCORE); // Ref so onGameOver always reads the latest value

  // Define checkCollision outside of useCallback to avoid warning
  const checkCollision = useCallback((head) => {
    return (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)
    );
  }, [snake]); // Include 'snake' in the dependencies

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    const newSnake = [...snake];
    const newHead = {
      x: newSnake[0].x + direction.x,
      y: newSnake[0].y + direction.y,
    };

    if (checkCollision(newHead)) {
      if (lives > 1) {
        // Decrement lives and reset snake position
        setLives((prevLives) => prevLives - 1);
        setSnake(INITIAL_SNAKE); // Reset snake to initial position
        return;
      } else {
        // No lives left, end the game
        setIsGameOver(true);
        setIsPaused(true);
        if (typeof onGameOver === 'function') {
          onGameOver(scoreRef.current);
        }
        return;
      }
    }

    newSnake.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y) {
      setFood(generateFoodPosition());
      setScore((prevScore) => {
        const next = prevScore + 100;
        scoreRef.current = next;
        return next;
      }); // Increment score
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, isPaused, isGameOver, lives, checkCollision]); // Include checkCollision

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
    setLives(INITIAL_LIVES); // Reset lives
    setScore(INITIAL_SCORE); // Reset score
    scoreRef.current = INITIAL_SCORE;
  }, []); // Use useCallback with an empty dependency array

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent arrow keys from scrolling the page
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === " ") {
        if (isGameOver) {
          resetGame();
        } else {
          setIsPaused((prev) => !prev);
        }
      }
      switch (event.key) {
        case "ArrowUp":
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isGameOver, resetGame]); // Include resetGame in dependencies

  // Touch swipe controls for mobile
  useEffect(() => {
    let touchStartX = null;
    let touchStartY = null;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (touchStartX === null || touchStartY === null) return;

      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Require a minimum swipe distance to avoid accidental taps
      if (Math.max(absDx, absDy) < 20) return;

      if (absDx > absDy) {
        // Horizontal swipe
        if (dx > 0 && direction.x === 0) setDirection({ x: 1, y: 0 });
        else if (dx < 0 && direction.x === 0) setDirection({ x: -1, y: 0 });
      } else {
        // Vertical swipe
        if (dy > 0 && direction.y === 0) setDirection({ x: 0, y: 1 });
        else if (dy < 0 && direction.y === 0) setDirection({ x: 0, y: -1 });
      }

      touchStartX = null;
      touchStartY = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [direction]);

  function generateFoodPosition() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  return (
    <div>
      {isGameOver ? (
        <div className="game-over">
          Game Over! Final score: {score}
          <br />
          <button className="snake-btn" onClick={resetGame}>Play again</button>
        </div>
      ) : isPaused ? (
        <div className="game-paused">
          <p>Press Space or tap the button to start</p>
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
                  let className = "cell";
                  if (snake.some(segment => segment.x === x && segment.y === y)) {
                    className += " snake";
                  }
                  if (food.x === x && food.y === y) {
                    className += " food";
                  }
                  return <div key={x} className={className}></div>;
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