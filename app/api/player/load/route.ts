import { NextResponse } from "next/server"
import { isValidPlayerId, loadPlayer, savePlayer } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as { userId?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""

    if (!userId || !isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }

    const player = await loadPlayer(userId)
    if (!player) {
      return NextResponse.json({ ok: true, exists: false }, { headers: { "Cache-Control": "no-store" } })
    }

    // Проверка статуса блокировки/бана
    const status = player.status ?? "active"
    const now = Date.now()

    if (status === "blocked") {
      return NextResponse.json({ ok: false, error: "blocked" }, { status: 403 })
    }

    if (status === "banned") {
      const banUntil = typeof player.banUntil === "number" ? player.banUntil : 0
      if (banUntil && banUntil > now) {
        return NextResponse.json({ ok: false, error: "banned", banUntil }, { status: 403 })
      }
      // Бан истёк — автоматически разблокируем
      const cleared = await savePlayer({
        ...player,
        status: "active",
        banUntil: undefined,
      })
      return NextResponse.json(
        { ok: true, exists: true, player: cleared },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    return NextResponse.json({ ok: true, exists: true, player }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

