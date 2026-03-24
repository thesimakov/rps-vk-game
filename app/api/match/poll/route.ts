import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { pollMatch } from "@/lib/match-queue-store"
import { getUserIdFromGetRequest } from "@/lib/query-user-id"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Polling: есть ли уже пара для игрока, который ждал первым */
export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const raw = getUserIdFromGetRequest(req)
    /** Не отдаём 400: клиент крутит poll каждую секунду — 400 ломает матчмейкинг при сбое парсинга/прокси. */
    if (!isValidPlayerId(raw)) {
      return NextResponse.json({ ok: true, matched: false }, { headers: { "Cache-Control": "no-store" } })
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
