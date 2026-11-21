import React from "react";
// Adjust the relative path depending on your project folder nesting structure
import ScaleCalculator from "./ScaleCalculator";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

function ShapeMeasurements() {
  return (

    <div className="page-home">
      <Helmet>
        <title data-rh="true">Shape &amp; Area Calculator for Cosplay — Midwest Cosplay Club</title>
        <meta name="description" content="Calculate area, perimeter, and material needs for circles, rectangles, and other shapes when planning cosplay builds." />
      </Helmet>
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