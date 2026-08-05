import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Footer from "../Footer";
import { Helmet } from 'react-helmet-async';
import EnchantedBackground from "./Enchantedbackground";

const ScavengerHunt = () => {
  console.log("ScavengerHunt.js");
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Tracks which itemid is mid-request (checkbox toggle, photo upload, or
  // text save) so we can disable that card's controls without blocking
  // the rest of the list.
  const [pendingItemId, setPendingItemId] = useState(null);

  // Draft text answers, keyed by itemid, edited locally before "Save" is
  // pressed. Seeded from each item's saved textresponse once loaded.
  const [textDrafts, setTextDrafts] = useState({});

  // --- Crop modal state (mirrors CreateUser.js / Update.js) ---------------
  // Only one crop can be in progress at a time, for whichever itemid is
  // currently in cropTargetId.
  const [cropTargetId, setCropTargetId] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: "px", width: 100, height: 100, x: 20, y: 20, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const token = localStorage.getItem("token");

  const fetchHunt = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(`${apiUrl}/hunt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedItems = response.data.items || [];
      setItems(fetchedItems);
      setTextDrafts(
        Object.fromEntries(fetchedItems.map((i) => [i.id, i.textresponse || ""]))
      );
    } catch (err) {
      console.error("Error fetching hunt progress:", err);
      setError("Could not load the scavenger hunt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, navigate, token]);

  useEffect(() => {
    fetchHunt();
  }, [fetchHunt]);

  // Optimistically update one item in local state so controls feel instant,
  // without needing to refetch the whole list.
  const patchItem = (itemId, patch) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  };

  // --- Plain checkbox tasks (no photo/text required) ----------------------
  const handleToggleComplete = async (item) => {
    if (pendingItemId) return;
    setError("");
    setPendingItemId(item.id);

    const wasCompleted = item.completed;
    patchItem(item.id, { completed: !wasCompleted });

    try {
      if (wasCompleted) {
        await axios.delete(`${apiUrl}/hunt/${item.id}/complete`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/hunt/${item.id}/complete`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("Error updating task:", err);
      patchItem(item.id, { completed: wasCompleted });
      setError(err.response?.data?.message || "Couldn't save that — please try again.");
    } finally {
      setPendingItemId(null);
    }
  };

  // --- Text-answer tasks ---------------------------------------------------
  const handleTextDraftChange = (itemId, value) => {
    setTextDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleTextSave = async (item) => {
    const value = (textDrafts[item.id] || "").trim();
    if (!value || pendingItemId) return;
    setError("");
    setPendingItemId(item.id);

    try {
      const formData = new FormData();
      formData.append("textresponse", value);
      const response = await axios.post(`${apiUrl}/hunt/${item.id}/complete`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      patchItem(item.id, {
        completed: response.data.progress.completed,
        textresponse: response.data.progress.textresponse,
        imageurl: response.data.progress.imageurl,
      });
    } catch (err) {
      console.error("Error saving answer:", err);
      setError(err.response?.data?.message || "Couldn't save that answer — please try again.");
    } finally {
      setPendingItemId(null);
    }
  };

  // --- Photo tasks: file select -> crop -> upload --------------------------
  const handleFileSelected = (item, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropTargetId(item.id);
      setImageSrc(event.target.result);
      setCrop({ unit: "px", width: 100, height: 100, x: 20, y: 20, aspect: 1 });
      setCompletedCrop(null);
      setCroppedPreviewUrl(null);
      setCroppedBlob(null);
    };
    reader.readAsDataURL(file);
  };

  const onCropChange = (newCrop) => {
    if (newCrop.width > 0 && newCrop.height > 0) setCrop(newCrop);
  };

  const onCropComplete = useCallback((c) => {
    if (c.width > 0 && c.height > 0) setCompletedCrop(c);
  }, []);

  // Renders the crop selection to a canvas and stores the resulting blob,
  // same approach as CreateUser.js / Update.js.
  useEffect(() => {
    if (!completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0) return;

    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      800,
      800
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCroppedPreviewUrl(URL.createObjectURL(blob));
      setCroppedBlob(blob);
    }, "image/jpeg");
  }, [completedCrop]);

  const closeCropModal = () => {
    setCropTargetId(null);
    setImageSrc(null);
    setCompletedCrop(null);
    setCroppedPreviewUrl(null);
    setCroppedBlob(null);
  };

  const handleAcceptCrop = async () => {
    if (!croppedBlob || !cropTargetId) return;
    const itemId = cropTargetId;
    setError("");
    setPendingItemId(itemId);

    try {
      const formData = new FormData();
      formData.append("image", croppedBlob, "cropped-image.jpg");
      const response = await axios.post(`${apiUrl}/hunt/${itemId}/complete`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      patchItem(itemId, {
        completed: response.data.progress.completed,
        imageurl: response.data.progress.imageurl,
        textresponse: response.data.progress.textresponse,
      });
      closeCropModal();
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError(err.response?.data?.message || "Couldn't upload that photo — please try again.");
    } finally {
      setPendingItemId(null);
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const earnedPoints = items.reduce((sum, i) => sum + (i.completed ? (i.points || 0) : 0), 0);

  return (
    <div className="page-home">
      <Helmet>
        <title data-rh="true">Planet Anime Scavenger Hunt</title>
        <meta name="description" content="Planet Anime Kansas City scavenger hunt." />
      </Helmet>
      <EnchantedBackground />

      <div className="home-content">
        <div className="home-headline-section">
          <h1 className="home-headline">Planet Anime Scavenger Hunt</h1>
        </div>

        <div style={{ width: "100%", maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ marginBottom: "1rem" }}>
            Work through the tasks below. Your progress saves automatically, so
            feel free to switch between your phone and a computer.
          </p>

          {!loading && totalCount > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ background: "#e0d5ea", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(completedCount / totalCount) * 100}%`,
                    background: "#7b4fa6",
                    height: "100%",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", marginTop: "0.4rem", opacity: 0.85, textAlign: "center" }}>
                {completedCount} / {totalCount} complete &middot; {earnedPoints} pts
                {completedCount === totalCount ? " — you finished the hunt! \uD83C\uDF89" : ""}
              </p>
            </div>
          )}

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

          {loading ? (
            <p style={{ textAlign: "center" }}>Loading hunt...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item) => {
                const isPending = pendingItemId === item.id;
                const canCheckPlainBox = !item.requiresimage && !item.requirestext;

                return (
                  <div
                    key={item.id}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #7b4fa6",
                      borderRadius: "10px",
                      padding: "1rem 1.25rem",
                      opacity: isPending ? 0.7 : 1,
                      background: item.completed ? "rgba(123, 79, 166, 0.12)" : "rgba(0, 0, 0, 0.15)",
                      textAlign: "left",
                    }}
                  >
                    {/* Header row: status + title */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {canCheckPlainBox ? (
                        <input
                          type="checkbox"
                          checked={item.completed}
                          disabled={isPending}
                          onChange={() => handleToggleComplete(item)}
                        />
                      ) : (
                        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>
                          {item.completed ? "\u2705" : "\u2b1c"}
                        </span>
                      )}
                      <strong style={{ fontSize: "1.05rem" }}>{item.title}</strong>
                      {typeof item.points === "number" && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#7b4fa6",
                            background: "rgba(123, 79, 166, 0.15)",
                            borderRadius: "999px",
                            padding: "0.15rem 0.6rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.points} pts
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "0.4rem 0 0.75rem", fontSize: "0.92rem", opacity: 0.9 }}>
                      {item.description}
                    </p>

                    {/* Photo requirement */}
                    {item.requiresimage && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: item.requirestext ? "0.75rem" : 0 }}>
                        {item.imageurl && (
                          <img
                            src={item.imageurl}
                            alt={item.title}
                            style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "8px" }}
                          />
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={isPending}
                            onChange={(e) => handleFileSelected(item, e.target.files[0])}
                          />
                          <div style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: "0.25rem" }}>
                            {item.imageurl ? "Retake photo" : "Photo required"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text requirement */}
                    {item.requirestext && (
                      <div>
                        <textarea
                          rows={2}
                          placeholder={item.textprompt || "Type your answer..."}
                          value={textDrafts[item.id] ?? ""}
                          disabled={isPending}
                          onChange={(e) => handleTextDraftChange(item.id, e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            borderRadius: "8px",
                            border: "1px solid #7b4fa6",
                            padding: "0.5rem",
                            fontFamily: "inherit",
                            fontSize: "0.9rem",
                            resize: "vertical",
                          }}
                        />
                        <button
                          type="button"
                          disabled={isPending || !(textDrafts[item.id] || "").trim()}
                          onClick={() => handleTextSave(item)}
                          style={{ marginTop: "0.4rem" }}
                        >
                          {item.textresponse ? "Update answer" : "Save answer"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Crop modal — same pattern as CreateUser.js / Update.js, but sized
            with explicit inline styles so it stays bounded regardless of
            how large the source photo is (phone camera photos can be huge). */}
        {imageSrc && cropTargetId && (
          <div className="crop-popup">
            <div
              className="popup-overlay"
              onClick={closeCropModal}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                zIndex: 1000,
              }}
            />
            <div
              className="crop-container"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1001,
                background: "#1a1030",
                border: "1px solid #7b4fa6",
                borderRadius: "12px",
                padding: "1rem",
                maxWidth: "90vw",
                maxHeight: "90vh",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
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
                  style={{ maxWidth: "min(80vw, 500px)", maxHeight: "50vh", display: "block" }}
                />
              </ReactCrop>

              {croppedPreviewUrl && (
                <div style={{ marginTop: "0.75rem" }}>
                  <img
                    src={croppedPreviewUrl}
                    alt="Cropped preview"
                    style={{ width: "100px", height: "100px", borderRadius: "10px", objectFit: "cover" }}
                  />
                </div>
              )}

              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="accept-button"
                  disabled={!croppedBlob || pendingItemId === cropTargetId}
                  onClick={handleAcceptCrop}
                >
                  {pendingItemId === cropTargetId ? "Uploading..." : "Use This Photo"}
                </button>
                <button type="button" onClick={closeCropModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <Footer />
      </div>
    </div>
  );
};

export default ScavengerHunt;