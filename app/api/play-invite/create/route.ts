import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { createPlayInvite } from "@/lib/play-invite-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { fromUserId?: string; toUserId?: string }
    const fromUserId = typeof body.fromUserId === "string" ? body.fromUserId : ""
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : ""
    if (!isValidPlayerId(fromUserId) || !isValidPlayerId(toUserId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    const r = await createPlayInvite(fromUserId, toUserId)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(
      { ok: true, inviteId: r.inviteId, waiterLabel: r.waiterLabel },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
