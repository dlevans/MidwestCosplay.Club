import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";

const getPlatformInfo = (url) => {
  if (!url) return { label: "Link", icon: null, color: "#888" };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platforms = {
      "etsy.com":          { label: "Etsy",         icon: "https://www.etsy.com/favicon.ico",           color: "#F56400" },
      "patreon.com":       { label: "Patreon",       icon: "https://www.patreon.com/favicon.ico",        color: "#FF424D" },
      "gumroad.com":       { label: "Gumroad",       icon: "https://gumroad.com/favicon.ico",            color: "#FF90E8" },
      "ko-fi.com":         { label: "Ko-fi",         icon: "https://ko-fi.com/favicon.ico",              color: "#29ABE0" },
      "sellfy.com":        { label: "Sellfy",        icon: "https://sellfy.com/favicon.ico",             color: "#21C45D" },
      "redbubble.com":     { label: "Redbubble",     icon: "https://www.redbubble.com/favicon.ico",      color: "#E41321" },
      "instructables.com": { label: "Instructables", icon: "https://www.instructables.com/favicon.ico",  color: "#F4A227" },
      "deviantart.com":    { label: "DeviantArt",    icon: "https://www.deviantart.com/favicon.ico",     color: "#05CC47" },
      "pinterest.com":     { label: "Pinterest",     icon: "https://www.pinterest.com/favicon.ico",      color: "#E60023" },
      "drive.google.com":  { label: "Google Drive",  icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png", color: "#4285F4" },
      "dropbox.com":       { label: "Dropbox",       icon: "https://www.dropbox.com/favicon.ico",        color: "#0061FF" },
      "sksprops.com":      { label: "SKS Props",     icon: null,                                          color: "#888" },
    };
    return platforms[host] || { label: host, icon: null, color: "#888" };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

const CATEGORY_EMOJI = {
  "Uncategorized":          "📁",
  "Accessories & Jewelry":  "💍",
  "Armor & Chest Pieces":   "🛡️",
  "General / Other":        "🗂️",
  "Helmets & Headgear":     "🪖",
  "Props & Weapons":        "⚔️",
  "Clothing":               "👗",
  "Wings & Tails":          "🪶",
  "Foam":                   "🧱",
  "3D Print":               "🖨️",
  "Shoes & Footwear":       "👠",
  "Tails & Ears":           "🦊",
  "Bags & Pouches":         "👜",
};
const DEFAULT_EMOJI = "🏷️";

const Templates = () => {
  const [templates, setTemplates]         = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [page, setPage]                   = useState(1);
  const [limit, setLimit]                 = useState(25);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [loading, setLoading]             = useState(false);

  // Filter state — each change triggers a new server fetch
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [freeOnly, setFreeOnly]           = useState(false);
  const [creatorFilter, setCreatorFilter] = useState("");

  // Pending input values — committed on Enter / blur
  const [searchInput, setSearchInput]   = useState("");
  const [creatorInput, setCreatorInput] = useState("");

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

  // Fetch categories once on mount so tiles are always populated
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}/templates/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setAllCategories(response.data.categories || []);
      } catch {
        // If no dedicated endpoint, categories will populate from first page fetch below
      }
    };
    fetchCategories();
  }, [apiUrl, token]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/templates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          limit,
          page,
          ...(search.trim()          && { search: search.trim() }),
          ...(activeCategory         && { category: activeCategory }),
          ...(freeOnly               && { free: true }),
          ...(creatorFilter.trim()   && { creator: creatorFilter.trim() }),
        },
      });
      setTemplates(response.data.templates || []);
      setTotalTemplates(response.data.total || 0);

      // Populate category tiles from response if no dedicated endpoint
      if (allCategories.length === 0 && response.data.categories) {
        setAllCategories(response.data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, limit, page, search, activeCategory, freeOnly, creatorFilter, allCategories.length]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Reset to page 1 whenever filters or limit change
  useEffect(() => { setPage(1); }, [search, activeCategory, freeOnly, creatorFilter, limit]);

  const handleDelete = async (templateid) => {
    if (!window.confirm("Remove this template?")) return;
    try {
      await axios.delete(`${apiUrl}/templates/${templateid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates((prev) => prev.filter((t) => t.templateid !== templateid));
      setTotalTemplates((prev) => prev - 1);
    } catch (err) {
      console.error("Delete template error:", err);
    }
  };

  // Derive category list from loaded templates if server doesn't provide them
  const categories = useMemo(() => {
    if (allCategories.length > 0) return allCategories;
    const cats = new Set();
    templates.forEach((t) => cats.add(t.templatecategory || "Uncategorized"));
    return Array.from(cats).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [templates, allCategories]);

  const commitSearch  = () => setSearch(searchInput);
  const commitCreator = () => setCreatorFilter(creatorInput);

  const toggleCategory = (label) =>
    setActiveCategory((prev) => (prev === label ? "" : label));

  const clearAll = () => {
    setSearchInput("");   setSearch("");
    setCreatorInput("");  setCreatorFilter("");
    setActiveCategory("");
    setFreeOnly(false);
  };

  const isFiltering = search.trim() !== "" || activeCategory !== "" || freeOnly || creatorFilter.trim() !== "";
  const totalPages  = Math.ceil(totalTemplates / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
        {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
    </div>
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Templates</title>
        <meta name="description" content="Cosplay pattern and template links shared by MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Templates ✦</h1>
        </div>

        {loggedInUserId && (
          <Link to="/addtemplate">
            <button className="button">Add a Template</button>
          </Link>
        )}

        {/* ── Filter panel ── */}
        <div className="tl-filter-panel">

          {/* Row 1: title search + creator search + free toggle */}
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

            <div className="tl-filter-field tl-filter-field--toggle">
              <label className="tl-filter-label">Free only</label>
              <button
                className={`tl-toggle-btn${freeOnly ? " tl-toggle-btn--on" : ""}`}
                onClick={() => setFreeOnly((v) => !v)}
              >
                {freeOnly ? "✓ Free" : "All"}
              </button>
            </div>
          </div>

          {/* Row 2: category tiles */}
          <div className="tl-filter-row tl-filter-row--cats">
            <label className="tl-filter-label">Category</label>
            <div className="tl-category-grid">
              {categories.map((label) => (
                <button
                  key={label}
                  className={`tl-category-tile${activeCategory === label ? " tl-category-tile--active" : ""}`}
                  onClick={() => toggleCategory(label)}
                >
                  <span className="tl-category-emoji">{CATEGORY_EMOJI[label] || DEFAULT_EMOJI}</span>
                  <span className="tl-category-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active filter summary + clear */}
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
                  <button className="tl-filter-pill-x" onClick={() => { setSearch(""); setSearchInput(""); }}>✕</button>
                </span>
              )}
              {creatorFilter.trim() && (
                <span className="tl-filter-pill">
                  Creator: <strong>"{creatorFilter.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => { setCreatorFilter(""); setCreatorInput(""); }}>✕</button>
                </span>
              )}
              {freeOnly && (
                <span className="tl-filter-pill">
                  Free only
                  <button className="tl-filter-pill-x" onClick={() => setFreeOnly(false)}>✕</button>
                </span>
              )}
              <span className="tl-filter-count">
                {totalTemplates} result{totalTemplates !== 1 ? "s" : ""}
              </span>
              <button className="tl-clear-btn" onClick={clearAll}>✕ Clear all</button>
            </div>
          )}
        </div>

        <PaginationBar />

        <div className="group-container">
          {loading ? (
            <p className="tl-no-results">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="tl-no-results">
              No templates match your filters.{" "}
              <button className="button" onClick={clearAll}>Clear all filters</button>
            </p>
          ) : (
            templates.map((template) => {
              const platform = getPlatformInfo(template.templateurl);
              return (
                <div className="group-card tutorial-card" key={template.templateid}>
                  {template.useravatar ? (
                    <img src={template.useravatar} alt={`${template.username || "User"}'s avatar`} className="tutorial-card-avatar" />
                  ) : (
                    <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
                      {(template.username || "?")[0].toUpperCase()}
                    </div>
                  )}

                  {template.templateimage && (
                    <img src={template.templateimage} alt={template.templatetitle || "Template thumbnail"} className="tutorial-card-thumbnail" />
                  )}

                  {template.templatetitle && <h3>{template.templatetitle}</h3>}

                  {template.templatedescription && (
                    <p className="tutorial-card-description">{template.templatedescription}</p>
                  )}

                  {template.templateisfree != null && (
                    <span className={`template-price-badge ${template.templateisfree ? "template-price-badge--free" : "template-price-badge--paid"}`}>
                      {template.templateisfree ? "Free" : "Paid"}
                    </span>
                  )}

                  {template.username && (
                    <p className="tutorial-card-submitter">
                      Shared by{" "}
                      <Link to={`/public/${template.username}`}>{template.username}</Link>
                    </p>
                  )}

                  <span
                    className="tutorial-card-tag tl-category-badge"
                    title="Filter by this category"
                    onClick={() => toggleCategory(template.templatecategory || "Uncategorized")}
                  >
                    {template.templatecategory || "Uncategorized"}
                  </span>

                  <a href={template.templateurl} target="_blank" rel="noopener noreferrer">
                    <button className="button">View Template</button>
                  </a>

                  {(template.userid === loggedInUserId || isAdmin) && (
                    <>
                      <Link to={`/addtemplate/${template.templateid}`}>
                        <button className="button">Edit</button>
                      </Link>
                      <button className="button" type="button" onClick={() => handleDelete(template.templateid)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalTemplates > limit && <PaginationBar />}
        <Footer />
      </div>
    </div>
  );
};

export default Templates;