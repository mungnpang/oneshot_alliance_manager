"use client"

import Image from "next/image"
import StarBackground from "./StarBackground"
import { C, F, cardStyle, fontUiSans } from "@/lib/theme"

interface Props {
  children: React.ReactNode
}

export default function AuthCard({ children }: Props) {
  return (
    <>
      <StarBackground starCount={220} />

      {/* Page content: z-index 1 so it sits above background layers */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem" }}>
        {/* Logo */}
        <div className="mb-8 flex-shrink-0">
          <Image
            src="/alliance_logo.png"
            alt="Order of New Era"
            width={144}
            height={144}
            className="rounded-2xl"
          />
        </div>

        {/* Card */}
        <div
          className="relative w-full max-w-sm rounded-2xl p-8"
          style={cardStyle}
        >
          {/* Top shimmer line */}
          <div
            className="absolute top-0 left-12 right-12 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}cc, transparent)` }}
          />
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l rounded-tl-2xl" style={{ borderColor: `${C.gold}88` }} />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r rounded-tr-2xl" style={{ borderColor: `${C.gold}88` }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l rounded-bl-2xl" style={{ borderColor: `${C.gold}44` }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r rounded-br-2xl" style={{ borderColor: `${C.gold}44` }} />

          {children}
        </div>

        {/* Bottom ornament */}
        <div className="mt-6 flex items-center gap-3">
          <div className="w-12 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.goldMid}bb)` }} />
          <p className="text-xs font-semibold" style={{ color: `${C.goldMid}bb`, letterSpacing: F.trackingNormal, fontFamily: fontUiSans }}>
            Order of New Era
          </p>
          <div className="w-12 h-px" style={{ background: `linear-gradient(90deg, ${C.goldMid}bb, transparent)` }} />
        </div>
      </div>
    </>
  )
}
