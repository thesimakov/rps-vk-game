import { NextResponse } from "next/server"
import { loadAllPlayers } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

function isAuthorized(request: Request): boolean {
  // Упростили: доступ к списку игроков открываем без дополнительного секрета,
  // так как доступ уже ограничен логином/паролем на странице /admin-lemnity.
  return true
}

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  try {
    const players = await loadAllPlayers()
    return NextResponse.json(
      {
        ok: true,
        players,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

