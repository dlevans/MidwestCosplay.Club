import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";
import "./StoreMap.css";

// ─── Fix Leaflet default marker icon paths broken by webpack ─────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Colored category icons ───────────────────────────────────────────────────
const CATEGORY_COLOR = {
  "Fabric Store":    "#a855f7",
  "Art Supply":      "#f97316",
  "Bead & Jewelry":  "#ec4899",
  "Sewing Classes":  "#22c55e",
  "Craft Supply":    "#3b82f6",
  "Yarn & Fiber":    "#f59e0b",
  "Thrift / Reuse":  "#6b7280",
  "Other":           "#94a3b8",
};

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.45);
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });

// ─── Midwest states list ──────────────────────────────────────────────────────
const MIDWEST_STATES = [
  "Illinois", "Indiana", "Iowa", "Kansas", "Michigan",
  "Minnesota", "Missouri", "Nebraska", "North Dakota",
  "Ohio", "South Dakota", "Wisconsin",
];

const STORE_TYPES = Object.keys(CATEGORY_COLOR);

const TYPE_EMOJI = {
  "Fabric Store":   "🧵",
  "Art Supply":     "🎨",
  "Bead & Jewelry": "💎",
  "Sewing Classes": "📐",
  "Craft Supply":   "✂️",
  "Yarn & Fiber":   "🧶",
  "Thrift / Reuse": "♻️",
  "Other":          "📍",
};

// ─── Helper: build Google Maps multi-stop URL ─────────────────────────────────
const buildGoogleMapsUrl = (stores) => {
  if (stores.length === 0) return null;
  if (stores.length === 1) {
    const q = encodeURIComponent(stores[0].address);
    return `https://maps.google.com/?daddr=${q}`;
  }
  const origin      = encodeURIComponent(stores[0].address);
  const destination = encodeURIComponent(stores[stores.length - 1].address);
  const waypoints   = stores
    .slice(1, -1)
    .map((s) => encodeURIComponent(s.address))
    .join("|");
  const wp = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wp}&travelmode=driving`;
};

// Apple Maps deeplink (single stop; multi-stop not supported in URL scheme)
const buildAppleMapsUrl = (store) =>
  `https://maps.apple.com/?daddr=${encodeURIComponent(store.address)}&dirflg=d`;

// ─── Sub-component: fly map to new center when user location granted ──────────
const FlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.4 });
  }, [center, zoom, map]);
  return null;
};

// ─── Sub-component: fit map bounds to visible stores ─────────────────────────
const FitBounds = ({ stores }) => {
  const map = useMap();
  useEffect(() => {
    const pts = stores.filter((s) => s.lat && s.lng);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 12);
      return;
    }
    map.fitBounds(pts.map((s) => [s.lat, s.lng]), { padding: [40, 40] });
  }, [stores, map]);
  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────
