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

// Map hostnames to a favicon/icon URL and a display label
const getPlatformInfo = (url) => {
  if (!url) return { label: "Link", icon: null };
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace("www.", "");

    const platforms = {
      "youtube.com": {
        label: "YouTube",
        icon: "https://www.youtube.com/favicon.ico",
        color: "#FF0000",
      },
      "youtu.be": {
        label: "YouTube",
        icon: "https://www.youtube.com/favicon.ico",
        color: "#FF0000",
      },
      "vimeo.com": {
        label: "Vimeo",
        icon: "https://vimeo.com/favicon.ico",
        color: "#1AB7EA",
      },
      "instructables.com": {
        label: "Instructables",
        icon: "https://www.instructables.com/favicon.ico",
        color: "#F4A227",
      },
      "tiktok.com": {
        label: "TikTok",
        icon: "https://www.tiktok.com/favicon.ico",
        color: "#010101",
      },
      "twitch.tv": {
        label: "Twitch",
        icon: "https://www.twitch.tv/favicon.ico",
        color: "#9146FF",
      },
      "patreon.com": {
        label: "Patreon",
        icon: "https://www.patreon.com/favicon.ico",
        color: "#FF424D",
      },
      "skillshare.com": {
        label: "Skillshare",
        icon: "https://www.skillshare.com/favicon.ico",
        color: "#002333",
      },
      "udemy.com": {
        label: "Udemy",
        icon: "https://www.udemy.com/favicon.ico",
        color: "#A435F0",
      },
    };

    if (platforms[host]) return platforms[host];

    // Fallback: use Google's favicon service for any other domain
    return {
      label: host,
      icon: `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
      color: "#888",
    };
  } catch {
    return { label: "Link", icon: null, color: "#888" };
  }
};

const Tutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalTutorials, setTotalTutorials] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAllTutorials = async () => {
      try {
        const response = await axios.get(`${apiUrl}/tutorials`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setTutorials(response.data.tutorials || []);
        setTotalTutorials(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllTutorials();
  }, [navigate, token, limit, page, apiUrl]);

  const handleDelete = async (tutorialid) => {
    if (!window.confirm("Remove this tutorial?")) return;

    try {
      await axios.delete(`${apiUrl}/tutorials/${tutorialid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTutorials((prev) => prev.filter((t) => t.tutorialid !== tutorialid));
      setTotalTutorials((prev) => prev - 1);
    } catch (err) {
      console.error("Delete tutorial error:", err);
    }
  };

  const totalPages = Math.ceil(totalTutorials / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select
        value={limit}
        onChange={(e) => {
          setLimit(Number(e.target.value));
          setPage(1);
        }}
      >
        {[5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        ← Prev
      </button>
      <span>
        Page {page} of {totalPages || 1}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
    </div>
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Tutorials</title>
        <meta
          name="description"
          content="Tutorial links shared by MidwestCosplay Club members."
        />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Tutorials ✦</h1>
        </div>

        {loggedInUserId && (
          <Link to="/addtutorial">
            <button className="button">Add a Tutorial</button>
          </Link>
        )}

        <PaginationBar />

        <div className="group-container">
          {tutorials.map((tutorial) => {
            const platform = getPlatformInfo(tutorial.tutorialurl);

            return (
              <div className="group-card tutorial-card" key={tutorial.tutorialid}>
                {/* Submitter avatar as main card image */}
                {tutorial.useravatar ? (
                  <img
                    src={tutorial.useravatar}
                    alt={`${tutorial.username || "User"}'s avatar`}
                    className="tutorial-card-avatar"
                  />
                ) : (
                  <div className="tutorial-card-avatar tutorial-card-avatar--placeholder">
                    {(tutorial.username || "?")[0].toUpperCase()}
                  </div>
                )}

                {/* Platform badge */}
                <div
                  className="tutorial-platform-badge"
                  style={{ borderColor: platform.color }}
                >
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

                {/* Tutorial title */}
                {tutorial.tutorialtitle && (
                  <h3>{tutorial.tutorialtitle}</h3>
                )}

                {/* Description */}
                {tutorial.tutorialdescription && (
                  <p className="tutorial-card-description">
                    {tutorial.tutorialdescription}
                  </p>
                )}

                {/* Submitted by */}
                {tutorial.username && (
                  <p className="tutorial-card-submitter">
                    Shared by{" "}
                    <Link to={`/public/user/${tutorial.userslug || tutorial.userid}`}>
                      {tutorial.username}
                    </Link>
                  </p>
                )}

                {/* Category / tags */}
                {tutorial.tutorialcategory && (
                  <span className="tutorial-card-tag">{tutorial.tutorialcategory}</span>
                )}

                <a
                  href={tutorial.tutorialurl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="button">Watch / View</button>
                </a>

                {/* Owner controls */}
                {tutorial.userid === loggedInUserId && (
                  <>
                    <Link to={`/addtutorial/${tutorial.tutorialid}`}>
                      <button className="button">Edit</button>
                    </Link>
                    <button
                      className="button"
                      type="button"
                      onClick={() => handleDelete(tutorial.tutorialid)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {tutorials.length > 6 && <PaginationBar />}

        <Footer />
      </div>
    </div>
  );
};

export default Tutorials;