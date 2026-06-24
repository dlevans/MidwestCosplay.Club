import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground.js";

// ─── Shared platform helper ───────────────────────────────────────────────────
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
      "skillshare.com":    { label: "Skillshare",    icon: "https://www.skillshare.com/favicon.ico",    color: "#002333" },
      "udemy.com":         { label: "Udemy",         icon: "https://www.udemy.com/favicon.ico",         color: "#A435F0" },
    };

    const templatePlatforms = {
      "etsy.com":          { label: "Etsy",          icon: "https://www.etsy.com/favicon.ico",          color: "#F56400" },
      "patreon.com":       { label: "Patreon",       icon: "https://www.patreon.com/favicon.ico",       color: "#FF424D" },
      "gumroad.com":       { label: "Gumroad",       icon: "https://gumroad.com/favicon.ico",           color: "#FF90E8" },
      "ko-fi.com":         { label: "Ko-fi",         icon: "https://ko-fi.com/favicon.ico",             color: "#29ABE0" },
      "sellfy.com":        { label: "Sellfy",        icon: "https://sellfy.com/favicon.ico",            color: "#21C45D" },
      "redbubble.com":     { label: "Redbubble",     icon: "https://www.redbubble.com/favicon.ico",     color: "#E41321" },
      "instructables.com": { label: "Instructables", icon: "https://www.instructables.com/favicon.ico", color: "#F4A227" },
      "deviantart.com":    { label: "DeviantArt",    icon: "https://www.deviantart.com/favicon.ico",    color: "#05CC47" },
      "pinterest.com":     { label: "Pinterest",     icon: "https://www.pinterest.com/favicon.ico",     color: "#E60023" },
      "drive.google.com":  { label: "Google Drive",  icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png", color: "#4285F4" },
      "dropbox.com":       { label: "Dropbox",       icon: "https://www.dropbox.com/favicon.ico",       color: "#0061FF" },
    };

    const map = type === "template" ? templatePlatforms : tutorialPlatforms;
    return map[host] || {
      label: host,
      icon: null,  // unknown domain — skip favicon, just show text label
      color: "#888",
    };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

// ─── Filter toggle pill ───────────────────────────────────────────────────────
const FilterToggle = ({ label, active, onClick }) => (
  <button
    type="button"
    className={`search-filter-toggle ${active ? "search-filter-toggle--active" : ""}`}
    onClick={onClick}
  >
    {label}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
function Search() {
  const location  = useLocation();
  const searchRef = useRef(null);

  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState({ users: [], groups: [], tutorials: [], templates: [] });
  const [searched, setSearched] = useState(false);
  const [shaking,  setShaking]  = useState(false);

  const [filters, setFilters] = useState({
    users:     true,
    groups:    true,
    tutorials: true,
    templates: true,
  });

  const apiUrl = process.env.REACT_APP_API_URL;

  // ── Derived visible sets ─────────────────────────────────────────────────
  const visible = {
    users:     filters.users     ? results.users     : [],
    groups:    filters.groups    ? results.groups    : [],
    tutorials: filters.tutorials ? results.tutorials : [],
    templates: filters.templates ? results.templates : [],
  };

  const totalVisible =
    visible.users.length + visible.groups.length +
    visible.tutorials.length + visible.templates.length;

  const nothingFound = searched && totalVisible === 0;

  useEffect(() => {
    if (nothingFound) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
  }, [nothingFound]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("query") || "";
    setQuery(searchQuery);
    if (searchQuery) fetchResults(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const fetchResults = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    try {
      const { data } = await axios.get(
        `${apiUrl}/search?query=${encodeURIComponent(searchQuery.trim())}`
      );
      setResults({
        users:     Array.isArray(data.users)     ? data.users     : [],
        groups:    Array.isArray(data.groups)    ? data.groups    : [],
        tutorials: Array.isArray(data.tutorials) ? data.tutorials : [],
        templates: Array.isArray(data.templates) ? data.templates : [],
      });
      setSearched(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResults({ users: [], groups: [], tutorials: [], templates: [] });
      setSearched(true);
    }
  }, [apiUrl]);

  const handleInputChange = (e) => setQuery(e.target.value);
  const handleSearchClick = () => fetchResults(query);
  const handleKeyDown     = (e) => { if (e.key === "Enter") fetchResults(query); };
  const toggleFilter      = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Keyword highlight ────────────────────────────────────────────────────
  const hl = (text, q) => {
    if (!text) return "";
    if (!q)    return text;
    try {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      const parts = String(text).split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase()
          ? <span key={i} className="search-highlight">{part}</span>
          : part
      );
    } catch { return text; }
  };

  // ── Count label helper ───────────────────────────────────────────────────
  const countLabel = (key, label) =>
    `${label}${results[key].length ? ` (${results[key].length})` : ""}`;

  // ── Shared submitter avatar ──────────────────────────────────────────────
  const Avatar = ({ src, username }) =>
    src ? (
      <img src={src} alt={`${username || "User"}'s avatar`} className="tutorial-card-avatar" />
    ) : (
      <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
        {(username || "?")[0].toUpperCase()}
      </div>
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
            placeholder="Search members, groups, tutorials, templates…"
            ref={searchRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <button className="button" type="button" onClick={handleSearchClick}>
            Search
          </button>
        </div>

        {/* ── Filter toggles ── */}
        <div className="search-filter-row">
          <FilterToggle label={countLabel("users",     "Everyone")}  active={filters.users}     onClick={() => toggleFilter("users")} />
          <FilterToggle label={countLabel("groups",    "Groups")}    active={filters.groups}    onClick={() => toggleFilter("groups")} />
          <FilterToggle label={countLabel("tutorials", "Tutorials")} active={filters.tutorials} onClick={() => toggleFilter("tutorials")} />
          <FilterToggle label={countLabel("templates", "Templates")} active={filters.templates} onClick={() => toggleFilter("templates")} />
        </div>

        {/* ── Nothing found ── */}
        {nothingFound && (
          <div className={`search-empty ${shaking ? "search-empty--shake" : ""}`}>
            <span className="search-empty-icon">✦</span>
            <p>Nothing found for <strong>"{query}"</strong></p>
            <p className="search-empty-sub">Try different keywords, or check your filters above.</p>
          </div>
        )}

        {/* ── Groups ── */}
        {visible.groups.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">Groups</h2>
            <div className="group-container">
              {visible.groups.map((group) => (
                <div className="group-card" key={group.groupid}>
                  {group.groupimage && (
                    <img src={group.groupimage} alt={`${group.groupname}'s photo`} />
                  )}
                  {group.groupname && <h3>{hl(group.groupname, query)}</h3>}
                  <h4>{group.groupcity}, {group.groupstate}</h4>
                  <Link to={`/public/group/${group.groupslug || group.groupid}`}>
                    <button className="button">View Group</button>
                  </Link>
                  <a href={group.groupwebsite} target="_blank" rel="noopener noreferrer">
                    <button className="button">Visit Website</button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── People ── */}
        {visible.users.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">People</h2>
            <div className="user-container">
              {visible.users.map((user) => {
                const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ");
                return (
                  <div className="search-user-card" key={user.id}>
                    <div className="search-user-header">
                      {user.image && <img src={user.image} alt={`${user.username}'s avatar`} />}
                      <div className="search-user-name">
                        {user.username && <h3>{hl(user.username, query)}</h3>}
                        {fullName      && <p>{hl(fullName, query)}</p>}
                      </div>
                    </div>
                    {user.imawhat && (
                      <div className="search-field">
                        <div className="search-field-label">I am a</div>
                        <div className="search-tag-row">
                          {user.imawhat.split(",").map((role, i) => (
                            <span className="search-tag" key={i}>{hl(role.trim(), query)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.complete && (
                      <div className="search-field">
                        <div className="search-field-label">Completed Cosplays</div>
                        <div className="search-tag-row">
                          {user.complete.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>{hl(item.trim(), query)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.inprogress && (
                      <div className="search-field">
                        <div className="search-field-label">In Progress</div>
                        <div className="search-tag-row">
                          {user.inprogress.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>{hl(item.trim(), query)}</span>
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

        {/* ── Tutorials ── */}
        {visible.tutorials.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">Tutorials</h2>
            <div className="group-container">
              {visible.tutorials.map((tutorial) => {
                const platform = getPlatformInfo(tutorial.tutorialurl, "tutorial");
                return (
                  <div className="group-card tutorial-card" key={tutorial.tutorialid}>
                    {/* User avatar — always shown */}
                    <Avatar src={tutorial.useravatar} username={tutorial.username} />
                    {/* Custom thumbnail — shown below avatar if uploaded */}
                    {tutorial.tutorialimage && (
                      <img
                        src={tutorial.tutorialimage}
                        alt={tutorial.tutorialtitle || "Tutorial thumbnail"}
                        className="tutorial-card-thumbnail"
                      />
                    )}
                    {tutorial.tutorialtitle && <h3>{hl(tutorial.tutorialtitle, query)}</h3>}
                    {tutorial.tutorialdescription && (
                      <p className="tutorial-card-description">{hl(tutorial.tutorialdescription, query)}</p>
                    )}
                    {tutorial.username && (
                      <p className="tutorial-card-submitter">
                        Shared by <Link to={`/public/${tutorial.username}`}>{tutorial.username}</Link>
                      </p>
                    )}
                    {tutorial.tutorialcategory && (
                      <span className="tutorial-card-tag">{hl(tutorial.tutorialcategory, query)}</span>
                    )}
                    <a href={tutorial.tutorialurl} target="_blank" rel="noopener noreferrer">
                      <button className="button">Watch Tutorial</button>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Templates ── */}
        {visible.templates.length > 0 && (
          <div className="search-section">
            <h2 className="search-section-heading">Templates</h2>
            <div className="group-container">
              {visible.templates.map((template) => {
                const platform = getPlatformInfo(template.templateurl, "template");
                return (
                  <div className="group-card tutorial-card" key={template.templateid}>
                    {/* User avatar — always shown */}
                    <Avatar src={template.useravatar} username={template.username} />
                    {/* Custom thumbnail — shown below avatar if uploaded */}
                    {template.templateimage && (
                      <img
                        src={template.templateimage}
                        alt={template.templatetitle || "Template thumbnail"}
                        className="tutorial-card-thumbnail"
                      />
                    )}

                    {template.templatetitle && <h3>{hl(template.templatetitle, query)}</h3>}
                    {template.templatedescription && (
                      <p className="tutorial-card-description">{hl(template.templatedescription, query)}</p>
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
                      <span className="tutorial-card-tag">{hl(template.templatecategory, query)}</span>
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