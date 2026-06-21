import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpandArrowsAlt, faCalculator } from "@fortawesome/free-solid-svg-icons";

function ScaleCalculator() {
  const [values, setValues] = useState({
    original: "",
    factor: "",
    target: ""
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

    const origNum = parseFloat(values.original);
    const factNum = parseFloat(values.factor);
    const targNum = parseFloat(values.target);

    // Track which fields have valid numerical inputs
    const hasOrig = !isNaN(origNum);
    const hasFact = !isNaN(factNum);
    const hasTarg = !isNaN(targNum);

    let updatedValues = { ...values };

    // Case 1: Solve for Target Size (Original * Factor)
    if (hasOrig && hasFact && !hasTarg) {
      updatedValues.target = (origNum * factNum).toFixed(4).replace(/\.?0+$/, "");
    } 
    // Case 2: Solve for Scale Factor (Target / Original)
    else if (hasOrig && hasTarg && !hasFact) {
      updatedValues.factor = (targNum / origNum).toFixed(4).replace(/\.?0+$/, "");
    } 
    // Case 3: Solve for Original Size (Target / Factor)
    else if (hasTarg && hasFact && !hasOrig) {
      updatedValues.original = (targNum / factNum).toFixed(4).replace(/\.?0+$/, "");
    }
    // Case 4: Overdetermined (All 3 filled) -> Recalculate Factor by default based on dimensions
    else if (hasOrig && hasTarg && hasFact) {
      updatedValues.factor = (targNum / origNum).toFixed(4).replace(/\.?0+$/, "");
    }

    setValues(updatedValues);
  };

  return (
    <div className="theme-card calculator-card">
      <h2>
        <FontAwesomeIcon icon={faExpandArrowsAlt} className="header-icon-margin" />
        Scale Factor Solver
      </h2>
      <p className="calculator-instructions">
        Fill in any <strong>two</strong> fields and click calculate to compute the missing dimension.
      </p>

      <form className="theme-form" onSubmit={handleCalculate}>
        <div className="scale-inputs-grid">
          
          <div className="form-group">
            <label htmlFor="original">Original Size</label>
            <input
              type="number"
              id="original"
              name="original"
              step="any"
              className="theme-input"
              placeholder="e.g., 20"
              value={values.original}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="factor">Scale Factor (Multiplier)</label>
            <input
              type="number"
              id="factor"
              name="factor"
              step="any"
              className="theme-input"
              placeholder="e.g., 2.25"
              value={values.factor}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="target">Target Size</label>
            <input
              type="number"
              id="target"
              name="target"
              step="any"
              className="theme-input"
              placeholder="e.g., 45"
              value={values.target}
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

export default ScaleCalculator;