import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";
import "./FabricMap.css";

const RESOURCE_LINKS = [
  {
    label: "Open Full Map",
    href: "https://www.google.com/maps/d/viewer?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q",
    icon: "🗺️",
    description: "View in Google Maps with directions",
  },
];

const MAP_EMBED_SRC =
  "https://www.google.com/maps/d/embed?mid=1_WkygXJTNwi0z-wwOTPK7Dbsfs1dG-Q&ll=39.09762590652763,-94.80579350000001&z=10";

const FabricMap = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

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
              src={MAP_EMBED_SRC}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="map-card-footer">
            {RESOURCE_LINKS.map(({ label, href, icon, description }) => (
              <a
                key={label}
                href={href}
                className="map-resource-btn"
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <span className="map-resource-icon" aria-hidden="true">{icon}</span>
                <span className="map-resource-text">
                  <span className="map-resource-label">{label}</span>
                  <span className="map-resource-desc">{description}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FabricMap;