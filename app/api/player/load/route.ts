import { NextResponse } from "next/server"
import { isValidPlayerId, loadPlayer } from "@/lib/player-store"

export const dynamic = "force-dynamic"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

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

    return NextResponse.json({ ok: true, exists: true, player }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

