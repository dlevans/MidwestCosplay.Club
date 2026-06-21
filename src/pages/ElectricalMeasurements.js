import React from "react";
import ResistanceCalculator from "./ResistanceCalculator";
import ResistorCalculator from "./ResistorCalculator";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

function ElectricalMeasurements() {
  return (
    <div className="page-home">
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