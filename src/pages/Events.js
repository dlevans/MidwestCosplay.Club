import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter state — changes trigger a new server fetch
  const [search, setSearch] = useState("");
  const [activeState, setActiveState] = useState("");

  // Pending input values (only committed on Enter / blur to avoid a fetch per keystroke)
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  const fetchEvents = useCallback(async () => {
    if (!token) { navigate("/login"); return; }
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit,
          page,
          ...(search.trim() && { search: search.trim() }),
          ...(activeState && { state: activeState }),
        },
      });
      setEvents(response.data.events || []);
      setTotalEvents(response.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, token, apiUrl, limit, page, search, activeState]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, activeState, limit]);

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

  const commitSearch = () => setSearch(searchInput);

  const toggleState = (abbr) => {
    setActiveState((prev) => (prev === abbr ? "" : abbr));
  };

  const clearAll = () => {
    setSearchInput("");
    setSearch("");
    setActiveState("");
  };

  const isFiltering = search.trim() !== "" || activeState !== "";
  const totalPages = Math.ceil(totalEvents / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        ← Prev
      </button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
        Next →
      </button>
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

        {/* ── Filter panel ── */}
        <div className="tl-filter-panel">

          {/* Row 1: name/city search */}
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

          {/* Row 2: state tiles */}
          <div className="tl-filter-row tl-filter-row--cats">
            <label className="tl-filter-label">State</label>
            <div className="tl-category-grid">
              {MIDWEST_STATES.map(([abbr, name]) => (
                <button
                  key={abbr}
                  className={`tl-category-tile${activeState === abbr ? " tl-category-tile--active" : ""}`}
                  onClick={() => toggleState(abbr)}
                >
                  <span className="tl-category-emoji">📍</span>
                  <span className="tl-category-label">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active filter summary + clear */}
          {isFiltering && (
            <div className="tl-active-filter">
              {activeState && (
                <span className="tl-filter-pill">
                  State: <strong>{MIDWEST_STATES.find(([a]) => a === activeState)?.[1]}</strong>
                  <button className="tl-filter-pill-x" onClick={() => setActiveState("")}>✕</button>
                </span>
              )}
              {search.trim() && (
                <span className="tl-filter-pill">
                  Search: <strong>"{search.trim()}"</strong>
                  <button className="tl-filter-pill-x" onClick={() => { setSearch(""); setSearchInput(""); }}>✕</button>
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