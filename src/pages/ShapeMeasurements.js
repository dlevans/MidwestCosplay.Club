import React from "react";
// Adjust the relative path depending on your project folder nesting structure
import ScaleCalculator from "./ScaleCalculator";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

function ShapeMeasurements() {
  return (

    <div className="page-home">
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1>Shape Tools & Calculators ✦</h1>
        <p className="subtitle">Geometric utilities for patterning, resizing, and material planning.</p>
        </div>
        
        <ScaleCalculator />

      <Footer />
      </div>
    </div>
  );
}

export default ShapeMeasurements;