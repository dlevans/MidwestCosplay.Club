import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = process.env.REACT_APP_API_URL;

  // If reached via an NFC tag / QR code like /login?eventid=858, mark the
  // logging-in user as having attended that event once login succeeds.
  const eventId = (() => {
    const raw = new URLSearchParams(location.search).get("eventid");
    const parsed = parseInt(raw, 10);
    return Number.isInteger(parsed) ? parsed : null;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    try {
      const response = await axios.post(apiUrl + "/login", { username: trimmedUsername, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("id", response.data.id);

      if (eventId) {
        try {
          await axios.post(
            `${apiUrl}/events/${eventId}/members`,
            { userid: response.data.id },
            { headers: { Authorization: `Bearer ${response.data.token}` } }
          );
        } catch (attendanceErr) {
          console.error("Could not auto-mark event attendance:", attendanceErr);
        }
      }

      navigate("/motd");
    } catch (err) {
      console.error("Error: ", err);
      setErrorMessage("Invalid username or password.");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgotpassword");
  };

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Login</title>
        <meta name="description" content="Login page for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Sign in</h1>
        </div>
        <p style={{ marginBottom: "1.5rem" }}>
          Welcome back — log in to access the community.
        </p>

        <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            This site is in BETA — things may shift from day to day. Thanks for your patience!
          </p>

          {eventId && (
            <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              You'll automatically be marked as an attendee for this event after you log in.
            </p>
          )}

          {errorMessage && (
            <p style={{ color: "var(--accent)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
              {errorMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <button type="submit">Log in</button>          
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <Link to={eventId ? `/createuser?eventid=${eventId}` : "/createuser"}>
            Sign up
          </Link>
        </p>

        <Footer />
      </div>
    </div>
  );
};

export default Login;