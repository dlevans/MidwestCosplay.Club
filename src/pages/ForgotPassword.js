import React, { useState } from "react";
import Footer from "../Footer";

const ForgotPassword = () => {
  console.log("ForgotPassword.js");

  const [username, setUsername] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter your username.");
      return;
    }

    try {
      const response = await fetch(apiUrl +`/resetpassword/${username}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        alert("If this account exists, you will receive a password reset email.");
      } else {
        alert("Error processing request.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="page">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <p>
            This website is in BETA. There will be dragons.
            Things may not work from day to day or even hour to hour.
          </p>
        </div>

        <button type="submit">Reset Password</button>
      </form>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
