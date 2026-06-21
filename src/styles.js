// Brand tokens — mirrors the CSS custom properties in index.css.
// Use these when you need JS access to design values (e.g. chart colors,
// canvas drawing, dynamic inline styles).

const styles = {
  // ── Core palette ──
  brandColor:      "#E8956D",   // rose-gold accent
  bgBase:          "#1E1425",   // deep plum background
  bgSurface:       "#2C2035",   // card/panel surface
  bgElevated:      "#362845",   // hover / input background
  textPrimary:     "#F5EFE6",   // warm cream
  textSecondary:   "#B8A8C8",   // muted lavender
  textMuted:       "#7A6E8A",

  // ── Enchantment welcome-page tokens ──
  // (used by Starfield canvas and Sparkles particle system in Home.js)
  home: {
    bg:          "#0d0618",
    purple1:     "#2d0f4a",
    purple2:     "#1a0a2e",
    purple3:     "#3a0a3a",
    gold:        "#c9956c",
    goldLight:   "#d4a574",
    goldDark:    "#b8845c",
    goldDim:     "rgba(201, 149, 108, 0.25)",
    goldGlow:    "rgba(201, 149, 108, 0.35)",
    cream:       "#f5e6d0",
    creamDim:    "#e8d8c8",
    silver:      "#e8e0f0",
    rose:        "#e8a0c0",
    text:        "#c8b8a8",
    // Star canvas colour pool
    starColors:  ["#e8e0f0", "#c9956c", "#ffffff", "#e8a0c0"],
  },
};

export default styles;