import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { getPvpState } from "@/lib/pvp-session-store"
import { getSearchParamFromRequest } from "@/lib/query-user-id"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const matchId = getSearchParamFromRequest(req, "matchId")
    const userIdRaw = getSearchParamFromRequest(req, "userId")
    if (!matchId || !isValidPlayerId(userIdRaw)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    const r = getPvpState(matchId, userIdRaw)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
