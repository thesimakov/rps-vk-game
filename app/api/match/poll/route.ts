import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { pollMatch } from "@/lib/match-queue-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-dynamic"

/** Polling: есть ли уже пара для игрока, который ждал первым */
export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId") ?? ""
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const result = pollMatch(userId)
    if (result.matched) {
      return NextResponse.json(
        {
          ok: true,
          matched: true,
          matchId: result.matchId,
          opponent: result.opponent,
        },
        { headers: { "Cache-Control": "no-store" } },
      )
    }
    return NextResponse.json({ ok: true, matched: false }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
