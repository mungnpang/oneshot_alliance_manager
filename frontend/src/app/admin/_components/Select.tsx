"use client"

import { useEffect, useRef, useState } from "react"
import { C, F, fontUiSans } from "@/lib/theme"

export interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string | number | null
  onChange: (value: string | number | null) => void
  placeholder?: string
  width?: number | string
  height?: number
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select…",
  width = 200,
  height = 38,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative", width, flexShrink: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          height,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "linear-gradient(160deg, #1a2a4e99, #0f1c3ecc)",
          border: `1px solid ${open ? C.goldMid : C.goldFaint}`,
          borderRadius: 8,
          color: selected ? C.textBright : C.textHint,
          fontSize: F.xs,
          fontFamily: fontUiSans,
          fontWeight: 500,
          cursor: "pointer",
          boxSizing: "border-box",
          transition: "border-color 0.18s ease, box-shadow 0.18s ease",
          boxShadow: open ? `0 0 0 2px ${C.goldGlow}` : "none",
          outline: "none",
          letterSpacing: F.trackingNormal,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected?.label ?? placeholder}
        </span>
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: C.goldMid,
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: height + 6,
            left: 0,
            right: 0,
            zIndex: 200,
            background: "linear-gradient(160deg, #1a2a58ee, #0f1c40f5)",
            border: `1px solid ${C.goldFaint}`,
            borderRadius: 10,
            backdropFilter: "blur(16px)",
            boxShadow: `0 12px 40px #00000066, 0 0 0 1px ${C.goldGlow2}, inset 0 1px 0 ${C.goldGlow2}`,
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          {options.map(opt => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 14px",
                  textAlign: "left",
                  background: isActive ? `${C.gold}18` : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${isActive ? C.gold : "transparent"}`,
                  color: isActive ? C.gold : C.textBright,
                  fontSize: F.xs,
                  fontFamily: fontUiSans,
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  letterSpacing: F.trackingNormal,
                  transition: "background 0.12s ease, color 0.12s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  boxSizing: "border-box",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = `${C.gold}0e`
                    e.currentTarget.style.color = C.textBright
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = C.textBright
                  }
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
