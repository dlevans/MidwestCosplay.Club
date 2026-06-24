import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";

const getUserId = (token) => {
  try {
    return token ? JSON.parse(atob(token.split(".")[1])).id : null;
  } catch (e) {
    return null;
  }
};

const CATEGORIES = [
  "Armor",
  "Sewing & Fabric",
  "Wigs & Hair",
  "Props & Weapons",
  "Makeup & FX",
  "3D Printing",
  "Foam Crafting",
  "Painting & Finishing",
  "Electronics & LEDs",
  "General Crafting",
  "Other",
];

const detectPlatform = (url, setter) => {
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platformMap = {
      "youtube.com":      { label: "YouTube",      color: "#FF0000", icon: "https://www.youtube.com/favicon.ico" },
      "youtu.be":         { label: "YouTube",      color: "#FF0000", icon: "https://www.youtube.com/favicon.ico" },
      "vimeo.com":        { label: "Vimeo",        color: "#1AB7EA", icon: "https://vimeo.com/favicon.ico" },
      "instructables.com":{ label: "Instructables",color: "#F4A227", icon: "https://www.instructables.com/favicon.ico" },
      "tiktok.com":       { label: "TikTok",       color: "#010101", icon: "https://www.tiktok.com/favicon.ico" },
      "twitch.tv":        { label: "Twitch",       color: "#9146FF", icon: "https://www.twitch.tv/favicon.ico" },
      "patreon.com":      { label: "Patreon",      color: "#FF424D", icon: "https://www.patreon.com/favicon.ico" },
      "skillshare.com":   { label: "Skillshare",   color: "#002333", icon: "https://www.skillshare.com/favicon.ico" },
      "udemy.com":        { label: "Udemy",        color: "#A435F0", icon: "https://www.udemy.com/favicon.ico" },
    };
    setter(
      platformMap[host] || {
        label: host,
        color: "#888",
        icon: `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
      }
    );
  } catch {
    setter(null);
  }
};

const AddTutorial = () => {
  const { tutorialid } = useParams();
  const isEditing = Boolean(tutorialid);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    tutorialtitle:       "",
    tutorialurl:         "",
    tutorialdescription: "",
    tutorialcategory:    "",
  });
  const [urlPreview, setUrlPreview] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  // ── Crop state — identical to CreateUser.js ────────────────────────────────
  const [crop,           setCrop]           = useState({ unit: "px", width: 100, height: 100, x: 20, y: 20, aspect: 1 });
  const [completedCrop,  setCompletedCrop]  = useState(null);
  const [imageSrc,       setImageSrc]       = useState(null);
  const [croppedImageUrl,setCroppedImageUrl]= useState(null);
  const [showCrop,       setShowCrop]       = useState(false);
  const [imageBlob,      setImageBlob]      = useState(null); // the blob sent to the API

  const imageRef  = useRef(null);
  const canvasRef = useRef(null);

  const navigate       = useNavigate();
  const token          = localStorage.getItem("token");
  const apiUrl         = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  // ── Guest redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // ── Load existing tutorial when editing ────────────────────────────────────
  useEffect(() => {
    if (!isEditing || !token) return;
    const fetchTutorial = async () => {
      try {
        const response = await axios.get(`${apiUrl}/tutorials/${tutorialid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const t = response.data.tutorial || response.data;
        setForm({
          tutorialtitle:       t.tutorialtitle       || "",
          tutorialurl:         t.tutorialurl         || "",
          tutorialdescription: t.tutorialdescription || "",
          tutorialcategory:    t.tutorialcategory    || "",
        });
        if (t.tutorialurl) detectPlatform(t.tutorialurl, setUrlPreview);
        // Existing thumbnail shown via t.tutorialimage if present
        if (t.tutorialimage) setCroppedImageUrl(t.tutorialimage);
      } catch (err) {
        console.error(err);
        setError("Could not load tutorial for editing.");
      }
    };
    fetchTutorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, tutorialid, token, apiUrl]);

  // ── Crop helpers — identical logic to CreateUser.js ───────────────────────
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setShowCrop(true);
        setCrop({ unit: "px", width: 100, height: 100, aspect: 1 });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropChange = (newCrop) => {
    if (newCrop.width > 0 && newCrop.height > 0) setCrop(newCrop);
  };

  const onCropComplete = useCallback((c) => {
    if (c.width > 0 && c.height > 0) setCompletedCrop(c);
  }, []);

  // Runs whenever completedCrop changes — draws to canvas and creates blob
  useEffect(() => {
    if (!completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;

    const canvas = canvasRef.current;
    const image  = imageRef.current;
    if (!canvas || !image) return;

    const scaleX = image.naturalWidth  / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx    = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = 1000;
    canvas.height = 1000;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width  * scaleX,
      completedCrop.height * scaleY,
      0, 0, 1000, 1000
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCroppedImageUrl(URL.createObjectURL(blob));
      setImageBlob(blob);
    }, "image/jpeg");
  }, [completedCrop]);

  const handleRecrop = () => {
    setShowCrop(true);
    setCroppedImageUrl(null);
    setImageBlob(null);
  };

  // ── Form field change ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "tutorialurl") detectPlatform(value, setUrlPreview);
  };

  // ── Submit — sends multipart/form-data so the image travels with the fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.tutorialurl.trim()) { setError("A tutorial URL is required."); return; }
    if (!form.tutorialtitle.trim()) { setError("Please add a title so others know what this tutorial covers."); return; }
    try {
      const parsed = new URL(form.tutorialurl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) { setError("URL must start with http or https."); return; }
    } catch { setError("Please enter a valid URL."); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("tutorialtitle",       form.tutorialtitle.trim().slice(0, 120));
      formData.append("tutorialurl",         form.tutorialurl.trim());
      formData.append("tutorialdescription", form.tutorialdescription.trim().slice(0, 500));
      formData.append("tutorialcategory",    form.tutorialcategory.trim());
      formData.append("userid",              loggedInUserId);
      if (imageBlob) formData.append("tutorialimage", imageBlob, "thumbnail.jpg");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      if (isEditing) {
        await axios.put(`${apiUrl}/tutorials/${tutorialid}`, formData, { headers });
        setSuccess("Tutorial updated!");
      } else {
        await axios.post(`${apiUrl}/tutorials`, formData, { headers });
        setSuccess("Tutorial added! Redirecting…");
        setTimeout(() => navigate("/tutorials"), 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">
          {isEditing ? "Edit Tutorial" : "Add a Tutorial"} — MidwestCosplay Club
        </title>
        <meta name="description" content="Share a cosplay tutorial link with the MidwestCosplay Club community." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            {isEditing ? "Edit Tutorial ✦" : "Add a Tutorial ✦"}
          </h1>
          <p className="home-subheadline">
            Share a link to a YouTube video, Vimeo, Instructables page, or any tutorial you love.
          </p>
        </div>

        <div className="manage-form-container">
          {error   && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <form onSubmit={handleSubmit} className="manage-form">

            {/* URL */}
            <div className="form-group">
              <label htmlFor="tutorialurl">Tutorial URL *</label>
              <input
                id="tutorialurl" name="tutorialurl" type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.tutorialurl} onChange={handleChange} required
              />
              {urlPreview && (
                <div className="tutorial-platform-badge tutorial-platform-badge--form" style={{ borderColor: urlPreview.color }}>
                  {urlPreview.icon && (
                    <img src={urlPreview.icon} alt={urlPreview.label} className="tutorial-platform-icon"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  <span style={{ color: urlPreview.color }}>{urlPreview.label} detected</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="tutorialtitle">Title *</label>
              <input
                id="tutorialtitle" name="tutorialtitle" type="text"
                placeholder="e.g. How to Make Foam Armor from Scratch"
                value={form.tutorialtitle} onChange={handleChange} required maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="tutorialdescription">
                Description <span className="form-label-optional">(optional)</span>
              </label>
              <textarea
                id="tutorialdescription" name="tutorialdescription" rows={4}
                placeholder="Briefly describe what this tutorial covers…"
                value={form.tutorialdescription} onChange={handleChange} maxLength={500}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="tutorialcategory">
                Category <span className="form-label-optional">(optional)</span>
              </label>
              <select id="tutorialcategory" name="tutorialcategory" value={form.tutorialcategory} onChange={handleChange}>
                <option value="">— Select a category —</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* ── Thumbnail upload & crop ── */}
            <div className="form-group">
              <label htmlFor="tutorialimage">
                Thumbnail <span className="form-label-optional">(optional)</span>
              </label>
              <input id="tutorialimage" type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            {/* Crop popup — identical structure to CreateUser.js */}
            {imageSrc && showCrop && (
              <div className="crop-popup">
                <div className="popup-overlay" onClick={() => setShowCrop(false)} />
                <div className="crop-container">
                  <ReactCrop crop={crop} onChange={onCropChange} onComplete={onCropComplete} aspect={1}>
                    <img
                      className="cropimg" ref={imageRef} src={imageSrc} alt="Crop preview"
                      style={{ maxWidth: "100%", maxHeight: "80vh" }}
                    />
                  </ReactCrop>
                  <button className="accept-button" type="button" onClick={() => setShowCrop(false)}>
                    Accept Crop
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail preview */}
            {croppedImageUrl && (
              <div className="form-group">
                <p className="form-label-optional" style={{ marginBottom: "0.5rem" }}>Thumbnail preview</p>
                <img
                  src={croppedImageUrl} alt="Thumbnail preview"
                  style={{ width: 200, height: 200, borderRadius: 10, objectFit: "cover", display: "block" }}
                />
                <button type="button" className="button button--secondary" style={{ marginTop: "0.5rem" }} onClick={handleRecrop}>
                  Re-crop
                </button>
              </div>
            )}

            <div className="form-actions">
              <button className="button" type="submit" disabled={loading}>
                {loading ? (isEditing ? "Saving…" : "Adding…") : (isEditing ? "Save Changes" : "Add Tutorial")}
              </button>
              <button className="button button--secondary" type="button" onClick={() => navigate("/tutorials")}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Hidden canvas for crop rendering */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <Footer />
      </div>
    </div>
  );
};

export default AddTutorial;