import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * CORS для API, когда фронт на другом origin (GitHub Pages, VK), а бэкенд на VPS.
 *
 * На сервере в .env:
 * CORS_ALLOWED_ORIGINS=https://USER.github.io,https://web.vk.com,https://vk.com,https://m.vk.com,https://vk.me,https://id.vk.com,https://*.github.io
 *
 * Последний пункт — любой поддомен github.io (страницы проектов).
 */
function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? ""
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean)
}

function pickAllowOrigin(requestOrigin: string | null, allowed: string[]): string | null {
  if (!requestOrigin) return null
  if (allowed.includes(requestOrigin)) return requestOrigin
  if (allowed.includes("https://*.github.io")) {
    try {
      const u = new URL(requestOrigin)
      if (u.hostname.endsWith(".github.io")) return requestOrigin
    } catch {
      /* ignore */
    }
  }
  return null
}

function applyCors(request: NextRequest, res: NextResponse): NextResponse {
  const origin = request.headers.get("origin")
  const allowed = parseAllowedOrigins()
  const allow = pickAllowOrigin(origin, allowed)
  if (allow) {
    res.headers.set("Access-Control-Allow-Origin", allow)
    res.headers.set("Access-Control-Allow-Credentials", "true")
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    )
    res.headers.set("Access-Control-Max-Age", "86400")
  }
  return res
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (!/\/api(\/|$)/.test(pathname)) {
    return NextResponse.next()
  }

  const allowed = parseAllowedOrigins()
  if (allowed.length === 0) {
    return NextResponse.next()
  }

  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 })
    return applyCors(request, res)
  }

  return applyCors(request, NextResponse.next())
}

export const config = {
  /** С basePath Next сам добавляет префикс к matcher */
  matcher: ["/api/:path*"],
}
