import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { submitPvpMove } from "@/lib/pvp-session-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { matchId?: string; userId?: string; move?: string }
    const matchId = typeof body.matchId === "string" ? body.matchId : ""
    const userId = typeof body.userId === "string" ? body.userId : ""
    const move = typeof body.move === "string" ? body.move : ""
    if (!matchId || !isValidPlayerId(userId) || !move) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    const r = submitPvpMove(matchId, userId, move)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(
      { ok: true, draw: r.draw === true },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
