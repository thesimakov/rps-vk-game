import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { pollMatch } from "@/lib/match-queue-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

/** С `output: export` допустим только force-static; при реальном SSR см. IS_STATIC_EXPORT в обработчике */
export const dynamic = "force-static"
export const runtime = "nodejs"

/** Polling: есть ли уже пара для игрока, который ждал первым */
export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const raw = req.nextUrl.searchParams.get("userId") ?? ""
    if (!isValidPlayerId(raw)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const result = pollMatch(normalizeVkPlayerId(raw))
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
