"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AuthCard from "@/components/AuthCard"
import { C, F, fontUiSans, inputStyle, labelStyle } from "@/lib/theme"
import { authApi, getToken, getUser, saveToken, saveUser } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [fid, setFid] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (token && user) {
      router.replace("/")
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await authApi.login(Number(fid), password)
      saveToken(data.access_token)
      saveUser(data.user)
      router.replace("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <h1 style={{
        color: C.gold, fontSize: F.xl, fontWeight: 700,
        letterSpacing: "-0.02em", lineHeight: 1.25,
        textAlign: "center", marginBottom: 6, fontFamily: fontUiSans,
      }}>
        Order of New Era
      </h1>
      <p style={{
        color: C.textMuted, fontSize: F.sm, textAlign: "center",
        marginBottom: 28, letterSpacing: "0.04em", fontFamily: fontUiSans,
      }}>
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ ...labelStyle, textAlign: "left" }}>Kingshot ID (FID)</label>
          <input
            type="number" value={fid} onChange={e => setFid(e.target.value)} required
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
            onBlur={e => (e.currentTarget.style.borderColor = C.goldDim)}
          />
        </div>
        <div>
          <label style={{ ...labelStyle, textAlign: "left" }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
            onBlur={e => (e.currentTarget.style.borderColor = C.goldDim)}
          />
        </div>

        {error && (
          <p style={{
            background: C.bgError, color: C.danger,
            border: `1px solid ${C.dangerBorder}`,
            borderRadius: 6, padding: "8px 12px",
            fontSize: F.xs, textAlign: "center",
          }}>
            {error}
          </p>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${C.goldMid}, ${C.gold}, #b8932a)`,
            color: "#080b18", border: "none", borderRadius: 8,
            padding: "11px", fontSize: F.sm, fontWeight: 700,
            letterSpacing: "0.04em", fontFamily: fontUiSans,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1, marginTop: 4,
            boxShadow: loading ? "none" : `0 4px 20px ${C.goldFaint}`,
          }}
        >
          {loading ? "Processing..." : "Login"}
        </button>
      </form>

      <p style={{
        marginTop: 20, textAlign: "center",
        fontSize: F.xs, color: C.textHint, fontFamily: fontUiSans,
      }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </AuthCard>
  )
}
