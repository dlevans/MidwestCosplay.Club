import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from 'react-helmet-async';

// Color data structure mapping colors to values, multipliers, and tolerances
const COLOR_CODES = {
  black:  { label: 'Black',  value: 0, multiplier: 1,          tolerance: null },
  brown:  { label: 'Brown',  value: 1, multiplier: 10,         tolerance: 1 },
  red:    { label: 'Red',    value: 2, multiplier: 100,        tolerance: 2 },
  orange: { label: 'Orange', value: 3, multiplier: 1000,       tolerance: null },
  yellow: { label: 'Yellow', value: 4, multiplier: 10000,      tolerance: null },
  green:  { label: 'Green',  value: 5, multiplier: 100000,     tolerance: 0.5 },
  blue:   { label: 'Blue',   value: 6, multiplier: 1000000,    tolerance: 0.25 },
  violet: { label: 'Violet', value: 7, multiplier: 10000000,   tolerance: 0.1 },
  grey:   { label: 'Grey',   value: 8, multiplier: 100000000,  tolerance: 0.05 },
  white:  { label: 'White',  value: 9, multiplier: 1000000000, tolerance: null },
  gold:   { label: 'Gold',   value: null, multiplier: 0.1,     tolerance: 5 },
  silver: { label: 'Silver', value: null, multiplier: 0.01,    tolerance: 10 },
};

export default function ResistorCalculator() {
  const [bandCount, setBandCount] = useState(4); // 4 or 5 band mode
  
  // State for each band's selected color
  const [band1, setBand1] = useState('brown');
  const [band2, setBand2] = useState('black');
  const [band3, setBand3] = useState('black'); // Used as Multiplier in 4-band, or 3rd Digit in 5-band
  const [band4, setBand4] = useState('red');   // Used as Tolerance in 4-band, or Multiplier in 5-band
  const [band5, setBand5] = useState('gold');  // Used only in 5-band as Tolerance

  const [result, setResult] = useState({ resistance: '', tolerance: '' });

  useEffect(() => {
    calculateResistance();
  }, [bandCount, band1, band2, band3, band4, band5]);

  const calculateResistance = () => {
    let digits = '';
    let multiplier = 1;
    let tolerance = null;

    if (bandCount === 4) {
      // 4-Band: Digit 1, Digit 2, Multiplier, Tolerance
      digits = `${COLOR_CODES[band1].value}${COLOR_CODES[band2].value}`;
      multiplier = COLOR_CODES[band3].multiplier;
      tolerance = COLOR_CODES[band4].tolerance;
    } else {
      // 5-Band: Digit 1, Digit 2, Digit 3, Multiplier, Tolerance
      digits = `${COLOR_CODES[band1].value}${COLOR_CODES[band2].value}${COLOR_CODES[band3].value}`;
      multiplier = COLOR_CODES[band4].multiplier;
      tolerance = COLOR_CODES[band5].tolerance;
    }

    const rawResistance = parseInt(digits, 10) * multiplier;
    
    // Format the final value for readability (ohms, kΩ, MΩ)
    let formattedResistance = `${rawResistance} Ω`;
    if (rawResistance >= 1000000) {
      formattedResistance = `${(rawResistance / 1000000).toFixed(2).replace(/\.00$/, '')} MΩ`;
    } else if (rawResistance >= 1000) {
      formattedResistance = `${(rawResistance / 1000).toFixed(2).replace(/\.00$/, '')} kΩ`;
    }

    setResult({
      resistance: formattedResistance,
      tolerance: tolerance !== null ? `±${tolerance}%` : 'None',
    });
  };

  // Filter color options based on context requirement
  const getOptions = (type) => {
    return Object.keys(COLOR_CODES).filter((color) => {
      if (type === 'digit') return COLOR_CODES[color].value !== null;
      if (type === 'multiplier') return COLOR_CODES[color].multiplier !== null;
      if (type === 'tolerance') return COLOR_CODES[color].tolerance !== null;
      return true;
    });
  };

  return (
    <div className="theme-card calculator-card">
      <Helmet>
        <title data-rh="true">Resistor Calculator</title>
        <meta name="description" content="Electronic measuring page for calculating resistor values by color." />
      </Helmet>
      <h2>
              <FontAwesomeIcon icon={faBolt} className="header-icon-margin" />
              Resistor Color Code Calculator
            </h2>
      
      {/* Mode Selector */}
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setBandCount(4)} disabled={bandCount === 4} style={btnStyle}>4-Band</button>
        <button onClick={() => setBandCount(5)} disabled={bandCount === 5} style={btnStyle}>5-Band</button>
      </div>

      {/* Select Dropdowns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>
          Band 1 (1st Digit): 
          <select value={band1} onChange={(e) => setBand1(e.target.value)} style={selectStyle}>
            {getOptions('digit').map(c => <option key={c} value={c}>{COLOR_CODES[c].label}</option>)}
          </select>
        </label>

        <label>
          Band 2 (2nd Digit): 
          <select value={band2} onChange={(e) => setBand2(e.target.value)} style={selectStyle}>
            {getOptions('digit').map(c => <option key={c} value={c}>{COLOR_CODES[c].label}</option>)}
          </select>
        </label>

        {bandCount === 5 && (
          <label>
            Band 3 (3rd Digit): 
            <select value={band3} onChange={(e) => setBand3(e.target.value)} style={selectStyle}>
              {getOptions('digit').map(c => <option key={c} value={c}>{COLOR_CODES[c].label}</option>)}
            </select>
          </label>
        )}

        <label>
          {bandCount === 4 ? 'Band 3 (Multiplier):' : 'Band 4 (Multiplier):'}
          <select 
            value={bandCount === 4 ? band3 : band4} 
            onChange={(e) => bandCount === 4 ? setBand3(e.target.value) : setBand4(e.target.value)}
            style={selectStyle}
          >
            {getOptions('multiplier').map(c => <option key={c} value={c}>{COLOR_CODES[c].label}</option>)}
          </select>
        </label>

        <label>
          {bandCount === 4 ? 'Band 4 (Tolerance):' : 'Band 5 (Tolerance):'}
          <select 
            value={bandCount === 4 ? band4 : band5} 
            onChange={(e) => bandCount === 4 ? setBand4(e.target.value) : setBand5(e.target.value)}
            style={selectStyle}
          >
            {getOptions('tolerance').map(c => <option key={c} value={c}>{COLOR_CODES[c].label}</option>)}
          </select>
        </label>
      </div>

      {/* Display Results */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#1e1425', borderRadius: '5px', textAlign: 'center' }}>
        <h3>Resistance: {result.resistance}</h3>
        <h4>Tolerance: {result.tolerance}</h4>
      </div>
    </div>
  );
}

const btnStyle = { padding: '8px 16px', marginRight: '10px', cursor: 'pointer' };
const selectStyle = { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px' };