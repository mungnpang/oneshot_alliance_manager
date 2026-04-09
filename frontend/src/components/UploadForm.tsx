"use client"

import { useState, useRef } from "react"
import { uploadScreenshot, MemberData } from "@/lib/api"

export default function UploadForm() {
  const [members, setMembers] = useState<MemberData[]>([])
  const [rawText, setRawText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setError("")
    setMembers([])
    setRawText("")

    try {
      const result = await uploadScreenshot(file)
      setMembers(result.members)
      setRawText(result.raw_text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Screenshot Upload</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Upload"}
        </button>
      </form>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {members.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Extraction Results ({members.length})</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Name</th>
                <th className="border px-3 py-2 text-right">Power</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{m.name}</td>
                  <td className="border px-3 py-2 text-right">
                    {m.score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500">OCR Raw Text</summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap">{rawText}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
