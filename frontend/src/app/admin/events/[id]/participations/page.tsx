"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import AdminShell, { btn, card, gold, goldDim, input, td, th } from "../../../_components/AdminShell"
import Checkbox from "../../../_components/Checkbox"
import DateInput from "../../../_components/DateInput"
import {
  adminApi,
  type BulkRecord,
  type DuplicateRecord,
  type EventOccurrenceCreate,
  type EventOccurrenceRead,
  type MemberRead,
  type ParsedMember,
  type ParticipationCreate,
  type ParticipationRead,
  type ParticipationUpdate,
} from "@/lib/admin-api"
import { formatDateOnlyKo, isoDatetimeToDateInputValue } from "@/lib/date-format"
import {
  formatISOWeekLabel,
  localDateToPeriodEnd,
  localDateToPeriodStart,
  parseLocalDateString,
} from "@/lib/iso-week"
import { C, F, sectionTitle } from "@/lib/theme"

type Modal = { type: "create" } | { type: "edit"; p: ParticipationRead }
type OccModal = { type: "createOccurrence" } | null

function fmtDt(iso: string) {
  return formatDateOnlyKo(iso)
}

function occurrenceLabel(o: EventOccurrenceRead) {
  if (o.label) return o.label
  const end = o.period_end ? fmtDt(o.period_end) : "—"
  return `${fmtDt(o.period_start)} ~ ${end}`
}

function ParticipationsPageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const eventId = Number(id)

  const occurrenceParam = searchParams.get("occurrence")
  const activeOccurrenceId = useMemo(() => {
    const n = Number(occurrenceParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [occurrenceParam])

  const [participations, setParticipations] = useState<ParticipationRead[]>([])
  const [occurrences, setOccurrences] = useState<EventOccurrenceRead[]>([])
  const [members, setMembers] = useState<MemberRead[]>([])
  const [modal, setModal] = useState<Modal | null>(null)
  const [occModal, setOccModal] = useState<OccModal>(null)
  const [form, setForm] = useState<Partial<ParticipationCreate & ParticipationUpdate>>({})
  const [occForm, setOccForm] = useState<Partial<EventOccurrenceCreate>>({})
  const [error, setError] = useState("")
  const [occError, setOccError] = useState("")

  // Multi-member select state
  const [allianceMemberIds, setAllianceMemberIds] = useState<number[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [memberSearch, setMemberSearch] = useState("")

  const [occEditTarget, setOccEditTarget] = useState<EventOccurrenceRead | null>(null)
  const [occEditForm, setOccEditForm] = useState({ startDate: "", endDate: "", note: "" })
  const [occEditError, setOccEditError] = useState("")

  const activeOccurrence = useMemo(
    () => (activeOccurrenceId ? occurrences.find((o) => o.id === activeOccurrenceId) : null),
    [activeOccurrenceId, occurrences],
  )

  const visibleParticipations = useMemo(() => {
    if (!activeOccurrenceId) return participations
    return participations.filter((p) => p.occurrence_id === activeOccurrenceId)
  }, [participations, activeOccurrenceId])

  const showOccurrenceCols = !activeOccurrenceId

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [p, allMembers, o] = await Promise.all([
        adminApi.listParticipations(eventId, activeOccurrenceId).catch(() => []),
        adminApi.listAllMembers().catch(() => [] as MemberRead[]),
        adminApi.listOccurrences(eventId).catch(() => ({ items: [], next_cursor: null })),
      ])
      if (cancelled) return
      setParticipations(p)
      setMembers(allMembers)
      setOccurrences(o.items)
    })()
    return () => {
      cancelled = true
    }
  }, [eventId, activeOccurrenceId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openCreate() {
    const oid = activeOccurrenceId ?? occurrences[0]?.id
    if (!oid) { setError("Please register an occurrence first"); return }

    const occ = occurrences.find(o => o.id === oid)
    if (occ?.alliance_id) {
      const page = await adminApi.listAllianceMembers(occ.alliance_id, null, 100).catch(() => ({ items: [], next_cursor: null }))
      setAllianceMemberIds(page.items.map(am => am.member_id))
    } else {
      setAllianceMemberIds(members.map(m => m.id))
    }

    setSelectedMemberIds(new Set())
    setMemberSearch("")
    setForm({ occurrence_id: oid, is_participated: true, score: undefined })
    setModal({ type: "create" })
    setError("")
  }

  function openEdit(p: ParticipationRead) {
    setForm({ is_participated: p.is_participated, score: p.score ?? undefined })
    setModal({ type: "edit", p })
    setError("")
  }

  function openOccCreate() {
    setOccForm({
      period_start: new Date().toISOString().slice(0, 16),
      period_end: undefined,
      label: "",
      note: "",
    })
    setOccModal({ type: "createOccurrence" })
    setOccError("")
  }

  async function saveOccurrence() {
    if (!occForm.period_start) {
      setOccError("Please enter a start time")
      return
    }
    setOccError("")
    try {
      const body: EventOccurrenceCreate = {
        period_start: new Date(occForm.period_start).toISOString(),
        period_end: occForm.period_end ? new Date(occForm.period_end).toISOString() : null,
        label: occForm.label?.trim() || null,
        note: occForm.note?.trim() || null,
      }
      await adminApi.createOccurrence(eventId, body)
      setOccModal(null)
      void reloadParticipations()
    } catch (e: unknown) {
      setOccError(e instanceof Error ? e.message : "Error")
    }
  }

  async function reloadParticipations() {
    const [p, allMembers, o] = await Promise.all([
      adminApi.listParticipations(eventId, activeOccurrenceId).catch(() => []),
      adminApi.listAllMembers().catch(() => [] as MemberRead[]),
      adminApi.listOccurrences(eventId).catch(() => ({ items: [], next_cursor: null })),
    ])
    setParticipations(p)
    setMembers(allMembers)
    setOccurrences(o.items)
  }

  async function save() {
    if (modal?.type === "create") {
      if (selectedMemberIds.size === 0) { setError("Please select at least one member"); return }
      const oid = form.occurrence_id ?? activeOccurrenceId ?? occurrences[0]?.id
      if (!oid) { setError("Please select an occurrence"); return }
      setError("")
      try {
        const res = await adminApi.bulkCreateParticipationsForEvent(eventId, {
          occurrence_id: oid,
          items: Array.from(selectedMemberIds).map((mid) => ({
            member_id: mid,
            is_participated: form.is_participated ?? false,
            score: form.score ?? undefined,
          })),
        })
        setModal(null)
        void reloadParticipations()
        if (res.skipped > 0 && res.created === 0) {
          setError(`${res.skipped} skipped (already exist)`)
        } else if (res.skipped > 0) {
          setError(`${res.created} created, ${res.skipped} skipped (already exist)`)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Bulk create failed")
      }
    } else if (modal?.type === "edit") {
      try {
        await adminApi.updateParticipation((modal as { type: "edit"; p: ParticipationRead }).p.id, {
          is_participated: form.is_participated,
          score: form.score ?? undefined,
        })
        setModal(null)
        void reloadParticipations()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error")
      }
    }
  }

  const [filling, setFilling] = useState(false)

  // ── Screenshot OCR state ──────────────────────────────────────────────────
  type SsStep = "upload" | "results" | "duplicates"
  type SsRow = ParsedMember & { selected_member_id: number | null; included: boolean }

  const [ssStep, setSsStep] = useState<SsStep | null>(null)
  const [ssFiles, setSsFiles] = useState<File[]>([])
  const [ssRows, setSsRows] = useState<SsRow[]>([])
  const [ssLoading, setSsLoading] = useState(false)
  const [ssError, setSsError] = useState("")
  const [ssDuplicates, setSsDuplicates] = useState<DuplicateRecord[]>([])
  const [ssUpsertRecords, setSsUpsertRecords] = useState<BulkRecord[]>([])

  function openSsUpload() {
    setSsFiles([])
    setSsRows([])
    setSsError("")
    setSsStep("upload")
  }

  async function analyzeScreenshots() {
    if (!activeOccurrenceId) return
    if (ssFiles.length === 0) { setSsError("Please select at least one image"); return }
    setSsLoading(true)
    setSsError("")
    try {
      const res = await adminApi.parseScreenshots(activeOccurrenceId, ssFiles)
      const rows: SsRow[] = res.items.map(item => ({
        ...item,
        selected_member_id: item.matched_member_id,
        included: true,
      }))
      setSsRows(rows)
      setSsStep("results")
    } catch (e: unknown) {
      setSsError(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setSsLoading(false)
    }
  }

  async function confirmSsResults() {
    if (!activeOccurrenceId) return
    const records: BulkRecord[] = ssRows
      .filter(r => r.included && r.selected_member_id != null)
      .map(r => ({ member_id: r.selected_member_id!, score: r.score }))

    if (records.length === 0) { setSsError("No records to insert"); return }

    setSsLoading(true)
    setSsError("")
    try {
      const res = await adminApi.bulkCreateParticipations(activeOccurrenceId, records, false)
      if (res.duplicates.length > 0) {
        // Determine which records are duplicates to upsert later
        const dupIds = new Set(res.duplicates.map(d => d.member_id))
        setSsUpsertRecords(records.filter(r => dupIds.has(r.member_id)))
        setSsDuplicates(res.duplicates)
        setSsStep("duplicates")
      } else {
        setSsStep(null)
        void reloadParticipations()
      }
    } catch (e: unknown) {
      setSsError(e instanceof Error ? e.message : "Insert failed")
    } finally {
      setSsLoading(false)
    }
  }

  async function confirmUpsert() {
    if (!activeOccurrenceId) return
    setSsLoading(true)
    try {
      await adminApi.bulkCreateParticipations(activeOccurrenceId, ssUpsertRecords, true)
    } catch { /* ignore */ } finally {
      setSsLoading(false)
      setSsStep(null)
      void reloadParticipations()
    }
  }

  function skipDuplicates() {
    setSsStep(null)
    void reloadParticipations()
  }

  async function autoFillAbsent() {
    if (!activeOccurrenceId || !activeOccurrence) return
    const allianceId = activeOccurrence.alliance_id
    if (!allianceId) {
      alert("This occurrence has no associated alliance.")
      return
    }

    const recordedIds = new Set(visibleParticipations.map(p => p.member_id))
    const page = await adminApi.listAllianceMembers(allianceId, null, 200).catch(() => ({ items: [], next_cursor: null }))
    const toFill = page.items.filter(am => !recordedIds.has(am.member_id))

    if (toFill.length === 0) {
      alert("All alliance members already have records for this occurrence.")
      return
    }

    if (!confirm(`Create absent records for ${toFill.length} member(s)?`)) return

    setFilling(true)
    try {
      const res = await adminApi.bulkCreateParticipationsForEvent(eventId, {
        occurrence_id: activeOccurrenceId,
        items: toFill.map((am) => ({ member_id: am.member_id, is_participated: false })),
      })
      void reloadParticipations()
      if (res.skipped > 0 && res.created === 0) {
        setError(`${res.skipped} skipped (already exist)`)
      } else if (res.skipped > 0) {
        setError(`${res.created} created, ${res.skipped} skipped`)
      }
    } finally {
      setFilling(false)
    }
  }

  async function deleteP(pid: number) {
    if (!confirm("Are you sure you want to delete?")) return
    await adminApi.deleteParticipation(pid).catch(() => {})
    void reloadParticipations()
  }

  async function deleteOcc(oid: number) {
    if (!confirm("This occurrence and all associated participation records will be deleted. Continue?")) return
    await adminApi.deleteOccurrence(oid).catch(() => {})
    void reloadParticipations()
  }

  function openOccEdit(o: EventOccurrenceRead) {
    setOccEditTarget(o)
    setOccEditForm({
      startDate: isoDatetimeToDateInputValue(o.period_start),
      endDate: o.period_end ? isoDatetimeToDateInputValue(o.period_end) : "",
      note: o.note ?? "",
    })
    setOccEditError("")
  }

  async function saveOccEdit() {
    if (!occEditTarget) return
    const { startDate, endDate, note } = occEditForm
    if (!startDate) {
      setOccEditError("Please select a start date")
      return
    }
    if (endDate && endDate < startDate) {
      setOccEditError("End date must be after start date")
      return
    }
    setOccEditError("")
    try {
      await adminApi.updateOccurrence(occEditTarget.id, {
        period_start: localDateToPeriodStart(startDate),
        period_end: endDate ? localDateToPeriodEnd(endDate) : null,
        label: formatISOWeekLabel(parseLocalDateString(startDate)),
        note: note.trim() || null,
      })
      setOccEditTarget(null)
      void reloadParticipations()
    } catch (e: unknown) {
      setOccEditError(e instanceof Error ? e.message : "Save failed")
    }
  }

  const allianceMembers = useMemo(
    () => members.filter(m => allianceMemberIds.includes(m.id)),
    [members, allianceMemberIds]
  )

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return allianceMembers
    return allianceMembers.filter(m =>
      m.nickname?.toLowerCase().includes(q) || String(m.fid).includes(q)
    )
  }, [allianceMembers, memberSearch])

  const memberName = (mid: number) => {
    const m = members.find((x) => x.id === mid)
    return m ? (m.nickname ?? `fid:${m.fid}`) : String(mid)
  }

  const fmtScore = (v: number | null | undefined) =>
    v != null ? v.toLocaleString("en-US") : "—"

  const withScore = visibleParticipations.filter((p) => p.score != null)
  const avgScore =
    withScore.length > 0
      ? Math.round(withScore.reduce((s, p) => s + (p.score ?? 0), 0) / withScore.length)
      : null

  const invalidOccurrenceFilter =
    Boolean(activeOccurrenceId) && occurrences.length > 0 && !activeOccurrence

  return (
    <AdminShell>
      <div style={{ marginBottom: 32, paddingTop: 8 }}>
        <h2 style={{ ...sectionTitle, marginBottom: activeOccurrence ? 6 : 0 }}>Event Participation Records</h2>
        {activeOccurrence && (
          <p style={{ color: C.textGold, fontSize: F.sm, margin: "0 0 0" }}>
            Occurrence: <strong>{occurrenceLabel(activeOccurrence)}</strong>
          </p>
        )}
      </div>

      {invalidOccurrenceFilter && (
        <p style={{ color: C.danger, fontSize: F.sm, marginBottom: 16 }}>
          The occurrence specified in the URL could not be found.{" "}
          <Link href={`/admin/events/${eventId}/participations`} style={{ color: C.gold }}>View All</Link>
        </p>
      )}

      {/* ── VIEW ALL: Occurrence list only ─────────────────────────────── */}
      {!activeOccurrenceId && (<>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button type="button" style={{ ...btn("ghost"), fontSize: F.xs }} onClick={openOccCreate}>
            + Add Occurrence
          </button>
        </div>

        {occurrences.length === 0 && (
          <p style={{ color: C.textHint, fontSize: F.sm }}>
            No occurrences registered. Add one from{" "}
            <strong style={{ color: C.textGold }}>Event Management</strong> or click <strong style={{ color: C.textGold }}>+ Add Occurrence</strong>.
          </p>
        )}

        {occurrences.length > 0 && (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "200px" }} />
              </colgroup>
              <thead>
                <tr>
                  {["Start", "End", "Label", "Total", "Participated", "Note", "Actions"].map(h => (
                    <th key={h} style={h === "Actions" ? { ...th, textAlign: "center" } : th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {occurrences.map(o => {
                  const oRecs = participations.filter(p => p.occurrence_id === o.id)
                  const participated = oRecs.filter(p => p.is_participated).length
                  return (
                    <tr key={o.id}>
                      <td style={td}>{fmtDt(o.period_start)}</td>
                      <td style={td}>{o.period_end ? fmtDt(o.period_end) : "—"}</td>
                      <td style={{ ...td, color: C.textGold, fontWeight: 600 }}>{o.label ?? "—"}</td>
                      <td style={{ ...td, textAlign: "center" }}>{oRecs.length}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{ color: participated > 0 ? C.success : C.textHint }}>{participated}</span>
                      </td>
                      <td style={{ ...td, color: C.textHint, wordBreak: "break-word", whiteSpace: "normal" }}>
                        {o.note ?? "—"}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "stretch" }}>
                          <Link
                            href={`/admin/events/${eventId}/participations?occurrence=${o.id}`}
                            style={{ ...btn("gold"), padding: "4px 10px", fontSize: F.xxs, textDecoration: "none", display: "block", textAlign: "center" }}
                          >
                            Participation Records
                          </Link>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button type="button" style={{ ...btn("ghost"), padding: "4px 0", fontSize: F.xxs, flex: 1 }} onClick={() => openOccEdit(o)}>
                              Edit
                            </button>
                            <button type="button" style={{ ...btn("danger"), padding: "4px 0", fontSize: F.xxs, flex: 1 }} onClick={() => deleteOcc(o.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>)}

      {/* ── FILTERED VIEW: summary + record table ─────────────────────── */}
      {activeOccurrenceId && (<>
        {/* Summary cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: visibleParticipations.length },
            { label: "Participated", value: visibleParticipations.filter(p => p.is_participated).length },
            { label: "Not Participated", value: visibleParticipations.filter(p => !p.is_participated).length },
            { label: "Avg Score", value: fmtScore(avgScore) },
          ].map(s => (
            <div key={s.label} style={{ background: "#1a2448aa", border: `1px solid ${C.goldDim}`, borderRadius: 8, padding: "12px 18px", minWidth: 80 }}>
              <div style={{ color: C.textHint, fontSize: F.xs, letterSpacing: F.trackingNormal, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: gold, fontSize: F.xl, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Button row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 28, marginBottom: 12 }}>
          {activeOccurrence && (
            <button type="button" style={{ ...btn("ghost"), fontSize: F.xs }} onClick={() => openOccEdit(activeOccurrence)}>
              Edit Occurrence
            </button>
          )}
          <Link
            href={`/admin/events/${eventId}/participations`}
            style={{ ...btn("ghost"), textDecoration: "none", display: "inline-block", fontSize: F.xs }}
          >
            View All Occurrences
          </Link>
          <button type="button" style={{ ...btn("ghost"), fontSize: F.xs }} onClick={openSsUpload}>
            Upload Screenshot
          </button>
          <button type="button" style={btn("gold")} onClick={() => void openCreate()}>
            + Add Record
          </button>
          {activeOccurrence?.alliance_id && (
            <button
              type="button"
              style={{ ...btn("gold"), opacity: filling ? 0.6 : 1 }}
              onClick={() => void autoFillAbsent()}
              disabled={filling}
            >
              {filling ? "Saving…" : "Save"}
            </button>
          )}
        </div>

        {/* Participation records table */}
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Member", "Participated", "Score", "Actions"].map(h => (
                  <th key={h} style={h === "Actions" ? { ...th, textAlign: "center" } : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleParticipations.map(p => (
                <tr key={p.id}>
                  <td style={td}>{memberName(p.member_id)}</td>
                  <td style={td}>
                    <span style={{ color: p.is_participated ? C.success : C.danger }}>{p.is_participated ? "✓" : "✗"}</span>
                  </td>
                  <td style={td}>{fmtScore(p.score)}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button type="button" style={{ ...btn("ghost"), padding: "4px 12px", fontSize: F.xs }} onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" style={{ ...btn("danger"), padding: "4px 12px", fontSize: F.xs }} onClick={() => deleteP(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {/* Occurrence edit modal (date/note, same rules as event management) */}
      {occEditTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 55,
          }}
        >
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 440 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 8 }}>Edit Occurrence</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 18 }}>{occurrenceLabel(occEditTarget)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Start Date *</label>
                <DateInput
                  value={occEditForm.startDate}
                  onChange={v => setOccEditForm(f => ({ ...f, startDate: v }))}
                />
                <p style={{ color: C.goldMid, fontSize: F.xxs, marginTop: 8 }}>
                  Label (auto):{" "}
                  <strong style={{ color: C.gold }}>
                    {occEditForm.startDate ? formatISOWeekLabel(parseLocalDateString(occEditForm.startDate)) : "—"}
                  </strong>
                </p>
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>End Date</label>
                <DateInput
                  value={occEditForm.endDate}
                  onChange={v => setOccEditForm(f => ({ ...f, endDate: v }))}
                />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Note</label>
                <textarea
                  style={{ ...input, height: 64, resize: "vertical" }}
                  value={occEditForm.note}
                  onChange={(e) => setOccEditForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              {occEditError && <p style={{ color: C.danger, fontSize: F.xs }}>{occEditError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" style={btn("ghost")} onClick={() => setOccEditTarget(null)}>
                  Cancel
                </button>
                <button type="button" style={btn("gold")} onClick={() => void saveOccEdit()}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Occurrence modal */}
      {occModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 20 }}>Register Event Occurrence</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Start *</label>
                <input
                  type="datetime-local"
                  style={input}
                  value={occForm.period_start ?? ""}
                  onChange={(e) => setOccForm((f) => ({ ...f, period_start: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>End</label>
                <input
                  type="datetime-local"
                  style={input}
                  value={occForm.period_end ?? ""}
                  onChange={(e) => setOccForm((f) => ({ ...f, period_end: e.target.value || undefined }))}
                />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Label</label>
                <input
                  style={input}
                  placeholder="e.g. 2026-W05-1"
                  value={occForm.label ?? ""}
                  onChange={(e) => setOccForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Note</label>
                <textarea
                  style={{ ...input, height: 64, resize: "vertical" }}
                  value={occForm.note ?? ""}
                  onChange={(e) => setOccForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              {occError && <p style={{ color: C.danger, fontSize: F.xs }}>{occError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" style={btn("ghost")} onClick={() => setOccModal(null)}>
                  Cancel
                </button>
                <button type="button" style={btn("gold")} onClick={saveOccurrence}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participation record modal */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 20 }}>{modal.type === "create" ? "Add Record" : "Edit Record"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {modal.type === "create" && activeOccurrence && (
                <div>
                  <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Occurrence</label>
                  <div
                    style={{
                      ...input,
                      opacity: 0.9,
                      cursor: "default",
                    }}
                  >
                    {occurrenceLabel(activeOccurrence)}
                  </div>
                </div>
              )}
              {modal.type === "create" && !activeOccurrence && (
                <div>
                  <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Occurrence *</label>
                  <select
                    style={input}
                    value={form.occurrence_id ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, occurrence_id: Number(e.target.value) }))}
                  >
                    <option value="">Select occurrence...</option>
                    {occurrences.map((o) => (
                      <option key={o.id} value={o.id}>{occurrenceLabel(o)}</option>
                    ))}
                  </select>
                </div>
              )}
              {modal.type === "create" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <label style={{ color: C.textHint, fontSize: F.xs }}>
                      Members *
                      {selectedMemberIds.size > 0 && (
                        <span style={{ color: C.gold, marginLeft: 6 }}>{selectedMemberIds.size} selected</span>
                      )}
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: C.goldMid, fontSize: F.xxs, cursor: "pointer", padding: 0 }}
                        onClick={() => setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)))}
                      >All</button>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: C.textHint, fontSize: F.xxs, cursor: "pointer", padding: 0 }}
                        onClick={() => setSelectedMemberIds(new Set())}
                      >Clear</button>
                    </div>
                  </div>
                  {/* Search */}
                  <input
                    style={{ ...input, marginBottom: 6, fontSize: F.xs, padding: "8px 12px" }}
                    placeholder="Search by name or FID…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                  {/* Member list — only shown when search has input */}
                  {memberSearch.trim() && <div style={{
                    maxHeight: 220,
                    overflowY: "auto",
                    border: `1px solid ${C.goldFaint}`,
                    borderRadius: 8,
                    background: "#0b1228",
                  }}>
                    {filteredMembers.length === 0 && (
                      <p style={{ color: C.textHint, fontSize: F.xs, padding: "12px 14px", margin: 0 }}>No members found</p>
                    )}
                    {filteredMembers.map((m, i) => {
                      const checked = selectedMemberIds.has(m.id)
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMemberIds(prev => {
                            const next = new Set(prev)
                            if (checked) next.delete(m.id); else next.add(m.id)
                            return next
                          })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: i < filteredMembers.length - 1 ? `1px solid ${C.goldFaint}22` : "none",
                            background: checked ? `${C.gold}10` : "transparent",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (!checked) e.currentTarget.style.background = `${C.gold}08` }}
                          onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent" }}
                        >
                          <Checkbox checked={checked} size={14} />
                          <span style={{ color: checked ? C.textBright : C.textMuted, fontSize: F.xs, flex: 1, fontWeight: checked ? 500 : 400 }}>
                            {m.nickname ?? `fid:${m.fid}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>}
                </div>
              )}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
                onClick={() => setForm(f => ({ ...f, is_participated: !f.is_participated }))}
              >
                <Checkbox checked={!!form.is_participated} />
                <span style={{ color: C.textGold, fontSize: F.sm }}>Participated</span>
              </div>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>Score</label>
                <input
                  type="number"
                  style={input}
                  value={form.score ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) || undefined }))}
                />
              </div>
              {error && <p style={{ color: C.danger, fontSize: F.xs }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" style={btn("ghost")} onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="button" style={btn("gold")} onClick={save}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Screenshot OCR: Step 1 — Upload ───────────────────────────── */}
      {ssStep === "upload" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 480 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 4 }}>Upload Screenshots</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 18 }}>
              Select one or more ranking screenshots. Duplicates across images will be deduplicated automatically.
            </p>
            <label
              style={{
                display: "block",
                border: `2px dashed ${C.goldDim}`,
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                color: C.textHint,
                fontSize: F.xs,
                marginBottom: 12,
                transition: "border-color 0.15s",
              }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = gold }}
              onDragLeave={e => { e.currentTarget.style.borderColor = C.goldDim }}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = C.goldDim
                const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
                setSsFiles(prev => {
                  const combined = [...prev, ...dropped]
                  const unique = combined.filter((f, i) => combined.findIndex(x => x.name === f.name && x.size === f.size) === i)
                  return unique
                })
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const selected = Array.from(e.target.files ?? [])
                  setSsFiles(prev => {
                    const combined = [...prev, ...selected]
                    return combined.filter((f, i) => combined.findIndex(x => x.name === f.name && x.size === f.size) === i)
                  })
                  e.target.value = ""
                }}
              />
              Click or drag &amp; drop images here
            </label>

            {ssFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {ssFiles.map((f, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.goldDim}` }}
                    />
                    <button
                      type="button"
                      onClick={() => setSsFiles(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        position: "absolute", top: -6, right: -6,
                        background: C.danger, border: "none", borderRadius: "50%",
                        width: 18, height: 18, cursor: "pointer", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, lineHeight: 1, padding: 0,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {ssError && <p style={{ color: C.danger, fontSize: F.xs, marginBottom: 8 }}>{ssError}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" style={btn("ghost")} onClick={() => setSsStep(null)}>Cancel</button>
              <button
                type="button"
                style={{ ...btn("gold"), opacity: ssLoading ? 0.6 : 1 }}
                disabled={ssLoading}
                onClick={() => void analyzeScreenshots()}
              >
                {ssLoading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Screenshot OCR: Step 2 — Results ──────────────────────────── */}
      {ssStep === "results" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 760, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 4, flexShrink: 0 }}>Review Extracted Records</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 16, flexShrink: 0 }}>
              {ssRows.filter(r => r.included).length} of {ssRows.length} rows selected. Rows with low confidence are highlighted.
            </p>

            <div style={{ overflowY: "auto", flex: 1, marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Raw Name", "Matched Member", "Score", "✓", ""].map((h, i) => (
                      <th key={i} style={{ ...th, ...(i === 3 || i === 4 ? { textAlign: "center", width: i === 4 ? 40 : 50 } : {}) }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ssRows.map((row, i) => {
                    const lowConfidence = row.matched_member_id == null || row.confidence < 80
                    return (
                      <tr key={i} style={{ background: lowConfidence ? `${C.goldDim}18` : "transparent" }}>
                        <td style={{ ...td, fontSize: F.xs }}>
                          <div style={{ color: lowConfidence ? C.textGold : C.textBright }}>{row.raw_nickname}</div>
                          {row.alliance_tag && <div style={{ color: C.textHint, fontSize: F.xxs }}>[{row.alliance_tag}]</div>}
                        </td>
                        <td style={{ ...td, fontSize: F.xs }}>
                          <select
                            style={{ ...input, fontSize: F.xs, padding: "4px 8px" }}
                            value={row.selected_member_id ?? ""}
                            onChange={e => {
                              const val = e.target.value ? Number(e.target.value) : null
                              setSsRows(prev => prev.map((r, j) => j === i ? { ...r, selected_member_id: val } : r))
                            }}
                          >
                            <option value="">— unmatched —</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.nickname ?? `fid:${m.fid}`}</option>
                            ))}
                          </select>
                          {row.matched_member_id != null && (
                            <div style={{ color: C.textHint, fontSize: F.xxs, marginTop: 2 }}>{row.confidence.toFixed(0)}% match</div>
                          )}
                        </td>
                        <td style={{ ...td, fontSize: F.xs, color: C.textGold }}>
                          {row.score != null ? row.score.toLocaleString("en-US") : "—"}
                        </td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <div
                            style={{ cursor: "pointer", display: "inline-flex" }}
                            onClick={() => setSsRows(prev => prev.map((r, j) => j === i ? { ...r, included: !r.included } : r))}
                          >
                            <Checkbox checked={row.included} size={15} />
                          </div>
                        </td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSsRows(prev => prev.filter((_, j) => j !== i))}
                            style={{ background: "none", border: "none", color: C.textHint, cursor: "pointer", fontSize: F.sm, padding: "0 4px", lineHeight: 1 }}
                          >✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {ssError && <p style={{ color: C.danger, fontSize: F.xs, marginBottom: 8, flexShrink: 0 }}>{ssError}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
              <button type="button" style={btn("ghost")} onClick={() => setSsStep("upload")}>Back</button>
              <button
                type="button"
                style={{ ...btn("gold"), opacity: ssLoading ? 0.6 : 1 }}
                disabled={ssLoading}
                onClick={() => void confirmSsResults()}
              >
                {ssLoading ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Screenshot OCR: Step 3 — Duplicates ───────────────────────── */}
      {ssStep === "duplicates" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 520 }}>
            <h3 style={{ color: C.textGold, fontSize: F.sm, marginBottom: 4 }}>Duplicate Records Found</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 16 }}>
              {ssDuplicates.length} member(s) already have records for this occurrence. Choose how to handle them.
            </p>

            <div style={{ border: `1px solid ${C.goldFaint}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Member", "Existing Score", "New Score"].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ssDuplicates.map((d, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontSize: F.xs }}>{d.member_name}</td>
                      <td style={{ ...td, fontSize: F.xs, color: C.textHint }}>{d.existing_score != null ? d.existing_score.toLocaleString("en-US") : "—"}</td>
                      <td style={{ ...td, fontSize: F.xs, color: C.textGold, fontWeight: 600 }}>{d.new_score != null ? d.new_score.toLocaleString("en-US") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                style={{ ...btn("ghost"), opacity: ssLoading ? 0.6 : 1 }}
                disabled={ssLoading}
                onClick={skipDuplicates}
              >
                Skip Duplicates
              </button>
              <button
                type="button"
                style={{ ...btn("gold"), opacity: ssLoading ? 0.6 : 1 }}
                disabled={ssLoading}
                onClick={() => void confirmUpsert()}
              >
                {ssLoading ? "Saving…" : "Confirm & Upsert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

export default function ParticipationsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <p style={{ color: C.textHint, padding: 24 }}>Loading...</p>
        </AdminShell>
      }
    >
      <ParticipationsPageInner />
    </Suspense>
  )
}
