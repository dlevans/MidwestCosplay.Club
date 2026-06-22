import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTape, faDraftingCompass, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

function MeasurementsIndex() {
  const categories = [
    {
      id: "body",
      title: "Body Measurements",
      description: "Manage sizing profiles, height scales, and tailored dimensions.",
      path: "/bodymeasurements",
      icon: faTape,
    },
    {
      id: "props",
      title: "Shape Calculators",
      description: "Calculate dimensions, areas, and segment lengths for geometric foam props.",
      path: "/shapemeasurements",
      icon: faDraftingCompass,
    },
    {
      id: "electronics",
      title: "LED & Electronics",
      description: "Determine power requirements, wiring schemas, and resistors for custom lit builds.",
      path: "/electricalmeasurements",
      icon: faLightbulb,
    }
  ];

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Measurments</title>
        <meta name="description" content="Measurements landing page for Midwest Cosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Measurements ✦</h1>
        </div>

      {/* Reuses your established grid container layout */}
      <div className="user-container">
        {categories.map((card) => (
          <div className="user-card utility-card" key={card.id}>
            
            {/* Semantic icon container classes targeting index.css styles */}
            <div className="card-icon-avatar">
              <FontAwesomeIcon icon={card.icon} className="card-icon-glyph" />
            </div>

            <h3 className="card-title-text">{card.title}</h3>
            <p className="card-description-text">{card.description}</p>

            <Link to={card.path} className="card-action-link">
              <button className="view-profile-btn card-fullwidth-btn">
                Open Tool
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
        <Footer />
    </div>
  );
}

export default MeasurementsIndex;