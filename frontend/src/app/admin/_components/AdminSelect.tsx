"use client"

import { useEffect, useRef, useState } from "react"
import { C, F } from "@/lib/theme"
import { input } from "./AdminShell"

export type AdminSelectOption<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  value: T
  options: readonly AdminSelectOption<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.textHint}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** Native select replacement — panel/hover styled for admin dark/gold UI */
export function AdminSelect<T extends string>({ value, options, onChange, ariaLabel }: Props<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        style={{
          ...input,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          padding: "12px 16px 12px 16px",
        }}
      >
        <span style={{ color: C.textWhite, fontSize: F.sm }}>{selectedLabel}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 6px)",
            margin: 0,
            padding: 6,
            listStyle: "none",
            zIndex: 60,
            background: "linear-gradient(160deg, #121c3af2, #0d1530f5)",
            border: `1px solid ${C.goldDim}`,
            borderRadius: 10,
            boxShadow: `0 16px 48px #000000aa, 0 0 0 1px ${C.goldFaint}`,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "none",
                    borderRadius: 8,
                    background: active ? `${C.gold}24` : "transparent",
                    color: active ? C.gold : C.textBright,
                    fontSize: F.sm,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#1a2a50"
                      e.currentTarget.style.color = C.textBright
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = C.textBright
                    }
                  }}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
