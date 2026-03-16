import { NextResponse } from "next/server"
import { backupDb, blockPlayer, isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

// Аналогично list/delete — доверяем защите логином/паролем на /admin-lemnity.
function isAuthorized(_request: Request): boolean {
  return true
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

