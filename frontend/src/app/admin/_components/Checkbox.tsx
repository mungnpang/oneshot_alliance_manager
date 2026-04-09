"use client"

import { C } from "@/lib/theme"

interface CheckboxProps {
  checked: boolean
  size?: number
}

export default function Checkbox({ checked, size = 16 }: CheckboxProps) {
  return (
    <div
      style={{
        width:        size,
        height:       size,
        flexShrink:   0,
        borderRadius: 3,
        border:       `1.5px solid ${checked ? C.gold : C.goldDim}`,
        background:   checked ? C.gold : "transparent",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        boxSizing:    "border-box",
        transition:   "border-color 0.15s ease, background 0.15s ease",
        pointerEvents: "none",
      }}
    >
      {checked && (
        <svg
          width={Math.round(size * 0.63)}
          height={Math.round(size * 0.5)}
          viewBox="0 0 10 8"
          fill="none"
        >
          <path
            d="M1 4l3 3 5-6"
            stroke="#0d1530"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
