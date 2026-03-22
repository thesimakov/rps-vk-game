import { NextResponse } from "next/server"
import { getOnlineVkCount } from "@/lib/presence-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-static"

/** Сколько игроков ВК считаются онлайн (недавний heartbeat) */
export async function GET() {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server", count: 0 }, { status: 501 })
  }
  try {
    const count = getOnlineVkCount()
    return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server", count: 0 }, { status: 500 })
  }
}
