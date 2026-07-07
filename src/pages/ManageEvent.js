import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";
import EventInfo from "./EventInfo";
import EventCosplanCard from "./EventCosplanCard";

const US_STATES = [
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MO", "Missouri"],
  ["NE", "Nebraska"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["SD", "South Dakota"],
  ["WI", "Wisconsin"],
];

const EMPTY_FORM = {
  eventname: "",
  eventcity: "",
  eventstate: "",
  eventwebsite: "",
  eventstartdate: "",
  eventenddate: "",
  eventstarttime: "",
  eventendtime: "",
  eventvenue: "",
  eventaddress: "",
  eventzip: "",
  eventdescription: "",
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

  // Optional custom background for the shareable "cosplan" graphic.
  // If left blank, the public page falls back to the default club template.
  const [currentCosplanImage, setCurrentCosplanImage] = useState("");
  const [cosplanImage, setCosplanImage] = useState(null);
  const [cosplanImagePreview, setCosplanImagePreview] = useState(null);

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
          eventstartdate: event.eventstartdate ? event.eventstartdate.slice(0, 10) : "",
          eventenddate: event.eventenddate ? event.eventenddate.slice(0, 10) : "",
          eventstarttime: event.eventstarttime || "",
          eventendtime: event.eventendtime || "",
          eventvenue: event.eventvenue || "",
          eventaddress: event.eventaddress || "",
          eventzip: event.eventzip || "",
          eventdescription: event.eventdescription || "",
        });
        setCurrentImage(event.eventimage || "");
        setCurrentCosplanImage(event.eventcosplanimage || "");
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

  const handleCosplanImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCosplanImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setCosplanImagePreview(event.target.result);
    reader.readAsDataURL(file);
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
    eventData.append("eventstartdate", form.eventstartdate);
    eventData.append("eventenddate", form.eventenddate);
    eventData.append("eventstarttime", form.eventstarttime);
    eventData.append("eventendtime", form.eventendtime);
    eventData.append("eventvenue", form.eventvenue);
    eventData.append("eventaddress", form.eventaddress);
    eventData.append("eventzip", form.eventzip);
    eventData.append("eventdescription", form.eventdescription);

    if (image) {
      eventData.append("eventimage", image);
    }
    if (cosplanImage) {
      eventData.append("eventcosplanimage", cosplanImage);
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

          <label htmlFor="eventstartdate">Start date:</label>
          <input type="date" name="eventstartdate" value={form.eventstartdate} onChange={handleChange} />

          <label htmlFor="eventenddate">End date (leave blank for a single-day event):</label>
          <input type="date" name="eventenddate" value={form.eventenddate} onChange={handleChange} />

          <label htmlFor="eventstarttime">Start time:</label>
          <input type="time" name="eventstarttime" value={form.eventstarttime} onChange={handleChange} />

          <label htmlFor="eventendtime">End time:</label>
          <input type="time" name="eventendtime" value={form.eventendtime} onChange={handleChange} />

          <label htmlFor="eventvenue">Venue name:</label>
          <input type="text" placeholder="e.g. Overland Park Convention Center" name="eventvenue" value={form.eventvenue} onChange={handleChange} />

          <label htmlFor="eventaddress">Street address:</label>
          <input type="text" placeholder="e.g. 6000 College Blvd" name="eventaddress" value={form.eventaddress} onChange={handleChange} />

          <label htmlFor="eventzip">ZIP code:</label>
          <input type="text" placeholder="e.g. 66211" name="eventzip" value={form.eventzip} onChange={handleChange} />

          <label htmlFor="eventdescription">About this event (shown as the write-up on the event page):</label>
          <textarea
            name="eventdescription"
            placeholder="Tell attendees what this event is about, what to expect, guests of honor, etc. Separate paragraphs with a blank line."
            value={form.eventdescription}
            onChange={handleChange}
            rows={8}
          />

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

          <label htmlFor="eventcosplanimage">
            Custom "Cosplans" graphic background (optional — leave blank to use the default MidwestCosplay Club template):
          </label>
          <input type="file" name="eventcosplanimage" accept="image/*" onChange={handleCosplanImageChange} />

          {currentCosplanImage && !cosplanImagePreview && (
            <div>
              <h3>Current custom background:</h3>
              <img
                src={currentCosplanImage}
                alt="Current cosplan template background"
                style={{ width: "220px", borderRadius: "10px" }}
              />
            </div>
          )}
          {cosplanImagePreview && (
            <div>
              <h3>New background preview:</h3>
              <img
                src={cosplanImagePreview}
                alt="New cosplan template background preview"
                style={{ width: "220px", borderRadius: "10px" }}
              />
            </div>
          )}

          <button type="submit">{isEditing ? "Save Changes" : "Add Event"}</button>
        </form>

        {isEditing && (
          <div className="event-preview-section" style={{ marginTop: "2rem" }}>
            <h2>Preview — this is what attendees see on the public event page</h2>

            <EventInfo
              event={{
                eventname: form.eventname,
                eventcity: form.eventcity,
                eventstate: form.eventstate,
                eventvenue: form.eventvenue,
                eventaddress: form.eventaddress,
                eventzip: form.eventzip,
                eventstartdate: form.eventstartdate,
                eventenddate: form.eventenddate,
                eventstarttime: form.eventstarttime,
                eventendtime: form.eventendtime,
                eventwebsite: form.eventwebsite,
                eventdescription: form.eventdescription,
              }}
            />

            <h3 style={{ marginTop: "1.5rem" }}>Shareable "Cosplans" graphic</h3>
            <EventCosplanCard
              eventid={eventid}
              eventname={form.eventname}
              templateImageUrl={cosplanImagePreview || currentCosplanImage || null}
            />
          </div>
        )}

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