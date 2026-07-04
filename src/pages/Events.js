import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const getUserId = (token) => {
  try {
    return token ? JSON.parse(atob(token.split(".")[1])).id : null;
  } catch (e) {
    return null;
  }
};

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

const Events = () => {
  const [events, setEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(false);

  // Uncommitted text-input state (committed to the URL on blur/Enter)
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  // ── URL is the source of truth for pagination + filters ────────────────
  // ?page=2&perpage=50&state=KS,MO&search=anime
  const urlParams = new URLSearchParams(location.search);
  const page   = parseInt(urlParams.get("page"), 10) || 1;
  const limit  = parseInt(urlParams.get("perpage"), 10) || 25;
  const search = urlParams.get("search") || "";
  const activeStates = useMemo(() => {
    const s = urlParams.get("state");
    return s ? new Set(s.split(",").filter(Boolean)) : new Set();
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the raw search input in sync whenever the committed URL value changes
  // (covers direct links, browser back/forward, and "Clear all")
  useEffect(() => { setSearchInput(search); }, [search]);

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
    navigate(`/events${qs ? `?${qs}` : ""}`, { replace: opts.replace ?? true });
  };

  const fetchEvents = useCallback(async () => {
    if (!token) { navigate("/login"); return; }
    setLoading(true);
    try {
      const params = { limit, page };
      if (search.trim())         params.search = search.trim();
      if (activeStates.size > 0) params.state  = [...activeStates].join(",");

      const response = await axios.get(`${apiUrl}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setEvents(response.data.events || []);
      setTotalEvents(response.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, token, apiUrl, limit, page, search, activeStates]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (eventid) => {
    if (!window.confirm("Remove this event from your site?")) return;
    try {
      await axios.delete(`${apiUrl}/events/${eventid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents((prev) => prev.filter((g) => g.eventid !== eventid));
      setTotalEvents((prev) => prev - 1);
    } catch (err) {
      console.error("Delete event error:", err);
    }
  };

  const commitSearch = () => updateParams({ search: searchInput.trim(), page: 1 });

  const toggleState = (abbr) => {
    const next = new Set(activeStates);
    next.has(abbr) ? next.delete(abbr) : next.add(abbr);
    updateParams({ state: next, page: 1 });
  };

  const goToPage    = (n) => updateParams({ page: n }, { replace: false });
  const changeLimit = (n) => updateParams({ perpage: n, page: 1 });

  const clearAll = () => {
    setSearchInput("");
    navigate("/events", { replace: true });
  };

  const isFiltering = search.trim() !== "" || activeStates.size > 0;
  const totalPages = Math.ceil(totalEvents / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => changeLimit(Number(e.target.value))}>
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button disabled={page === 1} onClick={() => goToPage(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next →</button>
    </div>
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Events</title>
        <meta name="description" content="Event landing page for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Events ✦</h1>
        </div>

        {loggedInUserId && (
          <Link to="/manageevent">
            <button className="button">Add an Event</button>
          </Link>
        )}

        <div className="tl-filter-panel">
          <div className="tl-filter-row">
            <div className="tl-filter-field">
              <label className="tl-filter-label">Search</label>
              <input
                className="tl-search-input"
                type="text"
                placeholder="e.g. anime, Chicago, convention…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSearch()}
                onBlur={commitSearch}
              />
            </div>
          </div>

          <div className="tl-filter-row tl-filter-row--cats">
            <label className="tl-filter-label">State — select one or more</label>
            <div className="tl-category-grid">
              {MIDWEST_STATES.map(([abbr, name]) => (
                <button
                  key={abbr}
                  className={`tl-category-tile${activeStates.has(abbr) ? " tl-category-tile--active" : ""}`}
                  onClick={() => toggleState(abbr)}
                >
                  <span className="tl-category-emoji">📍</span>
                  <span className="tl-category-label">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {isFiltering && (
            <div className="tl-active-filter">
              {[...activeStates].map((abbr) => (
                <span key={abbr} className="tl-filter-pill">
                  State: <strong>{MIDWEST_STATES.find(([a]) => a === abbr)?.[1]}</strong>
                  <button className="tl-filter-pill-x" onClick={() => toggleState(abbr)}>✕</button>
                </span>
              ))}
              {search.trim() && (
                <span className="tl-filter-pill">
                  Search: <strong>"{search.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => updateParams({ search: null, page: 1 })}>✕</button>
                </span>
              )}
              <span className="tl-filter-count">
                {totalEvents} result{totalEvents !== 1 ? "s" : ""}
              </span>
              <button className="tl-clear-btn" onClick={clearAll}>✕ Clear all</button>
            </div>
          )}
        </div>

        <PaginationBar />

        <div className="event-container">
          {loading ? (
            <p className="tl-no-results">Loading…</p>
          ) : events.length === 0 ? (
            <p className="tl-no-results">
              No events match your filters.{" "}
              <button className="button" onClick={clearAll}>Clear all filters</button>
            </p>
          ) : (
            events.map((event) => (
              <div className="event-card" key={event.eventid}>
                {event.eventimage && (
                  <img src={event.eventimage} alt={`${event.eventname}'s photo`} />
                )}
                {event.eventname && <h3>{event.eventname}</h3>}
                <h4>{event.eventcity}, {event.eventstate}</h4>
                <Link to={`/public/event/${event.eventslug || event.eventid}`}>
                  <button className="button">View Event</button>
                </Link>
                <a href={event.eventwebsite} target="_blank" rel="noopener noreferrer">
                  <button className="button">Visit Website</button>
                </a>
                {event.eventownerid === loggedInUserId && (
                  <>
                    <Link to={`/manageevent/${event.eventid}`}>
                      <button className="button">Edit</button>
                    </Link>
                    <button className="button" type="button" onClick={() => handleDelete(event.eventid)}>Delete</button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {totalEvents > limit && <PaginationBar />}
        <Footer />
      </div>
    </div>
  );
};

export default Events;