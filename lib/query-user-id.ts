import type { NextRequest } from "next/server"

/**
 * Достаёт userId из GET: сначала сырой query из req.url (относительный URL, прокси),
 * затем nextUrl, затем new URL с базой (без падения на path-only).
 */
export function getUserIdFromGetRequest(req: NextRequest): string {
  const raw = typeof req.url === "string" ? req.url : ""
  const qidx = raw.indexOf("?")
  if (qidx !== -1) {
    const fromRaw = new URLSearchParams(raw.slice(qidx + 1)).get("userId") ?? ""
    if (fromRaw !== "") return fromRaw
  }

  const fromNext = req.nextUrl.searchParams.get("userId")
  if (fromNext != null && fromNext !== "") return fromNext

  try {
    const u = new URL(raw, "http://127.0.0.1")
    const v = u.searchParams.get("userId")
    if (v != null && v !== "") return v
  } catch {
    /* ignore */
  }
  return ""
}
