"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { clearToken, clearUser } from "@/lib/auth"
import StarBackground from "@/components/StarBackground"
import { C, F, fontUiSans, tableCardStyle, thStyle, tdStyle, goldBtn, inputStyle } from "@/lib/theme"

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/members",
    label: "Member Management",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <circle cx="9" cy="7" r="3.5" /><path d="M2 21c0-4 3.1-7 7-7s7 3 7 7" strokeLinecap="round" />
        <circle cx="18" cy="8" r="2.5" /><path d="M22 21c0-3-1.8-5-4-5.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/alliances",
    label: "Alliance Management",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path d="M12 3l8 4v5c0 4.4-3.4 8.5-8 9.5C7.4 20.5 4 16.4 4 12V7l8-4z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/events",
    label: "Event Management",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
      </svg>
    ),
  },
]

// ── Common color re-export (for sub-page compatibility) ──────────────────────────
export const gold = C.gold
export const goldDim = C.goldDim

// ── Style re-export ───────────────────────────────────────────────────────
export const card: React.CSSProperties = tableCardStyle
export const th: React.CSSProperties = thStyle
export const td: React.CSSProperties = tdStyle
export const input: React.CSSProperties = inputStyle

export const btn = (variant: "gold" | "danger" | "ghost" = "gold"): React.CSSProperties => {
  if (variant === "gold") return goldBtn("primary")
  if (variant === "danger") return goldBtn("danger")
  return goldBtn("ghost")
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    clearToken(); clearUser(); router.replace("/admin")
  }

  return (
    <>
      <StarBackground starCount={160} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${C.goldFaint}`,
          background: `linear-gradient(180deg, ${C.bgSidebar} 0%, #0d153099 100%)`,
          backdropFilter: "blur(24px)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}>

          {/* Logo */}
          <div style={{
            padding: "28px 20px 24px",
            borderBottom: `1px solid ${C.goldFaint}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: `0 0 28px ${C.goldGlow}, 0 4px 24px rgba(0,0,0,0.4)`,
            }}>
              <Image src="/alliance_logo.png" alt="logo" width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: C.textBright, fontFamily: fontUiSans, lineHeight: 1.2 }}>
                Oneshot
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textHint, fontFamily: fontUiSans, marginTop: 5 }}>
                Alliance Manager
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "18px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textHint, padding: "0 10px", marginBottom: 10, fontFamily: fontUiSans }}>
              Menu
            </div>
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-nav-item${active ? " active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 12px",
                    borderRadius: 10,
                    fontSize: F.xs,
                    fontWeight: active ? 600 : 500,
                    fontFamily: fontUiSans,
                    color: active ? C.gold : C.textBright,
                    background: active ? `linear-gradient(90deg, ${C.gold}11, ${C.gold}05)` : "transparent",
                    borderLeft: `2px solid ${active ? C.gold : "transparent"}`,
                    textDecoration: "none",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.75, display: "flex", flexShrink: 0, transition: "opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    {icon}
                  </span>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: "14px 10px 20px", borderTop: `1px solid ${C.goldFaint}` }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 10,
                fontSize: F.xs,
                fontWeight: 500,
                color: C.textBright,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: fontUiSans,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.color = C.danger
                el.style.background = "#ff606010"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.color = C.textBright
                el.style.background = "transparent"
              }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} style={{ flexShrink: 0 }}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
