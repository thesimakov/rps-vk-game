import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { respondPlayInvite } from "@/lib/play-invite-store"
import { resolveSharedMatchPreset } from "@/lib/play-invite-preset"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = IS_STATIC_EXPORT ? "force-static" : "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { inviteId?: string; userId?: string; accept?: boolean }
    const inviteId = typeof body.inviteId === "string" ? body.inviteId : ""
    const userId = typeof body.userId === "string" ? body.userId : ""
    const accept = Boolean(body.accept)
    if (!inviteId || !isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 })
    }
    let presetJson: string | null = null
    let preset: Awaited<ReturnType<typeof resolveSharedMatchPreset>> | null = null
    if (accept) {
      preset = await resolveSharedMatchPreset()
      presetJson = JSON.stringify(preset)
    }
    const r = respondPlayInvite(inviteId, userId, accept, presetJson)
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 })
    }
    return NextResponse.json(
      { ok: true, ...(accept && preset ? { preset } : {}) },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
