"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import Dashboard from "@/components/Dashboard"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"

type Screen = "login" | "register" | "app"

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login")

  useEffect(() => {
    if (getToken()) setScreen("app")
  }, [])

  if (screen === "register") {
    return (
      <RegisterForm
        onSuccess={() => setScreen("app")}
        onSwitchToLogin={() => setScreen("login")}
      />
    )
  }

  if (screen === "login") {
    return (
      <LoginForm
        onSuccess={() => setScreen("app")}
        onSwitchToRegister={() => setScreen("register")}
      />
    )
  }

  return <Dashboard onLogout={() => setScreen("login")} />
}
