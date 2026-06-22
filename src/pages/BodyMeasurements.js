import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator, faDownload } from "@fortawesome/free-solid-svg-icons";
import brandStyles from "../styles";
import { Helmet } from 'react-helmet-async';
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

function BodyMeasurements() {
  const [profileName, setProfileName] = useState("");
  const [measurements, setMeasurements] = useState({
    chest: "",
    waist: "",
    hips: "",
    inseam: "",
    shoulders: "",
    sleeve: "",
    neck: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeasurements((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToJPG = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 600;
    canvas.height = 700;

    ctx.fillStyle = brandStyles.bgSurface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = brandStyles.brandColor;
    ctx.fillRect(0, 0, canvas.width, 15);

    ctx.fillStyle = brandStyles.textPrimary;
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Created at MidwestCosplay.Club", 40, 65);

    ctx.fillStyle = brandStyles.textSecondary;
    ctx.font = "italic 18px sans-serif";
    const targetName = profileName.trim() || "Primary Profile";
    ctx.fillText(`Profile: ${targetName}`, 40, 100);

    ctx.strokeStyle = brandStyles.textMuted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 130);
    ctx.lineTo(560, 130);
    ctx.stroke();

    const items = [
      { label: "Chest / Bust",    val: measurements.chest },
      { label: "Waist",           val: measurements.waist },
      { label: "Hips",            val: measurements.hips },
      { label: "Shoulder Width",  val: measurements.shoulders },
      { label: "Sleeve Length",   val: measurements.sleeve },
      { label: "Inseam",          val: measurements.inseam },
      { label: "Neck",            val: measurements.neck }
    ];

    let currentYPosition = 180;

    items.forEach((item) => {
      ctx.fillStyle = brandStyles.bgElevated;
      ctx.fillRect(40, currentYPosition - 25, 520, 45);

      ctx.fillStyle = brandStyles.textSecondary;
      ctx.font = "600 16px sans-serif";
      ctx.fillText(item.label, 60, currentYPosition);

      ctx.fillStyle = brandStyles.brandColor;
      ctx.font = "bold 18px sans-serif";
      const displayValue = item.val.trim() || "Not Recorded";
      ctx.fillText(displayValue, 460, currentYPosition);

      currentYPosition += 65;
    });

    const imageURI = canvas.toDataURL("image/jpeg", 0.95);
    const downloadAnchor = document.createElement("a");
    const safeFileName = targetName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    downloadAnchor.href = imageURI;
    downloadAnchor.download = `${safeFileName}-measurements.jpg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Body Measurements</title>
        <meta name="description" content="Cosplay Sizing & Body Measurement Tool" />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            <FontAwesomeIcon icon={faCalculator} className="header-icon-margin" />
            Body Dimensions
          </h1>
        </div>

        <form className="theme-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group name-field-container">
            <label htmlFor="profileName">Profile / Character Name</label>
            <input
              type="text"
              id="profileName"
              className="theme-input"
              placeholder="e.g., My Primary Profile, Link, Samus"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>

          <div className="measurements-input-grid">
            <div className="form-group">
              <label htmlFor="chest">Chest / Bust</label>
              <input type="text" id="chest" name="chest" className="theme-input" placeholder='e.g., 42"' value={measurements.chest} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="waist">Waist</label>
              <input type="text" id="waist" name="waist" className="theme-input" placeholder='e.g., 36"' value={measurements.waist} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="hips">Hips</label>
              <input type="text" id="hips" name="hips" className="theme-input" placeholder='e.g., 44"' value={measurements.hips} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="shoulders">Shoulder Width</label>
              <input type="text" id="shoulders" name="shoulders" className="theme-input" placeholder='e.g., 18"' value={measurements.shoulders} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="sleeve">Sleeve Length</label>
              <input type="text" id="sleeve" name="sleeve" className="theme-input" placeholder='e.g., 25"' value={measurements.sleeve} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="inseam">Inseam</label>
              <input type="text" id="inseam" name="inseam" className="theme-input" placeholder='e.g., 32"' value={measurements.inseam} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-group single-column-row">
            <label htmlFor="neck">Neck</label>
            <input type="text" id="neck" name="neck" className="theme-input" placeholder='e.g., 16.5"' value={measurements.neck} onChange={handleInputChange} />
          </div>

          <div className="form-actions-wrapper">
            <button
              type="button"
              className="view-profile-btn export-action-btn"
              onClick={exportToJPG}
            >
              <FontAwesomeIcon icon={faDownload} className="btn-icon-spacing" />
              Export Dimensions
            </button>
          </div>
        </form>

        <Footer />
      </div>
    </div>
  );
}

export default BodyMeasurements;