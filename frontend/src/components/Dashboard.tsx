"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { clearToken, clearUser, getUser, UserData } from "@/lib/auth"
import ChangePasswordForm from "./ChangePasswordForm"
import UploadForm from "./UploadForm"
import StarBackground from "./StarBackground"
import { C, F, cardStyle, fontUiSans } from "@/lib/theme"

interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  function handleLogout() {
    clearToken()
    clearUser()
    onLogout()
  }

  return (
    <div className="min-h-screen" style={{ color: C.textBright }}>
      <StarBackground />

      {/* Navbar */}
      <nav
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{ position: "relative", zIndex: 1, borderBottom: `1px solid ${C.goldDim}`, background: "#0a0f22cc", backdropFilter: "blur(12px)" }}
      >
        <span className="font-bold" style={{ color: C.gold, fontSize: F.sm, letterSpacing: F.trackingTight, fontFamily: fontUiSans }}>
          Order of New Era
        </span>
        <div className="flex items-center gap-4">
          {user?.nickname && (
            <span style={{ color: C.textGold, fontSize: F.sm }}>
              {user.nickname}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded font-semibold"
            style={{
              border: `1px solid ${C.goldDim}`,
              color: C.gold,
              fontSize: F.xs,
              letterSpacing: F.trackingNormal,
              fontFamily: fontUiSans,
              background: "transparent",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${C.gold}22`
              e.currentTarget.style.borderColor = C.gold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = C.goldDim
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8" style={{ position: "relative", zIndex: 1 }}>
        {/* User Profile Card */}
        {user && (
          <div
            className="rounded-2xl p-6"
            style={cardStyle}
          >
            <h2
              className="mb-6"
              style={{ color: C.gold, fontSize: F.md, fontWeight: 700, letterSpacing: F.trackingTight, lineHeight: 1.3, borderBottom: `1px solid ${C.goldDim}`, paddingBottom: "12px", fontFamily: fontUiSans }}
            >
              Commander Profile
            </h2>

            <div className="flex gap-6 items-start">
              {/* Avatar */}
              <div
                className="relative shrink-0 rounded-xl overflow-hidden"
                style={{ width: 80, height: 80, border: `2px solid ${C.goldDim}` }}
              >
                {user.avatar_image ? (
                  <Image
                    src={user.avatar_image}
                    alt="avatar"
                    fill
                    className="object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "#1a2448", color: C.gold }}>
                    ★
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold" style={{ color: "#f5e6c0", fontSize: F.xl }}>
                    {user.nickname ?? "—"}
                  </span>
                  {user.stove_lv != null && (
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{ background: "#1a2448", color: C.gold, border: `1px solid ${C.goldDim}`, fontSize: F.xs }}
                    >
                      Lv.{user.stove_lv}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <InfoRow label="FID" value={String(user.fid)} />
                  <InfoRow label="Kingdom" value={user.kid != null ? `#${user.kid}` : "—"} />
                </div>

                {/* Stove Level Image */}
                {user.stove_lv_content && (
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ color: "#a89060", fontSize: F.xs }}>Stove</span>
                    <div className="relative" style={{ width: 28, height: 28 }}>
                      <Image
                        src={user.stove_lv_content}
                        alt="stove level"
                        fill
                        className="object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feature area */}
        <ChangePasswordForm onLogout={handleLogout} />
        <UploadForm />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ color: "#a89060", fontSize: F.xs, fontWeight: 600, letterSpacing: F.trackingNormal, fontFamily: fontUiSans }}>{label}</span>
      <span className="font-medium" style={{ color: C.textGold, fontSize: F.base }}>{value}</span>
    </div>
  )
}
