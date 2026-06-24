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

const AddTutorial = () => {
  const { tutorialid } = useParams(); // present when editing an existing tutorial
  const isEditing = Boolean(tutorialid);

  const [form, setForm] = useState({
    tutorialtitle: "",
    tutorialurl: "",
    tutorialdescription: "",
    tutorialcategory: "",
  });
  const [urlPreview, setUrlPreview] = useState(null); // detected platform
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  // Redirect guests
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Load existing tutorial when editing
  useEffect(() => {
    if (!isEditing || !token) return;

    const fetchTutorial = async () => {
      try {
        const response = await axios.get(`${apiUrl}/tutorials/${tutorialid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const t = response.data.tutorial || response.data;
        setForm({
          tutorialtitle: t.tutorialtitle || "",
          tutorialurl: t.tutorialurl || "",
          tutorialdescription: t.tutorialdescription || "",
          tutorialcategory: t.tutorialcategory || "",
        });
        if (t.tutorialurl) detectPlatform(t.tutorialurl);
      } catch (err) {
        console.error(err);
        setError("Could not load tutorial for editing.");
      }
    };

    fetchTutorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, tutorialid, token, apiUrl]);

  const detectPlatform = (url) => {
    try {
      const { hostname } = new URL(url);
      const host = hostname.replace("www.", "");
      const platformMap = {
        "youtube.com": { label: "YouTube", color: "#FF0000", icon: "https://www.youtube.com/favicon.ico" },
        "youtu.be": { label: "YouTube", color: "#FF0000", icon: "https://www.youtube.com/favicon.ico" },
        "vimeo.com": { label: "Vimeo", color: "#1AB7EA", icon: "https://vimeo.com/favicon.ico" },
        "instructables.com": { label: "Instructables", color: "#F4A227", icon: "https://www.instructables.com/favicon.ico" },
        "tiktok.com": { label: "TikTok", color: "#010101", icon: "https://www.tiktok.com/favicon.ico" },
        "twitch.tv": { label: "Twitch", color: "#9146FF", icon: "https://www.twitch.tv/favicon.ico" },
        "patreon.com": { label: "Patreon", color: "#FF424D", icon: "https://www.patreon.com/favicon.ico" },
        "skillshare.com": { label: "Skillshare", color: "#002333", icon: "https://www.skillshare.com/favicon.ico" },
        "udemy.com": { label: "Udemy", color: "#A435F0", icon: "https://www.udemy.com/favicon.ico" },
      };
      setUrlPreview(
        platformMap[host] || {
          label: host,
          color: "#888",
          icon: `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
        }
      );
    } catch {
      setUrlPreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "tutorialurl") {
      detectPlatform(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.tutorialurl.trim()) {
      setError("A tutorial URL is required.");
      return;
    }
    if (!form.tutorialtitle.trim()) {
      setError("Please add a title so others know what this tutorial covers.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `${apiUrl}/tutorials/${tutorialid}`,
          { ...form, userid: loggedInUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess("Tutorial updated!");
      } else {
        await axios.post(
          `${apiUrl}/tutorials`,
          { ...form, userid: loggedInUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">
          {isEditing ? "Edit Tutorial" : "Add a Tutorial"} — MidwestCosplay Club
        </title>
        <meta
          name="description"
          content="Share a cosplay tutorial link with the MidwestCosplay Club community."
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">
            {isEditing ? "Edit Tutorial ✦" : "Add a Tutorial ✦"}
          </h1>
          <p className="home-subheadline">
            Share a link to a YouTube video, Vimeo, Instructables page, or any
            tutorial you love.
          </p>
        </div>

        <div className="manage-form-container">
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <form onSubmit={handleSubmit} className="manage-form">
            {/* URL — first so the platform badge appears right away */}
            <div className="form-group">
              <label htmlFor="tutorialurl">Tutorial URL *</label>
              <input
                id="tutorialurl"
                name="tutorialurl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.tutorialurl}
                onChange={handleChange}
                required
              />

              {/* Live platform detection badge */}
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
                  <span style={{ color: urlPreview.color }}>
                    {urlPreview.label} detected
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="tutorialtitle">Title *</label>
              <input
                id="tutorialtitle"
                name="tutorialtitle"
                type="text"
                placeholder="e.g. How to Make Foam Armor from Scratch"
                value={form.tutorialtitle}
                onChange={handleChange}
                required
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="tutorialdescription">
                Description{" "}
                <span className="form-label-optional">(optional)</span>
              </label>
              <textarea
                id="tutorialdescription"
                name="tutorialdescription"
                rows={4}
                placeholder="Briefly describe what this tutorial covers…"
                value={form.tutorialdescription}
                onChange={handleChange}
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="tutorialcategory">
                Category{" "}
                <span className="form-label-optional">(optional)</span>
              </label>
              <select
                id="tutorialcategory"
                name="tutorialcategory"
                value={form.tutorialcategory}
                onChange={handleChange}
              >
                <option value="">— Select a category —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                className="button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? isEditing
                    ? "Saving…"
                    : "Adding…"
                  : isEditing
                  ? "Save Changes"
                  : "Add Tutorial"}
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => navigate("/tutorials")}
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

export default AddTutorial;