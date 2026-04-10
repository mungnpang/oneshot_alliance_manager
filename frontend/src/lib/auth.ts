import { API_BASE_URL } from "./api-config"
import { messageFromErrorBody } from "./api-error"

export interface UserData {
  id: number
  fid: number
  nickname: string | null
  kid: number | null
  avatar_image: string | null
  is_admin: boolean
  alliance_alias: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface LoginResponse extends TokenResponse {
  user: UserData
}

async function request<T>(path: string, body: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(messageFromErrorBody(err, res.statusText))
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const authApi = {
  register: (fid: number) =>
    request<TokenResponse>("/api/v1/auth/register", { fid }),

  login: (fid: number, password: string) =>
    request<LoginResponse>("/api/v1/auth/login", { fid, password }),

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    request<void>("/api/v1/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }, token),
}

export const TOKEN_KEY = "oneshot_token"

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export const USER_KEY = "oneshot_user"

export function saveUser(user: UserData) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser(): UserData | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}
