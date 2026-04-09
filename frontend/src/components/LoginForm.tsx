"use client"

import { useState } from "react"
import { authApi, saveToken, saveUser } from "@/lib/auth"
import AuthCard from "./AuthCard"
import { C, F, fontUiSans, inputStyle, labelStyle } from "@/lib/theme"

interface Props {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: Props) {
  const [fid, setFid] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await authApi.login(Number(fid), password)
      saveToken(data.access_token)
      saveUser(data.user)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <h2
        className="text-center mb-1"
        style={{ color: C.gold, fontSize: F.xxl, fontWeight: 700, letterSpacing: F.trackingTight, lineHeight: 1.2, fontFamily: fontUiSans }}
      >
        Login
      </h2>
      <p className="text-center mb-8" style={{ color: C.textMuted, fontSize: F.sm, letterSpacing: F.trackingNormal, fontFamily: fontUiSans }}>
        Alliance Member Login
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label style={{ ...labelStyle, marginBottom: 8 }}>
            Kingshot ID (fid)
          </label>
          <input
            type="number"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            placeholder="12345678"
            required
            className="outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.goldFaint)}
          />
        </div>

        <div>
          <label style={{ ...labelStyle, marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.goldFaint)}
          />
        </div>

        {error && (
          <p className="text-center px-3 py-2 rounded-lg" style={{ background: C.bgError, color: C.danger, border: "1px solid #ff404044", fontSize: F.sm }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${C.goldMid}, ${C.gold}, #b8932a)`,
            color: "#080b18",
            fontSize: F.sm,
            letterSpacing: F.trackingNormal,
            fontFamily: fontUiSans,
            boxShadow: loading ? "none" : `0 4px 20px ${C.goldFaint}`,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "transform 0.15s, box-shadow 0.15s, filter 0.15s",
          }}
          onMouseEnter={(e) => {
            if (loading) return
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"
            e.currentTarget.style.boxShadow = `0 8px 32px ${C.goldDim}`
            e.currentTarget.style.filter = "brightness(1.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ""
            e.currentTarget.style.boxShadow = `0 4px 20px ${C.goldFaint}`
            e.currentTarget.style.filter = ""
          }}
        >
          {loading ? "Processing..." : "Login"}
        </button>
      </form>

      <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${C.goldFaint}` }}>
        <p className="text-center" style={{ color: C.textHint, fontSize: F.xs }}>
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            style={{
              color: C.gold,
              cursor: "pointer",
              transition: "color 0.15s, text-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f5d060"
              e.currentTarget.style.textShadow = `0 0 10px ${C.gold}99`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.gold
              e.currentTarget.style.textShadow = ""
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </AuthCard>
  )
}
