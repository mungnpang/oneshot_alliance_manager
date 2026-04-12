"use client"

import React, { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import StarBackground from "@/components/StarBackground"
import { C, F, fontUiSans } from "@/lib/theme"
import { API_BASE_URL } from "@/lib/api-config"
import { useRouter } from "next/navigation"
import { getUser, getToken, clearToken, clearUser, authApi, type UserData } from "@/lib/auth"

// ── Types ─────────────────────────────────────────────────────────────────────
interface EventStatItem {
  event_id: number
  event_name: string
  thumbnail_url: string | null
  count: number
  eval_weight: number
}
interface MemberStats {
  stats: EventStatItem[]
  total_score: number
}

interface HomeDataResponse {
  occurrences: EventOccurrence[]
  stats: MemberStats | null
}

async function fetchHomeData(year: number, month: number, token: string | null): Promise<HomeDataResponse> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/public/home-data?year=${year}&month=${month}`,
      { headers, cache: "default" },
    )
    if (!res.ok) return { occurrences: [], stats: null }
    return res.json()
  } catch {
    return { occurrences: [], stats: null }
  }
}

interface EventOccurrence {
  id: number
  event_id: number
  alliance_id: number | null
  period_start: string
  period_end: string | null
  label: string | null
  note: string | null
  event_name: string
  event_thumbnail_url: string | null
}

// ── Calendar constants ────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_NAMES_SHORT = ["S", "M", "T", "W", "T", "F", "S"]
const EVENT_COLORS = ["#c9a84c", "#7c9edc", "#7dc98c", "#dc8c7c", "#c97cbd", "#7ccdc9", "#dcb87c"]

function getEventColor(eventId: number) {
  return EVENT_COLORS[eventId % EVENT_COLORS.length]
}

interface Segment {
  occ: EventOccurrence
  colStart: number
  colEnd: number
  isStart: boolean
  isEnd: boolean
  level: number
}

function buildSegments(
  occs: EventOccurrence[],
  firstDay: number,
  daysInMonth: number,
  weekIdx: number,
): Segment[] {
  const raw: Omit<Segment, "level">[] = []

  for (const occ of occs) {
    const startDay = new Date(occ.period_start).getDate()
    const endDay = occ.period_end
      ? Math.min(daysInMonth, new Date(occ.period_end).getDate())
      : startDay

    const startCell = firstDay + startDay - 1
    const endCell = firstDay + endDay - 1
    const startWeek = Math.floor(startCell / 7)
    const endWeek = Math.floor(endCell / 7)

    if (weekIdx < startWeek || weekIdx > endWeek) continue

    raw.push({
      occ,
      colStart: weekIdx === startWeek ? startCell % 7 : 0,
      colEnd: weekIdx === endWeek ? endCell % 7 : 6,
      isStart: weekIdx === startWeek,
      isEnd: weekIdx === endWeek,
    })
  }

  raw.sort((a, b) => a.colStart - b.colStart || b.colEnd - a.colEnd)

  const result: Segment[] = []
  for (const seg of raw) {
    const taken = result
      .filter(r => r.colStart <= seg.colEnd && r.colEnd >= seg.colStart)
      .map(r => r.level)
    let level = 0
    while (taken.includes(level)) level++
    result.push({ ...seg, level })
  }

  return result
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PublicCalendarPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [pwModal, setPwModal] = useState(false)
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const u = getUser()
    setUser(u)
    const token = getToken()
    void fetchHomeData(today.getFullYear(), today.getMonth() + 1, token).then(({ occurrences: occ, stats }) => {
      setOccurrences(occ)
      setMemberStats(stats)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openPwModal() {
    setPwCurrent(""); setPwNew(""); setPwConfirm("")
    setPwError(""); setPwSuccess(false)
    setPwModal(true)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return }
    const token = getToken()
    if (!token) return
    setPwError(""); setPwLoading(true)
    try {
      await authApi.changePassword(pwCurrent, pwNew, token)
      setPwSuccess(true)
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setPwLoading(false)
    }
  }

  const load = useCallback((y: number, m: number) => {
    const token = getToken()
    void fetchHomeData(y, m, token).then(({ occurrences: occ, stats }) => {
      setOccurrences(occ)
      setMemberStats(stats)
    })
  }, [])

  function prevMonth() {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setYear(y); setMonth(m); load(y, m)
  }
  function nextMonth() {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setYear(y); setMonth(m); load(y, m)
  }
  function goToday() {
    setYear(today.getFullYear()); setMonth(today.getMonth() + 1)
    load(today.getFullYear(), today.getMonth() + 1)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const numWeeks = Math.ceil((firstDay + daysInMonth) / 7)
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : null

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long", year: "numeric",
  })

  // Responsive calendar sizing
  const BAR_H = isMobile ? 22 : 34
  const BAR_GAP = isMobile ? 4 : 6
  const ROW_STRIDE = BAR_H + BAR_GAP

  return (
    <>
      <StarBackground starCount={180} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

        {/* ── Header ── */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 18px" : "20px 40px",
          borderBottom: `1px solid ${C.goldFaint}`,
          background: "linear-gradient(180deg, #0d153044 0%, transparent 100%)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: isMobile ? 40 : 54, height: isMobile ? 40 : 54, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <Image src="/alliance_logo.png" alt="logo" width={54} height={54} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 700, color: C.textBright, fontFamily: fontUiSans, lineHeight: 1.2 }}>
                Oneshot
              </div>
              {!isMobile && (
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textHint, fontFamily: fontUiSans }}>
                  Alliance Manager
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {user?.is_admin && (
              <Link href="/admin" style={headerBtn(isMobile)}>Admin</Link>
            )}
            {!user && (
              <Link href="/login" style={headerBtn(isMobile)}>Login</Link>
            )}
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ padding: isMobile ? "16px 14px" : "36px 40px", maxWidth: 1400, margin: "0 auto" }}>

          {/* ── Profile + Stats ── */}
          {user && (
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "stretch",
              gap: 14,
              marginBottom: 20,
            }}>

              {/* Profile card */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 16 : 24,
                background: "linear-gradient(135deg, #1e2f5866, #152040aa)",
                border: `1px solid ${C.goldFaint}`,
                borderRadius: 18,
                padding: isMobile ? "18px 20px" : "24px 32px",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
              }}>
                <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}88, transparent)` }} />

                {/* Avatar */}
                <div style={{
                  width: isMobile ? 72 : 88,
                  height: isMobile ? 72 : 88,
                  borderRadius: "50%",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: `2px solid ${C.goldDim}`,
                  background: "#0f1c3e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {user.avatar_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_image.startsWith("http") ? user.avatar_image : `/images/${user.avatar_image}`}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke={C.goldDim} strokeWidth={1.5}>
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {user.alliance_alias && (
                      <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: C.goldMid, fontFamily: fontUiSans, lineHeight: 1, whiteSpace: "nowrap" }}>
                        [{user.alliance_alias}]
                      </span>
                    )}
                    <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: C.textBright, fontFamily: fontUiSans, lineHeight: 1, whiteSpace: "nowrap" }}>
                      {user.nickname ?? `FID ${user.fid}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.textHint, fontFamily: fontUiSans, flexWrap: "wrap" }}>
                    <span>FID <span style={{ color: C.textMuted, fontWeight: 600 }}>{user.fid}</span></span>
                    {user.kid != null && (
                      <>
                        <span style={{ width: 1, height: 12, background: C.goldFaint, flexShrink: 0 }} />
                        <span>Kingdom <span style={{ color: C.textMuted, fontWeight: 600 }}>{user.kid}</span></span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                    <button onClick={openPwModal} style={profileBtn}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                      </svg>
                      Change Password
                    </button>
                    <button
                      onClick={() => { clearToken(); clearUser(); router.replace("/login") }}
                      style={profileBtnDanger}
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats panel */}
              {memberStats && (
                <div style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #1e2f5866, #152040aa)",
                  border: `1px solid ${C.goldFaint}`,
                  borderRadius: 18,
                  padding: isMobile ? "18px 20px" : "24px 28px",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}>
                  <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}88, transparent)` }} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textHint, fontFamily: fontUiSans, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Event Participation
                    </div>
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: 5,
                      background: `${C.gold}18`, border: `1px solid ${C.goldFaint}`,
                      borderRadius: 8, padding: "3px 10px",
                    }}>
                      <span style={{ fontSize: 11, color: C.textHint, fontFamily: fontUiSans }}>Total</span>
                      <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: C.gold, fontFamily: fontUiSans, lineHeight: 1 }}>
                        {memberStats.total_score % 1 === 0
                          ? memberStats.total_score.toFixed(0)
                          : memberStats.total_score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const maxCols = isMobile ? 2 : 3
                    const maxRows = 3
                    const visible = memberStats.stats.slice(0, maxCols * maxRows)
                    const numCols = Math.min(maxCols, Math.max(2, Math.ceil(visible.length / maxRows)))
                    const cols = Array.from({ length: numCols }, (_, ci) =>
                      visible.slice(ci * maxRows, ci * maxRows + maxRows)
                    )
                    const renderItem = (s: EventStatItem | null, idx: number) => (
                      <div key={s ? s.event_id : `empty-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, height: isMobile ? 26 : 32 }}>
                        {s ? (
                          <>
                            {s.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`/images/${s.thumbnail_url}`} alt="" style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, objectFit: "contain", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, flexShrink: 0 }} />
                            )}
                            <span style={{ flex: 1, fontSize: isMobile ? 12 : 13, color: C.textBright, fontFamily: fontUiSans, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.event_name}
                            </span>
                            <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: getEventColor(s.event_id), fontFamily: fontUiSans, flexShrink: 0 }}>
                              {s.count}×
                            </span>
                          </>
                        ) : (
                          <div style={{ flex: 1, height: 1, background: "#ffffff06", borderRadius: 1 }} />
                        )}
                      </div>
                    )
                    const pad = (col: EventStatItem[]) =>
                      Array.from({ length: maxRows }, (_, i) => renderItem(col[i] ?? null, i))
                    return (
                      <div style={{ display: "flex", gap: isMobile ? 14 : 24 }}>
                        {cols.map((col, ci) => (
                          <React.Fragment key={ci}>
                            {ci > 0 && <div style={{ width: 1, background: C.goldFaint, flexShrink: 0 }} />}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8 }}>{pad(col)}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── Change Password Modal ── */}
          {pwModal && (
            <div
              onClick={e => { if (e.target === e.currentTarget) setPwModal(false) }}
              style={{
                position: "fixed", inset: 0, zIndex: 100,
                background: "rgba(5, 10, 25, 0.75)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: isMobile ? "0 16px" : 0,
              }}
            >
              <div style={{
                width: "100%",
                maxWidth: 400,
                background: "linear-gradient(160deg, #1e2f58ee, #152040f5)",
                border: `1px solid ${C.goldFaint}`,
                borderRadius: 20,
                padding: isMobile ? "28px 22px" : "36px 32px",
                position: "relative",
                boxShadow: "0 24px 64px -12px rgba(0,0,0,0.6)",
              }}>
                <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}99, transparent)` }} />

                <button
                  onClick={() => setPwModal(false)}
                  style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", color: C.textHint, padding: 4, lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.textBright}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textHint}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>

                <div style={{ fontSize: 18, fontWeight: 700, color: C.gold, fontFamily: fontUiSans, marginBottom: 6 }}>Change Password</div>
                <div style={{ fontSize: 13, color: C.textHint, fontFamily: fontUiSans, marginBottom: 28 }}>Update your account password</div>

                {pwSuccess ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0a2e1866", border: `1px solid ${C.success}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={C.success} strokeWidth={2.5}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p style={{ color: C.success, fontSize: 14, fontFamily: fontUiSans, textAlign: "center" }}>Password changed successfully</p>
                    <button
                      onClick={() => setPwModal(false)}
                      style={{ background: `linear-gradient(135deg, ${C.goldMid}, ${C.gold})`, color: "#080b18", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 700, fontFamily: fontUiSans, cursor: "pointer" }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Current Password", value: pwCurrent, set: setPwCurrent },
                      { label: "New Password",     value: pwNew,     set: setPwNew },
                      { label: "Confirm Password", value: pwConfirm, set: setPwConfirm },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textHint, fontFamily: fontUiSans, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
                          {label}
                        </label>
                        <input
                          type="password" value={value} onChange={e => set(e.target.value)} required
                          style={{ width: "100%", background: "#0f1c3eaa", border: `1px solid ${C.goldDim}`, borderRadius: 8, padding: "10px 14px", color: C.textWhite, fontSize: 14, fontFamily: fontUiSans, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
                          onBlur={e => (e.currentTarget.style.borderColor = C.goldDim)}
                        />
                      </div>
                    ))}
                    {pwError && (
                      <p style={{ background: C.bgError, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, textAlign: "center", fontFamily: fontUiSans }}>
                        {pwError}
                      </p>
                    )}
                    <button
                      type="submit" disabled={pwLoading}
                      style={{ background: `linear-gradient(135deg, ${C.goldMid}, ${C.gold}, #b8932a)`, color: "#080b18", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, fontFamily: fontUiSans, cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.6 : 1, marginTop: 4 }}
                    >
                      {pwLoading ? "Updating..." : "Change Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── Calendar ── */}
          <div style={{
            background: "linear-gradient(160deg, #1e2f5877, #152040aa)",
            border: `1px solid ${C.goldFaint}`,
            boxShadow: `0 20px 60px -15px rgba(0,0,0,0.4), inset 0 1px 0 #d4af3740`,
            borderRadius: 18,
            backdropFilter: "blur(20px)",
            padding: isMobile ? 14 : 32,
          }}>

            {/* Calendar header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 14 : 24 }}>
              <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: C.gold, fontFamily: fontUiSans, letterSpacing: "-0.02em" }}>
                {monthLabel}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={goToday} style={navBtn(isMobile)}>Today</button>
                <button onClick={prevMonth} style={navBtn(isMobile)}>‹</button>
                <button onClick={nextMonth} style={navBtn(isMobile)}>›</button>
              </div>
            </div>

            {/* Day names */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #ffffff10", paddingBottom: isMobile ? 8 : 12, marginBottom: 4 }}>
              {(isMobile ? DAY_NAMES_SHORT : DAY_NAMES).map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: isMobile ? 11 : 13, color: C.textHint, fontWeight: 600, fontFamily: fontUiSans, letterSpacing: "0.04em" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {Array.from({ length: numWeeks }).map((_, weekIdx) => {
              const segments = buildSegments(occurrences, firstDay, daysInMonth, weekIdx)
              const maxLevel = segments.reduce((m, s) => Math.max(m, s.level), -1)
              const eventsH = maxLevel >= 0 ? (maxLevel + 1) * ROW_STRIDE + 6 : isMobile ? 16 : 24

              return (
                <div key={weekIdx} style={{ borderBottom: weekIdx < numWeeks - 1 ? "1px solid #ffffff08" : undefined }}>
                  {/* Day number cells */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                    {Array.from({ length: 7 }).map((_, col) => {
                      const dayNum = weekIdx * 7 + col - firstDay + 1
                      const isValid = dayNum >= 1 && dayNum <= daysInMonth
                      const isToday = isValid && dayNum === todayDay
                      return (
                        <div key={col} style={{ padding: isMobile ? "8px 4px 4px" : "14px 12px 6px", borderLeft: col > 0 ? "1px solid #ffffff06" : undefined }}>
                          {isValid && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: isMobile ? 24 : 30,
                              height: isMobile ? 24 : 30,
                              borderRadius: "50%",
                              background: isToday ? C.gold : "transparent",
                              color: isToday ? "#1a1208" : C.textHint,
                              fontSize: isMobile ? 11 : 14,
                              fontWeight: isToday ? 700 : 400,
                              fontFamily: fontUiSans,
                            }}>
                              {dayNum}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Event bars */}
                  <div style={{ position: "relative", height: eventsH, margin: isMobile ? "0 2px 6px" : "0 6px 12px" }}>
                    {segments.map((seg, i) => {
                      const color = getEventColor(seg.occ.event_id)
                      const colW = 100 / 7
                      return (
                        <div
                          key={i}
                          title={`${seg.occ.event_name}${seg.occ.label ? ` · ${seg.occ.label}` : ""}${seg.occ.note ? `\n${seg.occ.note}` : ""}`}
                          style={{
                            position: "absolute",
                            left: `calc(${seg.colStart * colW}% + 2px)`,
                            right: `calc(${(6 - seg.colEnd) * colW}% + ${seg.isEnd ? 2 : 0}px)`,
                            top: seg.level * ROW_STRIDE,
                            height: BAR_H,
                            background: `${color}28`,
                            borderTop: `1px solid ${color}66`,
                            borderBottom: `1px solid ${color}66`,
                            borderLeft: seg.isStart ? `3px solid ${color}` : "none",
                            borderRight: seg.isEnd ? `1px solid ${color}66` : "none",
                            borderRadius: seg.isStart && seg.isEnd ? 5 : seg.isStart ? "5px 0 0 5px" : seg.isEnd ? "0 5px 5px 0" : 0,
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 4 : 8,
                            paddingLeft: seg.isStart ? (isMobile ? 6 : 10) : 0,
                            paddingRight: isMobile ? 4 : 10,
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {seg.isStart && (
                            <>
                              {seg.occ.event_thumbnail_url && !isMobile && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={`/images/${seg.occ.event_thumbnail_url}`}
                                  alt=""
                                  style={{ width: 16, height: 16, borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
                                />
                              )}
                              <span style={{
                                fontSize: isMobile ? 10 : 13,
                                color,
                                fontFamily: fontUiSans,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1,
                              }}>
                                {seg.occ.event_name}{!isMobile && seg.occ.label ? ` · ${seg.occ.label}` : ""}
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
function navBtn(isMobile: boolean): React.CSSProperties {
  return {
    background: "#ffffff0f",
    border: "1px solid #ffffff18",
    borderRadius: 7,
    color: C.textBright,
    cursor: "pointer",
    fontSize: isMobile ? 12 : 14,
    fontFamily: fontUiSans,
    padding: isMobile ? "6px 10px" : "8px 18px",
    lineHeight: 1.5,
  }
}

function headerBtn(isMobile: boolean): React.CSSProperties {
  return {
    fontSize: isMobile ? 12 : F.xs,
    fontFamily: fontUiSans,
    fontWeight: 500,
    color: C.textHint,
    textDecoration: "none",
    padding: isMobile ? "6px 12px" : "7px 16px",
    border: `1px solid ${C.goldFaint}`,
    borderRadius: 8,
    background: "transparent",
  }
}

const profileBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  fontSize: 12, fontFamily: fontUiSans, fontWeight: 500,
  color: C.textHint,
  background: "transparent",
  border: `1px solid ${C.goldFaint}`,
  borderRadius: 7,
  padding: "5px 11px",
  cursor: "pointer",
}

const profileBtnDanger: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  fontSize: 12, fontFamily: fontUiSans, fontWeight: 500,
  color: C.textHint,
  background: "transparent",
  border: `1px solid ${C.goldFaint}`,
  borderRadius: 7,
  padding: "5px 11px",
  cursor: "pointer",
}
