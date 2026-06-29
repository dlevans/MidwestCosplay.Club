import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faGamepad, faSearch, faUsers, faPeopleGroup, faUserPlus, faPersonCircleCheck, faTicketSimple, faPersonDotsFromLine, faPersonChalkboard, faRightFromBracket, faRuler, faScroll, faMap } from "@fortawesome/free-solid-svg-icons";
import { faReddit, faDiscord, faFortAwesomeAlt } from "@fortawesome/free-brands-svg-icons";

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const loggedInUserId = payload?.id ?? null;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu when switching to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);  

  return (
    <nav className={`navbar ${menuOpen ? "open" : ""}`}>

      <div className="logo">
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            className="menu-toggle"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        )}

        {/* Icon home link — desktop sidebar only */}
        {!isMobile && (
          <NavLink className="nav-link logo-link" to="/" onClick={closeMenu} aria-label="Home">
            <FontAwesomeIcon icon={faFortAwesomeAlt} />
          </NavLink>
        )}
      </div>

      <ul className="navbar-nav" onClick={() => setMenuOpen(false)}>

        {/* Home — first item in mobile dropdown only */}
        {isMobile && (
          <li className="nav-item">
            <NavLink className="nav-link" to="/" onClick={closeMenu}>
              <FontAwesomeIcon icon={faFortAwesomeAlt} />
              <span className="link-text">Home</span>
            </NavLink>
          </li>
        )}

        <li className="nav-item" onClick={(e) => e.stopPropagation()}>
          {isLoggedIn ? (
            <button className="nav-link" onClick={handleSignOut}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="link-text">Log Out</span>
            </button>
          ) : (
            <NavLink className="nav-link" to="/login">
              <FontAwesomeIcon icon={faPersonCircleCheck} />
              <span className="link-text">Log In</span>
            </NavLink>
          )}
        </li>

        <li className="nav-item">
          {isLoggedIn ? (
            <>
              <NavLink className="nav-link" to={`/update/${loggedInUserId}`}>
                <FontAwesomeIcon icon={faUserPlus} />
                <span className="link-text">Update Profile</span>
              </NavLink>
              <NavLink className="nav-link" to={`/public/${localStorage.getItem("username")}`}>
                <FontAwesomeIcon icon={faUsers} />
                <span className="link-text">View Profile</span>
              </NavLink>
            </>
          ) : (
            <NavLink className="nav-link" to="/createuser">
              <FontAwesomeIcon icon={faUserPlus} />
              <span className="link-text">Sign Up</span>
            </NavLink>
          )}
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/search">
            <FontAwesomeIcon icon={faSearch} />
            <span className="link-text">Search</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/users">
            <FontAwesomeIcon icon={faUsers} />
            <span className="link-text">Users</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/groups">
            <FontAwesomeIcon icon={faPeopleGroup} />
            <span className="link-text">Groups</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/events">
            <FontAwesomeIcon icon={faTicketSimple} />
            <span className="link-text">Events</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/calendar">
            <FontAwesomeIcon icon={faPersonChalkboard} />
            <span className="link-text">Calendar</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/games">
            <FontAwesomeIcon icon={faGamepad} />
            <span className="link-text">Games</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/fabric-map">
            <FontAwesomeIcon icon={faMap} />
            <span className="link-text">Fabric Map</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/tutorials">
            <FontAwesomeIcon icon={faPersonDotsFromLine} />
            <span className="link-text">Tutorials</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/templates">
            <FontAwesomeIcon icon={faScroll} />
            <span className="link-text">Templates</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="/measurements">
            <FontAwesomeIcon icon={faRuler} />
            <span className="link-text">Measurements</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="https://discord.gg/7BH7Hthuz6" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faDiscord} />
            <span className="link-text">Discord</span>
          </a>
        </li>

        <li className="nav-item">
          <NavLink className="nav-link" to="https://www.reddit.com/r/MidwestCosplayClub/">
            <FontAwesomeIcon icon={faReddit} />
            <span className="link-text">Reddit</span>
          </NavLink>
        </li>        

        {payload?.is_admin && (
        <li className="nav-item">
          <NavLink className="nav-link" to="/admin">
            <FontAwesomeIcon icon={faPersonCircleCheck} /> {/* pick whichever icon fits */}
            <span className="link-text">Admin</span>
          </NavLink>
        </li>)}

      </ul>
    </nav>
  );
}

export default Nav;