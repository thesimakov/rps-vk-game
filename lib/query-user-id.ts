import type { NextRequest } from "next/server"

/**
 * Параметр из query GET: сначала сырой `req.url`, затем `nextUrl`, затем `new URL(..., base)`.
 */
export function getSearchParamFromRequest(req: NextRequest, key: string): string {
  const raw = typeof req.url === "string" ? req.url : ""
  const qidx = raw.indexOf("?")
  if (qidx !== -1) {
    const fromRaw = new URLSearchParams(raw.slice(qidx + 1)).get(key) ?? ""
    if (fromRaw !== "") return fromRaw
  }

  const fromNext = req.nextUrl.searchParams.get(key)
  if (fromNext != null && fromNext !== "") return fromNext

  try {
    const u = new URL(raw, "http://127.0.0.1")
    const v = u.searchParams.get(key)
    if (v != null && v !== "") return v
  } catch {
    /* ignore */
  }
  return ""
}

/** Достаёт `userId` из GET (см. getSearchParamFromRequest). */
export function getUserIdFromGetRequest(req: NextRequest): string {
  return getSearchParamFromRequest(req, "userId")
}
