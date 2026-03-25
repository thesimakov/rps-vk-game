import { NextResponse } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { createFriendTournamentInvite } from "@/lib/play-invite-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as {
      fromUserId?: string
      toUserId?: string
      bet?: unknown
      rounds?: unknown
    }
    const fromUserId = typeof body.fromUserId === "string" ? normalizeVkPlayerId(body.fromUserId) : ""
    const toUserId = typeof body.toUserId === "string" ? normalizeVkPlayerId(body.toUserId) : ""
    const bet = typeof body.bet === "number" && Number.isFinite(body.bet) ? body.bet : NaN
    const rounds = body.rounds === 1 || body.rounds === 3 || body.rounds === 5 ? body.rounds : null

    if (!isValidPlayerId(fromUserId) || !isValidPlayerId(toUserId) || !rounds || !Number.isFinite(bet)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }

    const r = await createFriendTournamentInvite(fromUserId, toUserId, bet, rounds)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(
      { ok: true, inviteId: r.inviteId, waiterLabel: r.waiterLabel },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
