import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const getPayload = (token) => {
  try { return token ? JSON.parse(atob(token.split(".")[1])) : null; }
  catch { return null; }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const apiUrl = process.env.REACT_APP_API_URL;
  const payload = getPayload(token);
  const loggedInUserId = payload?.id ?? null;
  const isAdmin = payload?.is_admin ?? false;
  

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const fetchAllUsers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, page },
        });
        setUsers(response.data.users || []);
        setTotalUsers(response.data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllUsers();
  }, [navigate, token, limit, page]);

  const totalPages = Math.ceil(totalUsers / limit);

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
        <title data-rh="true">Users Page</title>
        <meta name="description" content="List users page for MidwestCosplay Club." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Members ✦</h1>
        </div>

      <PaginationBar />

      <div className="user-container">
        {users.map((user) => (
          <div className="user-card" key={user.id}>
            {user.image && (
              <img src={user.image} alt={`${user.username}'s avatar`} />
            )}
            {user.username && <h3>{user.username}</h3>}
            {user.about && (
              <h4>
                {user.about.length > 250
                  ? <>{user.about.slice(0, 250)}… <Link to={`/public/${user.username}`} className="read-more-link"> read more</Link></>
                  : user.about
                }
              </h4>
            )}
            {(user.id === loggedInUserId || isAdmin) && (
            <Link to={`/update/${user.id}`}>
              <button className="button">Edit</button>
            </Link>
            )}
            <Link to={`/public/${user.username}`}>
              <button className="button">View profile</button>
            </Link>
          </div>
        ))}
        
      </div>

      {users.length > 6 && <PaginationBar />}

      <Footer />
    </div>
    </div>
  );
};

export default Users;