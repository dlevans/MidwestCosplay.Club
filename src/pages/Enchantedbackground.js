import React, { useEffect, useRef } from "react";
import styles from "../styles";

/* ── Starfield canvas ── */
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

    const COLORS = [styles.home.gold, styles.home.silver, styles.home.rose];
    const SIZES  = ["3px", "2px", "2px"];

    const spawn = () => {
      const idx   = Math.floor(Math.random() * 3);
      const dur   = (Math.random() * 4 + 3).toFixed(1);
      const delay = (Math.random() * 2).toFixed(1);
      const s     = document.createElement("div");
      Object.assign(s.style, {
        position:     "absolute",
        width:        SIZES[idx],
        height:       SIZES[idx],
        background:   COLORS[idx],
        borderRadius: "50%",
        left:         Math.random() * 100 + "%",
        top:          (60 + Math.random() * 35) + "%",
        opacity:      "0",
        animation:    `home-sparkle-float ${dur}s ${delay}s linear forwards`,
      });
      el.appendChild(s);
      setTimeout(() => s.remove(), (parseFloat(dur) + parseFloat(delay) + 0.5) * 1000);
    };

    const id = setInterval(spawn, 300);
    return () => clearInterval(id);
  }, []);

  return <div ref={containerRef} className="home-sparkles" />;
};

/* ── EnchantedBackground ──────────────────────────────────────
   Drop this anywhere inside your page wrapper and the starfield,
   sparkles, and gradient will render behind all other content.

   Usage:
     import EnchantedBackground from "../components/EnchantedBackground";

     <div className="page-home">
       <EnchantedBackground />
       ... your page content ...
     </div>
──────────────────────────────────────────────────────────────── */
const EnchantedBackground = () => (
  <>
    <div className="home-bg-gradient" />
    <Starfield />
    <Sparkles />
  </>
);

export default EnchantedBackground;