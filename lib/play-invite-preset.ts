import { PVP_RULESET_MODE } from "@/lib/pvp-ruleset"

/** Общий режим ставки для пары после принятия приглашения (совпадает с сеткой bet-select: 25 = 3 раунда). */
export type SharedMatchPreset = {
  bet: number
  rounds: 1 | 3 | 5
  weeklyMode: string
}

/** Допустимые пары ставка / число ходов — как на экране выбора ставки. */
export const TOURNAMENT_INVITE_BET_OPTIONS: { value: number; rounds: 1 | 3 | 5 }[] = [
  { value: 5, rounds: 1 },
  { value: 10, rounds: 1 },
  { value: 25, rounds: 3 },
  { value: 50, rounds: 3 },
  { value: 100, rounds: 5 },
  { value: 250, rounds: 5 },
]

export function isValidTournamentInviteBet(bet: number, rounds: 1 | 3 | 5): boolean {
  return TOURNAMENT_INVITE_BET_OPTIONS.some((o) => o.value === bet && o.rounds === rounds)
}

export function buildTournamentInvitePreset(bet: number, rounds: 1 | 3 | 5): SharedMatchPreset {
  return { bet, rounds, weeklyMode: PVP_RULESET_MODE }
}

export async function resolveSharedMatchPreset(): Promise<SharedMatchPreset> {
  return {
    bet: 25,
    rounds: 3,
    weeklyMode: PVP_RULESET_MODE,
  }
}
