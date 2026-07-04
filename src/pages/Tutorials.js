import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";

const getPlatformInfo = (url) => {
  if (!url) return { label: "Link", icon: null };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platforms = {
      "youtube.com":       { label: "YouTube",       icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "youtu.be":          { label: "YouTube",       icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "vimeo.com":         { label: "Vimeo",         icon: "https://vimeo.com/favicon.ico",             color: "#1AB7EA" },
      "instructables.com": { label: "Instructables", icon: "https://www.instructables.com/favicon.ico", color: "#F4A227" },
      "tiktok.com":        { label: "TikTok",        icon: "https://www.tiktok.com/favicon.ico",        color: "#010101" },
      "twitch.tv":         { label: "Twitch",        icon: "https://www.twitch.tv/favicon.ico",         color: "#9146FF" },
      "patreon.com":       { label: "Patreon",       icon: "https://www.patreon.com/favicon.ico",       color: "#FF424D" },
      "skillshare.com":    { label: "Skillshare",    icon: "https://www.skillshare.com/favicon.ico",    color: "#002333" },
      "udemy.com":         { label: "Udemy",         icon: "https://www.udemy.com/favicon.ico",         color: "#A435F0" },
    };
    return platforms[host] || { label: host, icon: null, color: "#888" };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

const CATEGORY_EMOJI = {
  "Uncategorized":         "📁",
  "Armor":                 "🛡️",
  "Electronics & LEDs":   "💡",
  "Foam Crafting":         "🧱",
  "General Crafting":      "🎨",
  "Other":                 "🗂️",
  "Props & Weapons":       "⚔️",
  "Clothing":              "👗",
  "Wings & Tails":         "🪶",
  "Helmets & Headgear":   "🪖",
  "Accessories & Jewelry": "💍",
  "3D Print":              "🖨️",
  "Shoes & Footwear":     "👠",
  "Tails & Ears":          "🦊",
  "Bags & Pouches":        "👜",
};
const DEFAULT_EMOJI = "🏷️";

const Tutorials = () => {
  const [tutorials, setTutorials]         = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading]             = useState(false);

  // Uncommitted text-input state (committed to the URL on blur/Enter)
  const [searchInput, setSearchInput]     = useState("");
  const [creatorInput, setCreatorInput]   = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const token    = localStorage.getItem("token");
  const apiUrl   = process.env.REACT_APP_API_URL;

  const getPayload = (t) => {
    try { return t ? JSON.parse(atob(t.split(".")[1])) : null; }
    catch { return null; }
  };
  const payload        = getPayload(token);
  const loggedInUserId = payload?.id ?? null;
  const isAdmin        = payload?.is_admin ?? false;

  // ── URL is the source of truth for pagination + filters ────────────────
  // ?page=2&perpage=50&category=Armor,Foam+Crafting&search=iron+man&creator=sksprops
  const urlParams = new URLSearchParams(location.search);
  const page          = parseInt(urlParams.get("page"), 10) || 1;
  const limit         = parseInt(urlParams.get("perpage"), 10) || 25;
  const search        = urlParams.get("search") || "";
  const creatorFilter = urlParams.get("creator") || "";
  const activeCategories = useMemo(() => {
    const c = urlParams.get("category");
    return c ? new Set(c.split(",").filter(Boolean)) : new Set();
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the raw text inputs in sync whenever the committed URL value changes
  // (covers direct links, browser back/forward, and "Clear all")
  useEffect(() => { setSearchInput(search); }, [search]);
  useEffect(() => { setCreatorInput(creatorFilter); }, [creatorFilter]);

  const updateParams = (updates, opts = {}) => {
    const next = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value instanceof Set) {
        if (value.size === 0) next.delete(key);
        else next.set(key, [...value].join(","));
      } else if (value === null || value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const qs = next.toString();
    navigate(`/tutorials${qs ? `?${qs}` : ""}`, { replace: opts.replace ?? true });
  };

  // Fetch all categories once on mount — independent of pagination
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}/tutorials/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setAllCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, [apiUrl, token]);

  const [totalTutorials, setTotalTutorials] = useState(0);

  const fetchTutorials = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, page };
      if (search.trim())              params.search   = search.trim();
      if (activeCategories.size > 0)  params.category = [...activeCategories].join(",");
      if (creatorFilter.trim())       params.creator  = creatorFilter.trim();

      const response = await axios.get(`${apiUrl}/tutorials`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      setTutorials(response.data.tutorials || []);
      setTotalTutorials(response.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, limit, page, search, activeCategories, creatorFilter]);

  useEffect(() => { fetchTutorials(); }, [fetchTutorials]);

  const handleDelete = async (tutorialid) => {
    if (!window.confirm("Remove this tutorial?")) return;
    try {
      await axios.delete(`${apiUrl}/tutorials/${tutorialid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTutorials((prev) => prev.filter((t) => t.tutorialid !== tutorialid));
      setTotalTutorials((prev) => prev - 1);
    } catch (err) {
      console.error("Delete tutorial error:", err);
    }
  };

  const commitSearch  = () => updateParams({ search: searchInput.trim(), page: 1 });
  const commitCreator = () => updateParams({ creator: creatorInput.trim(), page: 1 });

  const toggleCategory = (label) => {
    const next = new Set(activeCategories);
    next.has(label) ? next.delete(label) : next.add(label);
    updateParams({ category: next, page: 1 });
  };

  const goToPage    = (n) => updateParams({ page: n }, { replace: false });
  const changeLimit = (n) => updateParams({ perpage: n, page: 1 });

  const clearAll = () => {
    setSearchInput("");
    setCreatorInput("");
    navigate("/tutorials", { replace: true });
  };

  const isFiltering = search.trim() !== "" || activeCategories.size > 0 || creatorFilter.trim() !== "";
  const totalPages  = Math.ceil(totalTutorials / limit);

  // Derive sorted category list from the dedicated /categories fetch
  const categories = useMemo(() => {
    if (allCategories.length > 0) return allCategories;
    return [];
  }, [allCategories]);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => changeLimit(Number(e.target.value))}>
        {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <button disabled={page === 1} onClick={() => goToPage(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next →</button>
    </div>
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Tutorials</title>
        <meta name="MidwestCosplay Tutorials" content="Tutorial links shared by MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Tutorials ✦</h1>
        </div>

        {loggedInUserId && (
          <Link to="/addtutorial">
            <button className="button">Add a Tutorial</button>
          </Link>
        )}

        <div className="tl-filter-panel">
          <div className="tl-filter-row">
            <div className="tl-filter-field">
              <label className="tl-filter-label">Title / Description</label>
              <input
                className="tl-search-input"
                type="text"
                placeholder="e.g. flower, helmet, iron man…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSearch()}
                onBlur={commitSearch}
              />
            </div>
            <div className="tl-filter-field">
              <label className="tl-filter-label">Creator</label>
              <input
                className="tl-search-input"
                type="text"
                placeholder="e.g. sksprops"
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitCreator()}
                onBlur={commitCreator}
              />
            </div>
          </div>

          <div className="tl-filter-row tl-filter-row--cats">
            <label className="tl-filter-label">Category — select one or more</label>
            <div className="tl-category-grid">
              {categories.map((label) => (
                <button
                  key={label}
                  className={`tl-category-tile${activeCategories.has(label) ? " tl-category-tile--active" : ""}`}
                  onClick={() => toggleCategory(label)}
                >
                  <span className="tl-category-emoji">{CATEGORY_EMOJI[label] || DEFAULT_EMOJI}</span>
                  <span className="tl-category-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {isFiltering && (
            <div className="tl-active-filter">
              {[...activeCategories].map((label) => (
                <span key={label} className="tl-filter-pill">
                  Category: <strong>{label}</strong>
                  <button className="tl-filter-pill-x" onClick={() => toggleCategory(label)}>✕</button>
                </span>
              ))}
              {search.trim() && (
                <span className="tl-filter-pill">
                  Title: <strong>"{search.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => updateParams({ search: null, page: 1 })}>✕</button>
                </span>
              )}
              {creatorFilter.trim() && (
                <span className="tl-filter-pill">
                  Creator: <strong>"{creatorFilter.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => updateParams({ creator: null, page: 1 })}>✕</button>
                </span>
              )}
              <span className="tl-filter-count">
                {totalTutorials} result{totalTutorials !== 1 ? "s" : ""}
              </span>
              <button className="tl-clear-btn" onClick={clearAll}>✕ Clear all</button>
            </div>
          )}
        </div>

        <PaginationBar />

        <div className="group-container">
          {loading ? (
            <p className="tl-no-results">Loading…</p>
          ) : tutorials.length === 0 ? (
            <p className="tl-no-results">
              No tutorials match your filters.{" "}
              <button className="button" onClick={clearAll}>Clear all filters</button>
            </p>
          ) : (
            tutorials.map((tutorial) => {
              const platform = getPlatformInfo(tutorial.tutorialurl);
              return (
                <div className="group-card tutorial-card" key={tutorial.tutorialid}>
                  {tutorial.useravatar ? (
                    <img src={tutorial.useravatar} alt={`${tutorial.username || "User"}'s avatar`} className="tutorial-card-avatar" />
                  ) : (
                    <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
                      {(tutorial.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  {tutorial.tutorialimage && (
                    <img src={tutorial.tutorialimage} alt={tutorial.tutorialtitle || "Tutorial thumbnail"} className="tutorial-card-thumbnail" />
                  )}
                  {tutorial.tutorialtitle && <h3>{tutorial.tutorialtitle}</h3>}
                  {tutorial.tutorialdescription && (
                    <p className="tutorial-card-description">{tutorial.tutorialdescription}</p>
                  )}
                  {tutorial.username && (
                    <p className="tutorial-card-submitter">
                      Shared by <Link to={`/public/${tutorial.userslug || tutorial.userid}`}>{tutorial.username}</Link>
                    </p>
                  )}
                  <span
                    className="tutorial-card-tag tl-category-badge"
                    title="Filter by this category"
                    onClick={() => toggleCategory(tutorial.tutorialcategory || "Uncategorized")}
                  >
                    {tutorial.tutorialcategory || "Uncategorized"}
                  </span>
                  <a href={tutorial.tutorialurl} target="_blank" rel="noopener noreferrer">
                    <button className="button">Watch on {platform.label}</button>
                  </a>
                  {(tutorial.userid === loggedInUserId || isAdmin) && (
                    <>
                      <Link to={`/addtutorial/${tutorial.tutorialid}`}>
                        <button className="button">Edit</button>
                      </Link>
                      <button className="button" type="button" onClick={() => handleDelete(tutorial.tutorialid)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalTutorials > limit && <PaginationBar />}
        <Footer />
      </div>
    </div>
  );
};

export default Tutorials;