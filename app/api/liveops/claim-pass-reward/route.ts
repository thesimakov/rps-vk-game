import { claimPassReward } from "@/lib/liveops/engine"
import { IS_STATIC_EXPORT, jsonNoStore, loadPlayerForLiveOps, mapError, persistPlayer } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const body = (await req.json()) as { userId?: string; level?: number; premium?: boolean }
    const level = Math.floor(body.level ?? 0)
    const premium = !!body.premium
    const player = await loadPlayerForLiveOps(body.userId ?? "")
    const result = await claimPassReward(player, level, premium, Date.now())
    const saved = await persistPlayer(player)
    return jsonNoStore({
      ok: true,
      rewards: result.rewards,
      liveOpsState: saved.liveOpsState,
      balance: saved.balance,
      vkVoicesBalance: saved.vkVoicesBalance ?? 0,
    })
  } catch (error) {
    return mapError(error)
  }
}
