import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground.js";
import "../components/StoreMap.css";

// ─── Platform helpers ─────────────────────────────────────────────────────────
const getPlatformInfo = (url, type = "tutorial") => {
  if (!url) return { label: "Link", icon: null, color: "#888" };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const tutorialPlatforms = {
      "youtube.com":       { label: "YouTube",       icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "youtu.be":          { label: "YouTube",       icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "vimeo.com":         { label: "Vimeo",         icon: "https://vimeo.com/favicon.ico",             color: "#1AB7EA" },
      "instructables.com": { label: "Instructables", icon: "https://www.instructables.com/favicon.ico", color: "#F4A227" },
      "tiktok.com":        { label: "TikTok",        icon: "https://www.tiktok.com/favicon.ico",        color: "#010101" },
      "twitch.tv":         { label: "Twitch",        icon: "https://www.twitch.tv/favicon.ico",         color: "#9146FF" },
      "patreon.com":       { label: "Patreon",       icon: "https://www.patreon.com/favicon.ico",       color: "#FF424D" },
    };
    const templatePlatforms = {
      "etsy.com":          { label: "Etsy",          icon: "https://www.etsy.com/favicon.ico",          color: "#F56400" },
      "patreon.com":       { label: "Patreon",       icon: "https://www.patreon.com/favicon.ico",       color: "#FF424D" },
      "gumroad.com":       { label: "Gumroad",       icon: "https://gumroad.com/favicon.ico",           color: "#FF90E8" },
      "ko-fi.com":         { label: "Ko-fi",         icon: "https://ko-fi.com/favicon.ico",             color: "#29ABE0" },
      "sksprops.com":      { label: "SKS Props",     icon: null,                                         color: "#888"   },
    };
    const map = type === "template" ? templatePlatforms : tutorialPlatforms;
    return map[host] || { label: host, icon: null, color: "#888" };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

// ─── Emoji maps (same as Template.js / Tutorials.js) ─────────────────────────
const TEMPLATE_CAT_EMOJI = {
  "Uncategorized":         "📁",
  "Accessories & Jewelry": "💍",
  "Armor & Chest Pieces":  "🛡️",
  "General / Other":       "🗂️",
  "Helmets & Headgear":    "🪖",
  "Props & Weapons":       "⚔️",
  "Clothing":              "👗",
  "Wings & Tails":         "🪶",
  "Foam":                  "🧱",
  "3D Print":              "🖨️",
  "Shoes & Footwear":      "👠",
};
const TUTORIAL_CAT_EMOJI = {
  "Uncategorized":         "📁",
  "Armor":                 "🛡️",
  "Electronics & LEDs":    "💡",
  "Foam Crafting":         "🧱",
  "General Crafting":      "🎨",
  "Other":                 "🗂️",
  "Props & Weapons":       "⚔️",
  "Clothing":              "👗",
  "Helmets & Headgear":    "🪖",
  "Accessories & Jewelry": "💍",
  "3D Print":              "🖨️",
};
const DEFAULT_EMOJI = "🏷️";

// ─── Store type colors/emoji (mirrors StoreMap.js) ────────────────────────────
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

// Single-store Google/Apple Maps deep links (mirrors StoreMap.js)
const buildGoogleMapsUrl = (store) =>
  `https://maps.google.com/?daddr=${encodeURIComponent(store.address)}`;
const buildAppleMapsUrl = (store) =>
  `https://maps.apple.com/?daddr=${encodeURIComponent(store.address)}&dirflg=d`;

// ─── Midwest state list (abbr → full name), same set used on Events.js ───────
const MIDWEST_STATES = [
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MO", "Missouri"],
  ["NE", "Nebraska"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["SD", "South Dakota"],
  ["WI", "Wisconsin"],
];
const stateName = (abbr) => MIDWEST_STATES.find(([a]) => a === abbr)?.[1] || abbr;

// ─── Parse Google-style query into token groups ───────────────────────────────
// "exact phrase"  → exact match required
// -word           → exclude this word
// -"exact phrase" → exclude this phrase
// word            → plain keyword
function parseQueryTokens(raw) {
  const required = [], exact = [], negative = [];
  const regex = /(-?"[^"]*"|-?\S+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const t = match[1];
    if (t.startsWith('-"') && t.endsWith('"')) negative.push(t.slice(2, -1).trim());
    else if (t.startsWith('"') && t.endsWith('"')) exact.push(t.slice(1, -1).trim());
    else if (t.startsWith("-") && t.length > 1)  negative.push(t.slice(1).trim());
    else required.push(t.trim());
  }
  return { required, exact, negative };
}

// Build a plain highlight term from the parsed tokens (just the positive terms)
function highlightTerms(tokens) {
  return [...tokens.required, ...tokens.exact];
}

// ─── Keyword highlight (supports multiple terms) ──────────────────────────────
function hl(text, terms) {
  if (!text || !terms || terms.length === 0) return text;
  try {
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex   = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts   = String(text).split(regex);
    return parts.map((part, i) =>
      terms.some((t) => part.toLowerCase() === t.toLowerCase())
        ? <span key={i} className="search-highlight">{part}</span>
        : part
    );
  } catch { return text; }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ src, username }) =>
  src ? (
    <img src={src} alt={`${username || "User"}'s avatar`} className="tutorial-card-avatar" />
  ) : (
    <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
      {(username || "?")[0].toUpperCase()}
    </div>
  );

// ─── Category filter button ───────────────────────────────────────────────────
// grayed out when count === 0, active when selected
const CatButton = ({ label, emoji, count, active, onClick }) => (
  <button
    type="button"
    className={`srch-cat-btn${active ? " srch-cat-btn--active" : ""}${count === 0 ? " srch-cat-btn--empty" : ""}`}
    onClick={onClick}
    disabled={count === 0}
    title={count === 0 ? "No results in this category" : `${count} result${count !== 1 ? "s" : ""}`}
  >
    <span className="srch-cat-emoji">{emoji}</span>
    <span className="srch-cat-label">{label}</span>
    {count > 0 && <span className="srch-cat-count">{count}</span>}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
function Search() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const searchRef = useRef(null);
  const lastFetchedQueryRef = useRef("");

  // Section filter keys, and the URL param name each one maps to
  const SECTION_KEYS = ["users", "groups", "tutorials", "templates", "events", "stores"];
  const ALL_SECTIONS_ON = { users: true, groups: true, tutorials: true, templates: true, events: true, stores: true };

  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState({ users: [], groups: [], tutorials: [], templates: [], events: [], stores: [] });
  const [meta,     setMeta]     = useState({ userIama: [], tutorialCats: [], templateCats: [], eventStates: [], storeTypes: [] });
  const [searched, setSearched] = useState(false);
  const [shaking,  setShaking]  = useState(false);

  // Section-level show/hide filters
  const [filters, setFilters] = useState(ALL_SECTIONS_ON);

  // Category sub-filters (null = all, string = selected category)
  const [tutorialCatFilter, setTutorialCatFilter] = useState(null);
  const [templateCatFilter, setTemplateCatFilter] = useState(null);
  const [iamaFilter,        setIamaFilter]        = useState(null);
  const [eventStateFilter,  setEventStateFilter]  = useState(null);
  const [storeTypeFilter,   setStoreTypeFilter]   = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  // ── Auth (only needed here for store card ownership — Edit/Delete) ────────
  const token = localStorage.getItem("token");
  const getPayload = (t) => {
    try { return t ? JSON.parse(atob(t.split(".")[1])) : null; }
    catch { return null; }
  };
  const payload        = getPayload(token);
  const loggedInUserId = payload?.id ?? null;
  const isAdmin         = payload?.is_admin ?? false;

  // ── Load meta on mount (for filter buttons before any search) ────────────
  useEffect(() => {
    axios.get(`${apiUrl}/search`).then(({ data }) => {
      if (data.meta) setMeta(data.meta);
    }).catch(() => {});
  }, [apiUrl]);

  // ── URL-driven search + section filters ───────────────────────────────────
  // ?query=planet&events=1&tutorials=1  → search "planet", show only Events + Tutorials
  // ?query=planet                       → search "planet", show everyone (default)
  useEffect(() => {
    const params      = new URLSearchParams(location.search);
    const searchQuery = params.get("query") || "";
    setQuery(searchQuery);

    const activeSections = SECTION_KEYS.filter((k) => params.get(k) === "1");
    if (activeSections.length > 0) {
      const next = {};
      SECTION_KEYS.forEach((k) => { next[k] = activeSections.includes(k); });
      setFilters(next);
    } else {
      setFilters(ALL_SECTIONS_ON);
    }

    // Only refetch when the query itself changed — toggling a section filter
    // just re-syncs `filters` above without hitting the API again.
    if (searchQuery && searchQuery !== lastFetchedQueryRef.current) {
      lastFetchedQueryRef.current = searchQuery;
      fetchResults(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const fetchResults = useCallback(async (raw) => {
    if (!raw || !raw.trim()) return;
    try {
      const { data } = await axios.get(
        `${apiUrl}/search?query=${encodeURIComponent(raw.trim())}`
      );
      setResults({
        users:     Array.isArray(data.users)     ? data.users     : [],
        groups:    Array.isArray(data.groups)    ? data.groups    : [],
        tutorials: Array.isArray(data.tutorials) ? data.tutorials : [],
        templates: Array.isArray(data.templates) ? data.templates : [],
        events:    Array.isArray(data.events)    ? data.events    : [],
        stores:    Array.isArray(data.stores)    ? data.stores    : [],
      });
      if (data.meta) setMeta(data.meta);
      setSearched(true);
      // Reset sub-filters on new search
      setTutorialCatFilter(null);
      setTemplateCatFilter(null);
      setIamaFilter(null);
      setEventStateFilter(null);
      setStoreTypeFilter(null);
    } catch (err) {
      console.error("Search error:", err);
      setResults({ users: [], groups: [], tutorials: [], templates: [], events: [], stores: [] });
      setSearched(true);
    }
  }, [apiUrl]);

  const doSearch = () => {
    if (!query.trim()) return;
    const params = new URLSearchParams();
    params.set("query", query.trim());
    if (!SECTION_KEYS.every((k) => filters[k])) {
      SECTION_KEYS.forEach((k) => { if (filters[k]) params.set(k, "1"); });
    }
    navigate(`/search?${params.toString()}`);
  };

  const clearAll = () => {
    setQuery("");
    setResults({ users: [], groups: [], tutorials: [], templates: [], events: [], stores: [] });
    setSearched(false);
    setFilters(ALL_SECTIONS_ON);
    setTutorialCatFilter(null);
    setTemplateCatFilter(null);
    setIamaFilter(null);
    setEventStateFilter(null);
    setStoreTypeFilter(null);
    navigate("/search", { replace: true });
    if (searchRef.current) searchRef.current.focus();
  };

  const handleDeleteStore = async (storeid) => {
    if (!window.confirm("Remove this store listing?")) return;
    try {
      await axios.delete(`${apiUrl}/stores/${storeid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults((prev) => ({ ...prev, stores: prev.stores.filter((s) => s.storeid !== storeid) }));
    } catch (err) {
      console.error("Delete store error:", err);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") doSearch(); };
  const toggleFilter = (key) => {
    const next = { ...filters, [key]: !filters[key] };
    const params = new URLSearchParams(location.search);

    if (SECTION_KEYS.every((k) => next[k])) {
      // Back to the "everyone" default — keep the URL clean, no section params
      SECTION_KEYS.forEach((k) => params.delete(k));
    } else {
      SECTION_KEYS.forEach((k) => {
        if (next[k]) params.set(k, "1");
        else params.delete(k);
      });
    }
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // ── Shake on empty ───────────────────────────────────────────────────────
  useEffect(() => {
    const tokens  = parseQueryTokens(query);
    const hlTerms = highlightTerms(tokens);
    const total   =
      results.users.length + results.groups.length +
      results.tutorials.length + results.templates.length +
      results.events.length + results.stores.length;
    if (searched && total === 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
  }, [searched, results, query]);

  // ── Derived visible lists (section filter + category sub-filter) ─────────
  const tokens  = parseQueryTokens(query);
  const hlTerms = highlightTerms(tokens);

  const visibleUsers = filters.users
    ? (iamaFilter
        ? results.users.filter((u) =>
            u.imawhat && u.imawhat.split(",").map((s) => s.trim()).includes(iamaFilter)
          )
        : results.users)
    : [];

  const visibleTutorials = filters.tutorials
    ? (tutorialCatFilter
        ? results.tutorials.filter((t) => (t.tutorialcategory || "") === tutorialCatFilter)
        : results.tutorials)
    : [];

  const visibleTemplates = filters.templates
    ? (templateCatFilter
        ? results.templates.filter((t) => (t.templatecategory || "") === templateCatFilter)
        : results.templates)
    : [];

  const visibleGroups = filters.groups ? results.groups : [];

  const visibleEvents = filters.events
    ? (eventStateFilter
        ? results.events.filter((e) => (e.eventstate || "").toUpperCase() === eventStateFilter)
        : results.events)
    : [];

  const visibleStores = filters.stores
    ? (storeTypeFilter
        ? results.stores.filter((s) => (s.storetype || "Other") === storeTypeFilter)
        : results.stores)
    : [];

  const totalVisible =
    visibleUsers.length + visibleGroups.length +
    visibleTutorials.length + visibleTemplates.length +
    visibleEvents.length + visibleStores.length;

  const nothingFound = searched && totalVisible === 0;

  // ── Count helpers for category buttons ──────────────────────────────────
  const tutorialCatCount = (cat) =>
    results.tutorials.filter((t) => (t.tutorialcategory || "") === cat).length;

  const templateCatCount = (cat) =>
    results.templates.filter((t) => (t.templatecategory || "") === cat).length;

  const iamaCatCount = (role) =>
    results.users.filter((u) =>
      u.imawhat && u.imawhat.split(",").map((s) => s.trim()).includes(role)
    ).length;

  const eventStateCount = (abbr) =>
    results.events.filter((e) => (e.eventstate || "").toUpperCase() === abbr).length;

  const storeTypeCount = (type) =>
    results.stores.filter((s) => (s.storetype || "Other") === type).length;

  // Section-level count label
  const countLabel = (key, label) =>
    `${label}${results[key].length ? ` (${results[key].length})` : ""}`;

  // ── Search syntax hint ───────────────────────────────────────────────────
  const SyntaxHint = () => (
    <p className="srch-syntax-hint">
      Tip: use <code>"quotes"</code> for exact phrases · <code>-word</code> to exclude ·
      e.g. <code>"lightsaber" -sksprops</code>
    </p>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Search — MidwestCosplay Club</title>
        <meta name="description" content="Search members, groups, tutorials, and templates on MidwestCosplay Club." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Search ✦</h1>
        </div>

        {/* ── Search bar ── */}
        <div className="search-bar-row">
          <input
            className="search-input"
            placeholder='Search… try "lightsaber" -sksprops'
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="button" type="button" onClick={doSearch}>Search</button>
          {(query || searched) && (
            <button className="button srch-clear-btn" type="button" onClick={clearAll}>✕ Clear</button>
          )}
        </div>
        <SyntaxHint />

        {/* ── Section filter toggles ── */}
        <div className="search-filter-row">
          <button type="button" className={`search-filter-toggle${filters.users     ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("users")}>
            {countLabel("users",     "Everyone")}
          </button>
          <button type="button" className={`search-filter-toggle${filters.groups    ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("groups")}>
            {countLabel("groups",    "Groups")}
          </button>
          <button type="button" className={`search-filter-toggle${filters.tutorials ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("tutorials")}>
            {countLabel("tutorials", "Tutorials")}
          </button>
          <button type="button" className={`search-filter-toggle${filters.templates ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("templates")}>
            {countLabel("templates", "Templates")}
          </button>
          <button type="button" className={`search-filter-toggle${filters.events ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("events")}>
            {countLabel("events", "Events")}
          </button>
          <button type="button" className={`search-filter-toggle${filters.stores ? " search-filter-toggle--active" : ""}`} onClick={() => toggleFilter("stores")}>
            {countLabel("stores", "Stores")}
          </button>
        </div>

        {/* ── Nothing found ── */}
        {nothingFound && (
          <div className={`search-empty ${shaking ? "search-empty--shake" : ""}`}>
            <span className="search-empty-icon">✦</span>
            <p>Nothing found for <strong>"{query}"</strong></p>
            <p className="search-empty-sub">Try different keywords, or check your filters.</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PEOPLE — iama category buttons
        ══════════════════════════════════════════════ */}
        {filters.users && searched && meta.userIama.length > 0 && (
          <div className="srch-cat-section">
            <p className="srch-cat-heading">Filter people by role</p>
            <div className="srch-cat-grid">
              {meta.userIama.map((role) => (
                <CatButton
                  key={role}
                  label={role}
                  emoji="🧑‍🎨"
                  count={iamaCatCount(role)}
                  active={iamaFilter === role}
                  onClick={() => setIamaFilter((p) => (p === role ? null : role))}
                />
              ))}
            </div>
          </div>
        )}

        {filters.users && visibleUsers.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">
              People {iamaFilter && <span className="srch-active-cat">· {iamaFilter}</span>}
            </h2>
            <div className="user-container">
              {visibleUsers.map((user) => {
                const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ");
                return (
                  <div className="search-user-card" key={user.id}>
                    <div className="search-user-header">
                      {user.image && <img src={user.image} alt={`${user.username}'s avatar`} />}
                      <div className="search-user-name">
                        {user.username && <h3>{hl(user.username, hlTerms)}</h3>}
                        {fullName      && <p>{hl(fullName, hlTerms)}</p>}
                      </div>
                    </div>
                    {user.imawhat && (
                      <div className="search-field">
                        <div className="search-field-label">I am a</div>
                        <div className="search-tag-row">
                          {user.imawhat.split(",").map((role, i) => (
                            <span className="search-tag" key={i}>{hl(role.trim(), hlTerms)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.complete && (
                      <div className="search-field">
                        <div className="search-field-label">Completed</div>
                        <div className="search-tag-row">
                          {user.complete.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>{hl(item.trim(), hlTerms)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.inprogress && (
                      <div className="search-field">
                        <div className="search-field-label">In Progress</div>
                        <div className="search-tag-row">
                          {user.inprogress.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>{hl(item.trim(), hlTerms)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link to={`/public/${user.username}`}>
                      <button className="button">View Profile</button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            GROUPS
        ══════════════════════════════════════════════ */}
        {visibleGroups.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">Groups</h2>
            <div className="group-container">
              {visibleGroups.map((group) => (
                <div className="group-card" key={group.groupid}>
                  {group.groupimage && (
                    <img src={group.groupimage} alt={`${group.groupname}'s photo`} />
                  )}
                  {group.groupname && <h3>{hl(group.groupname, hlTerms)}</h3>}
                  <h4>{group.groupcity}, {group.groupstate}</h4>
                  <Link to={`/public/group/${group.groupslug || group.groupid}`}>
                    <button className="button">View Group</button>
                  </Link>
                  {group.groupwebsite && (
                    <a href={group.groupwebsite} target="_blank" rel="noopener noreferrer">
                      <button className="button">Visit Website</button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            EVENTS — state buttons
        ══════════════════════════════════════════════ */}
        {filters.events && searched && meta.eventStates.length > 0 && (
          <div className="srch-cat-section">
            <p className="srch-cat-heading">Filter events by state</p>
            <div className="srch-cat-grid">
              {meta.eventStates.map((abbr) => (
                <CatButton
                  key={abbr}
                  label={stateName(abbr)}
                  emoji="📍"
                  count={eventStateCount(abbr)}
                  active={eventStateFilter === abbr}
                  onClick={() => setEventStateFilter((p) => (p === abbr ? null : abbr))}
                />
              ))}
            </div>
          </div>
        )}

        {filters.events && visibleEvents.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">
              Events {eventStateFilter && <span className="srch-active-cat">· {stateName(eventStateFilter)}</span>}
            </h2>
            <div className="event-container">
              {visibleEvents.map((event) => (
                <div className="event-card" key={event.eventid}>
                  {event.eventimage && (
                    <img src={event.eventimage} alt={`${event.eventname}'s photo`} />
                  )}
                  {event.eventname && <h3>{hl(event.eventname, hlTerms)}</h3>}
                  <h4>{hl(event.eventcity, hlTerms)}, {event.eventstate}</h4>
                  <Link to={`/public/event/${event.eventslug || event.eventid}`}>
                    <button className="button">View Event</button>
                  </Link>
                  {event.eventwebsite && (
                    <a href={event.eventwebsite} target="_blank" rel="noopener noreferrer">
                      <button className="button">Visit Website</button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STORES — type buttons
        ══════════════════════════════════════════════ */}
        {filters.stores && searched && meta.storeTypes.length > 0 && (
          <div className="srch-cat-section">
            <p className="srch-cat-heading">Filter stores by type</p>
            <div className="srch-cat-grid">
              {meta.storeTypes.map((type) => (
                <CatButton
                  key={type}
                  label={type}
                  emoji="🏬"
                  count={storeTypeCount(type)}
                  active={storeTypeFilter === type}
                  onClick={() => setStoreTypeFilter((p) => (p === type ? null : type))}
                />
              ))}
            </div>
          </div>
        )}

        {filters.stores && visibleStores.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">
              Stores {storeTypeFilter && <span className="srch-active-cat">· {storeTypeFilter}</span>}
            </h2>
            <div className="sm-card-list">
              {visibleStores.map((store) => (
                <div className="sm-card" key={store.storeid}>
                  {store.storeimage && (
                    <img
                      src={store.storeimage}
                      alt={store.storename || "Store photo"}
                      className="sm-card-img"
                    />
                  )}

                  <div className="sm-card-header">
                    <h3 className="sm-card-name">{hl(store.storename, hlTerms)}</h3>
                    <span
                      className="sm-type-badge"
                      style={{
                        background:  `${CATEGORY_COLOR[store.storetype] || "#888"}33`,
                        borderColor: CATEGORY_COLOR[store.storetype] || "#888",
                      }}
                    >
                      {TYPE_EMOJI[store.storetype] || "📍"} {hl(store.storetype || "Other", hlTerms)}
                    </span>
                  </div>

                  {store.storedescription && (
                    <p className="sm-card-desc">{hl(store.storedescription, hlTerms)}</p>
                  )}

                  <ul className="sm-card-details">
                    {store.address && (
                      <li>
                        <span className="sm-detail-icon">📌</span>
                        {hl(store.address, hlTerms)}
                        {store.city  && `, ${store.city}`}
                        {store.state && `, ${store.state}`}
                        {store.zip   && ` ${store.zip}`}
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

                  {store.username && (
                    <p className="sm-card-submitter">
                      Added by <Link to={`/public/${store.username}`}>{store.username}</Link>
                    </p>
                  )}

                  <div className="sm-card-actions">
                    {store.address && (
                      <>
                        <a
                          href={buildGoogleMapsUrl(store)}
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

                  {(store.userid === loggedInUserId || isAdmin) && (
                    <div className="sm-card-admin">
                      <Link to={`/addstore/${store.storeid}`}>
                        <button className="button">Edit</button>
                      </Link>
                      <button className="button" onClick={() => handleDeleteStore(store.storeid)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TUTORIALS — category buttons
        ══════════════════════════════════════════════ */}
        {filters.tutorials && searched && meta.tutorialCats.length > 0 && (
          <div className="srch-cat-section">
            <p className="srch-cat-heading">Filter tutorials by category</p>
            <div className="srch-cat-grid">
              {meta.tutorialCats.map((cat) => (
                <CatButton
                  key={cat}
                  label={cat}
                  emoji={TUTORIAL_CAT_EMOJI[cat] || DEFAULT_EMOJI}
                  count={tutorialCatCount(cat)}
                  active={tutorialCatFilter === cat}
                  onClick={() => setTutorialCatFilter((p) => (p === cat ? null : cat))}
                />
              ))}
            </div>
          </div>
        )}

        {filters.tutorials && visibleTutorials.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">
              Tutorials {tutorialCatFilter && <span className="srch-active-cat">· {tutorialCatFilter}</span>}
            </h2>
            <div className="group-container">
              {visibleTutorials.map((tutorial) => {
                const platform = getPlatformInfo(tutorial.tutorialurl, "tutorial");
                return (
                  <div className="group-card tutorial-card" key={tutorial.tutorialid}>
                    <Avatar src={tutorial.useravatar} username={tutorial.username} />
                    {tutorial.tutorialimage && (
                      <img src={tutorial.tutorialimage} alt={tutorial.tutorialtitle || "Tutorial thumbnail"} className="tutorial-card-thumbnail" />
                    )}
                    {tutorial.tutorialtitle && <h3>{hl(tutorial.tutorialtitle, hlTerms)}</h3>}
                    {tutorial.tutorialdescription && (
                      <p className="tutorial-card-description">{hl(tutorial.tutorialdescription, hlTerms)}</p>
                    )}
                    {tutorial.username && (
                      <p className="tutorial-card-submitter">
                        Shared by <Link to={`/public/${tutorial.username}`}>{tutorial.username}</Link>
                      </p>
                    )}
                    {tutorial.tutorialcategory && (
                      <span className="tutorial-card-tag">{hl(tutorial.tutorialcategory, hlTerms)}</span>
                    )}
                    <a href={tutorial.tutorialurl} target="_blank" rel="noopener noreferrer">
                      <button className="button">Watch on {platform.label}</button>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TEMPLATES — category buttons
        ══════════════════════════════════════════════ */}
        {filters.templates && searched && meta.templateCats.length > 0 && (
          <div className="srch-cat-section">
            <p className="srch-cat-heading">Filter templates by category</p>
            <div className="srch-cat-grid">
              {meta.templateCats.map((cat) => (
                <CatButton
                  key={cat}
                  label={cat}
                  emoji={TEMPLATE_CAT_EMOJI[cat] || DEFAULT_EMOJI}
                  count={templateCatCount(cat)}
                  active={templateCatFilter === cat}
                  onClick={() => setTemplateCatFilter((p) => (p === cat ? null : cat))}
                />
              ))}
            </div>
          </div>
        )}

        {filters.templates && visibleTemplates.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">
              Templates {templateCatFilter && <span className="srch-active-cat">· {templateCatFilter}</span>}
            </h2>
            <div className="group-container">
              {visibleTemplates.map((template) => {
                const platform = getPlatformInfo(template.templateurl, "template");
                return (
                  <div className="group-card tutorial-card" key={template.templateid}>
                    <Avatar src={template.useravatar} username={template.username} />
                    {template.templateimage && (
                      <img src={template.templateimage} alt={template.templatetitle || "Template thumbnail"} className="tutorial-card-thumbnail" />
                    )}
                    {template.templatetitle && <h3>{hl(template.templatetitle, hlTerms)}</h3>}
                    {template.templatedescription && (
                      <p className="tutorial-card-description">{hl(template.templatedescription, hlTerms)}</p>
                    )}
                    {template.templateisfree != null && (
                      <span className={`template-price-badge ${template.templateisfree ? "template-price-badge--free" : "template-price-badge--paid"}`}>
                        {template.templateisfree ? "Free" : "Paid"}
                      </span>
                    )}
                    {template.username && (
                      <p className="tutorial-card-submitter">
                        Shared by <Link to={`/public/${template.username}`}>{template.username}</Link>
                      </p>
                    )}
                    {template.templatecategory && (
                      <span className="tutorial-card-tag">{hl(template.templatecategory, hlTerms)}</span>
                    )}
                    <a href={template.templateurl} target="_blank" rel="noopener noreferrer">
                      <button className="button">View Template</button>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <br /><br /><br />
        <Footer />
      </div>
    </div>
  );
}

export default Search;