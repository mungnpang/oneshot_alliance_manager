"use client"

import { useEffect, useState } from "react"
import { C } from "@/lib/theme"

interface Star {
  w: number; h: number; top: number; left: number
  opacity: number; duration: number; delay: number
  color: string; glow: boolean
}

interface Props {
  starCount?: number
}

export default function StarBackground({ starCount = 200 }: Props) {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const colors = ["#ffffff", "#ffe8b0", "#b0d4ff", "#ffd0f0", "#d4af37"]
    setStars(Array.from({ length: starCount }, () => {
      const size = Math.random()
      const w = size < 0.6 ? Math.random() * 1 + 0.5
              : size < 0.9 ? Math.random() * 1.5 + 1.5
              : Math.random() * 3 + 3
      const glow = w > 3
      const color = colors[Math.floor(Math.random() * colors.length)]
      return {
        w, h: w * (0.8 + Math.random() * 0.4),
        top: Math.random() * 100, left: Math.random() * 100,
        opacity: glow ? 0.85 + Math.random() * 0.15 : Math.random() * 0.6 + 0.3,
        duration: Math.random() * 4 + 1.5, delay: Math.random() * 6,
        color, glow,
      }
    }))
  }, [starCount])

  return (
    <>
      {/* Base background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: C.bgGrad }} />

      {/* Nebula layer */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: "70vw", height: "55vw", top: "-15%", left: "-15%", borderRadius: "50%", filter: "blur(70px)", background: "radial-gradient(circle, #2855cc66 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", width: "60vw", height: "50vw", bottom: "-10%", right: "-10%", borderRadius: "50%", filter: "blur(70px)", background: "radial-gradient(circle, #7030dd55 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", width: "40vw", height: "30vw", top: "30%", left: "30%", borderRadius: "50%", filter: "blur(50px)", background: "radial-gradient(circle, #d4af3730 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", width: "35vw", height: "28vw", top: "0%", right: "0%", borderRadius: "50%", filter: "blur(60px)", background: "radial-gradient(circle, #1a6a8844 0%, transparent 65%)" }} />
      </div>

      {/* Stars */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <style>{`
          @keyframes twinkle {
            0%,100%{opacity:var(--op);transform:scale(1)}
            50%{opacity:calc(var(--op)*0.2);transform:scale(0.4)}
          }
          @keyframes sparkle {
            0%,100%{opacity:var(--op);transform:scale(1) rotate(0deg);filter:blur(0)}
            25%{opacity:1;transform:scale(1.6) rotate(15deg);filter:blur(.5px)}
            75%{opacity:calc(var(--op)*0.4);transform:scale(.7) rotate(-10deg);filter:blur(0)}
          }
        `}</style>
        {stars.map((s, i) => (
          <span key={i} style={{
            position: "absolute",
            width: s.w + "px", height: s.h + "px",
            top: s.top + "%", left: s.left + "%",
            borderRadius: s.glow ? "2px" : "50%",
            background: s.color,
            opacity: s.opacity,
            ["--op" as string]: s.opacity,
            boxShadow: s.glow ? `0 0 ${s.w*3}px ${s.w}px ${s.color}99` : undefined,
            animation: s.glow
              ? `sparkle ${s.duration}s ${s.delay}s ease-in-out infinite`
              : `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  )
}
