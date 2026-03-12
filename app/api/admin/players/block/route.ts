import { NextResponse } from "next/server"
import { backupDb, blockPlayer, isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
const ADMIN_SECRET = process.env.ADMIN_SECRET
export const dynamic = "force-static"

function isAuthorized(request: Request): boolean {
  if (!ADMIN_SECRET) return false
  const header = request.headers.get("x-admin-token") || request.headers.get("authorization")
  if (!header) return false
  if (header === ADMIN_SECRET) return true
  if (header.startsWith("Bearer ") && header.slice("Bearer ".length) === ADMIN_SECRET) return true
  return false
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  try {
    const body = (await req.json()) as { id?: string; note?: string }
    const id = typeof body.id === "string" ? body.id : ""
    const note = typeof body.note === "string" ? body.note : undefined

    if (!id || !isValidPlayerId(id)) {
      return NextResponse.json({ ok: false, error: "invalid_player" }, { status: 400 })
    }

    await backupDb()
    const updated = await blockPlayer(id, note)
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, player: updated }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

