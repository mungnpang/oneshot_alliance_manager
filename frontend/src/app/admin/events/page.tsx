"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import AdminShell, { btn, card, gold, goldDim, input, td, th } from "../_components/AdminShell"
import DateInput from "../_components/DateInput"
import Select from "../_components/Select"
import {
  adminApi,
  type AllianceRead,
  type EventCreate,
  type EventOccurrenceRead,
  type EventRead,
  type EventUpdate,
  type LeaderboardEntry,
} from "@/lib/admin-api"
import { formatDateOnlyKo, isoDatetimeToDateInputValue } from "@/lib/date-format"
import {
  formatISOWeekLabel,
  localDateToPeriodEnd,
  localDateToPeriodStart,
  parseLocalDateString,
} from "@/lib/iso-week"
import { C, F, sectionTitle } from "@/lib/theme"

type Modal = { type: "create" } | { type: "edit"; event: EventRead }

type OccurrenceUIModal =
  | { mode: "create"; eventId: number; eventName: string }
  | { mode: "edit"; eventId: number; eventName: string; occurrence: EventOccurrenceRead }

type OccurrenceFormState = { startDate: string; endDate: string; note: string }

function todayYmd(): string {
  const n = new Date()
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRead[]>([])
  const [modal, setModal] = useState<Modal | null>(null)
  const [form, setForm] = useState<Partial<EventCreate & EventUpdate>>({})
  const [error, setError] = useState("")

  const [alliances, setAlliances] = useState<AllianceRead[]>([])
  const [selectedAllianceId, setSelectedAllianceId] = useState<number | null>(null)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)
  const [occurrences, setOccurrences] = useState<EventOccurrenceRead[]>([])
  const [occurrencesCursor, setOccurrencesCursor] = useState<string | null>(null)
  const [occurrenceError, setOccurrenceError] = useState("")

  const [occurrenceModal, setOccurrenceModal] = useState<OccurrenceUIModal | null>(null)
  const [occForm, setOccForm] = useState<OccurrenceFormState>({ startDate: "", endDate: "", note: "" })
  const [occSaveError, setOccSaveError] = useState("")

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  async function refreshEventList() {
    const data = await adminApi.listEvents().catch(() => [])
    setEvents(data)
  }

  async function refreshLeaderboard(allianceId: number | null) {
    const data = await adminApi.listLeaderboard(allianceId).catch(() => [] as LeaderboardEntry[])
    setLeaderboard(data)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [eventsData, alliancesData] = await Promise.all([
        adminApi.listEvents().catch(() => [] as EventRead[]),
        adminApi.listAlliances().catch(() => [] as AllianceRead[]),
      ])
      if (!cancelled) {
        setEvents(eventsData)
        setAlliances(alliancesData)
        const firstAllianceId = alliancesData.length > 0 ? alliancesData[0].id : null
        setSelectedAllianceId(firstAllianceId)
        void refreshLeaderboard(firstAllianceId)
      }
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleExpand(eventId: number) {
    if (expandedId === eventId) {
      setExpandedId(null)
      setOccurrences([])
      setOccurrencesCursor(null)
      setOccurrenceError("")
      return
    }
    setExpandedId(eventId)
    setOccurrenceError("")
    const page = await adminApi.listOccurrences(eventId, selectedAllianceId).catch(() => ({ items: [], next_cursor: null }))
    setOccurrences(page.items)
    setOccurrencesCursor(page.next_cursor)
  }

  async function loadMoreOccurrences(eventId: number) {
    if (!occurrencesCursor) return
    const page = await adminApi.listOccurrences(eventId, selectedAllianceId, occurrencesCursor).catch(() => ({ items: [], next_cursor: null }))
    setOccurrences(prev => [...prev, ...page.items])
    setOccurrencesCursor(page.next_cursor)
  }

  async function refreshOccurrences(eventId: number) {
    const page = await adminApi.listOccurrences(eventId, selectedAllianceId).catch(() => ({ items: [], next_cursor: null }))
    setOccurrences(page.items)
    setOccurrencesCursor(page.next_cursor)
  }

  function openOccurrenceCreate(eventId: number, eventName: string) {
    if (!selectedAllianceId) return
    setOccurrenceModal({ mode: "create", eventId, eventName })
    setOccForm({ startDate: todayYmd(), endDate: "", note: "" })
    setOccSaveError("")
  }

  function openOccurrenceEdit(eventId: number, eventName: string, o: EventOccurrenceRead) {
    setOccurrenceModal({ mode: "edit", eventId, eventName, occurrence: o })
    setOccForm({
      startDate: isoDatetimeToDateInputValue(o.period_start),
      endDate: o.period_end ? isoDatetimeToDateInputValue(o.period_end) : "",
      note: o.note ?? "",
    })
    setOccSaveError("")
  }

  async function saveOccurrence() {
    if (!occurrenceModal) return
    if (!selectedAllianceId) {
      setOccSaveError("Please select an alliance first")
      return
    }
    const { startDate, endDate } = occForm
    if (!startDate) {
      setOccSaveError("Please select a start date")
      return
    }
    if (endDate && endDate < startDate) {
      setOccSaveError("End date must be after start date")
      return
    }
    setOccSaveError("")
    const period_start = localDateToPeriodStart(startDate)
    const period_end = endDate ? localDateToPeriodEnd(endDate) : null
    const label = formatISOWeekLabel(parseLocalDateString(startDate))
    const note = occForm.note?.trim() || null
    try {
      if (occurrenceModal.mode === "create") {
        await adminApi.createOccurrence(occurrenceModal.eventId, {
          alliance_id: selectedAllianceId,
          period_start,
          period_end,
          label,
          note,
        })
        await refreshOccurrences(occurrenceModal.eventId)
      } else {
        await adminApi.updateOccurrence(occurrenceModal.occurrence.id, {
          period_start,
          period_end,
          label,
          note,
        })
        await refreshOccurrences(occurrenceModal.eventId)
      }
      setOccurrenceModal(null)
    } catch (e: unknown) {
      setOccSaveError(e instanceof Error ? e.message : "Save failed")
    }
  }

  async function deleteOccurrence(eventId: number, occurrenceId: number) {
    if (!confirm("Delete this occurrence?")) return
    await adminApi.deleteOccurrence(occurrenceId).catch(() => {})
    refreshOccurrences(eventId)
  }

  function openCreate() { setForm({ name: "", eval_weight: 1.0, description: "" }); setModal({ type: "create" }); setError("") }
  function openEdit(e: EventRead) { setForm({ name: e.name, eval_weight: e.eval_weight, description: e.description ?? "" }); setModal({ type: "edit", event: e }); setError("") }

  async function save() {
    try {
      if (modal?.type === "create") await adminApi.createEvent(form as EventCreate)
      else if (modal?.type === "edit") await adminApi.updateEvent((modal as { type: "edit"; event: EventRead }).event.id, form)
      setModal(null)
      await refreshEventList()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error") }
  }

  async function deleteEvent(id: number) {
    if (!confirm("Are you sure you want to delete?")) return
    await adminApi.deleteEvent(id).catch(() => {})
    if (expandedId === id) setExpandedId(null)
    await refreshEventList()
  }

  // ── Leaderboard pivot ─────────────────────────────────────────────────────
  type MemberRow = {
    member_id: number
    nickname: string | null
    stats: Map<number, { count: number; avg_score: number | null }>
    total_count: number
    total_score: number
  }
  const leaderboardRows: MemberRow[] = (() => {
    const map = new Map<number, MemberRow>()
    for (const e of leaderboard) {
      if (!map.has(e.member_id)) {
        map.set(e.member_id, { member_id: e.member_id, nickname: e.nickname, stats: new Map(), total_count: 0, total_score: 0 })
      }
      const row = map.get(e.member_id)!
      row.stats.set(e.event_id, { count: e.count, avg_score: e.avg_score })
      row.total_count += e.count
      if (e.avg_score != null) row.total_score += e.avg_score * e.count
    }
    return Array.from(map.values()).sort((a, b) => b.total_score - a.total_score)
  })()

  const subTh: React.CSSProperties = { ...th, fontSize: F.xxs, padding: "10px 14px" }
  const subTd: React.CSSProperties = { ...td, fontSize: F.xs, padding: "10px 14px", borderBottom: `1px solid #c9a84c0e` }

  const thCenter: React.CSSProperties = { ...th, textAlign: "center" }
  const tdCenter: React.CSSProperties = { ...td, textAlign: "center" }
  const tdDesc: React.CSSProperties = {
    ...td,
    color: C.textHint,
    verticalAlign: "top",
    wordBreak: "break-word",
    whiteSpace: "normal",
    lineHeight: 1.45,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 4,
  }

  return (
    <AdminShell>
      <div style={{ marginBottom: 32, paddingTop: 8 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 20 }}>Event Management</h2>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
          <Select
            options={alliances.map(a => ({ value: a.id, label: `${a.alias} · ${a.name}` }))}
            value={selectedAllianceId}
            onChange={v => {
              const aid = v as number | null
              setSelectedAllianceId(aid)
              setExpandedId(null)
              setOccurrences([])
              void refreshLeaderboard(aid)
            }}
            placeholder="Select alliance…"
            width={220}
          />
          <button style={{ ...btn("gold"), height: 38, padding: "0 22px", boxSizing: "border-box" }} onClick={openCreate}>+ Register Event</button>
        </div>
      </div>

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "72px" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "17%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}></th>
              <th style={thCenter}>Name</th>
              <th style={thCenter}>Weight</th>
              <th style={th}>Description</th>
              <th style={thCenter}>Occurrences</th>
              <th style={thCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <Fragment key={e.id}>
                <tr
                  onClick={() => toggleExpand(e.id)}
                  onMouseEnter={() => setHoveredEventId(e.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  title={expandedId === e.id ? "Click to collapse occurrence list" : "Click to expand occurrence list"}
                  style={{
                    cursor: "pointer",
                    transition: "background 0.14s ease",
                    background:
                      expandedId === e.id
                        ? `${C.gold}14`
                        : hoveredEventId === e.id
                          ? `${C.gold}0a`
                          : undefined,
                  }}
                >
                  <td style={{ ...td, padding: "0 4px 0 20px", textAlign: "right" }}>
                    {e.thumbnail_url && (
                      <img
                        src={`/images/${e.thumbnail_url}`}
                        alt=""
                        onError={ev => { (ev.currentTarget as HTMLImageElement).style.display = "none" }}
                        style={{ height: 36, width: "auto", objectFit: "contain", display: "inline-block", verticalAlign: "middle" }}
                      />
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>{e.name}</td>
                  <td style={tdCenter}>{e.eval_weight}</td>
                  <td style={tdDesc}>{e.description?.trim() ? e.description : "—"}</td>
                  <td style={{ ...td, textAlign: "center", userSelect: "none" }}>
                    <span
                      style={{
                        fontSize: F.xxs,
                        color: expandedId === e.id ? C.goldMid : C.textHint,
                        borderBottom: `1px dashed ${expandedId === e.id ? C.goldDim : `${C.goldFaint}`}`,
                        paddingBottom: 2,
                        letterSpacing: F.trackingWide,
                      }}
                    >
                      {expandedId === e.id ? "Collapse" : "Expand List"}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "center" }} onClick={ev => ev.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                      <button type="button" style={{ ...btn("ghost"), padding: "4px 8px", fontSize: F.xxs }} onClick={() => openEdit(e)}>Edit</button>
                      <button type="button" style={{ ...btn("danger"), padding: "4px 8px", fontSize: F.xxs }} onClick={() => deleteEvent(e.id)}>Delete</button>
                    </div>
                  </td>
                </tr>

                {expandedId === e.id && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "18px 20px 26px",
                        borderBottom: `1px solid ${C.goldFaint}`,
                        verticalAlign: "top",
                        background: `${C.gold}06`,
                      }}
                    >
                      <div
                        onClick={ev => ev.stopPropagation()}
                        style={{
                          padding: "20px 22px 22px",
                          borderRadius: 12,
                          border: `1px solid ${C.goldFaint}`,
                          background: "linear-gradient(168deg, #141f3e99, #0b1229cc)",
                          boxShadow: `0 10px 36px #00000055, inset 0 1px 0 ${C.goldGlow2}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingBottom: 14,
                            marginBottom: 14,
                            borderBottom: `1px solid ${C.goldFaint}`,
                          }}
                        >
                          <span style={{ color: C.textHint, fontSize: F.xxs, letterSpacing: F.trackingWide, textTransform: "uppercase", fontWeight: 600 }}>
                            {occurrences.length} Occurrence(s) · {e.name}
                            {selectedAllianceId && alliances.find(a => a.id === selectedAllianceId) && (
                              <span style={{ color: C.goldDim, marginLeft: 6 }}>
                                [{alliances.find(a => a.id === selectedAllianceId)!.alias}]
                              </span>
                            )}
                          </span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                              type="button"
                              style={{ ...btn("gold"), padding: "4px 12px", fontSize: F.xxs }}
                              onClick={() => openOccurrenceCreate(e.id, e.name)}
                            >
                              + Add Occurrence
                            </button>
                          </div>
                        </div>
                        {occurrenceError && <p style={{ color: C.danger, fontSize: F.xs, marginBottom: 10 }}>{occurrenceError}</p>}

                        {occurrences.length === 0 && !occurrencesCursor ? (
                          <p style={{ color: "#555", fontSize: F.xs, padding: "8px 0 4px" }}>No occurrences registered</p>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                            <colgroup>
                              <col style={{ width: "18%" }} />
                              <col style={{ width: "18%" }} />
                              <col style={{ width: "12%" }} />
                              <col style={{ width: "auto" }} />
                              <col style={{ width: "220px" }} />
                            </colgroup>
                            <thead>
                              <tr>
                                {["Start", "End", "Label", "Note", "Actions"].map(h => (
                                  <th key={h} scope="col" style={h === "Actions" ? { ...subTh, textAlign: "center" } : subTh}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {occurrences.map(o => (
                                <tr key={o.id}>
                                  <td style={subTd}>{formatDateOnlyKo(o.period_start)}</td>
                                  <td style={subTd}>{o.period_end ? formatDateOnlyKo(o.period_end) : "—"}</td>
                                  <td style={{ ...subTd, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.label ?? undefined}>
                                    {o.label ?? "—"}
                                  </td>
                                  <td style={{ ...subTd, wordBreak: "break-word", whiteSpace: "normal" }}>{o.note ?? "—"}</td>
                                  <td style={{ ...subTd, textAlign: "center" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "stretch" }}>
                                      <Link
                                        href={`/admin/events/${e.id}/participations?occurrence=${o.id}`}
                                        style={{
                                          ...btn("gold"),
                                          padding: "4px 10px",
                                          fontSize: F.xxs,
                                          textDecoration: "none",
                                          display: "block",
                                          textAlign: "center",
                                        }}
                                      >
                                        Participation Records
                                      </Link>
                                      <div style={{ display: "flex", gap: 4 }}>
                                        <button
                                          type="button"
                                          style={{ ...btn("ghost"), padding: "4px 0", fontSize: F.xxs, flex: 1 }}
                                          onClick={ev => {
                                            ev.stopPropagation()
                                            openOccurrenceEdit(e.id, e.name, o)
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          style={{ ...btn("danger"), padding: "4px 0", fontSize: F.xxs, flex: 1 }}
                                          onClick={ev => {
                                            ev.stopPropagation()
                                            deleteOccurrence(e.id, o.id)
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {occurrencesCursor && (
                          <div style={{ textAlign: "center", marginTop: 12 }}>
                            <button
                              type="button"
                              style={{ ...btn("ghost"), padding: "4px 16px", fontSize: F.xxs }}
                              onClick={ev => { ev.stopPropagation(); loadMoreOccurrences(e.id) }}
                            >Load More</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 20 }}>{modal.type === "create" ? "Register Event" : "Edit Event"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Name *</label>
                <input style={input} value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Eval Weight</label>
                <input type="number" step="0.1" style={input} value={form.eval_weight ?? 1.0} onChange={e => setForm(f => ({ ...f, eval_weight: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Description</label>
                <textarea style={{ ...input, height: 72, resize: "vertical" }} value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {error && <p style={{ color: C.danger, fontSize: F.xs }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
                <button type="button" style={btn("gold")} onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ marginTop: 48 }}>
        <h3 style={{ color: C.goldMid, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
          Leaderboard
          {selectedAllianceId && alliances.find(a => a.id === selectedAllianceId) && (
            <span style={{ color: C.textHint, fontWeight: 400, marginLeft: 8 }}>
              · {alliances.find(a => a.id === selectedAllianceId)!.alias}
            </span>
          )}
        </h3>

        {leaderboardRows.length === 0 ? (
          <div style={{ ...card, padding: "28px 32px", color: C.textHint, fontSize: F.xs }}>
            No participation records yet.
          </div>
        ) : (
          <div style={{ ...card, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto", minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "center", minWidth: 48, width: 48 }}>#</th>
                  <th style={{ ...th, textAlign: "center", minWidth: 140 }}>Member</th>
                  {events.map(e => (
                    <th key={e.id} style={{ ...th, textAlign: "center", minWidth: 90 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        {e.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/images/${e.thumbnail_url}`} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                        )}
                        <span style={{ fontSize: F.xxs, wordBreak: "keep-all", whiteSpace: "normal" }}>
                          {e.name}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th style={{ ...th, textAlign: "center", minWidth: 80 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardRows.map((row, idx) => (
                  <tr key={row.member_id} style={{ background: idx % 2 === 0 ? "transparent" : "#ffffff04" }}>
                    <td style={{ ...td, color: C.textHint, fontSize: F.xxs, textAlign: "center" }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...td, fontWeight: 500, textAlign: "center" }}>
                      {row.nickname ?? `#${row.member_id}`}
                    </td>
                    {events.map(e => {
                      const stat = row.stats.get(e.id)
                      return (
                        <td key={e.id} style={{ ...td, textAlign: "center" }}>
                          {stat ? (
                            <span style={{ color: gold, fontWeight: 600, fontSize: F.xs }}>{stat.count}</span>
                          ) : (
                            <span style={{ color: "#ffffff18", fontSize: F.xxs }}>—</span>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={{ color: C.goldMid, fontWeight: 700, fontSize: F.xs }}>{row.total_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {occurrenceModal && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 440 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 8 }}>
              {occurrenceModal.mode === "create" ? "Add Occurrence" : "Edit Occurrence"}
            </h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 18 }}>{occurrenceModal.eventName}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Start Date *</label>
                <DateInput
                  value={occForm.startDate}
                  onChange={v => setOccForm(f => ({ ...f, startDate: v }))}
                />
                <p style={{ color: C.goldMid, fontSize: F.xxs, marginTop: 8, letterSpacing: 0.3 }}>
                  Occurrence label (ISO week·day, Mon=1…Sun=7, auto):{" "}
                  <strong style={{ color: C.gold }}>
                    {occForm.startDate ? formatISOWeekLabel(parseLocalDateString(occForm.startDate)) : "—"}
                  </strong>
                </p>
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>End Date</label>
                <DateInput
                  value={occForm.endDate}
                  onChange={v => setOccForm(f => ({ ...f, endDate: v }))}
                />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Note</label>
                <textarea style={{ ...input, height: 64, resize: "vertical" }} value={occForm.note ?? ""} onChange={e => setOccForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              {occSaveError && <p style={{ color: C.danger, fontSize: F.xs }}>{occSaveError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" style={btn("ghost")} onClick={() => setOccurrenceModal(null)}>Cancel</button>
                <button type="button" style={btn("gold")} onClick={saveOccurrence}>
                  {occurrenceModal.mode === "create" ? "Register" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
