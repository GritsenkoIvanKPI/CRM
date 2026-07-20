// Mirrors the CSS custom properties in app/globals.css as literal hex, for
// use inside Recharts SVG props where var() resolution can be unreliable.
// Keep in sync with globals.css if those tokens change.
export const CHART_COLORS = {
  bg: "#0a0a0c",
  surface: "#151519",
  surface2: "#1d1d23",
  border: "rgba(255,255,255,0.08)",
  text: "#f1eee7",
  textMuted: "#a7a49d",
  textFaint: "#6c6a66",
  accent: "#c9a24c",
  accentStrong: "#e2ba62",
  danger: "#b56354",
  success: "#63a17f",
  // validated against accent via dataviz skill's validate_palette.js
  // (CVD normal-vision floor 23.8, well above the 15 gate)
  trendSales: "#1f8fac",
  stage: {
    contacted: "#6b6252",
    call: "#8a7850",
    proposal: "#ab9150",
    thinking: "#cba94a",
    interested: "#e8c052",
    not_interested: "#b56354",
    won: "#63a17f",
  },
} as const;
