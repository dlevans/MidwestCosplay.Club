import React from "react";
import ReactDOM from "react-dom/client"; // Updated import for ReactDOM
import App from "./App";
import './index.css';
// Using BrowserRouter since it provides clean URLs (no hashes in URLs)
import { BrowserRouter as Router } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

// Create the root
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <Router>
      <App />
    </Router>
  </ErrorBoundary>
);
