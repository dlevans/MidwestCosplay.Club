import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";
import EnchantedBackground from "./Enchantedbackground";

const getPayload = (token) => {
  try {
    return token ? JSON.parse(atob(token.split(".")[1])) : null;
  } catch { return null; }
};

const Admin = () => {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const payload = getPayload(token);
    if (!token || !payload?.is_admin) { navigate("/"); return; }

    axios.get(`${apiUrl}/api/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setAdmins(res.data.admins || []))
    .catch(() => setError("Could not load admins."));
  }, [token, navigate, apiUrl]);

  // Debounced user search — same pattern as ManageGroup
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) { setSearchResults([]); return; }

    const id = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/admins/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: trimmed },
        });
        setSearchResults(res.data.users || []);
      } catch { setError("Search failed."); }
    }, 300);

    return () => clearTimeout(id);
  }, [search, token, apiUrl]);

  const handleGrant = async (user) => {
    setError("");
    try {
      await axios.post(`${apiUrl}/api/admins`,
        { userid: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdmins((prev) => [...prev, user]);
      setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
      setSearch("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not grant admin.");
    }
  };

  const handleRevoke = async (userid) => {
    if (!window.confirm("Remove this user's admin access?")) return;
    setError("");
    try {
      await axios.delete(`${apiUrl}/api/admins/${userid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins((prev) => prev.filter((a) => a.id !== userid));
    } catch (err) {
      setError(err.response?.data?.message || "Could not revoke admin.");
    }
  };

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Admin Panel</title>
        <meta name="description" content="Admin management for MidwestCosplay Club." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Admin Panel ✦</h1>
        </div>

        {error && <p style={{ color: "red" }}>{error}!!!</p>}

        <h2>Current Admins</h2>
        <div className="group-container">
          {admins.length === 0 ? (
            <p>No admins yet.</p>
          ) : (
            admins.map((admin) => (
              <div className="group-card" key={admin.id}>
                <h3>{admin.firstname} {admin.lastname}</h3>
                <h4>@{admin.username}</h4>
                <button className="button" type="button" onClick={() => handleRevoke(admin.id)}>
                  Remove Admin
                </button>
              </div>
            ))
          )}
        </div>

        <h2>Add an Admin</h2>
        <input
          type="text"
          placeholder="Search by name or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="member-search-results">
            {searchResults.map((user) => (
              <li key={user.id}>
                {user.firstname} {user.lastname} (@{user.username})
                <button className="button" type="button" onClick={() => handleGrant(user)}>
                  Make Admin
                </button>
              </li>
            ))}
          </ul>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Admin;