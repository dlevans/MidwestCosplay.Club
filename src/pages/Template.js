import React, { useEffect, useState } from "react";
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

// Map hostnames to favicon + label — same helper as Tutorials.js
const getPlatformInfo = (url) => {
  if (!url) return { label: "Link", icon: null, color: "#888" };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");
    const platforms = {
      "etsy.com":           { label: "Etsy",          icon: "https://www.etsy.com/favicon.ico",           color: "#F56400" },
      "patreon.com":        { label: "Patreon",        icon: "https://www.patreon.com/favicon.ico",        color: "#FF424D" },
      "gumroad.com":        { label: "Gumroad",        icon: "https://gumroad.com/favicon.ico",            color: "#FF90E8" },
      "ko-fi.com":          { label: "Ko-fi",          icon: "https://ko-fi.com/favicon.ico",              color: "#29ABE0" },
      "sellfy.com":         { label: "Sellfy",         icon: "https://sellfy.com/favicon.ico",             color: "#21C45D" },
      "redbubble.com":      { label: "Redbubble",      icon: "https://www.redbubble.com/favicon.ico",      color: "#E41321" },
      "instructables.com":  { label: "Instructables",  icon: "https://www.instructables.com/favicon.ico",  color: "#F4A227" },
      "deviantart.com":     { label: "DeviantArt",     icon: "https://www.deviantart.com/favicon.ico",     color: "#05CC47" },
      "pinterest.com":      { label: "Pinterest",      icon: "https://www.pinterest.com/favicon.ico",      color: "#E60023" },
      "drive.google.com":   { label: "Google Drive",   icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png", color: "#4285F4" },
      "dropbox.com":        { label: "Dropbox",        icon: "https://www.dropbox.com/favicon.ico",        color: "#0061FF" },
    };
    return platforms[host] || {
      label: host,
      icon: `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
      color: "#888",
    };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAllTemplates = async () => {
      try {
        const response = await axios.get(`${apiUrl}/templates`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setTemplates(response.data.templates || []);
        setTotalTemplates(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllTemplates();
  }, [navigate, token, limit, page, apiUrl]);

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

  const totalPages = Math.ceil(totalTemplates / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select
        value={limit}
        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
      >
        {[5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
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

        <PaginationBar />

        <div className="group-container">
          {templates.map((template) => {
            const platform = getPlatformInfo(template.templateurl);
            return (
              <div className="group-card tutorial-card" key={template.templateid}>

                {/* Submitter avatar */}
                {template.useravatar ? (
                  <img
                    src={template.useravatar}
                    alt={`${template.username || "User"}'s avatar`}
                    className="tutorial-card-avatar"
                  />
                ) : (
                  <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
                    {(template.username || "?")[0].toUpperCase()}
                  </div>
                )}

                {/* Platform badge */}
                <div className="tutorial-platform-badge" style={{ borderColor: platform.color }}>
                  {platform.icon && (
                    <img
                      src={platform.icon}
                      alt={platform.label}
                      className="tutorial-platform-icon"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <span style={{ color: platform.color }}>{platform.label}</span>
                </div>

                {template.templatetitle && <h3>{template.templatetitle}</h3>}

                {template.templatedescription && (
                  <p className="tutorial-card-description">{template.templatedescription}</p>
                )}

                {/* Free vs paid badge */}
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

                {template.templatecategory && (
                  <span className="tutorial-card-tag">{template.templatecategory}</span>
                )}

                <a href={template.templateurl} target="_blank" rel="noopener noreferrer">
                  <button className="button">View Template</button>
                </a>

                {/* Owner controls */}
                {template.userid === loggedInUserId && (
                  <>
                    <Link to={`/addtemplate/${template.templateid}`}>
                      <button className="button">Edit</button>
                    </Link>
                    <button
                      className="button"
                      type="button"
                      onClick={() => handleDelete(template.templateid)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {templates.length > 6 && <PaginationBar />}

        <Footer />
      </div>
    </div>
  );
};

export default Templates;