const StoreMap = () => {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const apiUrl   = process.env.REACT_APP_API_URL;

  const getPayload = (t) => {
    try { return t ? JSON.parse(atob(t.split(".")[1])) : null; }
    catch { return null; }
  };
  const payload        = getPayload(token);
  const loggedInUserId = payload?.id ?? null;
  const isAdmin        = payload?.is_admin ?? false;

  // ── State ──────────────────────────────────────────────────────────────────
  const [stores, setStores]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(50);
  const [loading, setLoading]         = useState(false);

  const [searchInput, setSearchInput]   = useState("");
  const [search, setSearch]             = useState("");
  const [activeTypes, setActiveTypes]   = useState(new Set());
  const [activeStates, setActiveStates] = useState(new Set());
  const [cityInput, setCityInput]       = useState("");
  const [city, setCity]                 = useState("");

  const [userCenter, setUserCenter]     = useState(null);
  const [locState, setLocState]         = useState("idle"); // idle|requesting|granted|denied|unavailable
  const [selectedStores, setSelectedStores] = useState(new Set()); // for road-trip multi-select
  const [roadTripMode, setRoadTripMode] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);

  const sendMenuRef = useRef(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  // ── Close send-menu on outside click ──────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (sendMenuRef.current && !sendMenuRef.current.contains(e.target))
        setSendMenuOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Fetch stores ───────────────────────────────────────────────────────────
  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search.trim())         params.search = search.trim();
      if (activeTypes.size > 0)  params.type   = [...activeTypes].join(",");
      if (activeStates.size > 0) params.state  = [...activeStates].join(",");
      if (city.trim())           params.city   = city.trim();

      const res = await axios.get(`${apiUrl}/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      setStores(res.data.stores || []);
      setTotal(res.data.total   || 0);
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, page, limit, search, activeTypes, activeStates, city]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { setPage(1); }, [search, activeTypes, activeStates, city, limit]);

  // ── Geolocation ────────────────────────────────────────────────────────────
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocState("unavailable"); return; }
    setLocState("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCenter([coords.latitude, coords.longitude]);
        setLocState("granted");
      },
      () => setLocState("denied"),
      { timeout: 10000 }
    );
  }, []);

  // ── Filters ────────────────────────────────────────────────────────────────
  const toggleType  = (t) => setActiveTypes(prev  => { const n = new Set(prev); n.has(t)  ? n.delete(t)  : n.add(t);  return n; });
  const toggleState = (s) => setActiveStates(prev => { const n = new Set(prev); n.has(s)  ? n.delete(s)  : n.add(s);  return n; });
  const commitSearch = () => setSearch(searchInput);
  const commitCity   = () => setCity(cityInput);

  const clearAll = () => {
    setSearchInput(""); setSearch("");
    setCityInput("");   setCity("");
    setActiveTypes(new Set());
    setActiveStates(new Set());
  };
  const isFiltering = search || activeTypes.size > 0 || activeStates.size > 0 || city;

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (storeid) => {
    if (!window.confirm("Remove this store listing?")) return;
    try {
      await axios.delete(`${apiUrl}/stores/${storeid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores((prev) => prev.filter((s) => s.storeid !== storeid));
      setTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Delete store error:", err);
    }
  };

  // ── Road-trip multi-select ─────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelectedStores((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectedList = useMemo(
    () => stores.filter((s) => selectedStores.has(s.storeid) && s.address),
    [stores, selectedStores]
  );

  const allFilteredWithAddress = stores.filter((s) => s.address);

  // ── Map stores (only those with coords) ───────────────────────────────────
  const mappableStores = stores.filter((s) => s.lat && s.lng);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / limit);

  const PaginationBar = () => (
    <div className="sm-pagination">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
        {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
    </div>
  );

  // ── Send-to-phone helpers ──────────────────────────────────────────────────
  const routeStores = roadTripMode && selectedList.length > 0
    ? selectedList
    : allFilteredWithAddress;

  const googleUrl = buildGoogleMapsUrl(routeStores);
  const appleUrl  = routeStores.length > 0 ? buildAppleMapsUrl(routeStores[0]) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club — Fabric &amp; Craft Stores</title>
        <meta
          name="description"
          content="Community-sourced fabric, art supply, bead, and craft stores across the Midwest."
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content sm-hub">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="games-header">
          <p className="games-eyebrow">Guild Resources</p>
          <h1 className="games-headline">Fabric &amp; Craft Stores</h1>
          <p className="games-subhead">
            Community-sourced shops for fabric, beads, art supplies, sewing classes, and cosplay crafting across Kansas, Missouri, and the greater Midwest.
          </p>
        </header>

        {/* ── Actions row ────────────────────────────────────────────────── */}
        <div className="sm-actions-row">
          {loggedInUserId && (
            <Link to="/addstore">
              <button className="button">+ Add a Store</button>
            </Link>
          )}

          {/* Road-trip mode toggle */}
          <button
            className={`sm-trip-toggle${roadTripMode ? " sm-trip-toggle--on" : ""}`}
            onClick={() => { setRoadTripMode((v) => !v); setSelectedStores(new Set()); }}
          >
            {roadTripMode ? "🗺️ Picking stops…" : "🗺️ Plan a Road Trip"}
          </button>

          {/* Send-to-phone dropdown */}
          <div className="sm-send-wrapper" ref={sendMenuRef}>
            <button
              className="sm-send-btn"
              onClick={() => setSendMenuOpen((v) => !v)}
              disabled={routeStores.length === 0}
            >
              📲 Send to Phone
              {roadTripMode && selectedList.length > 0 && (
                <span className="sm-badge">{selectedList.length}</span>
              )}
            </button>
            {sendMenuOpen && (
              <div className="sm-send-menu">
                <p className="sm-send-menu-label">
                  {roadTripMode && selectedList.length > 0
                    ? `${selectedList.length} selected stop${selectedList.length !== 1 ? "s" : ""}`
                    : `${routeStores.length} store${routeStores.length !== 1 ? "s" : ""} in view`}
                </p>
                {googleUrl && (
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="sm-send-option">
                    <span>🗺️</span> Open in Google Maps
                  </a>
                )}
                {appleUrl && (
                  <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="sm-send-option">
                    <span>🍎</span> Open in Apple Maps
                    {routeStores.length > 1 && (
                      <small> (first stop only)</small>
                    )}
                  </a>
                )}
                {routeStores.length > 1 && (
                  <p className="sm-send-note">
                    Google Maps supports multi-stop routes. Apple Maps links to the first stop.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {roadTripMode && (
          <p className="sm-trip-hint">
            {selectedList.length === 0
              ? "Check the boxes on store cards to build your route, then tap Send to Phone."
              : `${selectedList.length} stop${selectedList.length !== 1 ? "s" : ""} selected: ${selectedList.map((s) => s.storename).join(" → ")}`}
          </p>
        )}

        {/* ── Top row: map + filter panel side-by-side ────────────────────── */}
        <div className="sm-top-row">

          {/* Map panel */}
          <div className="sm-map-panel">
            <MapContainer
              center={[39.09, -94.58]}
              zoom={7}
              className="sm-leaflet-map"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Auto-fit to filtered results */}
              {mappableStores.length > 0 && <FitBounds stores={mappableStores} />}

              {/* Fly to user location */}
              {userCenter && <FlyTo center={userCenter} zoom={12} />}

              {/* Store pins */}
              {mappableStores.map((s) => (
                <Marker
                  key={s.storeid}
                  position={[s.lat, s.lng]}
                  icon={makeIcon(CATEGORY_COLOR[s.storetype] || "#94a3b8")}
                >
                  <Popup>
                    <div className="sm-popup">
                      <strong>{s.storename}</strong>
                      <span className="sm-popup-type">{s.storetype}</span>
                      {s.address && <p>{s.address}</p>}
                      {s.phone && <p>📞 {s.phone}</p>}
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>
                      )}
                      <div className="sm-popup-links">
                        <a
                          href={buildGoogleMapsUrl([s])}
                          target="_blank"
                          rel="noopener noreferrer"
                        >Google Maps</a>
                        <a
                          href={buildAppleMapsUrl(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >Apple Maps</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Locate me */}
            <button
              className={`sm-locate-btn${locState === "granted" ? " sm-locate-btn--success" : ""}`}
              onClick={handleLocateMe}
              disabled={locState === "requesting"}
              title="Center map on your location"
            >
              {locState === "requesting" ? "⏳" : "📍"}
            </button>

            {locState === "denied" && (
              <p className="sm-locate-error">Location denied. Enable it in browser settings.</p>
            )}

            {/* Map legend */}
            <ul className="sm-legend">
              {STORE_TYPES.map((t) => (
                <li key={t}>
                  <span className="sm-legend-dot" style={{ background: CATEGORY_COLOR[t] }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Filter panel ──────────────────────────────────────────── */}
          <div className="sm-filter-panel">
              {/* Text search */}
              <div className="sm-filter-field">
                <label className="sm-filter-label">Search stores</label>
                <input
                  className="sm-search-input"
                  type="text"
                  placeholder="fabric, beads, spray paint…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitSearch()}
                  onBlur={commitSearch}
                />
              </div>

              {/* City filter */}
              <div className="sm-filter-field">
                <label className="sm-filter-label">City</label>
                <input
                  className="sm-search-input"
                  type="text"
                  placeholder="e.g. Kansas City, Topeka…"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitCity()}
                  onBlur={commitCity}
                />
              </div>

              {/* Store type tiles */}
              <div className="sm-filter-group">
                <label className="sm-filter-label">Type — select one or more</label>
                <div className="sm-type-grid">
                  {STORE_TYPES.map((t) => (
                    <button
                      key={t}
                      className={`sm-type-tile${activeTypes.has(t) ? " sm-type-tile--active" : ""}`}
                      style={activeTypes.has(t) ? { borderColor: CATEGORY_COLOR[t], background: `${CATEGORY_COLOR[t]}22` } : {}}
                      onClick={() => toggleType(t)}
                    >
                      <span>{TYPE_EMOJI[t]}</span>
                      <span className="sm-type-label">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State chips */}
              <div className="sm-filter-group">
                <label className="sm-filter-label">State — select one or more</label>
                <div className="sm-state-grid">
                  {MIDWEST_STATES.map((s) => (
                    <button
                      key={s}
                      className={`sm-state-chip${activeStates.has(s) ? " sm-state-chip--active" : ""}`}
                      onClick={() => toggleState(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filter pills + clear */}
              {isFiltering && (
                <div className="sm-active-filters">
                  {[...activeTypes].map((t) => (
                    <span key={t} className="sm-pill">
                      {t} <button className="sm-pill-x" onClick={() => toggleType(t)}>✕</button>
                    </span>
                  ))}
                  {[...activeStates].map((s) => (
                    <span key={s} className="sm-pill">
                      {s} <button className="sm-pill-x" onClick={() => toggleState(s)}>✕</button>
                    </span>
                  ))}
                  {search && (
                    <span className="sm-pill">
                      "{search}" <button className="sm-pill-x" onClick={() => { setSearch(""); setSearchInput(""); }}>✕</button>
                    </span>
                  )}
                  {city && (
                    <span className="sm-pill">
                      City: {city} <button className="sm-pill-x" onClick={() => { setCity(""); setCityInput(""); }}>✕</button>
                    </span>
                  )}
                  <span className="sm-result-count">{total} result{total !== 1 ? "s" : ""}</span>
                  <button className="sm-clear-btn" onClick={clearAll}>✕ Clear all</button>
                </div>
              )}
          </div>
        </div>

        {/* ── Stores: full-width section below map + filters ──────────────── */}
        <div className="sm-stores-section">
          <PaginationBar />

          <div className="sm-card-list">
              {loading ? (
                <p className="sm-no-results">Loading stores…</p>
              ) : stores.length === 0 ? (
                <p className="sm-no-results">
                  No stores match your filters.{" "}
                  <button className="button" onClick={clearAll}>Clear all</button>
                </p>
              ) : (
                stores.map((store) => (
                  <div
                    key={store.storeid}
                    className={`sm-card${selectedStores.has(store.storeid) ? " sm-card--selected" : ""}`}
                  >
                    {/* Road-trip checkbox */}
                    {roadTripMode && store.address && (
                      <label className="sm-trip-check">
                        <input
                          type="checkbox"
                          checked={selectedStores.has(store.storeid)}
                          onChange={() => toggleSelect(store.storeid)}
                        />
                        <span>Add to route</span>
                      </label>
                    )}

                    {/* Store image */}
                    {store.storeimage && (
                      <img
                        src={store.storeimage}
                        alt={store.storename}
                        className="sm-card-img"
                      />
                    )}

                    {/* Header */}
                    <div className="sm-card-header">
                      <h3 className="sm-card-name">{store.storename}</h3>
                      <span
                        className="sm-type-badge"
                        style={{ background: `${CATEGORY_COLOR[store.storetype] || "#888"}33`, borderColor: CATEGORY_COLOR[store.storetype] || "#888" }}
                      >
                        {TYPE_EMOJI[store.storetype] || "📍"} {store.storetype || "Other"}
                      </span>
                    </div>

                    {/* Details */}
                    {store.storedescription && (
                      <p className="sm-card-desc">{store.storedescription}</p>
                    )}
                    <ul className="sm-card-details">
                      {store.address && (
                        <li>
                          <span className="sm-detail-icon">📌</span>
                          {store.address}
                          {store.city && `, ${store.city}`}
                          {store.state && `, ${store.state}`}
                          {store.zip && ` ${store.zip}`}
                        </li>
                      )}
                      {store.phone && (
                        <li>
                          <span className="sm-detail-icon">📞</span>
                          <a href={`tel:${store.phone}`}>{store.phone}</a>
                        </li>
                      )}
                      {store.hours && (
                        <li>
                          <span className="sm-detail-icon">🕐</span>
                          {store.hours}
                        </li>
                      )}
                      {store.website && (
                        <li>
                          <span className="sm-detail-icon">🌐</span>
                          <a href={store.website} target="_blank" rel="noopener noreferrer">
                            {store.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          </a>
                        </li>
                      )}
                    </ul>

                    {/* Submitted by */}
                    {store.username && (
                      <p className="sm-card-submitter">
                        Submitted by <Link to={`/public/${store.username}`}>{store.username}</Link>
                      </p>
                    )}

                    {/* CTA buttons */}
                    <div className="sm-card-actions">
                      {store.address && (
                        <>
                          <a
                            href={buildGoogleMapsUrl([store])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sm-dir-btn sm-dir-btn--google"
                          >
                            🗺️ Google Maps
                          </a>
                          <a
                            href={buildAppleMapsUrl(store)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sm-dir-btn sm-dir-btn--apple"
                          >
                            🍎 Apple Maps
                          </a>
                        </>
                      )}
                      {store.website && (
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sm-dir-btn"
                        >
                          🌐 Website
                        </a>
                      )}
                    </div>

                    {/* Edit/delete */}
                    {(store.userid === loggedInUserId || isAdmin) && (
                      <div className="sm-card-admin">
                        <Link to={`/addstore/${store.storeid}`}>
                          <button className="button">Edit</button>
                        </Link>
                        <button className="button" onClick={() => handleDelete(store.storeid)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {total > limit && <PaginationBar />}
          </div>

      </div>
      <Footer />
    </div>
  );
};

export default StoreMap;
