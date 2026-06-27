import React, { useEffect, useState } from "react";
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

const Events = () => {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const fetchAllEvents = async () => {
      try {
        const response = await axios.get(`${apiUrl}/events`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setEvents(response.data.events || []);
        setTotalEvents(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllEvents();
  }, [navigate, token, limit, page]);

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

  const totalPages = Math.ceil(totalEvents / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
        {[5, 10, 20, 50].map((n) => (
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

        <PaginationBar />

        <div className="event-container">
          {events.map((event) => (
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
          ))}
        </div>

        {events.length > 6 && <PaginationBar />}

        <Footer />
      </div>
    </div>
  );
};

export default Events;