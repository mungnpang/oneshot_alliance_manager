/**
 * ISO 8601 week·day label `YYYY-Www-D`.
 * - Week (W): based on that week's Monday; ISO week year is the calendar year of that week's Thursday.
 * - Day (D): 1=Mon … 7=Sun (included because multiple occurrences in the same week can't be distinguished by week number alone).
 */
export function formatISOWeekLabel(d: Date): string {
  const dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const isoDay = ((dayDate.getDay() + 6) % 7) + 1
  const monday = new Date(dayDate)
  monday.setDate(dayDate.getDate() - ((dayDate.getDay() + 6) % 7))
  const thu = new Date(monday)
  thu.setDate(monday.getDate() + 3)
  const isoYear = thu.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const week = Math.floor((monday.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1
  return `${isoYear}-W${String(week).padStart(2, "0")}-${isoDay}`
}

/** YYYY-MM-DD → local midnight Date (for week calculation / display) */
export function parseLocalDateString(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((x) => Number(x))
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Local datetime string for backend/form (no timezone suffix) → local Date */
export function parseLocalDateTimeString(s: string): Date {
  const [datePart, rest = "00:00:00"] = s.trim().split("T")
  const [y, m, d] = datePart.split("-").map((x) => Number(x))
  const t = rest.slice(0, 8).split(":").map((x) => Number(x))
  return new Date(y, (m || 1) - 1, d || 1, t[0] || 0, t[1] || 0, t[2] || 0)
}

/** Date-only occurrence → API period_start (that day at 00:00:00 local) */
export function localDateToPeriodStart(ymd: string): string {
  return `${ymd}T00:00:00`
}

/** Date-only occurrence → API period_end (that day at 23:59:59 local) */
export function localDateToPeriodEnd(ymd: string): string {
  return `${ymd}T23:59:59`
}
