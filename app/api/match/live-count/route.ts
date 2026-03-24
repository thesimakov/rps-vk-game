import { NextResponse } from "next/server"
import { getLiveVkPlayersInBucket, getLiveVkPlayersInMatchmaking } from "@/lib/match-queue-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-static"
export const runtime = "nodejs"

/**
 * Сколько vk_* в матчмейкинге.
 * Без query — глобально по всем корзинам.
 * С `bet`, `rounds` — только эта корзина (для таймера «бот через 2 мин»).
 */
export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server", count: 0 }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const betRaw = url.searchParams.get("bet")
    const roundsRaw = url.searchParams.get("rounds")
    const bet = betRaw != null ? Number(betRaw) : NaN
    const rounds = roundsRaw != null ? Number(roundsRaw) : NaN
    const globalLive = getLiveVkPlayersInMatchmaking()
    if (Number.isFinite(bet) && (rounds === 1 || rounds === 3 || rounds === 5)) {
      const bucketLive = getLiveVkPlayersInBucket(bet, rounds)
      return NextResponse.json(
        { ok: true, count: bucketLive, globalLive },
        { headers: { "Cache-Control": "no-store" } },
      )
    }
    return NextResponse.json({ ok: true, count: globalLive, globalLive }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server", count: 0 }, { status: 500 })
  }
}
