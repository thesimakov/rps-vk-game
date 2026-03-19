import { restoreDailyStreak } from "@/lib/liveops/engine"
import { IS_STATIC_EXPORT, jsonNoStore, loadPlayerForLiveOps, mapError, persistPlayer } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const body = (await req.json()) as { userId?: string }
    const player = await loadPlayerForLiveOps(body.userId ?? "")
    const result = await restoreDailyStreak(player, Date.now())
    const saved = await persistPlayer(player)
    return jsonNoStore({
      ok: true,
      costVoices: result.costVoices,
      liveOpsState: saved.liveOpsState,
      vkVoicesBalance: saved.vkVoicesBalance ?? 0,
    })
  } catch (error) {
    return mapError(error)
  }
}
