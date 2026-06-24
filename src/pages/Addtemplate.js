import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
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
  "Armor & Chest Pieces",
  "Helmets & Headgear",
  "Capes & Cloaks",
  "Sewing Patterns",
  "Wigs & Horns",
  "Wings",
  "Props & Weapons",
  "Shoes & Footwear",
  "Accessories & Jewelry",
  "Full Costume",
  "General / Other",
];

// Same platform map as Templates.js — live badge on URL input
const detectPlatform = (url, setter) => {
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platformMap = {
      "etsy.com":           { label: "Etsy",         color: "#F56400", icon: "https://www.etsy.com/favicon.ico" },
      "patreon.com":        { label: "Patreon",       color: "#FF424D", icon: "https://www.patreon.com/favicon.ico" },
      "gumroad.com":        { label: "Gumroad",       color: "#FF90E8", icon: "https://gumroad.com/favicon.ico" },
      "ko-fi.com":          { label: "Ko-fi",         color: "#29ABE0", icon: "https://ko-fi.com/favicon.ico" },
      "sellfy.com":         { label: "Sellfy",        color: "#21C45D", icon: "https://sellfy.com/favicon.ico" },
      "redbubble.com":      { label: "Redbubble",     color: "#E41321", icon: "https://www.redbubble.com/favicon.ico" },
      "instructables.com":  { label: "Instructables", color: "#F4A227", icon: "https://www.instructables.com/favicon.ico" },
      "deviantart.com":     { label: "DeviantArt",    color: "#05CC47", icon: "https://www.deviantart.com/favicon.ico" },
      "pinterest.com":      { label: "Pinterest",     color: "#E60023", icon: "https://www.pinterest.com/favicon.ico" },
      "drive.google.com":   { label: "Google Drive",  color: "#4285F4", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
      "dropbox.com":        { label: "Dropbox",       color: "#0061FF", icon: "https://www.dropbox.com/favicon.ico" },
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

const AddTemplate = () => {
  const { templateid } = useParams();
  const isEditing = Boolean(templateid);

  const [form, setForm] = useState({
    templatetitle:       "",
    templateurl:         "",
    templatedescription: "",
    templatecategory:    "",
    templateisfree:      true,
  });
  const [urlPreview, setUrlPreview] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const navigate        = useNavigate();
  const token           = localStorage.getItem("token");
  const apiUrl          = process.env.REACT_APP_API_URL;
  const loggedInUserId  = getUserId(token);

  // Redirect guests
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Load existing template when editing
  useEffect(() => {
    if (!isEditing || !token) return;
    const fetchTemplate = async () => {
      try {
        const response = await axios.get(`${apiUrl}/templates/${templateid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const t = response.data.template || response.data;
        setForm({
          templatetitle:       t.templatetitle       || "",
          templateurl:         t.templateurl         || "",
          templatedescription: t.templatedescription || "",
          templatecategory:    t.templatecategory    || "",
          templateisfree:      t.templateisfree      ?? true,
        });
        if (t.templateurl) detectPlatform(t.templateurl, setUrlPreview);
      } catch (err) {
        console.error(err);
        setError("Could not load template for editing.");
      }
    };
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, templateid, token, apiUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (name === "templateurl") detectPlatform(value, setUrlPreview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.templateurl.trim()) {
      setError("A template URL is required.");
      return;
    }
    if (!form.templatetitle.trim()) {
      setError("Please add a title so others know what this template is for.");
      return;
    }
    try {
      const parsed = new URL(form.templateurl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError("URL must start with http or https.");
        return;
      }
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        templateurl:         form.templateurl.trim(),
        templatetitle:       form.templatetitle.trim().slice(0, 120),
        templatedescription: form.templatedescription.trim().slice(0, 500) || null,
        templatecategory:    form.templatecategory.trim() || null,
        userid:              loggedInUserId,
      };

      if (isEditing) {
        await axios.put(`${apiUrl}/templates/${templateid}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Template updated!");
      } else {
        await axios.post(`${apiUrl}/templates`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Template added! Redirecting…");
        setTimeout(() => navigate("/templates"), 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">
          {isEditing ? "Edit Template" : "Add a Template"} — MidwestCosplay Club
        </title>
        <meta name="description" content="Share a cosplay pattern or template link with the MidwestCosplay Club community." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            {isEditing ? "Edit Template ✦" : "Add a Template ✦"}
          </h1>
          <p className="home-subheadline">
            Share a link to a pattern on Etsy, Patreon, Gumroad, Google Drive, or anywhere else.
          </p>
        </div>

        <div className="manage-form-container">
          {error   && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <form onSubmit={handleSubmit} className="manage-form">

            {/* URL — first so the badge appears immediately */}
            <div className="form-group">
              <label htmlFor="templateurl">Template URL *</label>
              <input
                id="templateurl"
                name="templateurl"
                type="url"
                placeholder="https://www.etsy.com/listing/..."
                value={form.templateurl}
                onChange={handleChange}
                required
              />
              {urlPreview && (
                <div
                  className="tutorial-platform-badge tutorial-platform-badge--form"
                  style={{ borderColor: urlPreview.color }}
                >
                  {urlPreview.icon && (
                    <img
                      src={urlPreview.icon}
                      alt={urlPreview.label}
                      className="tutorial-platform-icon"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <span style={{ color: urlPreview.color }}>{urlPreview.label} detected</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="templatetitle">Title *</label>
              <input
                id="templatetitle"
                name="templatetitle"
                type="text"
                placeholder="e.g. Iron Man Chest Plate PDF Pattern"
                value={form.templatetitle}
                onChange={handleChange}
                required
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="templatedescription">
                Description <span className="form-label-optional">(optional)</span>
              </label>
              <textarea
                id="templatedescription"
                name="templatedescription"
                rows={4}
                placeholder="Briefly describe what this template includes…"
                value={form.templatedescription}
                onChange={handleChange}
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="templatecategory">
                Category <span className="form-label-optional">(optional)</span>
              </label>
              <select
                id="templatecategory"
                name="templatecategory"
                value={form.templatecategory}
                onChange={handleChange}
              >
                <option value="">— Select a category —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Free / Paid toggle */}
            <div className="form-group form-group--inline">
              <label htmlFor="templateisfree" className="form-label-inline">
                <input
                  id="templateisfree"
                  name="templateisfree"
                  type="checkbox"
                  checked={form.templateisfree}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                This template is free
              </label>
            </div>

            <div className="form-actions">
              <button className="button" type="submit" disabled={loading}>
                {loading
                  ? isEditing ? "Saving…" : "Adding…"
                  : isEditing ? "Save Changes" : "Add Template"}
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => navigate("/templates")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default AddTemplate;