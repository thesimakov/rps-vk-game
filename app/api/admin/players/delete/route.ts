import { NextResponse } from "next/server"
import { backupDb, deletePlayer, isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

// Доступ к удалению открываем так же, как и к списку игроков,
// опираясь на логин/пароль на странице /admin-lemnity.
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
    const body = (await req.json()) as { id?: string }
    const id = typeof body.id === "string" ? body.id : ""

    if (!id || !isValidPlayerId(id)) {
      return NextResponse.json({ ok: false, error: "invalid_player" }, { status: 400 })
    }

    await backupDb()
    const deleted = await deletePlayer(id)
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

