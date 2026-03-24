import { PVP_RULESET_MODE } from "@/lib/pvp-ruleset"

/** Общий режим ставки для пары после принятия приглашения (совпадает с сеткой bet-select: 25 = 3 раунда). */
export type SharedMatchPreset = {
  bet: number
  rounds: 1 | 3 | 5
  weeklyMode: string
}

export async function resolveSharedMatchPreset(): Promise<SharedMatchPreset> {
  return {
    bet: 25,
    rounds: 3,
    weeklyMode: PVP_RULESET_MODE,
  }
}
