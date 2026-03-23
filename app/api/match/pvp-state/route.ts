import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { getPvpState } from "@/lib/pvp-session-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"
export const runtime = "nodejs"

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const matchId = url.searchParams.get("matchId") ?? ""
    const userId = url.searchParams.get("userId") ?? ""
    if (!matchId || !isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    const r = getPvpState(matchId, userId)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
