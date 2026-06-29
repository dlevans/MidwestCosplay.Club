import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import styles from "../styles";

/* ── Emblem SVG ── */
const Emblem = () => (
  <svg
    viewBox="0 0 160 160"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Midwest Cosplay Club emblem"
  >
    <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(201,149,108,0.08)" strokeWidth="20" />
    <g className="home-ring-outer">
      <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(201,149,108,0.18)" strokeWidth="0.5" strokeDasharray="3 6" />
      <circle cx="80"  cy="12"  r="2"   fill="#c9956c" opacity="0.6" />
      <circle cx="148" cy="80"  r="2"   fill="#c9956c" opacity="0.6" />
      <circle cx="80"  cy="148" r="2"   fill="#c9956c" opacity="0.6" />
      <circle cx="12"  cy="80"  r="2"   fill="#c9956c" opacity="0.6" />
      <circle cx="128" cy="28"  r="1.5" fill="#e8e0f0" opacity="0.5" />
      <circle cx="128" cy="132" r="1.5" fill="#e8e0f0" opacity="0.5" />
      <circle cx="32"  cy="132" r="1.5" fill="#e8e0f0" opacity="0.5" />
      <circle cx="32"  cy="28"  r="1.5" fill="#e8e0f0" opacity="0.5" />
    </g>
    <g className="home-ring-inner">
      <circle cx="80" cy="80" r="52" fill="none" stroke="rgba(232,224,240,0.12)" strokeWidth="0.5" strokeDasharray="2 8" />
      <circle cx="80"  cy="28"  r="1.5" fill="#e8a0c0" opacity="0.5" />
      <circle cx="132" cy="80"  r="1.5" fill="#e8a0c0" opacity="0.5" />
      <circle cx="80"  cy="132" r="1.5" fill="#e8a0c0" opacity="0.5" />
      <circle cx="28"  cy="80"  r="1.5" fill="#e8a0c0" opacity="0.5" />
    </g>
    <circle cx="80" cy="80" r="42" fill="rgba(45,15,74,0.7)" stroke="rgba(201,149,108,0.3)" strokeWidth="1" />
    <g className="home-emblem-glow">
      <path d="M80 44 L84.5 72 L80 76 L75.5 72 Z"           fill="#c9956c" opacity="0.9" />
      <path d="M80 116 L84.5 88 L80 84 L75.5 88 Z"          fill="#c9956c" opacity="0.9" />
      <path d="M44 80 L72 75.5 L76 80 L72 84.5 Z"           fill="#c9956c" opacity="0.9" />
      <path d="M116 80 L88 75.5 L84 80 L88 84.5 Z"          fill="#c9956c" opacity="0.9" />
      <path d="M52.7 52.7 L71.7 75.2 L76 76 L75.2 71.7 Z"   fill="#e8e0f0" opacity="0.7" />
      <path d="M107.3 52.7 L88.3 75.2 L84 76 L84.8 71.7 Z"  fill="#e8e0f0" opacity="0.7" />
      <path d="M107.3 107.3 L88.3 84.8 L84 84 L84.8 88.3 Z" fill="#e8e0f0" opacity="0.7" />
      <path d="M52.7 107.3 L71.7 84.8 L76 84 L75.2 88.3 Z"  fill="#e8e0f0" opacity="0.7" />
    </g>
    <circle cx="80" cy="80" r="8" fill="rgba(201,149,108,0.15)" stroke="#c9956c" strokeWidth="1.5" />
    <circle cx="80" cy="80" r="3" fill="#c9956c" />
  </svg>
);

