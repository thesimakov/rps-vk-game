import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"
import { recordPresence } from "@/lib/presence-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

/** Не кешировать как статику — запись в файловое presence */
export const dynamic = "force-dynamic"

/** Клиент шлёт раз в ~40 с, пока игрок ВК в приложении (не экран входа) */
export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    const body = (await req.json()) as { userId?: string }
    const userId = typeof body.userId === "string" ? body.userId : ""
    if (!isValidPlayerId(userId)) {
      return NextResponse.json({ ok: false, error: "invalid_user" }, { status: 400 })
    }
    await recordPresence(userId)
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 })
  }
}
