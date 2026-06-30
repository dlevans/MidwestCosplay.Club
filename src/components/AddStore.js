import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";
import "./AddStore.css";
import Footer from "../Footer";

// ─── Geocode a full address string using the free Nominatim API ───────────────
const geocodeAddress = async (addressStr) => {
  try {
    const encoded = encodeURIComponent(addressStr);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    /* fail silently — coords are optional */
  }
  return null;
};

const STORE_TYPES = [
  "Fabric Store",
  "Art Supply",
  "Bead & Jewelry",
  "Sewing Classes",
  "Craft Supply",
  "Yarn & Fiber",
  "Thrift / Reuse",
  "Other",
];

const MIDWEST_STATES = [
  "Illinois", "Indiana", "Iowa", "Kansas", "Michigan",
  "Minnesota", "Missouri", "Nebraska", "North Dakota",
  "Ohio", "South Dakota", "Wisconsin",
];

const EMPTY_FORM = {
  storename:        "",
  storedescription: "",
  storetype:        "Fabric Store",
  address:          "",
  city:             "",
  state:            "Missouri",
  zip:              "",
  phone:            "",
  website:          "",
  hours:            "",
};

const AddStore = () => {
  const navigate    = useNavigate();
  const { storeid } = useParams();
  const isEditing   = Boolean(storeid);

  const token  = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;

  const [form, setForm]         = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // ── Load existing store when editing ──────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const res = await axios.get(`${apiUrl}/stores/${storeid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const s = res.data.store;
        setForm({
          storename:        s.storename        || "",
          storedescription: s.storedescription || "",
          storetype:        s.storetype        || "Fabric Store",
          address:          s.address          || "",
          city:             s.city             || "",
          state:            s.state            || "Missouri",
          zip:              s.zip              || "",
          phone:            s.phone            || "",
          website:          s.website          || "",
          hours:            s.hours            || "",
        });
        if (s.storeimage) setImagePreview(s.storeimage);
      } catch (err) {
        setError("Could not load store data.");
        console.error(err);
      }
    };
    load();
  }, [isEditing, storeid, apiUrl, token]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccess("");

    if (!form.storename.trim()) { setError("Store name is required."); return; }
    if (!form.address.trim())   { setError("Street address is required."); return; }
    if (!form.city.trim())      { setError("City is required."); return; }

    // Validate website URL if provided
    if (form.website.trim()) {
      try {
        const parsed = new URL(form.website.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setError("Website must start with http or https."); return;
        }
      } catch {
        setError("Please enter a valid website URL."); return;
      }
    }

    setLoading(true);

    // Geocode the address to get lat/lng
    setGeocoding(true);
    const fullAddress = `${form.address}, ${form.city}, ${form.state} ${form.zip}`.trim();
    const coords = await geocodeAddress(fullAddress);
    setGeocoding(false);

    // Build multipart form data
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (coords) {
      data.append("lat", coords.lat);
      data.append("lng", coords.lng);
    }
    if (imageFile) data.append("storeimage", imageFile);

    try {
      if (isEditing) {
        await axios.put(`${apiUrl}/stores/${storeid}`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setSuccess("Store updated!");
      } else {
        await axios.post(`${apiUrl}/stores`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setSuccess("Store added! It will appear on the map shortly.");
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">{isEditing ? "Edit Store" : "Add a Store"} — MidwestCosplay Club</title>
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">{isEditing ? "Edit Store ✦" : "Add a Store ✦"}</h1>
          <p style={{ opacity: 0.65, fontSize: "0.95rem" }}>
            Share a fabric shop, art supply store, bead shop, or any craft resource with the community.
          </p>
        </div>

        <div className="add-form-card">

          {/* ── Basic info ────────────────────────────────────────────── */}
          <section className="add-form-section">
            <h2 className="add-form-heading">Basic Info</h2>

            <label className="add-form-label">
              Store Name <span className="add-form-required">*</span>
            </label>
            <input
              className="add-form-input"
              type="text"
              placeholder="e.g. Westwood Fabric Depot"
              value={form.storename}
              onChange={set("storename")}
              maxLength={120}
            />

            <label className="add-form-label">Type <span className="add-form-required">*</span></label>
            <select className="add-form-input" value={form.storetype} onChange={set("storetype")}>
              {STORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="add-form-label">Description</label>
            <textarea
              className="add-form-input add-form-textarea"
              placeholder="What makes this store great? Specialty items, vibe, parking notes…"
              value={form.storedescription}
              onChange={set("storedescription")}
              maxLength={600}
              rows={4}
            />
          </section>

          {/* ── Location ──────────────────────────────────────────────── */}
          <section className="add-form-section">
            <h2 className="add-form-heading">Location</h2>
            <p className="add-form-hint">
              We'll geocode your address automatically to place a pin on the map.
            </p>

            <label className="add-form-label">
              Street Address <span className="add-form-required">*</span>
            </label>
            <input
              className="add-form-input"
              type="text"
              placeholder="123 Main St"
              value={form.address}
              onChange={set("address")}
            />

            <div className="add-form-row">
              <div className="add-form-col">
                <label className="add-form-label">
                  City <span className="add-form-required">*</span>
                </label>
                <input
                  className="add-form-input"
                  type="text"
                  placeholder="Kansas City"
                  value={form.city}
                  onChange={set("city")}
                />
              </div>
              <div className="add-form-col">
                <label className="add-form-label">State</label>
                <select className="add-form-input" value={form.state} onChange={set("state")}>
                  {MIDWEST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="add-form-col add-form-col--sm">
                <label className="add-form-label">ZIP</label>
                <input
                  className="add-form-input"
                  type="text"
                  placeholder="64105"
                  value={form.zip}
                  onChange={set("zip")}
                  maxLength={10}
                />
              </div>
            </div>
          </section>

          {/* ── Contact & hours ───────────────────────────────────────── */}
          <section className="add-form-section">
            <h2 className="add-form-heading">Contact &amp; Hours</h2>

            <div className="add-form-row">
              <div className="add-form-col">
                <label className="add-form-label">Phone</label>
                <input
                  className="add-form-input"
                  type="tel"
                  placeholder="(816) 555-0100"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div className="add-form-col">
                <label className="add-form-label">Website</label>
                <input
                  className="add-form-input"
                  type="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={set("website")}
                />
              </div>
            </div>

            <label className="add-form-label">Hours / Notes</label>
            <input
              className="add-form-input"
              type="text"
              placeholder="Mon–Sat 9am–6pm, closed Sundays"
              value={form.hours}
              onChange={set("hours")}
              maxLength={200}
            />
          </section>

          {/* ── Photo ─────────────────────────────────────────────────── */}
          <section className="add-form-section">
            <h2 className="add-form-heading">Photo (optional)</h2>
            <p className="add-form-hint">Storefront or interior shot — helps other crafters find it!</p>

            <label className="add-form-file-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: "none" }}
              />
              📷 {imageFile ? imageFile.name : "Choose a photo…"}
            </label>

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="add-form-preview"
              />
            )}
          </section>

          {/* ── Errors / success ──────────────────────────────────────── */}
          {error   && <p className="add-form-error">{error}</p>}
          {success && <p className="add-form-success">{success}</p>}

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="add-form-actions">
            <button
              className="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? geocoding ? "Geocoding address…" : "Saving…"
                : isEditing ? "Save Changes" : "Add Store"}
            </button>
            <button
              className="button"
              onClick={() => navigate("/storemap")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AddStore;
