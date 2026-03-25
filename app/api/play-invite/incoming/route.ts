import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, loadPlayer, normalizeVkPlayerId } from "@/lib/player-store"
import { listIncomingInvites } from "@/lib/play-invite-store"
import { getUserIdFromGetRequest } from "@/lib/query-user-id"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const raw = getUserIdFromGetRequest(req)
    if (!isValidPlayerId(raw)) {
      return NextResponse.json({ ok: true, invites: [] }, { headers: { "Cache-Control": "no-store" } })
    }
    const rows = listIncomingInvites(normalizeVkPlayerId(raw))
    const invites = await Promise.all(
      rows.map(async (r) => {
        const from = await loadPlayer(r.fromUserId)
        return {
          id: r.id,
          fromUserId: r.fromUserId,
          state: r.state,
          preset: r.preset
            ? { bet: r.preset.bet, rounds: r.preset.rounds, weeklyMode: r.preset.weeklyMode }
            : null,
          fromProfile:
            from != null
              ? {
                  name: from.name,
                  avatar: from.avatar,
                  avatarUrl: from.avatarUrl,
                  balance: from.balance,
                  wins: from.wins,
                  losses: from.losses,
                  weekWins: from.weekWins,
                  weekEarnings: from.weekEarnings,
                  vip: Boolean(from.vip),
                }
              : null,
        }
      }),
    )
    return NextResponse.json({ ok: true, invites }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
