import { NextResponse } from "next/server"
import { isValidPlayerId, loadPlayer, normalizeVkPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

const MAX_FRIEND_IDS = 80

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string; friendVkIds?: unknown }
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const raw = Array.isArray(body.friendVkIds) ? body.friendVkIds : []
    const friendVkIds = raw
      .map((x) => (typeof x === "number" && Number.isInteger(x) ? x : Number(x)))
      .filter((n): n is number => Number.isInteger(n) && n > 0)
      .slice(0, MAX_FRIEND_IDS)

    const friends: { playerId: string; vkId: number; name: string; wins: number }[] = []
    for (const vkId of friendVkIds) {
      const playerId = normalizeVkPlayerId(`vk_${vkId}`)
      const p = await loadPlayer(playerId)
      if (p) {
        friends.push({
          playerId,
          vkId,
          name: p.name,
          wins: typeof p.wins === "number" ? p.wins : 0,
        })
      }
    }

    return NextResponse.json({ ok: true, friends }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
