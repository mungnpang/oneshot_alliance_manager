"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import AdminShell, { btn, card, gold, goldDim, input, td, th } from "../_components/AdminShell"
import { AdminSelect } from "../_components/AdminSelect"
import {
  adminApi,
  type AllianceCreate,
  type AllianceMemberRead,
  type AllianceRank,
  type AllianceRead,
  type AllianceUpdate,
  type CursorPage,
  type MemberRead,
} from "@/lib/admin-api"
import { C, F, sectionTitle } from "@/lib/theme"

const RANK_OPTIONS: AllianceRank[] = ["R1", "R2", "R3", "R4", "R5"]
const RANK_SELECT_OPTIONS = RANK_OPTIONS.map((r) => ({ value: r, label: r }))
const RANK_SECTION_ORDER: AllianceRank[] = ["R5", "R4", "R3", "R2", "R1"]

type Modal = { type: "create" } | { type: "edit"; alliance: AllianceRead }

export default function AlliancesPage() {
  const [alliances, setAlliances] = useState<AllianceRead[]>([])
  const [members, setMembers] = useState<MemberRead[]>([])
  const [modal, setModal] = useState<Modal | null>(null)
  const [form, setForm] = useState<Partial<AllianceCreate & AllianceUpdate>>({})
  const [error, setError] = useState("")

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [hoveredAllianceId, setHoveredAllianceId] = useState<number | null>(null)
  const [allianceMembers, setAllianceMembers] = useState<AllianceMemberRead[]>([])
  const [collapsedRanks, setCollapsedRanks] = useState<Set<AllianceRank>>(new Set())
  const [memberError, setMemberError] = useState("")

  const [searchAllianceId, setSearchAllianceId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
  const [addingMembers, setAddingMembers] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const [editAllianceMember, setEditAllianceMember] = useState<{
    allianceId: number
    am: AllianceMemberRead
  } | null>(null)
  const [editRank, setEditRank] = useState<AllianceRank>("R1")
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [memberEditError, setMemberEditError] = useState("")

  useEffect(() => { load() }, [])

  async function loadAllMembers(): Promise<MemberRead[]> {
    const all: MemberRead[] = []
    let cursor: string | null = null
    for (;;) {
      const page: CursorPage<MemberRead> = await adminApi.listMembers(cursor, 200).catch(() => ({ items: [] as MemberRead[], next_cursor: null }))
      all.push(...page.items)
      cursor = page.next_cursor
      if (!cursor) break
    }
    return all
  }

  async function loadAllAllianceMembers(allianceId: number): Promise<AllianceMemberRead[]> {
    const all: AllianceMemberRead[] = []
    let cursor: string | null = null
    for (;;) {
      const page: CursorPage<AllianceMemberRead> = await adminApi.listAllianceMembers(allianceId, cursor).catch(() => ({ items: [] as AllianceMemberRead[], next_cursor: null }))
      all.push(...page.items)
      cursor = page.next_cursor
      if (!cursor) break
    }
    return all
  }

  async function load() {
    const [a, m] = await Promise.all([adminApi.listAlliances().catch(() => []), loadAllMembers()])
    setAlliances(a); setMembers(m)
  }

  async function toggleExpand(allianceId: number) {
    if (expandedId === allianceId) {
      setExpandedId(null); setAllianceMembers([]); setCollapsedRanks(new Set()); setMemberError(""); return
    }
    setExpandedId(allianceId); setMemberError("")
    const all = await loadAllAllianceMembers(allianceId)
    setAllianceMembers(all)
    setCollapsedRanks(new Set())
  }

  function toggleRankCollapse(rank: AllianceRank) {
    setCollapsedRanks(prev => {
      const next = new Set(prev)
      if (next.has(rank)) next.delete(rank)
      else next.add(rank)
      return next
    })
  }

  async function refreshMembers(allianceId: number) {
    const all = await loadAllAllianceMembers(allianceId)
    setAllianceMembers(all)
  }

  function openSearch(allianceId: number) {
    setSearchAllianceId(allianceId)
    setSearchQuery("")
    setSelectedMemberIds(new Set())
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function toggleSelectMember(memberId: number) {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  async function addSelectedMembers(allianceId: number) {
    if (selectedMemberIds.size === 0) return
    setAddingMembers(true)
    try {
      await Promise.all(
        [...selectedMemberIds].map(memberId => adminApi.addAllianceMember(allianceId, { member_id: memberId }))
      )
      setSearchAllianceId(null)
      setSelectedMemberIds(new Set())
      refreshMembers(allianceId)
    } catch (e: unknown) {
      setMemberError(e instanceof Error ? e.message : "Add failed")
    } finally {
      setAddingMembers(false)
    }
  }

  async function removeMember(allianceId: number, memberId: number) {
    await adminApi.removeAllianceMember(allianceId, memberId).catch(() => {})
    refreshMembers(allianceId)
  }

  function openEditAllianceMember(allianceId: number, am: AllianceMemberRead) {
    const m = getMember(am.member_id)
    setEditAllianceMember({ allianceId, am })
    setEditRank(am.rank)
    setEditIsAdmin(Boolean(m?.is_admin))
    setMemberEditError("")
  }

  async function saveAllianceMemberEdit() {
    if (!editAllianceMember) return
    const { allianceId, am } = editAllianceMember
    setMemberEditError("")
    try {
      await Promise.all([
        adminApi.updateMember(am.member_id, { is_admin: editIsAdmin }),
        adminApi.updateAllianceMember(allianceId, am.member_id, { rank: editRank }),
      ])
      setEditAllianceMember(null)
      await load()
      await refreshMembers(allianceId)
    } catch (e: unknown) {
      setMemberEditError(e instanceof Error ? e.message : "Save failed")
    }
  }

  function openCreate() { setForm({ name: "", alias: "", kid: undefined }); setModal({ type: "create" }); setError("") }
  function openEdit(a: AllianceRead) {
    setForm({ name: a.name, alias: a.alias, kid: a.kid })
    setModal({ type: "edit", alliance: a }); setError("")
  }

  async function save() {
    try {
      if (modal?.type === "create") await adminApi.createAlliance(form as AllianceCreate)
      else if (modal?.type === "edit") await adminApi.updateAlliance((modal as { type: "edit"; alliance: AllianceRead }).alliance.id, form)
      setModal(null); load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error") }
  }

  async function deleteAlliance(id: number) {
    if (!confirm("Are you sure you want to delete?")) return
    await adminApi.deleteAlliance(id).catch(() => {})
    if (expandedId === id) setExpandedId(null)
    load()
  }

  const getMember = (mid: number) => members.find(m => m.id === mid)

  const allianceMembersByRank = useMemo(
    () =>
      RANK_SECTION_ORDER.map((rank) => ({
        rank,
        items: allianceMembers
          .filter((am) => am.rank === rank)
          .slice()
          .sort((a, b) => a.member_id - b.member_id),
      })).filter((g) => g.items.length > 0),
    [allianceMembers],
  )

  const q = searchQuery.trim().toLowerCase()
  const searchResults = searchAllianceId
    ? members.filter(m => {
        if (allianceMembers.some(am => am.member_id === m.id)) return false
        if (!q) return true
        return String(m.fid).includes(q) || (m.nickname ?? "").toLowerCase().includes(q)
      })
    : []

  const searchAlliance = alliances.find(a => a.id === searchAllianceId)

  const subTh: React.CSSProperties = { ...th, fontSize: F.xxs, padding: "10px 14px" }
  const subTd: React.CSSProperties = { ...td, fontSize: F.xs, padding: "10px 14px", borderBottom: `1px solid #c9a84c0e` }

  return (
    <AdminShell>
      <div style={{ marginBottom: 32, paddingTop: 8 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 20 }}>Alliance Management</h2>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={btn("gold")} onClick={openCreate}>+ Register Alliance</button>
        </div>
      </div>

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Name", "Alias", "Kingdom", "Members", "Actions"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {alliances.map(a => (
              <Fragment key={a.id}>
                <tr
                  onClick={() => toggleExpand(a.id)}
                  onMouseEnter={() => setHoveredAllianceId(a.id)}
                  onMouseLeave={() => setHoveredAllianceId(null)}
                  title={expandedId === a.id ? "Click to collapse member list" : "Click to expand member list"}
                  style={{
                    cursor: "pointer",
                    transition: "background 0.14s ease",
                    background:
                      expandedId === a.id
                        ? `${C.gold}14`
                        : hoveredAllianceId === a.id
                          ? `${C.gold}0a`
                          : undefined,
                  }}
                >
                  <td style={td}>{a.name}</td>
                  <td style={td}>{a.alias}</td>
                  <td style={td}>#{a.kid}</td>
                  <td style={{ ...td, userSelect: "none" }}>
                    <span style={{ fontSize: F.xxs, color: expandedId === a.id ? C.goldMid : C.textHint, borderBottom: `1px dashed ${expandedId === a.id ? C.goldDim : `${C.goldFaint}`}`, paddingBottom: 2, letterSpacing: F.trackingWide }}>
                      {expandedId === a.id ? "Collapse" : "Expand List"}
                    </span>
                  </td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button style={btn("ghost")} onClick={() => openEdit(a)}>Edit</button>
                      <button style={btn("danger")} onClick={() => deleteAlliance(a.id)}>Delete</button>
                    </div>
                  </td>
                </tr>

                {expandedId === a.id && (
                  <tr key={`${a.id}-expand`}>
                    <td colSpan={5} style={{ padding: "18px 20px 26px", borderBottom: `1px solid ${C.goldFaint}`, verticalAlign: "top", background: `${C.gold}06` }}>
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ padding: "20px 22px 22px", borderRadius: 12, border: `1px solid ${C.goldFaint}`, background: "linear-gradient(168deg, #141f3e99, #0b1229cc)", boxShadow: `0 10px 36px #00000055, inset 0 1px 0 ${C.goldGlow2}` }}
                      >
                        {/* Header bar */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${C.goldFaint}` }}>
                          <span style={{ color: C.textHint, fontSize: F.xxs, letterSpacing: F.trackingWide, textTransform: "uppercase", fontWeight: 600 }}>
                            {allianceMembers.length} Alliance Member(s)
                          </span>
                          <button style={{ ...btn("gold"), padding: "4px 12px", fontSize: F.xxs }} onClick={e => { e.stopPropagation(); openSearch(a.id) }}>+ Add</button>
                        </div>
                        {memberError && <p style={{ color: C.danger, fontSize: F.xs, marginBottom: 10 }}>{memberError}</p>}

                        {allianceMembers.length === 0 ? (
                          <p style={{ color: "#555", fontSize: F.xs, padding: "8px 0 4px" }}>No alliance members</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {allianceMembersByRank.map(({ rank, items }) => {
                              const isCollapsed = collapsedRanks.has(rank)
                              return (
                                <div key={rank}>
                                  {/* Rank header — clickable toggle */}
                                  <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); toggleRankCollapse(rank) }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 8,
                                      background: "transparent", border: "none", cursor: "pointer",
                                      padding: "4px 0 8px 10px",
                                      borderLeft: `3px solid ${C.goldFaint}`,
                                      width: "100%", textAlign: "left",
                                    }}
                                  >
                                    <span style={{ color: C.textHint, fontSize: F.xxs, letterSpacing: F.trackingWide, fontWeight: 600, textTransform: "uppercase" }}>
                                      {rank}
                                    </span>
                                    <span style={{ color: "#666", fontSize: F.xxs, fontWeight: 500 }}>
                                      · {items.length} users
                                    </span>
                                    <svg
                                      width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={C.textHint} strokeWidth={2}
                                      style={{ marginLeft: "auto", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                                    >
                                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>

                                  {!isCollapsed && (
                                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                                      <colgroup>
                                        <col style={{ width: "14%" }} />
                                        <col style={{ width: "26%" }} />
                                        <col style={{ width: "11%" }} />
                                        <col style={{ width: "12%" }} />
                                        <col style={{ width: "11%" }} />
                                        <col style={{ width: "26%" }} />
                                      </colgroup>
                                      <tbody>
                                        <tr>
                                          {["FID", "Nickname", "Rank", "Lv", "Admin", "Actions"].map((h) => (
                                            <th key={h} scope="col" style={h === "Actions" ? { ...subTh, textAlign: "center" } : subTh}>{h}</th>
                                          ))}
                                        </tr>
                                        {items.map((am) => {
                                          const m = getMember(am.member_id)
                                          return (
                                            <tr key={am.id}>
                                              <td style={subTd}>{m?.fid ?? am.member_id}</td>
                                              <td style={{ ...subTd, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m?.nickname || undefined}>
                                                {m?.nickname ?? "—"}
                                              </td>
                                              <td style={subTd}>{am.rank}</td>
                                              <td style={{ ...subTd, textAlign: "center" }}>
                                                <StoveLvCell value={m?.stove_lv_content ?? null} />
                                              </td>
                                              <td style={subTd}>
                                                <span style={{ color: m?.is_admin ? gold : "#555" }}>{m?.is_admin ? "✓" : "—"}</span>
                                              </td>
                                              <td style={{ ...subTd, textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                                  <button type="button" style={{ ...btn("ghost"), padding: "4px 10px", fontSize: F.xxs }} onClick={e => { e.stopPropagation(); openEditAllianceMember(a.id, am) }}>Edit</button>
                                                  <button type="button" style={{ ...btn("danger"), padding: "4px 10px", fontSize: F.xxs }} onClick={e => { e.stopPropagation(); removeMember(a.id, am.member_id) }}>Remove</button>
                                                </div>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )
                            })}
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

      {/* Alliance member rank/admin edit modal */}
      {editAllianceMember !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55 }} onClick={() => setEditAllianceMember(null)}>
          <div style={{ background: "linear-gradient(160deg, #0f1a38f0, #0a1228f0)", border: `1px solid ${goldDim}`, borderRadius: 14, padding: 28, width: 400, boxShadow: `0 0 60px #00000080, 0 0 0 1px ${C.goldGlow}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, fontSize: F.sm, fontWeight: 700, letterSpacing: F.trackingWide, marginBottom: 6 }}>Edit Alliance Member</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 18 }}>
              FID {getMember(editAllianceMember.am.member_id)?.fid ?? editAllianceMember.am.member_id}
              {" · "}
              {getMember(editAllianceMember.am.member_id)?.nickname ?? "—"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 6 }}>Rank</label>
                <AdminSelect<AllianceRank> ariaLabel="Rank" value={editRank} options={RANK_SELECT_OPTIONS} onChange={setEditRank} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: C.textBright, fontSize: F.sm }}>
                <input type="checkbox" checked={editIsAdmin} onChange={e => setEditIsAdmin(e.target.checked)} style={{ width: 18, height: 18, accentColor: gold }} />
                System Admin
              </label>
              {memberEditError && <p style={{ color: C.danger, fontSize: F.xs }}>{memberEditError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" style={btn("ghost")} onClick={() => setEditAllianceMember(null)}>Cancel</button>
                <button type="button" style={btn("gold")} onClick={saveAllianceMemberEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alliance member search + multi-select modal */}
      {searchAllianceId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setSearchAllianceId(null)}>
          <div style={{ background: "linear-gradient(160deg, #0f1a38f0, #0a1228f0)", border: `1px solid ${goldDim}`, borderRadius: 14, padding: 28, width: 480, boxShadow: `0 0 60px #00000080, 0 0 0 1px ${C.goldGlow}` }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: gold, fontSize: F.sm, fontWeight: 700, letterSpacing: F.trackingWide, marginBottom: 6 }}>Add Alliance Member</h3>
            <p style={{ color: C.textHint, fontSize: F.xs, marginBottom: 18 }}>{searchAlliance?.name} — Search by FID or Nickname</p>

            <input
              ref={searchRef}
              type="text"
              style={{ ...input, marginBottom: 12 }}
              placeholder="Enter nickname or FID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {searchResults.length === 0 ? (
                <p style={{ color: "#555", fontSize: F.xs, padding: "12px 0", textAlign: "center" }}>
                  {q ? "No search results" : "Enter a nickname or FID"}
                </p>
              ) : (
                searchResults.map(m => {
                  const selected = selectedMemberIds.has(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleSelectMember(m.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: selected ? `${C.gold}14` : "transparent",
                        border: `1px solid ${selected ? C.goldDim : "transparent"}`,
                        borderRadius: 8, padding: "9px 14px",
                        cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.background = "#1a2a50"; (e.currentTarget as HTMLButtonElement).style.borderColor = C.goldFaint } }}
                      onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent" } }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? C.gold : C.textHint}`, background: selected ? C.gold : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                        {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#080b18" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ color: C.textBright, fontSize: F.sm, flex: 1 }}>{m.nickname ?? "—"}</span>
                      <span style={{ color: C.textHint, fontSize: F.xs }}>FID {m.fid}{m.kid ? ` · #${m.kid}` : ""}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: F.xs, color: C.textHint }}>
                {selectedMemberIds.size > 0 ? `${selectedMemberIds.size} selected` : ""}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btn("ghost")} onClick={() => setSearchAllianceId(null)}>Cancel</button>
                <button
                  style={{ ...btn("gold"), opacity: selectedMemberIds.size === 0 || addingMembers ? 0.5 : 1, cursor: selectedMemberIds.size === 0 || addingMembers ? "not-allowed" : "pointer" }}
                  disabled={selectedMemberIds.size === 0 || addingMembers}
                  onClick={() => addSelectedMembers(searchAllianceId)}
                >
                  {addingMembers ? "Adding..." : `Add${selectedMemberIds.size > 0 ? ` (${selectedMemberIds.size})` : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alliance create/edit modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 380 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 20 }}>{modal.type === "create" ? "Register Alliance" : "Edit Alliance"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Name *", key: "name" }, { label: "Alias *", key: "alias" },
                { label: "Kingdom (kid) *", key: "kid", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 4 }}>{label}</label>
                  <input type={type ?? "text"} style={input} value={String((form as Record<string, unknown>)[key] ?? "")}
                    onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) || undefined : e.target.value || undefined }))} />
                </div>
              ))}
              {error && <p style={{ color: C.danger, fontSize: F.xs }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btn("ghost")} onClick={() => setModal(null)}>Cancel</button>
                <button style={btn("gold")} onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

function StoveLvCell({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "#555" }}>—</span>
  if (!value.startsWith("http")) {
    const num = Number(value)
    if (!isNaN(num)) return <span style={{ color: C.textBright }}>{value}</span>
    return <span style={{ color: "#555" }}>—</span>
  }
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
        <Image src={value} alt="stove lv" fill className="object-contain" unoptimized
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
      </div>
    </div>
  )
}
