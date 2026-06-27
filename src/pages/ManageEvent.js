import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"],
];

const EMPTY_FORM = {
  eventname: "",
  eventcity: "",
  eventstate: "",
  eventwebsite: "",
};

const ManageEvent = () => {
  console.log("ManageEvents.js");

  const { eventid } = useParams(); // undefined => creating a new event
  const isEditing = !!eventid;

  const [form, setForm] = useState(EMPTY_FORM);
  const [currentImage, setCurrentImage] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEditing);

  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [memberError, setMemberError] = useState("");

  const [crop, setCrop] = useState({ unit: "px", width: 100, height: 100, x: 0, y: 0, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [previewSize, setPreviewSize] = useState(null);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!isEditing) return;

    let payload;
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      navigate("/login");
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await axios.get(`${apiUrl}/events/${eventid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const event = response.data || {};

        if (event.eventownerid !== payload.id) {
          navigate("/events");
          return;
        }

        setForm({
          eventname: event.eventname || "",
          eventcity: event.eventcity || "",
          eventstate: event.eventstate || "",
          eventwebsite: event.eventwebsite || "",
        });
        setCurrentImage(event.eventimage || "");
      } catch (err) {
        console.error("Error fetching event: ", err);
        setError(err.response?.data?.message || err.message || "Could not load this event.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [apiUrl, eventid, isEditing, navigate]);

  const fetchMembers = useCallback(async (token) => {
    try {
      const response = await axios.get(`${apiUrl}/events/${eventid}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data.members || []);
    } catch (err) {
      console.error("Error fetching members: ", err);
    }
  }, [apiUrl, eventid]);

  useEffect(() => {
    if (!isEditing) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchMembers(token);
  }, [isEditing, fetchMembers]);

  // Debounced live search as the admin types
  useEffect(() => {
    if (!isEditing) return;

    const trimmed = memberSearch.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const timeoutId = setTimeout(async () => {
      try {
        const response = await axios.get(`${apiUrl}/events/${eventid}/members/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: trimmed },
        });
        setSearchResults(response.data.users || []);
      } catch (err) {
        console.error("Member search error: ", err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [memberSearch, isEditing, apiUrl, eventid]);

  const handleAddMember = async (userToAdd) => {
    setMemberError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/events/${eventid}/members`,
        { userid: userToAdd.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMembers((prev) => [
        ...prev,
        {
          eventmemberid: response.data.member?.eventmemberid,
          userid: userToAdd.id,
          firstname: userToAdd.firstname,
          lastname: userToAdd.lastname,
          username: userToAdd.username,
        },
      ]);
      setSearchResults((prev) => prev.filter((u) => u.id !== userToAdd.id));
    } catch (err) {
      console.error("Add member error:", err);
      setMemberError(err.response?.data?.message || err.message || "Could not add this member.");
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm("Remove this member from the event?")) return;

    setMemberError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`${apiUrl}/events/${eventid}/members/${memberUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMembers((prev) => prev.filter((m) => m.userid !== memberUserId));
    } catch (err) {
      console.error("Remove member error:", err);
      setMemberError(err.response?.data?.message || err.message || "Could not remove this member.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setShowCrop(true);
        setCrop({ unit: "px", width: 100, height: 100, x: 0, y: 0, aspect: 1 });
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
      setPreviewSize({ width: 150, height: 150 });
    }, "image/jpeg");
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this event from your site?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`${apiUrl}/events/${eventid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/events");
    } catch (err) {
      console.error("Delete event error:", err);
      setError(err.response?.data?.message || err.message || "Could not delete this event.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.eventname || !form.eventcity || !form.eventstate || !form.eventwebsite) {
      setError("Event name, city, state, and website are all required.");
      return;
    }

    const eventData = new FormData();
    eventData.append("eventname", form.eventname);
    eventData.append("eventcity", form.eventcity);
    eventData.append("eventstate", form.eventstate);
    eventData.append("eventwebsite", form.eventwebsite);

    if (image) {
      eventData.append("eventimage", image);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      if (isEditing) {
        await axios.put(`${apiUrl}/events/${eventid}`, eventData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(`${apiUrl}/events`, eventData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/events");
    } catch (err) {
      console.error("Event save error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="page-home">
        <EnchantedBackground />
        <div className="home-content">
          <p>Loading...</p>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">MidwestCosplay Club Manage Events</title>
        <meta name="description" content="Event management page for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">{isEditing ? "Edit Event" : "Add an Event"}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="eventname">Event name:</label>
          <input type="text" placeholder="Enter Event Name" name="eventname" value={form.eventname} onChange={handleChange} required />

          <label htmlFor="eventcity">City:</label>
          <input type="text" placeholder="e.g. Kansas City" name="eventcity" value={form.eventcity} onChange={handleChange} required />

          <label htmlFor="eventstate">State:</label>
          <select name="eventstate" value={form.eventstate} onChange={handleChange} required>
            <option value="" disabled>Select a state</option>
            {US_STATES.map(([code, name]) => (
              <option value={code} key={code}>{name}</option>
            ))}
          </select>

          <label htmlFor="eventwebsite">Event website:</label>
          <input type="url" placeholder="https://example.com" name="eventwebsite" value={form.eventwebsite} onChange={handleChange} required />

          <label htmlFor="eventimage">Event Photo:</label>
          <input type="file" name="eventimage" onChange={handleImageChange} />

          {currentImage && !croppedImageUrl && (
            <div>
              <h3>Current Photo:</h3>
              <img
                src={currentImage}
                alt="Current event"
                style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
              />
            </div>
          )}

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
              <h3>New Photo Preview:</h3>
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
          <br />

          <button type="submit">{isEditing ? "Save Changes" : "Add Event"}</button>
        </form>

        {isEditing && (
          <div className="event-members-section">
            <h2>Users who have attended this event:</h2>

            {memberError && <p style={{ color: "red" }}>{memberError}!!!</p>}

            <div className="event-container">
              {members.length === 0 ? (
                <p>No members added yet.</p>
              ) : (
                members.map((member) => (
                  <div className="event-card" key={member.eventmemberid}>
                    <h3>{member.firstname} {member.lastname}</h3>
                    <h4>@{member.username}</h4>
                    <button className="button" type="button" onClick={() => handleRemoveMember(member.userid)}>Remove</button>
                  </div>
                ))
              )}
            </div>

            <label htmlFor="membersearch">Add an attendee:</label>
            <input
              type="text"
              id="membersearch"
              placeholder="Search by first name, last name, or username"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />

            {searchResults.length > 0 && (
              <ul className="member-search-results">
                {searchResults.map((user) => (
                  <li key={user.id}>
                    {user.firstname} {user.lastname} (@{user.username})
                    <button className="button" type="button" onClick={() => handleAddMember(user)}>Add</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isEditing && (
          <button className="button" type="button" onClick={handleDelete}>Delete This Event</button>
        )}

        {error && <p style={{ color: "red" }}>{error}!!!</p>}
        <Footer />
      </div>
    </div>
  );
};

export default ManageEvent;