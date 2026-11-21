import React from "react";
import ResistanceCalculator from "./ResistanceCalculator";
import ResistorCalculator from "./ResistorCalculator";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

function ElectricalMeasurements() {
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Cosplay Electronics Calculators — Midwest Cosplay Club</title>
        <meta name="description" content="Resistor color code and resistance calculators for wiring LEDs and electronics in cosplay props and armor." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1>Electrical Utilities ✦</h1>
        <p className="subtitle">Calculators for wiring configurations, microcontrollers, and LED systems.</p>
        </div>

      <div className="dashboard-grid">
        {/* Render your pure Ohm's Law block */}
        <ResistanceCalculator />
        <ResistorCalculator />
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default ElectricalMeasurements;