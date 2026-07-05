import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";
import "./Games.css";

const GAMES = [
  {
    key: "snake",
    label: "Snake",
    path: "/snake",
    description: "Classic snake — eat, grow, survive.",
    icon: "🐍",
  },
  {
    key: "brickbreaker",
    label: "Brick Breaker",
    path: "/brickbreaker",
    description: "Break every brick. Don't drop the ball.",
    icon: "🧱",
  },
  { key: "memory", 
    label: "Memory Match", 
    path: "/memory", 
    description: "Find every pair. How few moves can you take?", 
    icon: "🃏" 
  },
  { key: "hacking", 
    label: "Hacking Game", 
    path: "/hackinggame", 
    description: "Hack the terminal.", 
    icon: "💻" 
  },
];

const LeaderboardTable = ({ game, scores, loading, error }) => {
  if (loading) {
    return (
      <div className="lb-state">
        <span className="lb-state-text">Loading scores…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="lb-state">
        <span className="lb-state-text lb-state-error">Couldn't load scores.</span>
      </div>
    );
  }
  if (!scores || scores.length === 0) {
    return (
      <div className="lb-state">
        <span className="lb-state-text">No scores yet — be the first!</span>
      </div>
    );
  }

  return (
    <ol className="lb-list">
      {scores.map((entry, i) => (
        <li key={entry.id || i} className={`lb-row ${i === 0 ? "lb-row--gold" : i === 1 ? "lb-row--silver" : i === 2 ? "lb-row--bronze" : ""}`}>
          <span className="lb-rank">{i + 1}</span>
          <span className="lb-username">{entry.username}</span>
          <span className="lb-score">{entry.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
};

const Games = () => {
  const navigate = useNavigate();
  const [leaderboards, setLeaderboards] = useState({ snake: [], brickbreaker: [] });
  const [loading, setLoading] = useState({ snake: true, brickbreaker: true });
  const [errors, setErrors] = useState({ snake: null, brickbreaker: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchLeaderboard = async (game) => {
      try {
        const res = await fetch(`https://midwestcosplayclubapi-1.onrender.com/api/scores/top?game=${game}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setLeaderboards((prev) => ({ ...prev, [game]: data }));
      } catch (err) {
        setErrors((prev) => ({ ...prev, [game]: err.message }));
      } finally {
        setLoading((prev) => ({ ...prev, [game]: false }));
      }
    };

    GAMES.forEach(({ key }) => fetchLeaderboard(key));
  }, [navigate]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club — Games</title>
        <meta name="description" content="Arcade games and leaderboards for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content games-hub">
        <header className="games-header">
          <p className="games-eyebrow">Club Arcade</p>
          <h1 className="games-headline">Games</h1>
          <p className="games-subhead">Challenge the guild. Claim the top spot.</p>
        </header>

        <div className="games-grid">
          {GAMES.map(({ key, label, path, description, icon }) => (
            <div key={key} className="game-card">
              <div className="game-card-top">
                <span className="game-icon" aria-hidden="true">{icon}</span>
                <div>
                  <h2 className="game-title">{label}</h2>
                  <p className="game-desc">{description}</p>
                </div>
              </div>

              <Link to={path} className="game-play-btn">
                Play {label}
              </Link>

              <div className="leaderboard">
                <h3 className="lb-heading">Top 10</h3>
                <LeaderboardTable
                  game={key}
                  scores={leaderboards[key]}
                  loading={loading[key]}
                  error={errors[key]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Games;