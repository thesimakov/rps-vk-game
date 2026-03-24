import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

/** С `output: export` нельзя force-dynamic; runtime-guard ниже оставляет поведение API прежним. */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Клиент шлёт раз в ~40 с, пока игрок ВК в приложении (не экран входа) */
export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const { recordPresence } = await import("@/lib/presence-store")
    const body = (await req.json()) as { userId?: string; screen?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    const screen = typeof body.screen === "string" ? body.screen.slice(0, 32) : undefined
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    await recordPresence(userId, screen)
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("[api/presence/heartbeat]", err)
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
