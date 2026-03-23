import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { ackPvpRound } from "@/lib/pvp-session-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { matchId?: string; userId?: string }
    const matchId = typeof body.matchId === "string" ? body.matchId : ""
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!matchId || !isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    const r = ackPvpRound(matchId, userId)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
