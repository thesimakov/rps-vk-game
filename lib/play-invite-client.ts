import type { GameScreen, Player } from "@/lib/game-context"
import { PVP_RULESET_MODE } from "@/lib/pvp-session-store"
import type { Dispatch, SetStateAction } from "react"

/** Пресет с сервера — тот же для реферера и реферала после «Принять». */
export type SharedMatchPresetClient = {
  bet: number
  rounds: 1 | 3 | 5
  weeklyMode: string
}

export const FALLBACK_SHARED_PRESET: SharedMatchPresetClient = {
  bet: 25,
  rounds: 3,
  weeklyMode: PVP_RULESET_MODE,
}

export function normalizeSharedPreset(raw: unknown): SharedMatchPresetClient {
  if (!raw || typeof raw !== "object") return FALLBACK_SHARED_PRESET
  const o = raw as { bet?: unknown; rounds?: unknown; weeklyMode?: unknown }
  const bet = typeof o.bet === "number" && Number.isFinite(o.bet) ? o.bet : FALLBACK_SHARED_PRESET.bet
  const rounds = o.rounds === 1 || o.rounds === 3 || o.rounds === 5 ? o.rounds : FALLBACK_SHARED_PRESET.rounds
  const weeklyMode =
    typeof o.weeklyMode === "string" && o.weeklyMode.length > 0 ? o.weeklyMode : FALLBACK_SHARED_PRESET.weeklyMode
  return { bet, rounds, weeklyMode }
}

export function openBetSelectWithSharedPreset(
  preset: SharedMatchPresetClient,
  setters: {
    setCurrentBet: (b: number) => void
    setTotalRounds: (r: 1 | 3 | 5) => void
    setPlayer: Dispatch<SetStateAction<Player>>
    setScreen: (s: GameScreen) => void
  },
) {
  setters.setCurrentBet(preset.bet)
  setters.setTotalRounds(preset.rounds)
  setters.setPlayer((p) => ({
    ...p,
    activeWeeklyMode: undefined,
    bossWeekMatchChoice: undefined,
  }))
  setters.setScreen("bet-select")
}
