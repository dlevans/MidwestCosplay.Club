import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";
import EventAttendance from "./EventAttendance";
import EventInfo from "./EventInfo";
import EventCosplanCard from "./EventCosplanCard";

const s = {
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "1.5rem 1rem",
    fontFamily: "var(--font-body, sans-serif)",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  bannerImg: {
    width: 96,
    height: 96,
    borderRadius: "var(--radius-md)",
    objectFit: "cover",
    border: "2px solid var(--border)",
    flexShrink: 0,
  },
  bannerPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: "var(--radius-md)",
    background: "var(--bg-elevated)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 36,
    color: "var(--text-muted)",
  },
  eventName: {
    fontSize: 22,
    fontWeight: 500,
    color: "var(--text-primary)",
    margin: "0 0 2px",
  },
  eventLocation: {
    fontSize: 14,
    color: "var(--text-secondary)",
    margin: "0 0 8px",
  },
  websiteBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
    textDecoration: "none",
  },
  divider: {
    height: "0.5px",
    background: "var(--border-subtle)",
    margin: "1.25rem 0",
  },
  section: { marginBottom: "1.5rem" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    margin: "0 0 10px",
  },
};

const PublicEvent = () => {
  console.log("PublicEvent.js");
  const { eventid } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventid) return;
      try {
        const response = await axios.get(`${apiUrl}/public/event/${eventid}`);
        setEvent(response.data || null);
      } catch (err) {
        console.error("Error fetching event data: ", err);
        setError(true);
      }
    };
    fetchEvent();
  }, [apiUrl, eventid]);

  if (error) return <div style={s.page}>Error loading event. Please try again later.</div>;
  if (!event) return <div style={s.page}>Loading...</div>;

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">{event.eventname} — MidwestCosplay</title>
        <meta name="description" content={`${event.eventname} in ${event.eventcity}, ${event.eventstate}`} />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div style={s.page}>

          {/* ── Hero ── */}
          <div style={s.hero}>
            {event.eventimage ? (
              <img src={event.eventimage} alt={`${event.eventname}`} style={s.bannerImg} />
            ) : (
              <div style={s.bannerPlaceholder}>
                <i className="ti ti-calendar-event" aria-hidden="true" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.eventName}>{event.eventname}</p>
              <p style={s.eventLocation}>{event.eventcity}, {event.eventstate}</p>
              <a href={event.eventwebsite} target="_blank" rel="noopener noreferrer" style={s.websiteBtn}>
                Visit Website
              </a>
            </div>
          </div>

          {/* ── Event details (dates, venue, address, about) ── */}
          <div style={s.divider} />
          <EventInfo event={event} />

          {/* ── Shareable "cosplan" graphic ── */}
          <div style={s.divider} />
          <div style={s.section}>
            <p style={s.sectionLabel}>Share your cosplan!</p>
            <EventCosplanCard
              eventid={event.eventid}
              eventname={event.eventname}
              templateImageUrl={event.eventcosplanimage || null}
            />
          </div>

          {/* ── Attendance ── */}
          <div style={s.divider} />
          <EventAttendance
            eventid={event.eventid}
            eventownerid={event.eventownerid}
            initialMembers={event.members || []}
          />

        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PublicEvent;