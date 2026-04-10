"use client"

import { useEffect, useState } from "react"
import AdminShell, { btn, card, gold, goldDim, input, td, th } from "../_components/AdminShell"
import { adminApi, type MemberRead } from "@/lib/admin-api"
import { C, F, sectionTitle } from "@/lib/theme"

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRead[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [fid, setFid] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const page = await adminApi.listMembers(null).catch(() => ({ items: [], next_cursor: null }))
    setMembers(page.items)
    setNextCursor(page.next_cursor)
  }

  async function loadMore() {
    if (!nextCursor) return
    const page = await adminApi.listMembers(nextCursor).catch(() => ({ items: [], next_cursor: null }))
    setMembers(prev => [...prev, ...page.items])
    setNextCursor(page.next_cursor)
  }

  async function addMember() {
    const fidNum = Number(fid)
    if (!fidNum) { setError("Please enter a FID"); return }
    setLoading(true)
    try {
      await adminApi.registerMember(fidNum)
      setShowAdd(false)
      setFid("")
      setError("")
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  async function deleteMember(id: number) {
    if (!confirm("Are you sure you want to delete?")) return
    await adminApi.deleteMember(id).catch(() => {})
    load()
  }

  return (
    <AdminShell>
      <div style={{ marginBottom: 32, paddingTop: 8 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 20 }}>Member Management</h2>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={btn("gold")} onClick={() => { setShowAdd(true); setFid(""); setError("") }}>+ Add Member</button>
        </div>
      </div>

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["FID", "Alliance", "Nickname", "Kingdom", "Admin", "Actions"].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td style={td}>{m.fid}</td>
                <td style={{ ...td, color: m.alliance_alias ? C.textBright : C.textHint }}>{m.alliance_alias ?? "—"}</td>
                <td style={td}>{m.nickname ?? "—"}</td>
                <td style={td}>{m.kid ?? "—"}</td>
                <td style={td}><span style={{ color: m.is_admin ? gold : "#666" }}>{m.is_admin ? "✓" : "—"}</span></td>
                <td style={td}>
                  <button style={btn("danger")} onClick={() => deleteMember(m.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button style={btn("ghost")} onClick={loadMore}>Load More</button>
        </div>
      )}

      {/* Add Member modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0f1730", border: `1px solid ${goldDim}`, borderRadius: 12, padding: 28, width: 360 }}>
            <h3 style={{ color: gold, fontSize: F.sm, marginBottom: 20 }}>Add Member</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: C.textHint, fontSize: F.xs, display: "block", marginBottom: 5 }}>FID *</label>
                <input
                  type="number"
                  style={input}
                  placeholder="Enter Kingshot FID"
                  value={fid}
                  onChange={e => setFid(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addMember()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: C.danger, fontSize: F.xs }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button style={btn("ghost")} onClick={() => setShowAdd(false)}>Cancel</button>
                <button style={btn("gold")} onClick={addMember} disabled={loading}>
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
