import { NextResponse } from "next/server"
import { createPvpSession } from "@/lib/pvp-session-store"
import { isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }

  try {
    const body = (await req.json()) as {
      matchId?: string
      p1Id?: string
      p2Id?: string
      totalRounds?: number
      bet?: number
      weeklyMode?: string
    }

    const matchId = typeof body.matchId === "string" ? body.matchId : ""
    const p1Id = typeof body.p1Id === "string" ? body.p1Id : ""
    const p2Id = typeof body.p2Id === "string" ? body.p2Id : ""
    const totalRounds = typeof body.totalRounds === "number" ? body.totalRounds : NaN
    const bet = typeof body.bet === "number" ? body.bet : NaN
    const weeklyMode = typeof body.weeklyMode === "string" ? body.weeklyMode : ""

    if (!matchId || !isValidPlayerId(p1Id) || !isValidPlayerId(p2Id)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    if (![1, 3, 5].includes(totalRounds) || !Number.isFinite(bet) || !weeklyMode) {
      return NextResponse.json({ ok: false, error: "invalid_preset" }, { status: 400 })
    }

    createPvpSession({
      matchId,
      p1Id,
      p2Id,
      totalRounds,
      bet,
      weeklyMode,
    })

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}

