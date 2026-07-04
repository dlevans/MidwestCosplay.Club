import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const Update = () => {
  console.log("Update.js");
  const [user, setUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    birthdate: "",
    phonenumber: "",
    password: "",
    about: "",
    image: "",
    calendar: "",
    twitter: "",
    bluesky: "",
    instagram: "",
    facebook: "",
    discord: "",
    snapchat: "",
    tiktok: "",
    threads: "",
    reddit: "",
    twitch: "",
    youtube: "",
    vimeo: "",
    patreon: "",
    kofi: "",
    venmo: "",
    cashapp: "",
    paypal: "",
    gofundme: "",
    extralife: "",
    etsy: "",
    complete: "",
    inprogress: "",
    cosplaygroup: "",
    imawhat: "", // Will hold a clean comma-separated string to match your backend expectations
    location: "", // Added to align with your updated PostgreSQL schema
    website: "",
    website1: "",
    website2: "",
    website3: "",
    onlyfans: "",
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(false);
  const [crop, setCrop] = useState({
    unit: "px",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [previewSize, setPreviewSize] = useState(null);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { id: userID } = useParams();

  const roles = [ "3D Printer", "3D Designer", "Actor", "Artist", "Author", "Content Creator", "Cosplayer", "Crafter", "Fan", "Leatherworker", "Maker", "Model", "Performer", "Photographer", "Prop Builder", "Seamstress", "Streamer", "Tailor", "Vendor"];
  
  const apiUrl = process.env.REACT_APP_API_URL;

  // Characters allowed for each social/username field. Anything not matching
  // gets stripped as the user types (this also removes spaces and "@").
  // Keep this in sync with the ALLOWED_CHARS map in usersRoute.js.
  const ALLOWED_CHARS = {
    twitter: /[^A-Za-z0-9_]/g,
    bluesky: /[^A-Za-z0-9._-]/g,      // e.g. "name.bsky.social"
    instagram: /[^A-Za-z0-9._]/g,
    facebook: /[^A-Za-z0-9.]/g,
    discord: /[^A-Za-z0-9-]/g,        // invite code only, e.g. "7BH7Hthuz6"
    snapchat: /[^A-Za-z0-9_.-]/g,
    tiktok: /[^A-Za-z0-9_.]/g,
    threads: /[^A-Za-z0-9._]/g,
    reddit: /[^A-Za-z0-9_-]/g,
    twitch: /[^A-Za-z0-9_]/g,
    youtube: /[^A-Za-z0-9_.-]/g,
    vimeo: /[^A-Za-z0-9_-]/g,
    patreon: /[^A-Za-z0-9_-]/g,
    kofi: /[^A-Za-z0-9_-]/g,
    onlyfans: /[^A-Za-z0-9_.-]/g,
    venmo: /[^A-Za-z0-9_-]/g,
    cashapp: /[^A-Za-z0-9_-]/g,       // don't store the leading "$"
    paypal: /[^A-Za-z0-9.-]/g,
    etsy: /[^A-Za-z0-9]/g,
  };

  // Strip a leading "@" (people often paste "@username") and any characters
  // that field's platform doesn't allow in a username (including spaces).
  const sanitizeSocialInput = (name, value) => {
    const disallowed = ALLOWED_CHARS[name];
    if (!disallowed) return value; // not a social field, leave untouched
    return value.replace(/^@+/, "").replace(disallowed, "");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));

    if(parseInt(userID) !== payload.id && !payload.is_admin)
    {
      navigate("/users");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/users/${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fallback safely to an empty object structure
        const userData = response.data || {};

        // Filter null values into empty text slots safely
        const sanitizedUser = Object.fromEntries(
          Object.entries(userData).map(([key, value]) => [key, value ?? ""])
        );

        // FIX: Format the incoming Postgres timestamp format string for standard HTML elements
        if (sanitizedUser.birthdate) {
          sanitizedUser.birthdate = sanitizedUser.birthdate.split("T")[0];
        }

        // Keep password inputs explicitly blank on screen layout load
        sanitizedUser.password = ""; 

        setUser(sanitizedUser);
      } catch (err) {
        console.error("Error fetching user data: ", err);
      }
    };
    fetchUser();
  }, [navigate, userID, apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "username" && value.length >= 25) {
      setError("Username must be less than 25 characters.");
      return;
    } else {
      setError("");
    }

    const cleanedValue = sanitizeSocialInput(name, value);
    setUser((prev) => ({ ...prev, [name]: cleanedValue }));
  };

  const handleRoleToggle = (role) => {
  const current = user.imawhat ? user.imawhat.split(",").map(r => r.trim()).filter(Boolean) : [];
  const updated = current.includes(role)
    ? current.filter(r => r !== role)
    : [...current, role];
  setUser(prev => ({ ...prev, imawhat: updated.join(",") }));
};

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setShowCrop(true);
        setCrop({
          unit: "px",
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          aspect: 1,
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropChange = (newCrop) => {
    if (newCrop.width > 0 && newCrop.height > 0) {
      setCrop(newCrop);
    }
  };

  const onCropComplete = useCallback((crop) => {
    if (crop.width > 0 && crop.height > 0) {
      setCompletedCrop(crop);
    }
  }, []);

  useEffect(() => {
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      getCroppedImage();
    }
  }, [completedCrop]);

  const getCroppedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imageRef.current;
    if (!img) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedImageURL = URL.createObjectURL(blob);
      setCroppedImageUrl(croppedImageURL);
      setImage(blob);
      setPreviewSize({
        width: 200,
        height: 200,
      });
    }, "image/jpeg");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const updateData = new FormData();
    for (let key in user) {
      if (key === "password" && !user[key]) continue; // Skip empty password updates
      updateData.append(key, user[key]);
    }
  
    if (image) {
      updateData.append("image", image);
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.put(`${apiUrl}/users/update/${userID}`, updateData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });    
      navigate("/users");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
    }
  };

  // Convert comma-separated string back to an array structure for the HTML multiselect value binder
  const selectedRoles = user.imawhat ? user.imawhat.split(",") : [];

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Update user</title>
        <meta name="description" content="Update and add user details." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Update: {user.username || ""}</h1>
        </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="firstname">Firstname:</label>
        <input type="text" placeholder="Enter First Name" name="firstname" value={user.firstname || ""} onChange={handleChange} />

        <label htmlFor="lastname">Lastname:</label>
        <input type="text" placeholder="Enter Last Name" name="lastname" value={user.lastname || ""} onChange={handleChange} />
        
        {/* Added New Location Input Field */}
        <label htmlFor="location">Location (City, State):</label>
        <input type="text" placeholder="e.g. Kansas City, MO" name="location" value={user.location || ""} onChange={handleChange} />

        <label>I am a (select all that apply):</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0", maxWidth: "462px" }}>
          {roles.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleToggle(role)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "2px solid #7b4fa6",
                background: selectedRoles.includes(role) ? "#7b4fa6" : "transparent",
                color: selectedRoles.includes(role) ? "#fff" : "#7b4fa6",
                cursor: "pointer",
                fontWeight: selectedRoles.includes(role) ? "bold" : "normal",
              }}
            >
              {role}
            </button>
          ))}
        </div>

        <label htmlFor="email">Email:</label>
        <input type="email" placeholder="Enter Email" name="email" value={user.email || ""} onChange={handleChange} autoComplete="email"/>

        <label htmlFor="phonenumber">Phone number:</label>
        <input type="text" placeholder="Enter Phone Number" name="phonenumber" value={user.phonenumber || ""} onChange={handleChange} />

        <label htmlFor="password">Updated password:</label>
        <input type="password" placeholder="Enter New Password" name="password" onChange={handleChange} autoComplete="new-password"/>

        <label htmlFor="about">About:</label>
        <input name="about" placeholder="Tell us about yourself" value={user.about || ""} onChange={handleChange} />

        <label htmlFor="complete">What cosplays have you completed (comma-separated please)?:</label>
        <input type="text" placeholder="Complete Cosplays" name="complete" value={user.complete || ""} onChange={handleChange} />

        <label htmlFor="inprogress">What cosplays are you working on (comma-separated please)?:</label>
        <input type="text" placeholder="In progress Cosplays" name="inprogress" value={user.inprogress || ""} onChange={handleChange} />

        <label htmlFor="image">Profile Photo:</label>
        <input type="file" name="image" onChange={handleImageChange} />

        {imageSrc && showCrop && (
          <div className="crop-popup">
            <div className="popup-overlay" onClick={() => setShowCrop(false)} />
            <div className="crop-container">
              <ReactCrop
                src={imageSrc}
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={1}
              >
                <img
                  className="cropimg"
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  style={{ maxWidth: "100%", maxHeight: "80vh" }}
                />
              </ReactCrop>
              <button type="button" className="accept-button" onClick={() => setShowCrop(false)}>Accept Crop</button>
            </div>
          </div>
        )}

        {croppedImageUrl && previewSize && (
          <div>
            <h3>Thumbnail Preview:</h3>
            <img
              className="cropimg"
              src={croppedImageUrl}
              alt="Cropped Preview"
              style={{
                width: `${previewSize.width}px`,
                height: `${previewSize.height}px`,
                borderRadius: "10px",
              }}
            />
            <br />
            <button type="button" onClick={() => setShowCrop(true)}>Re-crop</button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <label htmlFor="twitter">Twitter username:</label>
        <input type="text" placeholder="Twitter" name="twitter" value={user.twitter || ""} onChange={handleChange} />

        <label htmlFor="bluesky">Blue Sky username (don't forget the ".bsky.social" at the end):</label>
        <input type="text" placeholder="Blue Sky test.bsky.social" name="bluesky" value={user.bluesky || ""} onChange={handleChange} />

        <label htmlFor="instagram">Instagram username:</label>
        <input type="text" placeholder="Instagram" name="instagram" value={user.instagram || ""} onChange={handleChange} />

        <label htmlFor="facebook">Facebook username:</label>
        <input type="text" placeholder="Facebook" name="facebook" value={user.facebook || ""} onChange={handleChange} />

        <label htmlFor="discord">Discord server (https://discord.gg/7BH7Hthuz6 part only):</label>
        <input type="text" placeholder="Discord" name="discord" value={user.discord || ""} onChange={handleChange} />

        <label htmlFor="snapchat">Snapchat username:</label>
        <input type="text" placeholder="Snapchat" name="snapchat" value={user.snapchat || ""} onChange={handleChange} />

        <label htmlFor="tiktok">TikTok username:</label>
        <input type="text" placeholder="TikTok" name="tiktok" value={user.tiktok || ""} onChange={handleChange} />

        <label htmlFor="threads">Threads username:</label>
        <input type="text" placeholder="Threads" name="threads" value={user.threads || ""} onChange={handleChange} />

        <label htmlFor="reddit">Reddit username:</label>
        <input type="text" placeholder="Reddit" name="reddit" value={user.reddit || ""} onChange={handleChange} />

        <label htmlFor="twitch">Twitch username:</label>
        <input type="text" placeholder="Twitch" name="twitch" value={user.twitch || ""} onChange={handleChange} />

        <label htmlFor="youtube">YouTube username:</label>
        <input type="text" placeholder="YouTube" name="youtube" value={user.youtube || ""} onChange={handleChange} />

        <label htmlFor="vimeo">Vimeo username:</label>
        <input type="text" placeholder="Vimeo" name="vimeo" value={user.vimeo || ""} onChange={handleChange} />

        <label htmlFor="website">Website:</label>
        <input type="url" placeholder="https://yoursite.com" name="website" value={user.website || ""} onChange={handleChange} />

        <label htmlFor="website1">Website 2:</label>
        <input type="url" placeholder="https://yoursite.com" name="website1" value={user.website1 || ""} onChange={handleChange} />

        <label htmlFor="website2">Website 3:</label>
        <input type="url" placeholder="https://yoursite.com" name="website2" value={user.website2 || ""} onChange={handleChange} />

        <label htmlFor="website3">Website 4:</label>
        <input type="url" placeholder="https://yoursite.com" name="website3" value={user.website3 || ""} onChange={handleChange} />


        <label htmlFor="patreon">Patreon page:</label>
        <input type="text" placeholder="Patreon" name="patreon" value={user.patreon || ""} onChange={handleChange} />

        <label htmlFor="kofi">Kofi username:</label>
        <input type="text" placeholder="Kofi" name="kofi" value={user.kofi || ""} onChange={handleChange} />

        <label htmlFor="onlyfans">OnlyFans username:</label>
        <input type="text" placeholder="OnlyFans" name="onlyfans" value={user.onlyfans || ""} onChange={handleChange} />

        <label htmlFor="venmo">Venmo username:</label>
        <input type="text" placeholder="Venmo" name="venmo" value={user.venmo || ""} onChange={handleChange} />

        <label htmlFor="cashapp">CashApp username (without the $):</label>
        <input type="text" placeholder="CashApp" name="cashapp" value={user.cashapp || ""} onChange={handleChange} />

        <label htmlFor="paypal">PayPal username:</label>
        <input type="text" placeholder="PayPal" name="paypal" value={user.paypal || ""} onChange={handleChange} />

        <label htmlFor="gofundme">Go Fund Me Page:</label>
        <input type="text" placeholder="Go Fund Me" name="gofundme" value={user.gofundme || ""} onChange={handleChange} />

        <label htmlFor="extralife">Extra-Life page:</label>
        <input type="text" placeholder="Extra Life" name="extralife" value={user.extralife || ""} onChange={handleChange} /> 

        <label htmlFor="etsy">Etsy shop name (just the name not the URL):</label>
        <input type="text" placeholder="Etsy" name="etsy" value={user.etsy || ""} onChange={handleChange} />        

        <label htmlFor="calendar">Public Google Calendar URL:</label>
        <input type="text" placeholder="Calendar URL" name="calendar" value={user.calendar || ""} onChange={handleChange} />
        <br />
        
        <button type="submit">Update</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}!!!</p>}
      <Footer />
    </div>
    </div>
  );
};

export default Update;