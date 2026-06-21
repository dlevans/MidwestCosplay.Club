import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BrickBreaker.css';

const BrickBreaker = () => {
  console.log("BrickBreakerGame.js");
  const canvasRef = useRef(null);
  const gameLoop = useRef(null); // Declare the game loop with useRef to persist it across renders
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Game objects
  const ball = useRef({ x: 300, y: 400, dx: 4, dy: -4, radius: 8 });
  const paddle = useRef({ width: 100, height: 15, x: 300 });
  const bricks = useRef([]);

  // Brick configuration
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const BRICK_WIDTH = 70;
  const BRICK_HEIGHT = 20;
  const BRICK_PADDING = 10;
  const BRICK_OFFSET_TOP = 60;

  // Memoize resetGame to avoid unnecessary recreations
  const resetGame = useCallback(() => {
    setIsGameOver(false);
    setIsPlaying(false);
    setScore(0);
    setLives(3);
    initializeBricks();
    resetBall();
  }, []);

  // Memoize handleBallLost to avoid unnecessary recreations
  const handleBallLost = useCallback(() => {
    if (lives <= 1) {
      setLives(0);  // Explicitly set lives to 0
      setIsGameOver(true);  // Set the game over state
      setIsPlaying(false);  // Stop the game from playing
      clearInterval(gameLoop.current);  // Clear the game loop interval to stop the ball from moving
    } else {
      setLives((l) => l - 1);  // Decrease lives
      resetBall();  // Reset the ball position
    }
  }, [lives]);

  // Initialize bricks
  useEffect(() => {
    initializeBricks();
  }, []);

  const initializeBricks = () => {
    const arr = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      arr[c] = [];
      for (let r = 0; r < BRICK_ROWS; r++) {
        arr[c][r] = { x: 0, y: 0, status: 1 };
      }
    }
    bricks.current = arr;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') paddle.current.x = Math.max(0, paddle.current.x - 20);
      if (e.key === 'ArrowRight') paddle.current.x = Math.min(600 - paddle.current.width, paddle.current.x + 20);
      if (e.key === ' ') {
        if (isGameOver) resetGame();
        else setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, resetGame]);

  // Game loop
  useEffect(() => {
    if (isGameOver) {
      clearInterval(gameLoop.current);  // Clear the interval if the game is over
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    gameLoop.current = setInterval(() => {
      if (!isPlaying) return;  // If the game is paused, stop the loop

      // Clear canvas
      ctx.clearRect(0, 0, 600, 600);

      // Update ball position
      ball.current.x += ball.current.dx;
      ball.current.y += ball.current.dy;

      // Wall collisions
      if (ball.current.x + ball.current.dx > 600 - ball.current.radius || 
          ball.current.x + ball.current.dx < ball.current.radius) {
        ball.current.dx = -ball.current.dx;
      }

      // Ceiling collision
      if (ball.current.y + ball.current.dy < ball.current.radius) {
        ball.current.dy = -ball.current.dy;
      }

      // Paddle collision
      if (ball.current.y + ball.current.dy > 600 - paddle.current.height - ball.current.radius) {
        if (ball.current.x > paddle.current.x && ball.current.x < paddle.current.x + paddle.current.width) {
          ball.current.dy = -ball.current.dy;
          // Add paddle hit effect
          ball.current.dx += (Math.random() - 0.5) * 2;
        } else {
          handleBallLost();
        }
      }

      // Brick collisions
      checkBrickCollisions();

      // Draw elements
      drawBall(ctx);
      drawPaddle(ctx);
      drawBricks(ctx);
    }, 16);

    return () => clearInterval(gameLoop.current);  // Clear the interval on cleanup
  }, [isPlaying, isGameOver, handleBallLost, resetGame]);  // Include handleBallLost and resetGame in dependencies

  const checkBrickCollisions = () => {
    for (let c = 0; c < BRICK_COLS; c++) {
      for (let r = 0; r < BRICK_ROWS; r++) {
        const brick = bricks.current[c][r];
        if (brick.status === 1) {
          const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_TOP;
          const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

          if (
            ball.current.x > brickX &&
            ball.current.x < brickX + BRICK_WIDTH &&
            ball.current.y > brickY &&
            ball.current.y < brickY + BRICK_HEIGHT
          ) {
            ball.current.dy = -ball.current.dy;
            brick.status = 0;
            setScore((s) => s + 100);
          }
        }
      }
    }
  };

  const resetBall = () => {
    ball.current = { x: 300, y: 400, dx: 4, dy: -4, radius: 8 };
  };

  const drawBall = (ctx) => {
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.closePath();
  };

  const drawPaddle = (ctx) => {
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(paddle.current.x, 600 - paddle.current.height, paddle.current.width, paddle.current.height);
  };

  const drawBricks = (ctx) => {
    bricks.current.forEach((column, c) => {
      column.forEach((brick, r) => {
        if (brick.status === 1) {
          const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_TOP;
          const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
          ctx.fillStyle = '#4444ff';
          ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
        }
      });
    });
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div>Score: {score}</div>
        <div>Lives: {lives}</div>
      </div>
      <canvas
        ref={canvasRef}
        width="600"
        height="600"
        className="game-canvas"
      />
      {isGameOver && (
        <div className="game-overlay">
          <h2>GAME OVER</h2>
          <p>Press Space to restart</p>
        </div>
      )}
      {!isPlaying && !isGameOver && (
        <div className="game-overlay">
          <h2>BRICK BREAKER</h2>
          <p>Press Space to start</p>
          <p>Use arrow keys to move</p>
        </div>
      )}
    </div>
  );
};

export default BrickBreaker;
