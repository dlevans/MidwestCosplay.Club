import React, { useState, useEffect, useCallback } from "react";
import "./SnakeGame.css";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };
const INITIAL_LIVES = 3; // Initial number of lives
const INITIAL_SCORE = 0; // Initial score

const SnakeGame = () => {
  console.log("SnakeGame.js");
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(generateFoodPosition());
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [lives, setLives] = useState(INITIAL_LIVES); // Lives state
  const [score, setScore] = useState(INITIAL_SCORE); // Score state

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
        return;
      }
    }

    newSnake.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y) {
      setFood(generateFoodPosition());
      setScore((prevScore) => prevScore + 100); // Increment score
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
  }, []); // Use useCallback with an empty dependency array

  useEffect(() => {
    const handleKeyDown = (event) => {
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

  function generateFoodPosition() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  return (
    <div>
      {isGameOver ? (
        <div className="game-over">Game Over! Press Space to Restart! Final score: {score}</div>
      ) : isPaused ? (
        <div className="game-paused">Press Space to Start</div>
      ) : (
        <div>
          <div className="lives">Lives: {lives}</div>
          <div className="score">Score: {score}</div> {/* Display score */}
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
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
