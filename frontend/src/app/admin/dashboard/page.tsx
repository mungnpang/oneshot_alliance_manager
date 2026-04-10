"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminShell, { card, gold } from "../_components/AdminShell"
import { adminApi, fetchAllMembers, type AllianceRead, type EventOccurrenceWithEvent, type EventRead, type MemberRead } from "@/lib/admin-api"
import { C, F, cardTitle, fontUiSans, sectionTitle } from "@/lib/theme"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EVENT_COLORS = [
  "#c9a84c", "#7c9edc", "#7dc98c", "#dc8c7c", "#c97cbd", "#7ccdc9", "#dcb87c",
]

function getEventColor(eventId: number) {
  return EVENT_COLORS[eventId % EVENT_COLORS.length]
}

const BAR_H = 34       // height of each event bar
const BAR_GAP = 6      // gap between stacked bars
const ROW_STRIDE = BAR_H + BAR_GAP  // 40px per level

interface Segment {
  occ: EventOccurrenceWithEvent
  colStart: number
  colEnd: number
  isStart: boolean
  isEnd: boolean
  level: number
}

function buildSegments(
  occs: EventOccurrenceWithEvent[],
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

export default function AdminDashboard() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberRead[]>([])
  const [alliances, setAlliances] = useState<AllianceRead[]>([])
  const [events, setEvents] = useState<EventRead[]>([])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [occurrences, setOccurrences] = useState<EventOccurrenceWithEvent[]>([])

  const loadOccurrences = useCallback((y: number, m: number) => {
    adminApi.listOccurrencesByMonth(y, m).then(setOccurrences).catch(() => {})
  }, [])

  useEffect(() => {
    fetchAllMembers().then(setMembers).catch(() => {})
    adminApi.listAlliances().then(setAlliances).catch(() => {})
    adminApi.listEvents().then(setEvents).catch(() => {})
    loadOccurrences(today.getFullYear(), today.getMonth() + 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setYear(y); setMonth(m); loadOccurrences(y, m)
  }
  function nextMonth() {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setYear(y); setMonth(m); loadOccurrences(y, m)
  }
  function goToday() {
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    setYear(y); setMonth(m); loadOccurrences(y, m)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const numWeeks = Math.ceil((firstDay + daysInMonth) / 7)
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : null

  const stats = [
    { label: "Total Members", value: members.length },
    { label: "Alliances", value: alliances.length },
    { label: "Events", value: events.length },
    { label: "Admins", value: members.filter(m => m.is_admin).length },
  ]

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <AdminShell>
      <h2 style={{ ...sectionTitle, fontSize: 28, marginBottom: 48 }}>Dashboard</h2>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginBottom: 48 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: "36px 40px" }}>
            <div style={{ color: C.textHint, fontSize: 13, fontWeight: 600, letterSpacing: F.trackingNormal, marginBottom: 14, fontFamily: fontUiSans }}>
              {s.label}
            </div>
            <div style={{ color: gold, fontSize: 48, fontWeight: 700, lineHeight: 1, fontFamily: fontUiSans }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ ...card, padding: 32 }}>
        {/* Calendar header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ ...(cardTitle as React.CSSProperties), fontSize: 22 }}>{monthLabel}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={goToday} style={navBtn}>Today</button>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>
        </div>

        {/* Day name headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #ffffff10", paddingBottom: 12, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 13, color: C.textHint, fontWeight: 600, fontFamily: fontUiSans, letterSpacing: F.trackingNormal }}>
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {Array.from({ length: numWeeks }).map((_, weekIdx) => {
          const segments = buildSegments(occurrences, firstDay, daysInMonth, weekIdx)
          const maxLevel = segments.reduce((m, s) => Math.max(m, s.level), -1)
          const eventsH = maxLevel >= 0 ? (maxLevel + 1) * ROW_STRIDE + 8 : 24

          return (
            <div key={weekIdx} style={{ borderBottom: weekIdx < numWeeks - 1 ? "1px solid #ffffff08" : undefined }}>
              {/* Day number cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                {Array.from({ length: 7 }).map((_, col) => {
                  const dayNum = weekIdx * 7 + col - firstDay + 1
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth
                  const isToday = isValid && dayNum === todayDay
                  return (
                    <div key={col} style={{
                      padding: "14px 12px 6px",
                      borderLeft: col > 0 ? "1px solid #ffffff06" : undefined,
                    }}>
                      {isValid && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: isToday ? gold : "transparent",
                          color: isToday ? "#1a1208" : C.textHint,
                          fontSize: 14,
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
              <div style={{ position: "relative", height: eventsH, margin: "0 6px 12px" }}>
                {segments.map((seg, i) => {
                  const color = getEventColor(seg.occ.event_id)
                  const colW = 100 / 7
                  return (
                    <div
                      key={i}
                      onClick={() => router.push(`/admin/events/${seg.occ.event_id}/participations?occurrence=${seg.occ.id}`)}
                      title={`${seg.occ.event_name}${seg.occ.label ? ` · ${seg.occ.label}` : ""}${seg.occ.note ? `\n${seg.occ.note}` : ""}`}
                      style={{
                        position: "absolute",
                        left: `calc(${seg.colStart * colW}% + 3px)`,
                        right: `calc(${(6 - seg.colEnd) * colW}% + ${seg.isEnd ? 3 : 0}px)`,
                        top: seg.level * ROW_STRIDE,
                        height: BAR_H,
                        background: `${color}28`,
                        borderTop: `1px solid ${color}66`,
                        borderBottom: `1px solid ${color}66`,
                        borderLeft: seg.isStart ? `4px solid ${color}` : "none",
                        borderRight: seg.isEnd ? `1px solid ${color}66` : "none",
                        borderRadius: seg.isStart && seg.isEnd
                          ? 6
                          : seg.isStart ? "6px 0 0 6px"
                          : seg.isEnd ? "0 6px 6px 0"
                          : 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        paddingLeft: seg.isStart ? 10 : 0,
                        paddingRight: 10,
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {seg.isStart && (
                        <>
                          {seg.occ.event_thumbnail_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/images/${seg.occ.event_thumbnail_url}`}
                              alt=""
                              style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                            />
                          )}
                          <span style={{
                            fontSize: 13,
                            color,
                            fontFamily: fontUiSans,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1,
                          }}>
                            {seg.occ.event_name}{seg.occ.label ? ` · ${seg.occ.label}` : ""}
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
    </AdminShell>
  )
}

const navBtn: React.CSSProperties = {
  background: "#ffffff0f",
  border: "1px solid #ffffff18",
  borderRadius: 8,
  color: C.textBright,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: fontUiSans,
  padding: "8px 18px",
  lineHeight: 1.5,
}
