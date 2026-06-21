import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faCalculator } from "@fortawesome/free-solid-svg-icons";

function ResistanceCalculator() {
  const [values, setValues] = useState({
    voltage: "",
    current: "",
    resistance: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    const vNum = parseFloat(values.voltage);
    const iNum = parseFloat(values.current);
    const rNum = parseFloat(values.resistance);

    const hasVoltage = !isNaN(vNum);
    const hasCurrent = !isNaN(iNum);
    const hasResistance = !isNaN(rNum);

    let updatedValues = { ...values };

    // Case 1: Solve for Voltage (V = I * R)
    if (hasCurrent && hasResistance && !hasVoltage) {
      updatedValues.voltage = (iNum * rNum).toFixed(4).replace(/\.?0+$/, "");
    }
    // Case 2: Solve for Current (I = V / R)
    if (hasVoltage && hasResistance && !hasCurrent) {
      if (rNum === 0) {
        alert("Resistance cannot be zero when calculating current.");
        return;
      }
      updatedValues.current = (vNum / rNum).toFixed(4).replace(/\.?0+$/, "");
    }
    // Case 3: Solve for Resistance (R = V / I)
    if (hasVoltage && hasCurrent && !hasResistance) {
      if (iNum === 0) {
        alert("Current cannot be zero when calculating resistance.");
        return;
      }
      updatedValues.resistance = (vNum / iNum).toFixed(4).replace(/\.?0+$/, "");
    }
    // Case 4: Overdetermined (All 3 filled) -> Recalculate Resistance by default
    if (hasVoltage && hasCurrent && hasResistance) {
      if (iNum === 0) return;
      updatedValues.resistance = (vNum / iNum).toFixed(4).replace(/\.?0+$/, "");
    }

    setValues(updatedValues);
  };

  return (
    <div className="theme-card calculator-card">
      <h2>
        <FontAwesomeIcon icon={faBolt} className="header-icon-margin" />
        Ohm's Law Solver
      </h2>
      <p className="calculator-instructions">
        Enter any <strong>two</strong> electrical properties to calculate the remaining variable.
      </p>

      <form className="theme-form" onSubmit={handleCalculate}>
        <div className="scale-inputs-grid">
          
          <div className="form-group">
            <label htmlFor="voltage">Voltage (V)</label>
            <input
              type="number"
              id="voltage"
              name="voltage"
              step="any"
              className="theme-input"
              placeholder="e.g., 5"
              value={values.voltage}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="current">Current (Amps / I)</label>
            <input
              type="number"
              id="current"
              name="current"
              step="any"
              className="theme-input"
              placeholder="e.g., 0.02"
              value={values.current}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="resistance">Resistance (Ohms / R)</label>
            <input
              type="number"
              id="resistance"
              name="resistance"
              step="any"
              className="theme-input"
              placeholder="e.g., 220"
              value={values.resistance}
              onChange={handleInputChange}
            />
          </div>

        </div>

        <div className="form-actions-wrapper">
          <button type="submit" className="view-profile-btn calculate-action-btn">
            <FontAwesomeIcon icon={faCalculator} className="btn-icon-spacing" />
            Calculate
          </button>
        </div>
      </form>
    </div>
  );
}

export default ResistanceCalculator;