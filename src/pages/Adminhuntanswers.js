import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";

// Same JWT-payload decode used by Admin.js — kept local so this page has no
// dependency on Admin.js beyond the shared convention.
const getPayload = (token) => {
  try {
    return token ? JSON.parse(atob(token.split(".")[1])) : null;
  } catch { return null; }
};

const AdminHuntAnswers = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Which userids are expanded. Everyone collapsed by default — with a full
  // roster this keeps the page from turning into one giant photo dump.
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const payload = getPayload(token);
    if (!token || !payload?.is_admin) {
      navigate("/");
      return;
    }

    axios
      .get(`${apiUrl}/hunt/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => {
        console.error("Error fetching hunt admin data:", err);
        setError("Could not load scavenger hunt answers.");
      })
      .finally(() => setLoading(false));
  }, [token, navigate, apiUrl]);

  const toggleExpanded = (userid) => {
    setExpanded((prev) => ({ ...prev, [userid]: !prev[userid] }));
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Scavenger Hunt Answers — Admin</title>
        <meta name="description" content="Admin review of scavenger hunt submissions." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Scavenger Hunt Answers ✦</h1>
        </div>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <input
          type="text"
          placeholder="Search by username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            display: "block",
            margin: "0 auto 1.5rem",
            width: "min(320px, 90%)",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid #7b4fa6",
          }}
        />

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading answers...</p>
        ) : filteredUsers.length === 0 ? (
          <p style={{ textAlign: "center" }}>No submissions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "760px", margin: "0 auto" }}>
            {filteredUsers.map((user) => {
              const completedEntries = user.entries.filter((e) => e.completed);
              const totalPoints = completedEntries.reduce((sum, e) => sum + (e.points || 0), 0);
              const isOpen = !!expanded[user.userid];

              return (
                <div
                  key={user.userid}
                  style={{
                    border: "1px solid #7b4fa6",
                    borderRadius: "10px",
                    background: "rgba(0, 0, 0, 0.15)",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(user.userid)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "inherit",
                      padding: "0.9rem 1.1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>
                      <strong>@{user.username}</strong>
                      {(user.firstname || user.lastname) && (
                        <span style={{ opacity: 0.75 }}> — {user.firstname} {user.lastname}</span>
                      )}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                        {completedEntries.length}/{user.entries.length} done · {totalPoints} pts
                      </span>
                      <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid #7b4fa6", padding: "0.75rem 1.1rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {user.entries.map((entry) => (
                        <div
                          key={entry.itemid}
                          style={{
                            border: "1px solid rgba(123, 79, 166, 0.5)",
                            borderRadius: "8px",
                            padding: "0.65rem 0.85rem",
                            background: entry.completed ? "rgba(123, 79, 166, 0.12)" : "rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span aria-hidden="true">{entry.completed ? "✅" : "⬜"}</span>
                            <strong style={{ fontSize: "0.95rem" }}>{entry.title}</strong>
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#7b4fa6",
                                background: "rgba(123, 79, 166, 0.15)",
                                borderRadius: "999px",
                                padding: "0.1rem 0.55rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {entry.points} pts
                            </span>
                          </div>

                          {entry.requirestext && (
                            <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
                              <span style={{ opacity: 0.75 }}>
                                {entry.textprompt || "Answer"}:{" "}
                              </span>
                              {entry.textresponse ? (
                                <span>{entry.textresponse}</span>
                              ) : (
                                <span style={{ opacity: 0.6, fontStyle: "italic" }}>No answer yet</span>
                              )}
                            </p>
                          )}

                          {entry.requiresimage && (
                            <div style={{ marginTop: "0.6rem" }}>
                              {entry.imageurl ? (
                                <img
                                  src={entry.imageurl}
                                  alt={entry.title}
                                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                                />
                              ) : (
                                <span style={{ fontSize: "0.85rem", opacity: 0.6, fontStyle: "italic" }}>
                                  No photo yet
                                </span>
                              )}
                            </div>
                          )}

                          {entry.completedat && (
                            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", opacity: 0.6 }}>
                              Completed {new Date(entry.completedat).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default AdminHuntAnswers;