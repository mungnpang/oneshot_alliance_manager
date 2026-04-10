import { getToken } from "./auth"
import { API_BASE_URL } from "./api-config"
import { messageFromErrorBody } from "./api-error"

export interface MemberRead {
  id: number; fid: number; nickname: string | null; kid: number | null
  stove_lv: number | null; stove_lv_content: string | null; avatar_image: string | null
  is_admin: boolean; created_at: string; updated_at: string
  /** Alliance alias; null if not in any alliance */
  alliance_alias: string | null
}
export interface MemberUpdate {
  nickname?: string | null; kid?: number | null; stove_lv?: number | null
  stove_lv_content?: string | null; avatar_image?: string | null; is_admin?: boolean
}

export interface AllianceRead {
  id: number; name: string; alias: string; kid: number
  leader_id: number | null; power: number | null; num_member: number | null
  language: string | null; created_at: string; updated_at: string
}
export interface AllianceCreate { name: string; alias: string; kid: number; leader_id?: number | null; power?: number | null; num_member?: number | null; language?: string | null }
export interface AllianceUpdate { name?: string; alias?: string; kid?: number; leader_id?: number | null; power?: number | null; num_member?: number | null; language?: string | null }
export type AllianceRank = "R1" | "R2" | "R3" | "R4" | "R5"

export interface AllianceMemberRead {
  id: number
  alliance_id: number
  member_id: number
  rank: AllianceRank
  joined_date: string | null
  created_at: string
  updated_at: string
}
export interface AllianceMemberAdd { member_id: number; joined_date?: string | null; rank?: AllianceRank }
export interface AllianceMemberUpdate { rank: AllianceRank }

export interface EventRead { id: number; name: string; eval_weight: number; description: string | null; thumbnail_url: string | null; created_at: string; updated_at: string }
export interface EventCreate { name: string; eval_weight?: number; description?: string | null }
export interface EventUpdate { name?: string; eval_weight?: number; description?: string | null }

export interface EventOccurrenceRead {
  id: number; event_id: number; alliance_id: number | null; period_start: string; period_end: string | null
  label: string | null; note: string | null; created_at: string; updated_at: string
}
export interface EventOccurrenceWithEvent extends EventOccurrenceRead {
  event_name: string
  event_thumbnail_url: string | null
}
export interface EventOccurrenceCreate { alliance_id?: number | null; period_start: string; period_end?: string | null; label?: string | null; note?: string | null }
export interface EventOccurrenceUpdate { period_start?: string; period_end?: string | null; label?: string | null; note?: string | null }

export interface ParticipationRead {
  id: number; event_id: number; occurrence_id: number; member_id: number
  is_participated: boolean; score: number | null; extra_info: Record<string, unknown> | null
  period_start: string; period_end: string | null; occurrence_label: string | null
  created_at: string; updated_at: string
}
export interface ParticipationCreate {
  occurrence_id: number; member_id: number; is_participated?: boolean; score?: number | null; extra_info?: Record<string, unknown> | null
}
export interface ParticipationUpdate { is_participated?: boolean; score?: number | null; extra_info?: Record<string, unknown> | null }

export interface CursorPage<T> { items: T[]; next_cursor: string | null }

// ── Screenshot OCR ────────────────────────────────────────────────────────────
export interface ParsedMember {
  raw_nickname: string
  alliance_tag: string | null
  score: number | null
  matched_member_id: number | null
  matched_member_name: string | null
  confidence: number
}
export interface ParseScreenshotResponse { items: ParsedMember[] }

