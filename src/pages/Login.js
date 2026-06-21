import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    try {
      const response = await axios.post(apiUrl + "/login", { username: trimmedUsername, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
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

          {errorMessage && (
            <p style={{ color: "var(--accent)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
              {errorMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <button type="submit">Log in</button>          
          </div>
        </form>

        <Footer />
      </div>
    </div>
  );
};

export default Login;