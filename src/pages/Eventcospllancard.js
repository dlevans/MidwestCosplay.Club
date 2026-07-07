import React, { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode"; // npm install qrcode

// Canvas is drawn at a fixed internal resolution; CSS scales it responsively
// via aspect-ratio, so percentage-based overlay positions below stay correct
// no matter how large the card is displayed on screen.
const CANVAS_W = 1600;
const CANVAS_H = 900;
const HEADER_H = 150;
const FOOTER_H = 140;
const COLS = 4;
const ROWS = 2;
const MARGIN_X = 60;
const GAP = 24;

const CELL_W = (CANVAS_W - 2 * MARGIN_X - (COLS - 1) * GAP) / COLS;
const CELL_H = (CANVAS_H - HEADER_H - FOOTER_H - (ROWS - 1) * GAP) / ROWS;

const cellRect = (i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    x: MARGIN_X + col * (CELL_W + GAP),
    y: HEADER_H + row * (CELL_H + GAP),
    w: CELL_W,
    h: CELL_H,
  };
};

const roundRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/*
 * EventCosplanCard — the shareable "cosplan" graphic.
 *
 * Attendees fill in up to 8 photo slots with the characters they plan to
 * cosplay, then download the finished PNG to post on social media. Every
 * card includes a QR code that deep-links back to the login page with the
 * event pre-selected, so anyone who sees the post can jump straight to
 * marking themselves as attending.
 *
 * Props:
 *   eventid            — numeric event ID, used to build the QR link
 *   eventname          — displayed as the card title
 *   templateImageUrl   — optional custom background set on the manage page
 *                        (event.eventcosplanimage); falls back to a default
 *                        club-branded gradient when absent
 *   clubName           — defaults to "MidwestCosplay Club"
 *   baseUrl            — origin used to build the QR link; defaults to
 *                        window.location.origin
 *   slotCount          — number of photo slots, default 8
 */
const EventCosplanCard = ({
  eventid,
  eventname,
  templateImageUrl,
  clubName = "MidwestCosplay Club",
  baseUrl,
  slotCount = 8,
}) => {
  const canvasRef = useRef(null);
  const fileInputsRef = useRef([]);

  const [slotImages, setSlotImages] = useState(Array(slotCount).fill(null));
  const [templateImg, setTemplateImg] = useState(null);
  const [qrImg, setQrImg] = useState(null);
  const [error, setError] = useState("");

  const eventUrl = `${baseUrl || (typeof window !== "undefined" ? window.location.origin : "")}/login?eventid=${eventid}`;

  // Load the custom template background, if one was set on the manage page.
  useEffect(() => {
    let cancelled = false;
    if (!templateImageUrl) {
      setTemplateImg(null);
      return;
    }
    loadImage(templateImageUrl)
      .then((img) => { if (!cancelled) setTemplateImg(img); })
      .catch(() => { if (!cancelled) setTemplateImg(null); });
    return () => { cancelled = true; };
  }, [templateImageUrl]);

  // Generate the QR code once per event/URL.
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(eventUrl, { margin: 1, width: 320, color: { dark: "#1a0a2e", light: "#ffffff" } })
      .then((dataUrl) => loadImage(dataUrl))
      .then((img) => { if (!cancelled) setQrImg(img); })
      .catch(() => { if (!cancelled) setError("Could not generate QR code."); });
    return () => { cancelled = true; };
  }, [eventUrl]);

  const drawDefaultBackground = (ctx) => {
    const gradient = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H * 0.35, 80,
      CANVAS_W / 2, CANVAS_H * 0.5, CANVAS_W * 0.8
    );
    gradient.addColorStop(0, "#4a1f6b");
    gradient.addColorStop(1, "#160821");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    if (templateImg) {
      ctx.drawImage(templateImg, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      drawDefaultBackground(ctx);
    }

    // Header text
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8d9ff";
    ctx.font = "600 32px Georgia, serif";
    ctx.fillText(clubName.toUpperCase(), CANVAS_W / 2, 58);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 52px Georgia, serif";
    ctx.fillText(`${eventname || "My Event"} Cosplans`, CANVAS_W / 2, 118);

    // Photo slots
    for (let i = 0; i < slotCount; i++) {
      const { x, y, w, h } = cellRect(i);
      const img = slotImages[i];

      ctx.save();
      roundRectPath(ctx, x, y, w, h, 16);
      ctx.clip();

      if (img) {
        const scale = Math.max(w / img.width, h / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+ Add Photo", x + w / 2, y + h / 2 + 8);
      }
      ctx.restore();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      roundRectPath(ctx, x, y, w, h, 16);
      ctx.stroke();
    }

    // Footer: QR code + caption
    const qrSize = 110;
    const qrX = CANVAS_W - MARGIN_X - qrSize;
    const qrY = CANVAS_H - FOOTER_H + (FOOTER_H - qrSize) / 2 - 6;
    if (qrImg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 26px sans-serif";
    ctx.fillText("Scan to RSVP", MARGIN_X, CANVAS_H - FOOTER_H / 2 - 8);
    ctx.font = "400 20px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(clubName, MARGIN_X, CANVAS_H - FOOTER_H / 2 + 22);
  }, [templateImg, qrImg, slotImages, eventname, clubName, slotCount]);

  useEffect(() => { draw(); }, [draw]);

  const handleSlotFile = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = await loadImage(e.target.result);
        setSlotImages((prev) => {
          const next = [...prev];
          next[index] = img;
          return next;
        });
      } catch {
        setError("Could not load that image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(eventname || "event").replace(/\s+/g, "-").toLowerCase()}-cosplan.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => setSlotImages(Array(slotCount).fill(null));

  return (
    <div className="event-cosplan-card">
      <div className="event-cosplan-canvas-wrap" style={{ position: "relative", width: "100%", maxWidth: "700px", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", borderRadius: "10px" }} />

        {Array.from({ length: slotCount }).map((_, i) => {
          const { x, y, w, h } = cellRect(i);
          return (
            <button
              key={i}
              type="button"
              className="event-cosplan-slot-button"
              title="Add a photo of what you plan to cosplay"
              onClick={() => fileInputsRef.current[i]?.click()}
              style={{
                position: "absolute",
                left: `${(x / CANVAS_W) * 100}%`,
                top: `${(y / CANVAS_H) * 100}%`,
                width: `${(w / CANVAS_W) * 100}%`,
                height: `${(h / CANVAS_H) * 100}%`,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <input
                ref={(el) => (fileInputsRef.current[i] = el)}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleSlotFile(i, e.target.files[0])}
              />
            </button>
          );
        })}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="event-cosplan-controls" style={{ marginTop: "0.75rem" }}>
        <button className="button" type="button" onClick={handleDownload}>Download my Cosplan</button>
        <button className="button" type="button" onClick={handleReset}>Clear photos</button>
      </div>
      <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
        Tap any box to add a photo of a character you plan to cosplay, then download and share!
      </p>
    </div>
  );
};

export default EventCosplanCard;