import { API_BASE_URL } from "./api-config"
import { messageFromErrorBody } from "./api-error"

export interface MemberData {
  name: string
  score: number
}

export interface UploadResponse {
  members: MemberData[]
  raw_text: string
}

export async function uploadScreenshot(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(messageFromErrorBody(err, "Upload failed"))
  }

  return res.json()
}
