import React, { useEffect, useState } from "react";
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

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const loggedInUserId = getUserId(token);

  // ── URL is the source of truth for pagination ──────────────────────────
  // ?page=2&perpage=20  → shareable link straight to that page/size
  const params = new URLSearchParams(location.search);
  const page = parseInt(params.get("page"), 10) || 1;
  const limit = parseInt(params.get("perpage"), 10) || 10;

  const updateParams = (updates, opts = {}) => {
    const next = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    });
    const qs = next.toString();
    navigate(`/groups${qs ? `?${qs}` : ""}`, { replace: opts.replace ?? false });
  };

  const goToPage = (n) => updateParams({ page: n });
  const changeLimit = (n) => updateParams({ perpage: n, page: 1 }, { replace: true });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const fetchAllGroups = async () => {
      try {
        const response = await axios.get(`${apiUrl}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setGroups(response.data.groups || []);
        setTotalGroups(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllGroups();
  }, [navigate, token, limit, page, apiUrl]);

  const handleDelete = async (groupid) => {
    if (!window.confirm("Remove this group from your site?")) return;

    try {
      await axios.delete(`${apiUrl}/groups/${groupid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups((prev) => prev.filter((g) => g.groupid !== groupid));
      setTotalGroups((prev) => prev - 1);
    } catch (err) {
      console.error("Delete group error:", err);
    }
  };

  const totalPages = Math.ceil(totalGroups / limit);

  const PaginationBar = () => (
    <div className="pagination-controls">
      <label>Per page:</label>
      <select value={limit} onChange={(e) => changeLimit(Number(e.target.value))}>
        {[5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button disabled={page === 1} onClick={() => goToPage(page - 1)}>
        ← Prev
      </button>
      <span>Page {page} of {totalPages || 1}</span>
      <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
        Next →
      </button>
    </div>
  );

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Groups</title>
        <meta name="description" content="Group landing page for MidwestCosplay Club members." />
      </Helmet>      
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Groups ✦</h1>
        </div>

        {loggedInUserId && (
          <Link to="/managegroup">
            <button className="button">Add a Group</button>
          </Link>
        )}

        <PaginationBar />

        <div className="group-container">
          {groups.map((group) => (
            <div className="group-card" key={group.groupid}>
              {group.groupimage && (
                <img src={group.groupimage} alt={`${group.groupname}'s photo`} />
              )}
              {group.groupname && <h3>{group.groupname}</h3>}
              <h4>{group.groupcity}, {group.groupstate}</h4>
              <Link to={`/public/group/${group.groupslug || group.groupid}`}>
                <button className="button">View Group</button>
              </Link>
              <a href={group.groupwebsite} target="_blank" rel="noopener noreferrer">
                <button className="button">Visit Website</button>
              </a>
              {group.groupownerid === loggedInUserId && (
                <>
                  <Link to={`/managegroup/${group.groupid}`}>
                    <button className="button">Edit</button>
                  </Link>
                  <button className="button" type="button" onClick={() => handleDelete(group.groupid)}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>

        {groups.length > 6 && <PaginationBar />}

        <Footer />
      </div>
    </div>
  );
};

export default Groups;