"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi, getToken, getUser, saveToken, saveUser } from "@/lib/auth"
import StarBackground from "@/components/StarBackground"
import { C, F, cardStyle, fontUiSans, inputStyle, labelStyle } from "@/lib/theme"

export default function AdminLoginPage() {
  const router = useRouter()
  const [fid, setFid] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (token && user?.is_admin) router.replace("/admin/dashboard")
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await authApi.login(Number(fid), password)
      if (!data.user.is_admin) { setError("Admin privileges required"); return }
      saveToken(data.access_token)
      saveUser(data.user)
      router.replace("/admin/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <StarBackground />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 360, ...cardStyle, borderRadius: 16, padding: 36, position: "relative" }}>
          {/* Top shimmer */}
          <div style={{ position: "absolute", top: 0, left: 48, right: 48, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}cc, transparent)` }} />

          <h1 style={{ color: C.gold, fontSize: F.xl, fontWeight: 700, letterSpacing: F.trackingTight, lineHeight: 1.25, textAlign: "center", marginBottom: 6, fontFamily: fontUiSans }}>Order of New Era</h1>
          <p style={{ color: C.textMuted, fontSize: F.sm, textAlign: "center", marginBottom: 28, letterSpacing: F.trackingNormal, fontFamily: fontUiSans }}>Admin Login</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ ...labelStyle, textAlign: "left" }}>Kingshot ID (FID)</label>
              <input type="number" value={fid} onChange={e => setFid(e.target.value)} required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = C.goldDim)} />
            </div>
            <div>
              <label style={{ ...labelStyle, textAlign: "left" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = C.goldDim)} />
            </div>
            {error && <p style={{ background: C.bgError, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: 6, padding: "8px 12px", fontSize: F.xs, textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ background: `linear-gradient(135deg, ${C.goldMid}, ${C.gold}, #b8932a)`, color: "#080b18", border: "none", borderRadius: 8, padding: "11px", fontSize: F.sm, fontWeight: 700, letterSpacing: F.trackingNormal, fontFamily: fontUiSans, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginTop: 4, boxShadow: loading ? "none" : `0 4px 20px ${C.goldFaint}` }}
>
              {loading ? "Processing..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
