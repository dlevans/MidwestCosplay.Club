import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import BrickBreakerGame from "../games/BrickBreakerGame";
import EnchantedBackground from "./Enchantedbackground";

/**
 * Submits a final score to the leaderboard API.
 * Call this from BrickBreakerGame when the game ends.
 *
 * @param {number} score - The player's final score
 */
const useScoreSubmit = (game) => {
  const submitScore = useCallback(async (score) => {
    const token = localStorage.getItem("token");
    if (!token || typeof score !== "number") return;

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game, score }),
      });
      if (!res.ok) {
        console.error("Score submission failed:", res.status);
      }
    } catch (err) {
      console.error("Score submission error:", err);
    }
  }, [game]);

  return submitScore;
};

const BrickBreaker = () => {
  const navigate = useNavigate();
  const submitScore = useScoreSubmit("brickbreaker");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Brick Breaker — MidwestCosplay Club</title>
        <meta name="description" content="Brick Breaker game for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Brick Breaker</h1>
        </div>

        {/*
          Pass `onGameOver` to BrickBreakerGame so it can call submitScore
          when the game ends. Wire it inside BrickBreakerGame like:
            props.onGameOver(finalScore)
        */}
        <BrickBreakerGame onGameOver={submitScore} />
      </div>

      <Footer />
    </div>
  );
};

export default BrickBreaker;