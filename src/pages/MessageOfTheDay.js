import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const MOTD = () => {
  console.log("MessageOfTheDay.js");
  const navigate = useNavigate();

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
        <title data-rh="true">Message Of The Day</title>
        <meta name="description" content="Message of the day." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            MCC's
            <span className="home-headline-accent">Message Of The Day</span>
          </h1>
          <br />
          <br />
          <br />
        </div>
        <div className="home-member-welcome">
          <p className="home-member-copy">
            <strong>Help me. Help you. </strong>
            Tell me what you'd like added or updated.
          </p>
        </div>

        <div
          style={{
            border: "1px solid #7b4fa6",
            borderRadius: "10px",
            padding: "1rem",
            margin: "1.5rem 0",
            maxWidth: "500px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>🎯 Planet Anime Scavenger Hunt</h3>
          <p style={{ fontSize: "0.92rem" }}>
            Complete tasks around Planet Anime in Kansas City for a chance to
            win. Your progress saves as you go, so you can pick up right
            where you left off on any device.
          </p>
          <Link to="/scavengerhunt">
            <button type="button">Start the hunt</button>
          </Link>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default MOTD;