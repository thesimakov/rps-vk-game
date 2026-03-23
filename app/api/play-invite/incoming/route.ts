import { NextResponse, type NextRequest } from "next/server"
import { isValidPlayerId, normalizeVkPlayerId } from "@/lib/player-store"
import { listIncomingInvites } from "@/lib/play-invite-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const raw = req.nextUrl.searchParams.get("userId") ?? ""
    if (!isValidPlayerId(raw)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const invites = listIncomingInvites(normalizeVkPlayerId(raw))
    return NextResponse.json({ ok: true, invites }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
