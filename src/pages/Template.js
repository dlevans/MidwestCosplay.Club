import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  "Uncategorized":         "📁",
  "Accessories & Jewelry": "💍",
  "Armor & Chest Pieces":  "🛡️",
  "General / Other":       "🗂️",
  "Helmets & Headgear":   "🪖",
  "Props & Weapons":       "⚔️",
  "Clothing":              "👗",
  "Wings & Tails":         "🪶",
  "Foam":                  "🧱",
  "3D Print":              "🖨️",
  "Shoes & Footwear":     "👠",
  "Tails & Ears":          "🦊",
  "Bags & Pouches":        "👜",
};
const DEFAULT_EMOJI = "🏷️";

const Templates = () => {
  const [templates, setTemplates]         = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
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
  // ?page=2&perpage=50&category=Armor+%26+Chest+Pieces&search=iron+man&creator=sksprops&free=true
  const urlParams = new URLSearchParams(location.search);
  const page          = parseInt(urlParams.get("page"), 10) || 1;
  const limit         = parseInt(urlParams.get("perpage"), 10) || 25;
  const search        = urlParams.get("search") || "";
  const creatorFilter = urlParams.get("creator") || "";
  const freeOnly      = urlParams.get("free") === "true";
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
      } else if (value === null || value === undefined || value === "" || value === false) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const qs = next.toString();
    navigate(`/templates${qs ? `?${qs}` : ""}`, { replace: opts.replace ?? true });
  };

  // Fetch all categories once on mount — independent of pagination
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}/templates/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setAllCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, [apiUrl, token]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, page };
      if (search.trim())              params.search   = search.trim();
      if (activeCategories.size > 0)  params.category = [...activeCategories].join(",");
      if (creatorFilter.trim())       params.creator  = creatorFilter.trim();
      if (freeOnly)                   params.free     = true;

      const response = await axios.get(`${apiUrl}/templates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      setTemplates(response.data.templates || []);
      setTotalTemplates(response.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, limit, page, search, activeCategories, creatorFilter, freeOnly]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

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

  const commitSearch  = () => updateParams({ search: searchInput.trim(), page: 1 });
  const commitCreator = () => updateParams({ creator: creatorInput.trim(), page: 1 });

  const toggleCategory = (label) => {
    const next = new Set(activeCategories);
    next.has(label) ? next.delete(label) : next.add(label);
    updateParams({ category: next, page: 1 });
  };

  const toggleFreeOnly = () => updateParams({ free: !freeOnly ? "true" : null, page: 1 });

  const goToPage    = (n) => updateParams({ page: n }, { replace: false });
  const changeLimit = (n) => updateParams({ perpage: n, page: 1 });

  const clearAll = () => {
    setSearchInput("");
    setCreatorInput("");
    navigate("/templates", { replace: true });
  };

  const isFiltering = search.trim() !== "" || activeCategories.size > 0 || creatorFilter.trim() !== "" || freeOnly;
  const totalPages  = Math.ceil(totalTemplates / limit);

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
            <div className="tl-filter-field tl-filter-field--toggle">
              <label className="tl-filter-label">Free only</label>
              <button
                className={`tl-toggle-btn${freeOnly ? " tl-toggle-btn--on" : ""}`}
                onClick={toggleFreeOnly}
              >
                {freeOnly ? "✓ Free" : "All"}
              </button>
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
              {freeOnly && (
                <span className="tl-filter-pill">
                  Free only
                  <button className="tl-filter-pill-x" onClick={() => updateParams({ free: null, page: 1 })}>✕</button>
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
                      Shared by <Link to={`/public/${template.username}`}>{template.username}</Link>
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