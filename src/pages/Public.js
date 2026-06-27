import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Helmet } from 'react-helmet-async';
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const getUserId = (token) => {
  try {
    return token ? JSON.parse(atob(token.split(".")[1])).id : null;
  } catch (e) {
    return null;
  }
};

const SOCIAL_LINKS = [
  { key: "twitter",   label: "Twitter",   icon: "ti-brand-twitter",  url: (v) => `https://twitter.com/${v}` },
  { key: "bluesky",   label: "Bluesky",   icon: "ti-brand-bluesky",  url: (v) => `https://bsky.app/profile/${v}` },
  { key: "instagram", label: "Instagram", icon: "ti-brand-instagram", url: (v) => `https://instagram.com/${v}` },
  { key: "facebook",  label: "Facebook",  icon: "ti-brand-facebook",  url: (v) => `https://facebook.com/${v}` },
  { key: "discord",   label: "Discord",   icon: "ti-brand-discord",   url: (v) => `https://discord.gg/${v}` },
  { key: "snapchat",  label: "Snapchat",  icon: "ti-brand-snapchat",  url: (v) => `https://snapchat.com/add/${v}` },
  { key: "tiktok",    label: "TikTok",    icon: "ti-brand-tiktok",    url: (v) => `https://www.tiktok.com/@${v}` },
  { key: "threads",   label: "Threads",   icon: "ti-brand-threads",   url: (v) => `https://threads.net/${v}` },
  { key: "reddit",    label: "Reddit",    icon: "ti-brand-reddit",    url: (v) => `https://www.reddit.com/user/${v}` },
  { key: "twitch",    label: "Twitch",    icon: "ti-brand-twitch",    url: (v) => `https://www.twitch.tv/${v}` },
  { key: "youtube",   label: "YouTube",   icon: "ti-brand-youtube",   url: (v) => `https://www.youtube.com/@${v}` },
  { key: "vimeo",     label: "Vimeo",     icon: "ti-brand-vimeo",     url: (v) => `https://vimeo.com/${v}` },
  { key: "website",  label: "Website",   icon: "ti-world", url: (v) => v },
  { key: "website1", label: "Website 2", icon: "ti-world", url: (v) => v },
  { key: "website2", label: "Website 3", icon: "ti-world", url: (v) => v },
  { key: "website3", label: "Website 4", icon: "ti-world", url: (v) => v },
];

const SUPPORT_LINKS = [
  { key: "patreon",   label: "Patreon",    icon: "ti-heart",           url: (v) => `https://www.patreon.com/${v}` },
  { key: "kofi",      label: "Ko-fi",      icon: "ti-coffee",          url: (v) => `https://ko-fi.com/${v}` },
  { key: "onlyfans",  label: "OnlyFans",   icon: "ti-heart",           url: (v) => `https://onlyfans.com/${v}` },
  { key: "venmo",     label: "Venmo",      icon: "ti-currency-dollar", url: (v) => `https://venmo.com/${v}` },
  { key: "cashapp",   label: "CashApp",    icon: "ti-currency-dollar", url: (v) => `https://cash.app/$${v}` },
  { key: "paypal",    label: "PayPal",     icon: "ti-brand-paypal",    url: (v) => `https://www.paypal.me/${v}` },
  { key: "gofundme",  label: "GoFundMe",   icon: "ti-heart-handshake", url: (v) => `https://www.gofundme.com/${v}` },
  { key: "extralife", label: "Extra Life", icon: "ti-device-gamepad",  url: (v) => `https://www.extra-life.org/participant/${v}` },
  { key: "etsy",      label: "Etsy",       icon: "ti-shopping-bag",    url: (v) => `https://www.etsy.com/shop/${v}` },
];

