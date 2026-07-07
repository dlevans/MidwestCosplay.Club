import React, { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode"; // npm install qrcode
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Canvas is drawn at a fixed internal resolution; CSS scales it responsively
// via aspect-ratio, so percentage-based overlay positions below stay correct
// no matter how large the card is displayed on screen.
const CANVAS_W = 1600;
const CANVAS_H = 900;
const HEADER_H = 150;
const FOOTER_H = 140;
const MARGIN_X = 60;
const GAP = 24;

const MIN_SLOTS = 1;
const MAX_SLOTS = 6;

// Column/row grid per slot count, tuned for a clean layout at each size.
const LAYOUTS = {
  1: { cols: 1, rows: 1 },
  2: { cols: 2, rows: 1 },
  3: { cols: 3, rows: 1 },
  4: { cols: 2, rows: 2 },
  5: { cols: 3, rows: 2 },
  6: { cols: 3, rows: 2 },
};

/*
 * Lays out `slotCount` cells inside the grid area, row-major, centering any
 * incomplete final row (e.g. 5 slots = a full row of 3, then a centered
 * row of 2).
 */
const computeCellRects = (slotCount) => {
  const { cols, rows } = LAYOUTS[slotCount] || LAYOUTS[MAX_SLOTS];
  const gridW = CANVAS_W - 2 * MARGIN_X;
  const gridH = CANVAS_H - HEADER_H - FOOTER_H;
  const cellW = (gridW - (cols - 1) * GAP) / cols;
  const cellH = (gridH - (rows - 1) * GAP) / rows;

  const rects = [];
  let idx = 0;
  for (let r = 0; r < rows && idx < slotCount; r++) {
    const itemsInRow = Math.min(cols, slotCount - idx);
    const rowWidth = itemsInRow * cellW + (itemsInRow - 1) * GAP;
    const rowStartX = MARGIN_X + (gridW - rowWidth) / 2;
    for (let c = 0; c < itemsInRow; c++) {
      rects.push({
        x: rowStartX + c * (cellW + GAP),
        y: HEADER_H + r * (cellH + GAP),
        w: cellW,
        h: cellH,
      });
      idx++;
    }
  }
  return rects;
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
 * Attendees choose how many photo slots they want (1-6), crop a photo into
 * each one using the same react-image-crop tool used elsewhere on the site,
 * then download the finished PNG to post on social media. Every card
 * includes a QR code that deep-links back to the login page with the event
 * pre-selected, so anyone who sees the post can jump straight to marking
 * themselves as attending.
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
 *   defaultSlotCount   — initial number of photo slots (1-6), default 4;
 *                        the person can change this with the dropdown
 */
const EventCosplanCard = ({
  eventid,
  eventname,
  templateImageUrl,
  clubName = "MidwestCosplay Club",
  baseUrl,
  defaultSlotCount = 4,
}) => {
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const cropImageRef = useRef(null);
  const fileInputsRef = useRef([]);

  const clampSlotCount = (n) => Math.min(MAX_SLOTS, Math.max(MIN_SLOTS, n || MIN_SLOTS));

  const [slotCount, setSlotCount] = useState(clampSlotCount(defaultSlotCount));
  const [slotImages, setSlotImages] = useState(Array(clampSlotCount(defaultSlotCount)).fill(null));
  const [templateImg, setTemplateImg] = useState(null);
  const [qrImg, setQrImg] = useState(null);
  const [error, setError] = useState("");

  // Cropping state for whichever slot is currently being edited
  const [cropTargetIndex, setCropTargetIndex] = useState(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: "px", width: 100, height: 100, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  const eventUrl = `${baseUrl || (typeof window !== "undefined" ? window.location.origin : "")}/login?eventid=${eventid}`;
  const cellRects = computeCellRects(slotCount);

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
    cellRects.forEach(({ x, y, w, h }, i) => {
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
    });

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
  }, [templateImg, qrImg, slotImages, eventname, clubName, cellRects]);

  useEffect(() => { draw(); }, [draw]);

  // ── Slot count dropdown ──────────────────────────────────────────────
  const handleSlotCountChange = (n) => {
    const next = clampSlotCount(n);
    setSlotCount(next);
    setSlotImages((prev) => {
      const copy = prev.slice(0, next);
      while (copy.length < next) copy.push(null);
      return copy;
    });
  };

  // ── Selecting a photo for a slot opens the cropper, matching that
  //    slot's aspect ratio so the crop fits the box with no letterboxing ──
  const handleSlotFile = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropTargetIndex(index);
      setCropImageSrc(e.target.result);
      const { w, h } = cellRects[index];
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5, aspect: w / h });
      setCompletedCrop(null);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropChange = (newCrop) => {
    if (newCrop.width > 0 && newCrop.height > 0) setCrop(newCrop);
  };

  const onCropComplete = useCallback((c) => {
    if (c.width > 0 && c.height > 0) setCompletedCrop(c);
  }, []);

  // Renders the completed crop onto a hidden canvas at full source
  // resolution, then loads the result into the target slot.
  useEffect(() => {
    if (!showCrop || cropTargetIndex === null || !completedCrop) return;
    if (!(completedCrop.width > 0 && completedCrop.height > 0)) return;

    const canvas = cropCanvasRef.current;
    const image = cropImageRef.current;
    if (!canvas || !image) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const url = URL.createObjectURL(blob);
        const img = await loadImage(url);
        setSlotImages((prev) => {
          const next = [...prev];
          next[cropTargetIndex] = img;
          return next;
        });
      } catch {
        setError("Could not process that image.");
      }
    }, "image/jpeg", 0.92);
  }, [completedCrop]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptCrop = () => setShowCrop(false);

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
      <div className="event-cosplan-slot-count" style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="cosplan-slot-count">Photos to add: </label>
        <select
          id="cosplan-slot-count"
          value={slotCount}
          onChange={(e) => handleSlotCountChange(Number(e.target.value))}
        >
          {Array.from({ length: MAX_SLOTS - MIN_SLOTS + 1 }, (_, i) => MIN_SLOTS + i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="event-cosplan-canvas-wrap" style={{ position: "relative", width: "100%", maxWidth: "700px", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", borderRadius: "10px" }} />

        {cellRects.map(({ x, y, w, h }, i) => (
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
        ))}
      </div>

      {/* Crop popup — same tool/pattern used on CreateUser and ManageEvent */}
      {cropImageSrc && showCrop && (
        <div className="crop-popup">
          <div className="popup-overlay" onClick={() => setShowCrop(false)} />
          <div className="crop-container">
            <ReactCrop
              src={cropImageSrc}
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={cropTargetIndex !== null ? cellRects[cropTargetIndex].w / cellRects[cropTargetIndex].h : 1}
            >
              <img
                className="cropimg"
                ref={cropImageRef}
                src={cropImageSrc}
                alt="Crop preview"
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
            </ReactCrop>
            <button type="button" className="accept-button" onClick={acceptCrop}>Accept Crop</button>
          </div>
        </div>
      )}

      <canvas ref={cropCanvasRef} style={{ display: "none" }} />

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