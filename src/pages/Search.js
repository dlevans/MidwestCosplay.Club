import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground.js";

function Search() {
  console.log("Search.js");

  const location = useLocation();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], groups: [] });

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("query") || "";
    setQuery(searchQuery);
    if (searchQuery) {
      getInfo(searchQuery);
    }
  }, [location.search]);

  const getInfo = async (searchQuery) => {
    if (!searchQuery) return;
    try {
      const { data } = await axios.get(`${apiUrl}/search?query=${searchQuery}`);
      console.log("Search Results:", data);
      console.log("Query:", searchQuery);
      setResults({
        users: Array.isArray(data.users) ? data.users : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setResults({ users: [], groups: [] });
    }
  };

  const handleInputChange = (e) => setQuery(e.target.value);
  const handleSearchClick = () => getInfo(query);
  const handleKeyDown = (event) => {
    if (event.key === "Enter") getInfo(query);
  };

  const highlightText = (text, query) => {
    if (!text) return "";
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ fontWeight: "bold", color: "yellow" }}>{part}</span>
      ) : (
        part
      )
    );
  };

  const renderField = (label, value, link = "") =>
    value ? (
      <div>
        {label && <strong>{label} </strong>}
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {highlightText(value, query)}
          </a>
        ) : (
          highlightText(value, query)
        )}
      </div>
    ) : null;

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Search page</title>
        <meta name="description" content="Public search page for looking up members and finding people." />
      </Helmet>      
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Search</h1>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Search..."
            ref={searchRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <br />
          <button type="button" onClick={handleSearchClick}>
            Search
          </button>
        </form>

        {results.groups.length > 0 && (
          <div className="group-results-section">
            <h2>Groups</h2>
            <div className="group-container">
              {results.groups.map((group) => (
                <div className="group-card" key={group.groupid}>
                  {group.groupimage && (
                    <img src={group.groupimage} alt={`${group.groupname}'s photo`} />
                  )}
                  {group.groupname && <h3>{renderField("", group.groupname)}</h3>}
                  <h4>{group.groupcity}, {group.groupstate}</h4>
                  <Link to={`/public/group/${group.groupslug || group.groupid}`}>
                    <button className="button">View Group</button>
                  </Link>
                  <a href={group.groupwebsite} target="_blank" rel="noopener noreferrer">
                    <button className="button">Visit Website</button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.users.length > 0 && (
          <div className="user-results-section">
            <h2>People</h2>
            <div className="user-container">
              {results.users.map((user) => {
                const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ");
                return (
                  <div className="search-user-card" key={user.id}>
                    <div className="search-user-header">
                      {user.image && (
                        <img src={user.image} alt={`${user.username}'s avatar`} />
                      )}
                      <div className="search-user-name">
                        {user.username && <h3>{highlightText(user.username, query)}</h3>}
                        {fullName && <p>{highlightText(fullName, query)}</p>}
                      </div>
                    </div>

                    {user.about && (
                      <p className="search-user-about">{highlightText(user.about, query)}</p>
                    )}

                    {user.imawhat && (
                      <div className="search-field">
                        <div className="search-field-label">I am a</div>
                        <div className="search-tag-row">
                          {user.imawhat.split(",").map((role, i) => (
                            <span className="search-tag" key={i}>
                              {highlightText(role.trim(), query)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.complete && (
                      <div className="search-field">
                        <div className="search-field-label">Completed Cosplays</div>
                        <div className="search-tag-row">
                          {user.complete.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>
                              {highlightText(item.trim(), query)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.inprogress && (
                      <div className="search-field">
                        <div className="search-field-label">In Progress Cosplays</div>
                        <div className="search-tag-row">
                          {user.inprogress.split(",").map((item, i) => (
                            <span className="search-tag" key={i}>
                              {highlightText(item.trim(), query)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link to={`/public/${user.username}`}>
                      <button className="button">View profile</button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <br />
        <br />
        <br />
        <Footer />
      </div>
    </div>
  );
}

export default Search;