const s = {
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "1.5rem 1rem",
    fontFamily: "var(--font-sans, sans-serif)",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--color-border-secondary)",
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "var(--color-background-secondary)",
    border: "2px solid var(--color-border-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 36,
    color: "var(--color-text-tertiary)",
  },
  profileName: {
    fontSize: 22,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    margin: "0 0 2px",
  },
  profileHandle: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    margin: "0 0 8px",
  },
  tagRow:  { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: {
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 99,
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    display: "inline-block",
  },
  aboutText: {
    fontSize: 15,
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
    margin: "0 0 1.5rem",
  },
  divider: {
    height: "0.5px",
    background: "var(--color-border-tertiary)",
    margin: "1.25rem 0",
  },
  section:      { marginBottom: "1.5rem" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--color-text-tertiary)",
    margin: "0 0 10px",
  },
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg, 12px)",
    padding: "0.25rem 1.25rem",
  },
  linkRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 0",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  },
  linkRowLast: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 0",
  },
  linkIcon:     { fontSize: 17, color: "var(--color-text-tertiary)", width: 20, flexShrink: 0 },
  linkLabel:    { fontSize: 13, color: "var(--color-text-secondary)", width: 80, flexShrink: 0 },
  linkVal: {
    fontSize: 14,
    color: "var(--color-text-info)",
    textDecoration: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  externalIcon: { marginLeft: "auto", fontSize: 14, color: "var(--color-text-tertiary)", flexShrink: 0 },
  qrBtn: {
    marginLeft: 6, fontSize: 15,
    color: "var(--color-text-tertiary)",
    cursor: "pointer", background: "none", border: "none", padding: 4, flexShrink: 0,
  },
  cosplayGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 },
  cosplayChip: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md, 8px)",
    padding: "8px 12px", fontSize: 13,
    color: "var(--color-text-secondary)",
    textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
  },
  dotComplete:  { width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 },
  dotProgress:  { width: 7, height: 7, borderRadius: "50%", background: "#EF9F27", flexShrink: 0 },
  supportGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 },
  supportBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px",
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md, 8px)",
    textDecoration: "none", color: "var(--color-text-primary)", fontSize: 13,
  },
  groupGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  groupTile: {
    position: "relative",
    height: 110,
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    display: "block",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg-surface)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  groupTileOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(0deg, rgba(0,0,0,0.65), rgba(0,0,0,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    textAlign: "center",
  },
  groupTileName: {
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 600,
    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
    WebkitTextStroke: "0.6px rgba(0,0,0,0.9)",
  },
  qrOverlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  qrModal:  { background: "white", padding: 24, borderRadius: 12, textAlign: "center" },
  qrClose:  { marginTop: 12, padding: "6px 20px", cursor: "pointer" },

  guestbookEntry: {
    display: "flex", gap: 10, alignItems: "flex-start",
    padding: "10px 0",
    borderBottom: "0.5px solid var(--border-subtle)",
  },
  guestbookEntryLast: {
    display: "flex", gap: 10, alignItems: "flex-start",
    padding: "10px 0",
  },
  guestbookAvatar: {
    width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
    flexShrink: 0, border: "1px solid var(--border)",
  },
  guestbookAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--bg-elevated)", flexShrink: 0,
  },
  guestbookBody: { flex: 1, minWidth: 0 },
  guestbookMeta: { display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  guestbookAuthor: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" },
  guestbookDate: { fontSize: 11, color: "var(--text-muted)" },
  guestbookMessage: { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, margin: "2px 0 0" },
  guestbookDeleteBtn: {
    marginLeft: "auto", background: "none", border: "none",
    color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
    flexShrink: 0, textDecoration: "underline", padding: 0,
  },
  guestbookEmpty: { fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", padding: "6px 0" },
  guestbookForm: { marginTop: 14, display: "flex", flexDirection: "column", gap: 8 },
  guestbookTextarea: {
    width: "100%", minHeight: 70, resize: "vertical",
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
    fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 10px",
  },
  guestbookSubmitRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  guestbookCount: { fontSize: 11, color: "var(--text-muted)" },
  guestbookError: { fontSize: 12, color: "#e8a0a0" },
  guestbookLoginPrompt: { fontSize: 13, color: "var(--text-muted)", marginTop: 12 },
};

const Public = () => {
  console.log("Public.js");
  const [activeQR, setActiveQR] = useState(null);
  const { username } = useParams();
  const [user, setUser]   = useState(null);
  const [error, setError] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;

  const token = localStorage.getItem("token");
  const loggedInUserId = getUserId(token);

  const [guestbook, setGuestbook] = useState([]);
  const [guestbookText, setGuestbookText] = useState("");
  const [guestbookError, setGuestbookError] = useState(null);
  const [guestbookSubmitting, setGuestbookSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return;
      try {
        const response = await axios.get(`${apiUrl}/public/${username}`);
        setUser(response.data || null);
        setGuestbook(response.data?.guestbook || []);
      } catch (err) {
        console.error("Error fetching user data: ", err);
        setError(true);
      }
    };
    fetchUser();
  }, [username]);

  if (error) return <div style={s.page}>Error loading profile. Please try again later.</div>;
  if (!user)  return <div style={s.page}>Loading...</div>;

  const fullName   = [user.firstname, user.lastname].filter(Boolean).join(" ");
  const hasSocial  = SOCIAL_LINKS.some(({ key }) => user[key]);
  const hasSupport = SUPPORT_LINKS.some(({ key }) => user[key]);
  const hasCosplays = user.complete || user.inprogress;
  const hasContact  = user.phonenumber || user.email;
  const hasCalendar = user.calendar && user.calendar !== "null";
  const hasGroups   = user.groups && user.groups.length > 0;
  const hasEvents   = user.events && user.events.length > 0;

  const renderCosplayChips = (value, dot) =>
    value
      ? value.split(",").map((item, i) => {
          const trimmed = item.trim();
          return (
            <Link key={i} to={`/search?query=${encodeURIComponent(trimmed)}`} style={s.cosplayChip}>
              <span style={dot === "complete" ? s.dotComplete : s.dotProgress} />
              {trimmed}
            </Link>
          );
        })
      : null;

  const formatGuestbookDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const handlePostGuestbookEntry = async () => {
    const message = guestbookText.trim();
    if (!message) return;
    setGuestbookSubmitting(true);
    setGuestbookError(null);
    try {
      const response = await axios.post(
        `${apiUrl}/guestbook/${username}`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGuestbook((prev) => [response.data, ...prev]);
      setGuestbookText("");
    } catch (err) {
      console.error("Error posting guestbook entry: ", err);
      setGuestbookError("Couldn't post your message. Please try again.");
    } finally {
      setGuestbookSubmitting(false);
    }
  };

  const handleDeleteGuestbookEntry = async (entryId) => {
    if (!window.confirm("Remove this guestbook message?")) return;
    try {
      await axios.delete(`${apiUrl}/guestbook/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuestbook((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (err) {
      console.error("Error deleting guestbook entry: ", err);
    }
  };

  const activeSocials = SOCIAL_LINKS.filter(({ key }) => user[key]);
  const activeSupport = SUPPORT_LINKS.filter(({ key }) => user[key]);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">{`${user.username}'s public profile`}</title>
        <meta name="description" content="Publicly keep all social media links in one place." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div style={s.page}>

          {/* ── Hero ── */}
          <div style={s.hero}>
            {user.image ? (
              <img src={user.image} alt={`${user.username}'s profile`} style={s.avatarImg} />
            ) : (
              <div style={s.avatarPlaceholder}>
                <i className="ti ti-user" aria-hidden="true" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.profileName}>{user.username}</p>
              {fullName && <p style={s.profileHandle}>{fullName}</p>}
              {user.imawhat && (
                <div style={s.tagRow}>
                  {user.imawhat.split(",").map((role, i) => {
                    const trimmed = role.trim();
                    return (
                      <Link key={i} to={`/search?query=${encodeURIComponent(trimmed)}`} style={s.tag}>
                        {trimmed}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── About ── */}
          {user.about && <p style={s.aboutText}>{user.about}</p>}

          {/* ── Cosplays ── */}
          {hasCosplays && (
            <>
              <div style={s.divider} />
              {user.complete && (
                <div style={s.section}>
                  <p style={s.sectionLabel}>Completed cosplays</p>
                  <div style={s.cosplayGrid}>{renderCosplayChips(user.complete, "complete")}</div>
                </div>
              )}
              {user.inprogress && (
                <div style={s.section}>
                  <p style={s.sectionLabel}>In progress</p>
                  <div style={s.cosplayGrid}>{renderCosplayChips(user.inprogress, "progress")}</div>
                </div>
              )}
            </>
          )}

          {/* ── Group memberships ── */}
          {hasGroups && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Groups</p>
                <div style={s.groupGrid}>
                  {user.groups.map((group) => (
                    <a
                      key={group.groupid}
                      href={group.groupwebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...s.groupTile,
                        backgroundImage: group.groupimage ? `url(${group.groupimage})` : "none",
                      }}
                    >
                      <div style={s.groupTileOverlay}>
                        <span style={s.groupTileName}>{group.groupname}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Attended Events ── */}
          {hasEvents && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Events I've attended:</p>
                <div style={s.groupGrid}>
                  {user.events.map((event) => (
                    <a
                      key={event.eventid}
                      href={event.eventwebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...s.eventTile,
                        backgroundImage: event.eventimage ? `url(${event.eventimage})` : "none",
                      }}
                    >
                      <div style={s.eventTileOverlay}>
                        <span style={s.eventTileName}>{event.eventname}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Cosplay groups ── */}
          {user.cosplaygroup && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Cosplay group affiliations</p>
                <div style={s.cosplayGrid}>
                  {user.cosplaygroup.split(",").map((g, i) => {
                    const trimmed = g.trim();
                    return (
                      <Link key={i} to={`/search?query=${encodeURIComponent(trimmed)}`} style={s.cosplayChip}>
                        <i className="ti ti-users" aria-hidden="true" style={{ fontSize: 14 }} />
                        {trimmed}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Social media ── */}
          {hasSocial && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Social media</p>
                <div style={s.card}>
                  {activeSocials.map(({ key, label, icon, url }, i) => {
                    const val  = user[key];
                    const href = url(val);
                    const isLast = i === activeSocials.length - 1;
                    return (
                      <div key={key} style={isLast ? s.linkRowLast : s.linkRow}>
                        <i className={`ti ${icon}`} aria-hidden="true" style={s.linkIcon} />
                        <span style={s.linkLabel}>{label}</span>
                        <a href={href} target="_blank" rel="noopener noreferrer" style={s.linkVal}>{val}</a>
                        <i className="ti ti-external-link" aria-hidden="true" style={s.externalIcon} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Support ── */}
          {hasSupport && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Support</p>
                <div style={s.supportGrid}>
                  {activeSupport.map(({ key, label, icon, url }) => {
                    const val  = user[key];
                    const href = url(val);
                    return (
                      <a key={key} href={href} target="_blank" rel="noopener noreferrer" style={s.supportBtn}>
                        <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 16, color: "var(--color-text-secondary)" }} />
                        {label}
                        <button
                          style={s.qrBtn}
                          onClick={(e) => { e.preventDefault(); setActiveQR(href); }}
                          aria-label={`Show QR code for ${label}`}
                        >
                          <i className="ti ti-qrcode" aria-hidden="true" />
                        </button>
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Contact ── */}
          {hasContact && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Contact</p>
                <div style={s.card}>
                  {user.email && (
                    <div style={user.phonenumber ? s.linkRow : s.linkRowLast}>
                      <i className="ti ti-mail" aria-hidden="true" style={s.linkIcon} />
                      <span style={s.linkLabel}>Email</span>
                      <a href={`mailto:${user.email}`} style={s.linkVal}>{user.email}</a>
                    </div>
                  )}
                  {user.phonenumber && (
                    <div style={s.linkRowLast}>
                      <i className="ti ti-phone" aria-hidden="true" style={s.linkIcon} />
                      <span style={s.linkLabel}>Phone</span>
                      <span style={{ fontSize: 14, color: "var(--color-text-primary)" }}>{user.phonenumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Calendar ── */}
          {hasCalendar && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Calendar</p>
                <iframe
                  title="Google Calendar"
                  src={user.calendar}
                  style={{ border: 0, width: "100%", height: 600, borderRadius: 8 }}
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                />
              </div>
            </>
          )}

          {/* ── Guestbook ── */}
          <div style={s.divider} />
          <div style={s.section}>
            <p style={s.sectionLabel}>Guestbook</p>
            <div style={s.card}>
              {guestbook.length > 0 ? (
                guestbook.map((entry, i) => {
                  const isLast = i === guestbook.length - 1;
                  const canRemove = loggedInUserId && (loggedInUserId === entry.authorid || loggedInUserId === user.id);
                  return (
                    <div key={entry.id} style={isLast ? s.guestbookEntryLast : s.guestbookEntry}>
                      {entry.authorimage ? (
                        <img src={entry.authorimage} alt={`${entry.authorusername}'s avatar`} style={s.guestbookAvatar} />
                      ) : (
                        <div style={s.guestbookAvatarPlaceholder} />
                      )}
                      <div style={s.guestbookBody}>
                        <div style={s.guestbookMeta}>
                          <Link to={`/public/${entry.authorusername}`} style={s.guestbookAuthor}>
                            {entry.authorusername}
                          </Link>
                          <span style={s.guestbookDate}>{formatGuestbookDate(entry.createdat)}</span>
                        </div>
                        <p style={s.guestbookMessage}>{entry.message}</p>
                      </div>
                      {canRemove && (
                        <button style={s.guestbookDeleteBtn} onClick={() => handleDeleteGuestbookEntry(entry.id)}>
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={s.guestbookEmpty}>No messages yet — be the first to sign the guestbook!</p>
              )}

              {loggedInUserId ? (
                <div style={s.guestbookForm}>
                  <textarea
                    style={s.guestbookTextarea}
                    placeholder={`Leave a message for ${user.username}...`}
                    value={guestbookText}
                    maxLength={500}
                    onChange={(e) => setGuestbookText(e.target.value)}
                  />
                  <div style={s.guestbookSubmitRow}>
                    {guestbookError ? (
                      <span style={s.guestbookError}>{guestbookError}</span>
                    ) : (
                      <span style={s.guestbookCount}>{guestbookText.length}/500</span>
                    )}
                    <button
                      className="button"
                      type="button"
                      disabled={guestbookSubmitting || !guestbookText.trim()}
                      onClick={handlePostGuestbookEntry}
                    >
                      {guestbookSubmitting ? "Posting..." : "Sign Guestbook"}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={s.guestbookLoginPrompt}>
                  <Link to="/login" style={{ color: "var(--accent)" }}>Log in</Link> to leave a message.
                </p>
              )}
            </div>
          </div>

        </div>

        <Footer />
      </div>

      {/* ── QR overlay — outside home-content so it covers full screen ── */}
      {activeQR && (
        <div style={s.qrOverlay} onClick={() => setActiveQR(null)}>
          <div style={s.qrModal} onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG value={activeQR} size={256} />
            <div>
              <button style={s.qrClose} onClick={() => setActiveQR(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Public;