export interface BulkRecord { member_id: number; score?: number | null }
export interface DuplicateRecord {
  member_id: number
  member_name: string
  existing_score: number | null
  new_score: number | null
}
export interface BulkParticipationResponse {
  inserted: number
  upserted: number
  duplicates: DuplicateRecord[]
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}/api/v1/admin${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`[${res.status}] ${messageFromErrorBody(err, res.statusText)}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

async function reqMultipart<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}/api/v1/admin${path}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`[${res.status}] ${messageFromErrorBody(err, res.statusText)}`)
  }
  return res.json()
}

export async function fetchAllMembers(): Promise<MemberRead[]> {
  const all: MemberRead[] = []
  let cursor: string | null = null
  for (;;) {
    const page = await req<CursorPage<MemberRead>>("GET", `/members${cursor ? `?cursor=${cursor}&limit=200` : `?limit=200`}`)
    all.push(...page.items)
    cursor = page.next_cursor
    if (!cursor) break
  }
  return all
}

export const adminApi = {
  // Members
  listMembers: (cursor?: string | null, limit = 50) =>
    req<CursorPage<MemberRead>>("GET", `/members${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`),
  registerMember: (fid: number) => req<MemberRead>("POST", "/members", { fid }),
  getMember: (id: number) => req<MemberRead>("GET", `/members/${id}`),
  updateMember: (id: number, body: MemberUpdate) => req<MemberRead>("PUT", `/members/${id}`, body),
  deleteMember: (id: number) => req<void>("DELETE", `/members/${id}`),

  // Alliances
  listAlliances: () => req<AllianceRead[]>("GET", "/alliances"),
  createAlliance: (body: AllianceCreate) => req<AllianceRead>("POST", "/alliances", body),
  getAlliance: (id: number) => req<AllianceRead>("GET", `/alliances/${id}`),
  updateAlliance: (id: number, body: AllianceUpdate) => req<AllianceRead>("PUT", `/alliances/${id}`, body),
  deleteAlliance: (id: number) => req<void>("DELETE", `/alliances/${id}`),
  listAllianceMembers: (allianceId: number, cursor?: string | null, limit = 50) =>
    req<CursorPage<AllianceMemberRead>>("GET", `/alliances/${allianceId}/members${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`),
  addAllianceMember: (allianceId: number, body: AllianceMemberAdd) =>
    req<AllianceMemberRead>("POST", `/alliances/${allianceId}/members`, body),
  updateAllianceMember: (allianceId: number, memberId: number, body: AllianceMemberUpdate) =>
    req<AllianceMemberRead>("PUT", `/alliances/${allianceId}/members/${memberId}`, body),
  removeAllianceMember: (allianceId: number, memberId: number) =>
    req<void>("DELETE", `/alliances/${allianceId}/members/${memberId}`),

  // Events
  listEvents: () => req<EventRead[]>("GET", "/events"),
  createEvent: (body: EventCreate) => req<EventRead>("POST", "/events", body),
  getEvent: (id: number) => req<EventRead>("GET", `/events/${id}`),
  updateEvent: (id: number, body: EventUpdate) => req<EventRead>("PUT", `/events/${id}`, body),
  deleteEvent: (id: number) => req<void>("DELETE", `/events/${id}`),

  // All occurrences by month (for calendar)
  listOccurrencesByMonth: (year: number, month: number) =>
    req<EventOccurrenceWithEvent[]>("GET", `/occurrences?year=${year}&month=${month}`),

  // Event occurrences
  listOccurrences: (eventId: number, allianceId?: number | null, cursor?: string | null, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (allianceId != null) params.set("alliance_id", String(allianceId))
    if (cursor) params.set("cursor", cursor)
    return req<CursorPage<EventOccurrenceRead>>("GET", `/events/${eventId}/occurrences?${params}`)
  },
  createOccurrence: (eventId: number, body: EventOccurrenceCreate) =>
    req<EventOccurrenceRead>("POST", `/events/${eventId}/occurrences`, body),
  getOccurrence: (id: number) => req<EventOccurrenceRead>("GET", `/occurrences/${id}`),
  updateOccurrence: (id: number, body: EventOccurrenceUpdate) =>
    req<EventOccurrenceRead>("PUT", `/occurrences/${id}`, body),
  deleteOccurrence: (id: number) => req<void>("DELETE", `/occurrences/${id}`),

  // Participations
  listParticipations: (eventId: number, occurrenceId?: number | null) => {
    const params = new URLSearchParams()
    if (occurrenceId != null) params.set("occurrence_id", String(occurrenceId))
    const qs = params.toString()
    return req<ParticipationRead[]>("GET", `/events/${eventId}/participations${qs ? `?${qs}` : ""}`)
  },
  createParticipation: (eventId: number, body: ParticipationCreate) =>
    req<ParticipationRead>("POST", `/events/${eventId}/participations`, body),
  updateParticipation: (id: number, body: ParticipationUpdate) =>
    req<ParticipationRead>("PUT", `/participations/${id}`, body),
  deleteParticipation: (id: number) => req<void>("DELETE", `/participations/${id}`),

  // Screenshot OCR
  parseScreenshots: (occurrenceId: number, files: File[]): Promise<ParseScreenshotResponse> => {
    const fd = new FormData()
    for (const f of files) fd.append("files", f)
    return reqMultipart(`/occurrences/${occurrenceId}/parse-screenshots`, fd)
  },
  bulkCreateParticipations: (
    occurrenceId: number,
    records: BulkRecord[],
    upsert: boolean,
  ): Promise<BulkParticipationResponse> =>
    req("POST", `/occurrences/${occurrenceId}/bulk-participations`, { records, upsert }),
}
