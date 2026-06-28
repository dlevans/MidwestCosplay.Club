import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

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
  groupname: "",
  groupcity: "",
  groupstate: "",
  groupwebsite: "",
};

const ManageGroup = () => {
  console.log("ManageGroup.js");

  const { groupid } = useParams(); // undefined => creating a new group
  const isEditing = !!groupid;

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

    const fetchGroup = async () => {
      try {
        const response = await axios.get(`${apiUrl}/groups/${groupid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const group = response.data || {};

        if (group.groupownerid !== payload.id) {
          navigate("/groups");
          return;
        }

        setForm({
          groupname: group.groupname || "",
          groupcity: group.groupcity || "",
          groupstate: group.groupstate || "",
          groupwebsite: group.groupwebsite || "",
        });
        setCurrentImage(group.groupimage || "");
      } catch (err) {
        console.error("Error fetching group: ", err);
        setError(err.response?.data?.message || err.message || "Could not load this group.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [apiUrl, groupid, isEditing, navigate]);

  const fetchMembers = useCallback(async (token) => {
    try {
      const response = await axios.get(`${apiUrl}/groups/${groupid}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data.members || []);
    } catch (err) {
      console.error("Error fetching members: ", err);
    }
  }, [apiUrl, groupid]);

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
        const response = await axios.get(`${apiUrl}/groups/${groupid}/members/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: trimmed },
        });
        setSearchResults(response.data.users || []);
      } catch (err) {
        console.error("Member search error: ", err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [memberSearch, isEditing, apiUrl, groupid]);

  const handleAddMember = async (userToAdd) => {
    setMemberError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/groups/${groupid}/members`,
        { userid: userToAdd.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMembers((prev) => [
        ...prev,
        {
          groupmemberid: response.data.member?.groupmemberid,
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
    if (!window.confirm("Remove this member from the group?")) return;

    setMemberError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`${apiUrl}/groups/${groupid}/members/${memberUserId}`, {
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
    if (!window.confirm("Remove this group from your site?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`${apiUrl}/groups/${groupid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/groups");
    } catch (err) {
      console.error("Delete group error:", err);
      setError(err.response?.data?.message || err.message || "Could not delete this group.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.groupname || !form.groupcity || !form.groupstate || !form.groupwebsite) {
      setError("Group name, city, state, and website are all required.");
      return;
    }

    const groupData = new FormData();
    groupData.append("groupname", form.groupname);
    groupData.append("groupcity", form.groupcity);
    groupData.append("groupstate", form.groupstate);
    groupData.append("groupwebsite", form.groupwebsite);

    if (image) {
      groupData.append("groupimage", image);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      if (isEditing) {
        await axios.put(`${apiUrl}/groups/${groupid}`, groupData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(`${apiUrl}/groups`, groupData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/groups");
    } catch (err) {
      console.error("Group save error:", err);
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
        <title data-rh="true">MidwestCosplay Club Manage Groups</title>
        <meta name="description" content="Group management page for MidwestCosplay Club members." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">{isEditing ? "Edit Group" : "Add a Group"}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="groupname">Group name:</label>
          <input type="text" placeholder="Enter Group Name" name="groupname" value={form.groupname} onChange={handleChange} required />

          <label htmlFor="groupcity">City:</label>
          <input type="text" placeholder="e.g. Kansas City" name="groupcity" value={form.groupcity} onChange={handleChange} required />

          <label htmlFor="groupstate">State:</label>
          <select name="groupstate" value={form.groupstate} onChange={handleChange} required>
            <option value="" disabled>Select a state</option>
            {US_STATES.map(([code, name]) => (
              <option value={code} key={code}>{name}</option>
            ))}
          </select>

          <label htmlFor="groupwebsite">Group website:</label>
          <input type="url" placeholder="https://example.com" name="groupwebsite" value={form.groupwebsite} onChange={handleChange} required />

          <label htmlFor="groupimage">Group Photo:</label>
          <input type="file" name="groupimage" onChange={handleImageChange} />

          {currentImage && !croppedImageUrl && (
            <div>
              <h3>Current Photo:</h3>
              <img
                src={currentImage}
                alt="Current group"
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

          <button type="submit">{isEditing ? "Save Changes" : "Add Group"}</button>
        </form>

        {isEditing && (
          <div className="group-members-section">
            <h2>Members</h2>

            {memberError && <p style={{ color: "red" }}>{memberError}!!!</p>}

            <div className="group-container">
              {members.length === 0 ? (
                <p>No members added yet.</p>
              ) : (
                members.map((member) => (
                  <div className="group-card" key={member.groupmemberid}>
                    <h3>{member.firstname} {member.lastname}</h3>
                    <h4>@{member.username}</h4>
                    <button className="button" type="button" onClick={() => handleRemoveMember(member.userid)}>Remove</button>
                  </div>
                ))
              )}
            </div>

            <label htmlFor="membersearch">Add a member:</label>
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
          <button className="button" type="button" onClick={handleDelete}>Delete This Group</button>
        )}

        {error && <p style={{ color: "red" }}>{error}!!!</p>}
        <Footer />
      </div>
    </div>
  );
};

export default ManageGroup;