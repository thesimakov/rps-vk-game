import { NextResponse } from "next/server"
import { getOnlineVkCount, recordPresence } from "@/lib/presence-store"
import { isValidPlayerId } from "@/lib/player-store"

const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"

export const dynamic = "force-dynamic"

/**
 * Сколько игроков ВК считаются онлайн (недавний heartbeat).
 * Query `?userId=vk_*` — перед подсчётом записать пинг этого клиента в том же процессе,
 * чтобы GET и POST не «расходились» на разных воркерах/serverless (иначе часто 0).
 */
export async function GET(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server", count: 0 }, { status: 501 })
  }
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")?.trim() ?? ""
    if (userId && isValidPlayerId(userId)) {
      await recordPresence(userId)
    }
    const count = await getOnlineVkCount()
    return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "server", count: 0 }, { status: 500 })
  }
}
