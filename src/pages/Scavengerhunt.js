import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  // Tracks which itemid is mid-request (checkbox toggle or photo upload)
  // so we can disable that row's controls and show a small spinner state
  // without blocking the rest of the list.
  const [pendingItemId, setPendingItemId] = useState(null);

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
      setItems(response.data.items || []);
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

  // Optimistically update one item in local state so the checkbox/photo
  // feel instant, without needing to refetch the whole list.
  const patchItem = (itemId, patch) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  };

  const handleToggleComplete = async (item) => {
    if (pendingItemId) return; // one in-flight request at a time is plenty here
    setError("");
    setPendingItemId(item.id);

    const wasCompleted = item.completed;
    patchItem(item.id, { completed: !wasCompleted }); // optimistic

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
      patchItem(item.id, { completed: wasCompleted }); // revert
      setError(
        err.response?.data?.message || "Couldn't save that — please try again."
      );
    } finally {
      setPendingItemId(null);
    }
  };

  const handlePhotoSelected = async (item, file) => {
    if (!file || pendingItemId) return;
    setError("");
    setPendingItemId(item.id);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(
        `${apiUrl}/hunt/${item.id}/complete`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      patchItem(item.id, {
        completed: true,
        imageurl: response.data.progress.imageurl,
        completedat: response.data.progress.completedat,
      });
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError(
        err.response?.data?.message || "Couldn't upload that photo — please try again."
      );
    } finally {
      setPendingItemId(null);
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

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

        <p style={{ marginBottom: "1rem" }}>
          Work through the tasks below. Your progress saves automatically, so
          feel free to switch between your phone and a computer.
        </p>

        {!loading && totalCount > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                background: "#e0d5ea",
                borderRadius: "999px",
                height: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                  background: "#7b4fa6",
                  height: "100%",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "0.85rem", marginTop: "0.4rem", opacity: 0.85 }}>
              {completedCount} / {totalCount} complete
              {completedCount === totalCount ? " — you finished the hunt! \uD83C\uDF89" : ""}
            </p>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {loading ? (
          <p>Loading hunt...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.map((item) => {
              const isPending = pendingItemId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #7b4fa6",
                    borderRadius: "10px",
                    padding: "1rem",
                    opacity: isPending ? 0.7 : 1,
                    background: item.completed ? "rgba(123, 79, 166, 0.08)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      disabled={isPending || (!item.completed && item.requiresimage)}
                      onChange={() => handleToggleComplete(item)}
                      style={{ marginTop: "0.3rem" }}
                      title={
                        !item.completed && item.requiresimage
                          ? "Upload a photo below to complete this task"
                          : undefined
                      }
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{item.title}</strong>
                      <p style={{ margin: "0.25rem 0", fontSize: "0.92rem" }}>
                        {item.description}
                      </p>

                      {item.requiresimage && (
                        <div style={{ marginTop: "0.5rem" }}>
                          {item.imageurl && (
                            <img
                              src={item.imageurl}
                              alt={item.title}
                              style={{
                                width: "120px",
                                height: "120px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                display: "block",
                                marginBottom: "0.5rem",
                              }}
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={isPending}
                            onChange={(e) => handlePhotoSelected(item, e.target.files[0])}
                          />
                          <span style={{ fontSize: "0.8rem", opacity: 0.75, marginLeft: "0.5rem" }}>
                            {item.imageurl ? "Retake photo" : "Photo required"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default ScavengerHunt;