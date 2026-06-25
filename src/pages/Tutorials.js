import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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

const getPlatformInfo = (url) => {
  if (!url) return { label: "Link", icon: null };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platforms = {
      "youtube.com":       { label: "YouTube",      icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "youtu.be":          { label: "YouTube",      icon: "https://www.youtube.com/favicon.ico",       color: "#FF0000" },
      "vimeo.com":         { label: "Vimeo",        icon: "https://vimeo.com/favicon.ico",             color: "#1AB7EA" },
      "instructables.com": { label: "Instructables",icon: "https://www.instructables.com/favicon.ico", color: "#F4A227" },
      "tiktok.com":        { label: "TikTok",       icon: "https://www.tiktok.com/favicon.ico",        color: "#010101" },
      "twitch.tv":         { label: "Twitch",       icon: "https://www.twitch.tv/favicon.ico",         color: "#9146FF" },
      "patreon.com":       { label: "Patreon",      icon: "https://www.patreon.com/favicon.ico",       color: "#FF424D" },
      "skillshare.com":    { label: "Skillshare",   icon: "https://www.skillshare.com/favicon.ico",    color: "#002333" },
      "udemy.com":         { label: "Udemy",        icon: "https://www.udemy.com/favicon.ico",         color: "#A435F0" },
    };
    return platforms[host] || { label: host, icon: null, color: "#888" };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

const CATEGORY_SUGGESTIONS = [
  { label: "Helmets & Masks", emoji: "🪖" },
  { label: "Armor",           emoji: "🛡️" },
  { label: "Props & Weapons", emoji: "⚔️" },
  { label: "Clothing",        emoji: "👗" },
  { label: "Wings & Tails",   emoji: "🪶" },
  { label: "Accessories",     emoji: "💍" },
  { label: "Foam",            emoji: "🧱" },
  { label: "3D Print",        emoji: "🖨️" },
  { label: "Uncategorized",   emoji: "📁" },
];

const Tutorials = () => {
  const [tutorials, setTutorials]             = useState([]);
  const [page, setPage]                       = useState(1);
  const [limit, setLimit]                     = useState(10);
  const [totalTutorials, setTotalTutorials]   = useState(0);

  // Independent filter state — all stack together with AND logic
  const [search, setSearch]                   = useState("");
  const [activeCategory, setActiveCategory]   = useState("");
  const [creatorFilter, setCreatorFilter]     = useState("");

  const navigate       = useNavigate();
  const token          = localStorage.getItem("token");
  const apiUrl         = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetchAllTutorials = async () => {
      try {
        const response = await axios.get(`${apiUrl}/tutorials`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setTutorials(response.data.tutorials || []);
        setTotalTutorials(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllTutorials();
  }, [navigate, token, limit, page, apiUrl]);

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

  // All filters applied together with AND logic
  const filtered = useMemo(() => {
    const q       = search.trim().toLowerCase();
    const cat     = activeCategory.toLowerCase();
    const creator = creatorFilter.trim().toLowerCase();

    return tutorials.filter((t) => {
      const matchesSearch = !q || [
        t.tutorialtitle,
        t.tutorialdescription,
      ].some((f) => f && f.toLowerCase().includes(q));

      const tutorialCat = (t.tutorialcategory || "Uncategorized").toLowerCase();
      const matchesCat  = !cat || tutorialCat === cat;

      const matchesCreator = !creator || (t.username && t.username.toLowerCase().includes(creator));

      return matchesSearch && matchesCat && matchesCreator;
    });
  }, [tutorials, search, activeCategory, creatorFilter]);

  const toggleCategory = (label) =>
    setActiveCategory((prev) => (prev === label ? "" : label));

  const clearAll = () => {
    setSearch("");
    setActiveCategory("");
    setCreatorFilter("");
  };

  const isFiltering = search.trim() !== "" || activeCategory !== "" || creatorFilter.trim() !== "";

  const totalPages = Math.ceil(totalTutorials / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
        {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
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

        {/* ── Filter panel ── */}
        <div className="tl-filter-panel">

          {/* Row 1: title search + creator search */}
          <div className="tl-filter-row">
            <div className="tl-filter-field">
              <label className="tl-filter-label">Title / Description</label>
              <input
                className="tl-search-input"
                type="text"
                placeholder="e.g. flower, helmet, iron man…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="tl-filter-field">
              <label className="tl-filter-label">Creator</label>
              <input
                className="tl-search-input"
                type="text"
                placeholder="e.g. sksprops"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: category tiles — always visible so they stack with text filters */}
          <div className="tl-filter-row tl-filter-row--cats">
            <label className="tl-filter-label">Category</label>
            <div className="tl-category-grid">
              {CATEGORY_SUGGESTIONS.map(({ label, emoji }) => (
                <button
                  key={label}
                  className={`tl-category-tile${activeCategory === label ? " tl-category-tile--active" : ""}`}
                  onClick={() => toggleCategory(label)}
                >
                  <span className="tl-category-emoji">{emoji}</span>
                  <span className="tl-category-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active filter summary */}
          {isFiltering && (
            <div className="tl-active-filter">
              {activeCategory && (
                <span className="tl-filter-pill">
                  Category: <strong>{activeCategory}</strong>
                  <button className="tl-filter-pill-x" onClick={() => setActiveCategory("")}>✕</button>
                </span>
              )}
              {search.trim() && (
                <span className="tl-filter-pill">
                  Title: <strong>"{search.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => setSearch("")}>✕</button>
                </span>
              )}
              {creatorFilter.trim() && (
                <span className="tl-filter-pill">
                  Creator: <strong>"{creatorFilter.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => setCreatorFilter("")}>✕</button>
                </span>
              )}
              <span className="tl-filter-count">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
              <button className="tl-clear-btn" onClick={clearAll}>✕ Clear all</button>
            </div>
          )}
        </div>

        <PaginationBar />

        <div className="group-container">
          {filtered.length === 0 ? (
            <p className="tl-no-results">
              No tutorials match your filters.{" "}
              <button className="button" onClick={clearAll}>Clear all filters</button>
            </p>
          ) : (
            filtered.map((tutorial) => {
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
                      Shared by{" "}
                      <Link to={`/public/${tutorial.userslug || tutorial.userid}`}>{tutorial.username}</Link>
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

                  {tutorial.userid === loggedInUserId && (
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

        {filtered.length > 6 && <PaginationBar />}
        <Footer />
      </div>
    </div>
  );
};

export default Tutorials;