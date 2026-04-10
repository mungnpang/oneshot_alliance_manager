"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken, getUser } from "@/lib/auth"

export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (token && user?.is_admin) {
      router.replace("/admin/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router])

  return null
}
