import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";
import "./FabricMap.css";

const BASE_EMBED_SRC =
  "https://www.google.com/maps/d/embed?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q";

const DEFAULT_LL = "39.09762590652763,-94.80579350000001";
const DEFAULT_Z = 10;

const FabricMap = () => {
  const navigate = useNavigate();
  const [locationState, setLocationState] = useState("idle"); // idle | requesting | granted | denied | unavailable
  const [embedSrc, setEmbedSrc] = useState(
    `${BASE_EMBED_SRC}&ll=${DEFAULT_LL}&z=${DEFAULT_Z}`
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      return;
    }

    setLocationState("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationState("granted");
        // Re-center the embed on the user, zoom in a bit
        setEmbedSrc(
          `${BASE_EMBED_SRC}&ll=${latitude},${longitude}&z=12`
        );
      },
      () => {
        setLocationState("denied");
      },
      { timeout: 10000 }
    );
  }, []);

  const handleDirections = useCallback(() => {
    if (!navigator.geolocation) {
      // Fall back to just opening the map
      window.open(
        "https://www.google.com/maps/d/viewer?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q",
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Opens Google Maps from the user's location to the map area
        const url = `https://www.google.com/maps/dir/${latitude},${longitude}/Kansas+City,+MO`;
        window.open(url, "_blank", "noopener,noreferrer");
      },
      () => {
        // Permission denied — open map without directions
        window.open(
          "https://www.google.com/maps/d/viewer?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q",
          "_blank",
          "noopener,noreferrer"
        );
      },
      { timeout: 10000 }
    );
  }, []);

  const locationLabel = {
    idle: "📍 Center map on me",
    requesting: "Finding your location…",
    granted: "✅ Map centered on you",
    denied: "Location denied",
    unavailable: "Location unavailable",
  }[locationState];

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club — Fabric &amp; Craft Stores</title>
        <meta
          name="description"
          content="Find fabric, beads, sewing supplies, and crafting stores across Kansas City and the surrounding region."
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content fabric-hub">
        <header className="games-header">
          <p className="games-eyebrow">Guild Resources</p>
          <h1 className="games-headline">Fabric &amp; Craft Stores</h1>
          <p className="games-subhead">
            Local spots for fabric, beads, sewing classes, and cosplay supplies across Kansas and Missouri.
          </p>
        </header>

        <div className="map-card">
          <div className="map-embed-wrapper">
            <iframe
              className="map-embed"
              title="KC Crafting Companies Map"
              src={embedSrc}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="map-card-footer">
            {/* Center map on user */}
            <button
              className={`map-resource-btn ${locationState === "granted" ? "map-resource-btn--success" : ""}`}
              onClick={handleLocateMe}
              disabled={locationState === "requesting" || locationState === "granted"}
            >
              <span className="map-resource-icon" aria-hidden="true">
                {locationState === "requesting" ? "⏳" : locationState === "granted" ? "✅" : "📍"}
              </span>
              <span className="map-resource-text">
                <span className="map-resource-label">{locationLabel}</span>
                <span className="map-resource-desc">Re-centers the map to your area</span>
              </span>
            </button>

            {/* Open full map */}
            <a
              href="https://www.google.com/maps/d/viewer?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q"
              className="map-resource-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="map-resource-icon" aria-hidden="true">🗺️</span>
              <span className="map-resource-text">
                <span className="map-resource-label">Open Full Map</span>
                <span className="map-resource-desc">View in Google Maps with directions</span>
              </span>
            </a>

            {/* Directions from current location */}
            <button className="map-resource-btn" onClick={handleDirections}>
              <span className="map-resource-icon" aria-hidden="true">🧭</span>
              <span className="map-resource-text">
                <span className="map-resource-label">Get Directions</span>
                <span className="map-resource-desc">Navigate from your location to KC</span>
              </span>
            </button>
          </div>

          {locationState === "denied" && (
            <p className="map-location-error">
              Location access was denied. Enable it in your browser settings and try again.
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FabricMap;