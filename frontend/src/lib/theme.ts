// src/lib/theme.ts
import type { CSSProperties } from "react"

// ── Colors ──────────────────────────────────────────────────────────────────
export const C = {
  // Gold palette
  gold:      "#d4af37",
  goldMid:   "#c9a84c",
  goldDim:   "#c9a84c88",
  goldFaint: "#c9a84c55",
  goldGlow:  "#d4af3750",
  goldGlow2: "#d4af3738",

  // Text
  textBright:  "#f0e8d0",   // Main body text
  textGold:    "#e8c97a",   // Highlighted label
  textMuted:   "#d4b96a",   // Sub text
  textHint:    "#b8a878",   // Hint/meta (slightly brighter)
  textWhite:   "#ffffff",   // Input value

  // Page background
  bgGrad: "radial-gradient(ellipse 120% 80% at 50% 10%, #2a3870 0%, #172348 45%, #0d1530 100%)",

  // Card
  bgCard:     "linear-gradient(160deg, #1e2f5877, #152040aa)",
  bgSidebar:  "#111d3e99",
  bgInput:    "#0f1c3eaa",
  bgModal:    "#121f45ee",
  bgError:    "#3a0a0a",
  bgSuccess:  "#0a2e18",

  // Status
  success: "#6fdc8c",
  danger:  "#ff8080",
  dangerBorder: "#ff606044",
} as const

// ── Typography ───────────────────────────────────────────────────────────
/** Same name as layout.tsx `next/font` variable — only used when explicitly needed inline */
export const fontUiSans =
  "'Pretendard', var(--font-ui-sans), ui-sans-serif, system-ui, -apple-system, sans-serif" as const

export const F = {
  // Size (16px base, English dashboard standard)
  xxl:  32,
  xl:   24,
  lg:   20,
  md:   17,
  base: 16,
  sm:   15,
  xs:   14,
  xxs:  13,

  // Letter spacing — excessive tracking feels awkward with Inter
  trackingTight:  "0.01em",
  trackingNormal: "0.02em",
  trackingWide:   "0.04em",
  trackingWidest: "0.08em",
} as const

// ── Reusable style objects ─────────────────────────────────────────────────────
export const cardStyle: CSSProperties = {
  background:     C.bgCard,
  border:         `1px solid ${C.goldFaint}`,
  boxShadow:      `0 20px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px ${C.goldGlow2}, inset 0 1px 0 #d4af3740`,
  borderRadius:   16,
  backdropFilter: "blur(20px)",
}

export const inputStyle: CSSProperties = {
  background:   C.bgInput,
  border:       `1px solid ${C.goldDim}`,
  color:        C.textWhite,
  borderRadius: 8,
  padding:      "12px 16px",
  fontSize:     F.sm,
  fontWeight:   400,
  lineHeight:   1.5,
  width:        "100%",
  outline:      "none",
  boxSizing:    "border-box",
  fontFamily:   fontUiSans,
}

export const labelStyle: CSSProperties = {
  color:         C.textGold,
  fontSize:      F.xs,
  letterSpacing: F.trackingNormal,
  textTransform: "none",
  display:       "block",
  marginBottom:  6,
  fontWeight:    600,
  fontFamily:    fontUiSans,
}

export const thStyle: CSSProperties = {
  color:          C.goldMid,
  fontSize:       F.xxs,
  letterSpacing:  "0.07em",
  textTransform:  "uppercase",
  padding:        "13px 20px",
  borderBottom:   `1px solid ${C.goldFaint}`,
  textAlign:      "center",
  fontWeight:     700,
  whiteSpace:     "nowrap",
  fontFamily:     fontUiSans,
}

export const tdStyle: CSSProperties = {
  color:         C.textBright,
  fontSize:      F.sm,
  fontWeight:    400,
  lineHeight:    1.45,
  padding:       "14px 20px",
  borderBottom:  `1px solid #c9a84c0d`,
  verticalAlign: "middle",
  textAlign:     "center",
  fontFamily:    fontUiSans,
}

// Card wrapping the table: adds horizontal padding to separate from border
export const tableCardStyle: CSSProperties = {
  ...cardStyle,
  padding: "0 0 0",
  overflow: "hidden",
}

export function goldBtn(variant: "primary" | "ghost" | "danger" = "primary"): CSSProperties {
  const base: CSSProperties = {
    padding:       "10px 22px",
    borderRadius:  8,
    fontSize:      F.xs,
    fontWeight:    600,
    letterSpacing: F.trackingNormal,
    fontFamily:    fontUiSans,
    cursor:        "pointer",
    border:        "1px solid",
    lineHeight:    1.4,
  }
  if (variant === "primary") return { ...base,
    background:  `linear-gradient(135deg, ${C.goldMid}, ${C.gold}, #b8932a)`,
    color:       "#080b18",
    borderColor: C.gold,
    boxShadow:   `0 2px 12px ${C.goldGlow}`,
  }
  if (variant === "danger") return { ...base,
    background:  "transparent",
    color:       C.danger,
    borderColor: C.dangerBorder,
  }
  return { ...base,
    background:  "transparent",
    color:       C.textMuted,
    borderColor: C.goldDim,
  }
}

/** Page main title (h1/h2) */
export const sectionTitle: CSSProperties = {
  color:         C.gold,
  fontSize:      F.xl,
  fontWeight:    700,
  letterSpacing: F.trackingTight,
  lineHeight:    1.25,
  textTransform: "none",
  marginBottom:  24,
  fontFamily:    fontUiSans,
}

/** Card/block subtitle */
export const cardTitle: CSSProperties = {
  color:          C.gold,
  fontSize:       F.md,
  fontWeight:     700,
  letterSpacing:  F.trackingTight,
  lineHeight:     1.3,
  textTransform:  "none",
  paddingBottom:  14,
  marginBottom:   16,
  borderBottom:   `1px solid ${C.goldFaint}`,
  fontFamily:     fontUiSans,
}
