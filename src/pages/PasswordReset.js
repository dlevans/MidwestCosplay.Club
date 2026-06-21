import React, { useState, useEffect } from "react";

const PasswordReset = () => {
  console.log("PasswordReset.js");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true); // To track token validity

  // Extract the reset token from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token");

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Check token validity (make an API request to verify the token)
    const verifyToken = async () => {
      try {
        const response = await fetch(apiUrl + `/resetpassword/verify-reset-token?token=${resetToken}`);
        const data = await response.json();

        if (data.error) {
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setError("There was an error verifying your token.");
      }
    };

    if (resetToken) {
      verifyToken();
    }
  }, [resetToken]);

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()\-=+_%])[A-Za-z\d!@#$%^&*()\-=+_%]{8,}$/;
    return passwordRegex.test(password);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long, contain at least one number, and one special character (?=.*[!@#$%^&*()\-=+_%]).");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill out both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(apiUrl + `/resetpassword/token/${resetToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError("Error resetting password.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred. Please try again.");
    }
  };

  if (!tokenValid) {
    return <div>The reset link is invalid or has expired.</div>;
  }

  return (
    <div className="page">
      <h1>Reset Your Password</h1>
      {success ? (
        <div>Your password has been reset successfully!</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div style={{ color: "red" }}>{error}</div>}

          <button type="submit">Reset Password</button>
        </form>
      )}
    </div>
  );
};

export default PasswordReset;
