import { loadLiveOpsConfig } from "@/lib/liveops/config"
import { getWeeklyEventRuleSet } from "@/lib/liveops/engine"

/** Общий режим ставки для пары после принятия приглашения (совпадает с сеткой bet-select: 25 = 3 раунда). */
export type SharedMatchPreset = {
  bet: number
  rounds: 1 | 3 | 5
  weeklyMode: string
}

export async function resolveSharedMatchPreset(): Promise<SharedMatchPreset> {
  const config = await loadLiveOpsConfig()
  const rules = getWeeklyEventRuleSet(config, Date.now())
  return {
    bet: 25,
    rounds: 3,
    weeklyMode: rules.event.mode,
  }
}
