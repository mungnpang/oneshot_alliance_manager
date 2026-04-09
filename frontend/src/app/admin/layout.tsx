"use client"

import "./_components/admin-ui.css"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getToken, getUser } from "@/lib/auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === "/admin") return  // Skip login page
    const token = getToken()
    const user = getUser()
    if (!token || !user?.is_admin) {
      router.replace("/admin")
    }
  }, [pathname, router])

  return <>{children}</>
}
