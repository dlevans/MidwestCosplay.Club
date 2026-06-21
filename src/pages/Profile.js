import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../Footer";
import EnchantedBackground from "./Enchantedbackground";

const SOCIAL_FIELDS = [
  { key: "twitter",   label: "Twitter / X" },
  { key: "bluesky",   label: "Bluesky" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook",  label: "Facebook" },
  { key: "discord",   label: "Discord" },
  { key: "snapchat",  label: "Snapchat" },
  { key: "tiktok",    label: "TikTok" },
  { key: "threads",   label: "Threads" },
  { key: "reddit",    label: "Reddit" },
  { key: "twitch",    label: "Twitch" },
  { key: "youtube",   label: "YouTube" },
  { key: "vimeo",     label: "Vimeo" },
];

const SUPPORT_FIELDS = [
  { key: "patreon",   label: "Patreon" },
  { key: "kofi",      label: "Ko-fi" },
  { key: "venmo",     label: "Venmo" },
  { key: "paypal",    label: "PayPal" },
  { key: "gofundme",  label: "GoFundMe" },
  { key: "extralife", label: "Extra Life" },
];

const fieldStyle = { marginBottom: "0.25rem" };

const Profile = () => {
  const [user, setUser] = useState({
    firstname: "", lastname: "", email: "", birthdate: "",
    phonenumber: "", username: "", about: "", image: "",
    calendar: "", other: "",
    twitter: "", bluesky: "", instagram: "", facebook: "",
    discord: "", snapchat: "", tiktok: "", threads: "",
    reddit: "", twitch: "", youtube: "", vimeo: "",
    patreon: "", kofi: "", venmo: "", paypal: "",
    gofundme: "", extralife: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const userID   = location.pathname.split("/")[2];
  const apiUrl   = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const response = await axios.get(`${apiUrl}/users/${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data || {});
      } catch (err) {
        console.error("Error fetching user data: ", err);
      }
    };
    fetchUser();
  }, [userID]);

  const hasValue = (v) => v && v.trim() !== "";

  const activeSocials = SOCIAL_FIELDS.filter(({ key }) => hasValue(user[key]));
  const activeSupport = SUPPORT_FIELDS.filter(({ key }) => hasValue(user[key]));

  return (
    <div className="page-home">
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline"><h1>{user.username || "Profile"}</h1></h1>
        </div>

        {hasValue(user.about) && (
          <p style={{ marginBottom: "1.5rem" }}>{user.about}</p>
        )}

        {hasValue(user.image) && (
          <div className="profile-image-wrap" style={{ marginBottom: "1.5rem" }}>
            <img src={user.image} alt={`${user.username}'s profile`} />
          </div>
        )}

        <h2 style={{ marginTop: "1.5rem", marginBottom: "0.25rem" }}>Details</h2>

        <div style={fieldStyle}>
          <label>First name</label>
          <input type="text" readOnly value={user.firstname ?? ""} />
        </div>

        <div style={fieldStyle}>
          <label>Last name</label>
          <input type="text" readOnly value={user.lastname ?? ""} />
        </div>

        <div style={fieldStyle}>
          <label>Email</label>
          <input type="text" readOnly value={user.email ?? ""} />
        </div>

        <div style={fieldStyle}>
          <label>Birthdate</label>
          <input type="text" readOnly value={user.birthdate ?? ""} />
        </div>

        <div style={fieldStyle}>
          <label>Phone number</label>
          <input type="text" readOnly value={user.phonenumber ?? ""} />
        </div>

        {hasValue(user.other) && (
          <div style={fieldStyle}>
            <label>Other</label>
            <input type="text" readOnly value={user.other} />
          </div>
        )}

        {hasValue(user.calendar) && (
          <div style={fieldStyle}>
            <label>Calendar</label>
            <input type="text" readOnly value={user.calendar} />
          </div>
        )}

        {activeSocials.length > 0 && (
          <>
            <h2 style={{ marginTop: "2rem", marginBottom: "0.25rem" }}>Social</h2>
            {activeSocials.map(({ key, label }) => (
              <div key={key} style={fieldStyle}>
                <label>{label}</label>
                <input type="text" readOnly value={user[key]} />
              </div>
            ))}
          </>
        )}

        {activeSupport.length > 0 && (
          <>
            <h2 style={{ marginTop: "2rem", marginBottom: "0.25rem" }}>Support</h2>
            {activeSupport.map(({ key, label }) => (
              <div key={key} style={fieldStyle}>
                <label>{label}</label>
                <input type="text" readOnly value={user[key]} />
              </div>
            ))}
          </>
        )}

        <Footer />

      </div>
    </div>
  );
};

export default Profile;