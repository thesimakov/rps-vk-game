import { NextResponse } from "next/server"
import { isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

/** С `output: export` нельзя force-dynamic; runtime-guard ниже оставляет поведение API прежним. */
export const dynamic = "force-static"

/**
 * Сколько игроков ВК считаются онлайн (недавний heartbeat).
 * Опционально `?userId=vk_...` — перед подсчётом фиксируем присутствие этого игрока.
 */
export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server", count: 0 }, { status: 501 })
  }
  try {
    const { getOnlineVkCount, recordPresence } = await import("@/lib/presence-store")
    const userId = new URL(req.url).searchParams.get("userId") ?? ""
    if (userId && isValidPlayerId(userId)) {
      await recordPresence(userId)
    }
    const count = await getOnlineVkCount()
    return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server", count: 0 }, { status: 500 })
  }
}
