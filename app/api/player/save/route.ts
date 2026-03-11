import { NextResponse } from "next/server"
import { isValidPlayerId, savePlayer, type StoredPlayer } from "@/lib/player-store"

export const dynamic = "force-static"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT !== "0" && process.env.NODE_ENV === "production"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as { player?: StoredPlayer }
    const player = body.player

    if (!player || !player.id || !isValidPlayerId(player.id)) {
      return NextResponse.json({ ok: false, error: "invalid_player" }, { status: 400 })
    }

    const stored = await savePlayer(player)
    return NextResponse.json({ ok: true, player: stored })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

