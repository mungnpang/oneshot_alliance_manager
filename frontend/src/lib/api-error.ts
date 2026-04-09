/** FastAPI `detail` may be a string, validation error array, or nested object. */
export function normalizeApiErrorDetail(detail: unknown, fallback = "Request failed"): string {
  if (detail == null || detail === "") return fallback
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "msg" in item) {
        const msg = (item as { msg: unknown }).msg
        if (typeof msg === "string") return msg
      }
      try {
        return JSON.stringify(item)
      } catch {
        return ""
      }
    })
    const joined = parts.filter(Boolean).join("; ")
    return joined || fallback
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) {
    const msg = (detail as { msg: unknown }).msg
    if (typeof msg === "string") return msg
  }
  return fallback
}

export function messageFromErrorBody(body: unknown, statusText: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    return normalizeApiErrorDetail((body as { detail: unknown }).detail, statusText)
  }
  return statusText
}
