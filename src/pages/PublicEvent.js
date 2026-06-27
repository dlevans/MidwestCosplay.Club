import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

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
  groupName: {
    fontSize: 22,
    fontWeight: 500,
    color: "var(--text-primary)",
    margin: "0 0 2px",
  },
  groupLocation: {
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
  memberGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 },
  memberCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    textDecoration: "none",
    padding: "0.75rem 0.5rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--border)",
    marginBottom: 6,
  },
  memberAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "var(--bg-elevated)",
    border: "2px solid var(--border)",
    marginBottom: 6,
  },
  memberName: { fontSize: 13, color: "var(--text-primary)", fontWeight: 500 },
  memberHandle: { fontSize: 11, color: "var(--text-muted)" },
  noMembersText: { fontSize: 14, color: "var(--text-secondary)" },
};

const PublicEvent = () => {
  console.log("PublicGroup.js");
  const { groupid } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupid) return;
      try {
        const response = await axios.get(`${apiUrl}/public/group/${groupid}`);
        setGroup(response.data || null);
      } catch (err) {
        console.error("Error fetching group data: ", err);
        setError(true);
      }
    };
    fetchGroup();
  }, [apiUrl, groupid]);

  if (error) return <div style={s.page}>Error loading group. Please try again later.</div>;
  if (!group) return <div style={s.page}>Loading...</div>;

  const hasMembers = group.members && group.members.length > 0;

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Public Groups</title>
        <meta name="description" content="Public group listing page." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div style={s.page}>

          {/* ── Hero ── */}
          <div style={s.hero}>
            {group.groupimage ? (
              <img src={group.groupimage} alt={`${group.groupname}'s photo`} style={s.bannerImg} />
            ) : (
              <div style={s.bannerPlaceholder}>
                <i className="ti ti-users" aria-hidden="true" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.groupName}>{group.groupname}</p>
              <p style={s.groupLocation}>{group.groupcity}, {group.groupstate}</p>
              <a href={group.groupwebsite} target="_blank" rel="noopener noreferrer" style={s.websiteBtn}>
                Visit Website
              </a>
            </div>
          </div>

          {/* ── Members ── */}
          <div style={s.divider} />
          <div style={s.section}>
            <p style={s.sectionLabel}>Members</p>
            {hasMembers ? (
              <div style={s.memberGrid}>
                {group.members.map((member) => (
                  <Link key={member.id} to={`/public/${member.username}`} style={s.memberCard}>
                    {member.image ? (
                      <img src={member.image} alt={`${member.username}'s avatar`} style={s.memberAvatar} />
                    ) : (
                      <div style={s.memberAvatarPlaceholder} />
                    )}
                    <span style={s.memberName}>{member.firstname} {member.lastname}</span>
                    <span style={s.memberHandle}>@{member.username}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={s.noMembersText}>No members yet. </p>
            )}
          </div>

        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PublicEvent;