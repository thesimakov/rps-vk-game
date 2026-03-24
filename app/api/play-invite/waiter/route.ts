import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { getWaiterView } from "@/lib/play-invite-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const inviteId = url.searchParams.get("inviteId") ?? ""
    const userId = url.searchParams.get("userId") ?? ""
    if (!inviteId || !isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    const view = getWaiterView(inviteId, userId)
    if (!view) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, ...view }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
