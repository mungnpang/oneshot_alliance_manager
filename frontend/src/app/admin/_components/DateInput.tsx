"use client"

import { useRef } from "react"
import { C, F, fontUiSans } from "@/lib/theme"

interface DateInputProps {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
}

export default function DateInput({ value, onChange, style }: DateInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <input
        ref={ref}
        type="date"
        className="date-input-custom"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background:   "#0f1c3eaa",
          border:       `1px solid ${C.goldDim}`,
          color:        C.textWhite,
          borderRadius: 8,
          padding:      "12px 40px 12px 16px",
          fontSize:     F.sm,
          fontFamily:   fontUiSans,
          fontWeight:   400,
          lineHeight:   1.5,
          width:        "100%",
          outline:      "none",
          boxSizing:    "border-box",
          colorScheme:  "dark",
          cursor:       "pointer",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = C.gold }}
        onBlur={e => { e.currentTarget.style.borderColor = C.goldDim }}
      />
      {/* Custom calendar icon — clicking opens the native picker */}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => (ref.current as HTMLInputElement & { showPicker?: () => void })?.showPicker?.()}
        style={{
          position:   "absolute",
          right:      10,
          top:        "50%",
          transform:  "translateY(-50%)",
          background: "transparent",
          border:     "none",
          padding:    4,
          cursor:     "pointer",
          color:      C.goldMid,
          display:    "flex",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
    </div>
  )
}