/* ── Starfield canvas — uses styles.js for colours ── */
const Starfield = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let stars = [], frame = 0, animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      stars = Array.from({ length: count }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.2 + 0.2,
        alpha: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.003 + 0.001,
        phase: Math.random() * Math.PI * 2,
        color: styles.home.starColors[Math.floor(Math.random() * styles.home.starColors.length)],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      stars.forEach((s) => {
        ctx.globalAlpha = s.alpha * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
        ctx.fillStyle   = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="home-star-canvas" />;
};

/* ── Floating sparkles ── */
const Sparkles = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const SPARKLE_COLORS = [styles.home.gold, styles.home.silver, styles.home.rose];
    const SPARKLE_SIZES  = ["3px", "2px", "2px"];

    const spawn = () => {
      const idx = Math.floor(Math.random() * 3);
      const s   = document.createElement("div");
      Object.assign(s.style, {
        position:         "absolute",
        width:            SPARKLE_SIZES[idx],
        height:           SPARKLE_SIZES[idx],
        background:       SPARKLE_COLORS[idx],
        borderRadius:     "50%",
        left:             Math.random() * 100 + "%",
        bottom:           Math.random() * 30 + "%",
        opacity:          "0",
        animation:        `home-sparkle-float ${(Math.random() * 4 + 3).toFixed(1)}s ${(Math.random() * 2).toFixed(1)}s linear forwards`,
      });
      el.appendChild(s);
      setTimeout(() => s.remove(), 7000);
    };

    const id = setInterval(spawn, 300);
    return () => clearInterval(id);
  }, []);

  return <div ref={containerRef} className="home-sparkles" />;
};

/* ── Shake utility for empty-field validation ── */
const shake = (el) => {
  if (!el) return;
  const steps = [-6, 6, -4, 4, -2, 2, 0];
  let i = 0;
  el.style.transition = "transform 0.08s ease";
  const run = () => {
    if (i >= steps.length) { el.style.transform = ""; return; }
    el.style.transform = `translateX(${steps[i++]}px)`;
    setTimeout(run, 60);
  };
  run();
};

/* ── Feature card data ── */
const FEATURES = [
  { icon: "✦", title: "The Community",   desc: "Find cosplayers across the Midwest who share your passion and your fandoms.",          href: "/users"    },
  { icon: "◈", title: "Find Your People", desc: "Search for cosplayers just like you — same fandoms, same craft, same Midwest spirit.", href: "/search"   },
  { icon: "❋", title: "The Events",       desc: "From regional cons to local meetups — never miss a gathering near you.",               href: "/calendar" },
];

