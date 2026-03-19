import { claimAchievement } from "@/lib/liveops/engine"
import { IS_STATIC_EXPORT, jsonNoStore, loadPlayerForLiveOps, mapError, persistPlayer } from "@/lib/liveops/api-utils"

export const dynamic = "force-static"

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return jsonNoStore({ ok: false, error: "no_server" }, 501)
  }
  try {
    const body = (await req.json()) as { userId?: string; achievementId?: string; setActive?: boolean }
    if (!body.achievementId) {
      return jsonNoStore({ ok: false, error: "achievement_id_required" }, 400)
    }
    const player = await loadPlayerForLiveOps(body.userId ?? "")
    const result = await claimAchievement(player, body.achievementId, Date.now())
    if (body.setActive) {
      const titleReward = result.achievement.rewards.find((r) => r.kind === "title" && r.titleId)
      if (titleReward?.titleId) {
        player.activeTitleId = titleReward.titleId
      }
    }
    const saved = await persistPlayer(player)
    return jsonNoStore({
      ok: true,
      achievement: result.achievement,
      activeTitleId: saved.activeTitleId,
      liveOpsState: saved.liveOpsState,
    })
  } catch (error) {
    return mapError(error)
  }
}
