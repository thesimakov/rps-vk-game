import { ensureLiveOpsState, getCurrentWeeklyEvent } from "@/lib/liveops/engine"
import { loadLiveOpsConfig } from "@/lib/liveops/config"
import { syncWithVkApi } from "@/lib/liveops/vk-sync"
import { IS_STATIC_EXPORT, jsonNoStore, loadPlayerForLiveOps, mapError, persistPlayer } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const body = (await req.json()) as { userId?: string }
    const player = await loadPlayerForLiveOps(body.userId ?? "")
    const now = Date.now()
    const { config, state } = await ensureLiveOpsState(player, now)
    const vk = await syncWithVkApi(player)
    player.vkVoicesBalance = vk.voicesBalance
    player.liveOpsState = state
    const saved = await persistPlayer(player)
    return jsonNoStore({
      ok: true,
      seasonId: config.seasonId,
      config,
      weeklyEvent: getCurrentWeeklyEvent(config, now),
      vkSync: vk,
      liveOpsState: saved.liveOpsState,
      activeTitleId: saved.activeTitleId,
    })
  } catch (error) {
    return mapError(error)
  }
}