/* ═══════════════════════════════════════════
   Main Home component
═══════════════════════════════════════════ */
const Home = () => {
  const { username } = useParams();
  const navigate     = useNavigate();
  const apiUrl       = process.env.REACT_APP_API_URL;

  /* ── Existing data state (preserved) ── */
  const [user,  setUser]  = useState(null);
  const [error, setError] = useState(false);

  /* ── Session ── */
  const isLoggedIn       = Boolean(localStorage.getItem("token"));
  const loggedInUsername = localStorage.getItem("username") || "";

  /* ── Auth state ── */
  const [tab,              setTab]              = useState("login");
  const [loginUser,        setLoginUser]        = useState("");
  const [loginPass,        setLoginPass]        = useState("");
  const [signupFirstname,  setSignupFirstname]  = useState("");
  const [signupLastname,   setSignupLastname]   = useState("");
  const [signupBirthdate,  setSignupBirthdate]  = useState("");
  const [signupUsername,   setSignupUsername]   = useState("");
  const [signupPass,       setSignupPass]       = useState("");
  const [signupConfirm,    setSignupConfirm]    = useState("");
  const [authError,        setAuthError]        = useState("");
  const [authLoading,      setAuthLoading]      = useState(false);

  const loginBtnRef  = useRef(null);
  const signupBtnRef = useRef(null);

  /* ── Fetch site data (existing logic preserved) ── */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/copyright`);
        setUser(response.data || null);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError(true);
      }
    };
    fetchUser();
  }, [username, apiUrl]);

  /* ── Auth handlers ──
     TODO: update endpoint paths and redirect route to match your app. */
  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass) {
      shake(loginBtnRef.current);
      setAuthError("Please fill in all fields.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/login`, {
        username: loginUser.trim(),
        password: loginPass,
      });
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        navigate("/motd");
      } else {
        setAuthError(data.message || "Invalid username or password.");
      }
    } catch (err) {
      setAuthError("Invalid username or password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupFirstname.trim() || !signupLastname.trim() || !signupBirthdate.trim() || !signupUsername.trim() || !signupPass || !signupConfirm) {
      shake(signupBtnRef.current);
      setAuthError("Please fill in all fields.");
      return;
    }
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()\-=+_%])[A-Za-z\d!@#$%^&*()\-=+_%]{8,}$/;
    if (!passwordRegex.test(signupPass)) {
      setAuthError("Password must be at least 8 characters and include a number and special character.");
      return;
    }
    if (signupPass !== signupConfirm) {
      setAuthError("Passwords do not match.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstname", signupFirstname.trim());
      formData.append("lastname",  signupLastname.trim());
      formData.append("birthdate", signupBirthdate.trim());
      formData.append("username",  signupUsername.trim());
      formData.append("password",  signupPass);
      const { data } = await axios.post(`${apiUrl}/createnew`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUserID = data.userId;
      // Auto-login after account creation, matching CreateUser.js behaviour
      const loginResponse = await axios.post(`${apiUrl}/login`, {
        username: signupUsername.trim(),
        password: signupPass,
      });
      localStorage.setItem("token", loginResponse.data.token);
      navigate(`/update/${newUserID}`);
    } catch (err) {
      if (err.response?.status === 409) {
        setAuthError("Username already exists. Please choose another.");
      } else if (err.response?.status === 400) {
        setAuthError(err.response.data.message || "Please check your details and try again.");
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") tab === "login" ? handleLogin() : handleSignup();
  };

  const switchTab = (t) => { setTab(t); setAuthError(""); };

  /* ── Loading / error states (existing patterns preserved) ── */
  if (error) {
    return (
      <div className="page">
        <p className="text-accent">
          Something went wrong loading the page. Please try again later.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Home</title>
        <meta name="description" content="Home page for MidwestCosplay Club members." />
      </Helmet>
      <div className="home-bg-gradient" />
      <Starfield />
      <Sparkles />

      <div className="home-content">

        {/* ── Crest ── */}
        <div className="home-crest">
          <p className="home-crest-label">Midwest Cosplay Club</p>

          <div className="home-crest-rule-wrap">
            <div className="home-crest-rule" />
            <span className="home-crest-star">✦</span>
            <div className="home-crest-rule reverse" />
          </div>

          <div className="home-emblem-wrap">
            <Emblem />
          </div>

          <div className="home-crest-rule-wrap">
            <div className="home-crest-rule" />
            <span className="home-crest-star">✦</span>
            <div className="home-crest-rule reverse" />
          </div>
        </div>

        

        {/* ── Middle section — conditional on login state ── */}
        {isLoggedIn ? (

          /* Logged-in: personal welcome */
          <>
          {/* ── Headline ── */}
          <div className="home-headline-section">
            <h1 className="home-headline">
              You have
              <span className="home-headline-accent">arrived</span>
            </h1>
          </div>
            <div className="home-divider">
              <div className="home-divider-rule" />
              <div className="home-divider-diamond" />
              <div className="home-divider-rule right" />
            </div>

            <div className="home-member-welcome">
              <p className="home-member-greeting">
                {loggedInUsername
                  ? <>Welcome back, <span className="home-member-name">{loggedInUsername}</span>.</>
                  : <>Welcome back.</>}
              </p>
              <p className="home-member-copy">
                So glad you're on this journey with us. Every costume you share, every
                connection you make, every event you attend — it all weaves the fabric
                of something <strong>truly special</strong> here in the Club.
              </p>
              <p className="home-member-copy">
                The stage is yours. Go make something wonderful.
              </p>
              <button
                className="home-btn-primary home-btn-motd"
                onClick={() => navigate("/motd")}
              >
                See what's new
              </button>
            </div>
          </>

        ) : (

          /* Guest: divider + copy + auth panel */
          <>
          {/* ── Headline ── */}
            <div className="home-headline-section">
              <h1 className="home-headline">
                Enter the
                <span className="home-headline-accent">Club</span>
              </h1>
            </div>
            <div className="home-divider">
              <div className="home-divider-rule" />
              <div className="home-divider-diamond" />
              <div className="home-divider-rule right" />
            </div>

            <div className="home-welcome-copy">
              <p>
                Whether you're threading your first seams or debuting a five-year masterpiece,{" "}
                <strong>you belong here</strong> — among dreamers, makers, and the wonderfully devoted.
              </p>
            </div>

            <div className="home-auth-panel">
              <div className="home-auth-tabs">
                {["login", "signup"].map((t) => (
                  <button
                    key={t}
                    className={`home-auth-tab${tab === t ? " active" : ""}`}
                    onClick={() => switchTab(t)}
                  >
                    {t === "login" ? "Sign In" : "Join Us"}
                  </button>
                ))}
              </div>

              {authError && <p className="home-auth-error">{authError}</p>}

              {tab === "login" && (
                <div className="home-auth-form">
                  <div>
                    <label htmlFor="login-user">Username</label>
                    <input
                      id="login-user"
                      type="text"
                      placeholder="MidwestCosplayer"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value.replace(/\s/g, ""))}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div>
                    <label htmlFor="login-pass">Password</label>
                    <input
                      id="login-pass"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <button
                    ref={loginBtnRef}
                    className="home-btn-primary"
                    onClick={handleLogin}
                    disabled={authLoading}
                  >
                    {authLoading ? "Entering…" : "Step Inside"}
                  </button>
                  <p className="home-switch-prompt">
                    No account yet?{" "}
                    <span className="home-switch-link" onClick={() => switchTab("signup")}>
                      Create one — it's free
                    </span>
                  </p>
                </div>
              )}

              {tab === "signup" && (
                <div className="home-auth-form">
                  <div>
                    <label htmlFor="signup-firstname">First Name</label>
                    <input id="signup-firstname" type="text" placeholder="First name" autoComplete="given-name" value={signupFirstname} onChange={(e) => setSignupFirstname(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div>
                    <label htmlFor="signup-lastname">Last Name</label>
                    <input id="signup-lastname" type="text" placeholder="Last name" autoComplete="family-name" value={signupLastname} onChange={(e) => setSignupLastname(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div>
                    <label htmlFor="signup-birthdate">Date of Birth</label>
                    <input id="signup-birthdate" type="text" placeholder="YYYY-MM-DD" autoComplete="bday" value={signupBirthdate} onChange={(e) => setSignupBirthdate(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div>
                    <label htmlFor="signup-username">Username</label>
                    <input id="signup-username" type="text" placeholder="YourCosplayName" autoComplete="username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div>
                    <label htmlFor="signup-pass">Password</label>
                    <input id="signup-pass" type="password" placeholder="Min 8 chars, 1 number, 1 symbol" autoComplete="new-password" value={signupPass} onChange={(e) => setSignupPass(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div>
                    <label htmlFor="signup-confirm">Confirm Password</label>
                    <input id="signup-confirm" type="password" placeholder="Repeat password" autoComplete="new-password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <button ref={signupBtnRef} className="home-btn-primary" onClick={handleSignup} disabled={authLoading}>
                    {authLoading ? "Creating your account…" : "Begin the Journey"}
                  </button>
                  <p className="home-switch-prompt">
                    Already a member?{" "}
                    <span className="home-switch-link" onClick={() => switchTab("login")}>Sign in</span>
                  </p>
                </div>
              )}
            </div>
          </>

        )}

        {/* ── Feature cards ── */}
        <div className="home-features">
          {FEATURES.map(({ icon, title, desc, href }) => (
            <div key={title} className="home-feature-card" onClick={() => navigate(href)} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && navigate(href)}>
              <span className="home-feature-icon">{icon}</span>
              <div className="home-feature-title">{title}</div>
              <p className="home-feature-desc">{desc}</p>
            </div>
          ))}
        </div>

      </div>{/* /home-content */}

      <div className="home-footer-strip">
        <p>✦ &nbsp; Midwest Cosplay Club &nbsp; · &nbsp; Est. in wonder &nbsp; ✦</p>
      </div>

      <Footer />
    </div>
  );
};

export default Home;