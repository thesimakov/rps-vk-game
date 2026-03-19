export type CurrencyKind =
  | "coins"
  | "voices"
  | "event_tokens"
  | "xp"
  | "boost_double_win"
  | "skin"
  | "title"
  | "frame"
  | "effect"

export interface LiveOpsReward {
  kind: CurrencyKind
  amount?: number
  skinId?: string
  titleId?: string
  frameId?: string
  effectId?: string
}

export interface DailyRewardDay {
  day: number
  rewards: LiveOpsReward[]
}

export type QuestReset = "daily" | "weekly" | "monthly"

export type QuestConditionKind =
  | "play_matches"
  | "win_streak"
  | "bet_voices_total"
  | "throw_move"
  | "win_with_skin"
  | "win_matches"
  | "defeat_boss"

export interface QuestCondition {
  kind: QuestConditionKind
  target: number
  move?: "rock" | "scissors" | "paper" | "water" | "fire"
  skinId?: string
}

export interface QuestDefinition {
  id: string
  title: string
  description: string
  reset: QuestReset
  eventOnly?: string
  points: number
  rewards: LiveOpsReward[]
  condition: QuestCondition
}

export interface PassLevelReward {
  level: number
  freeRewards: LiveOpsReward[]
  premiumRewards: LiveOpsReward[]
}

export type WeeklyEventMode = "elements_tournament" | "time_is_money" | "blind_luck" | "boss_week"

export interface WeeklyEventDefinition {
  week: 1 | 2 | 3 | 4
  id: string
  mode: WeeklyEventMode
  title: string
  description: string
  rewardsMultiplier: number
  tokenRewardPerWin: number
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  condition: QuestCondition
  rewards: LiveOpsReward[]
}

export interface LiveOpsConfig {
  seasonId: string
  seasonDays: number
  streakRestoreCostVoices: number
  dailyRewards: DailyRewardDay[]
  quests: QuestDefinition[]
  pass: {
    maxLevel: number
    pointsPerLevel: number
    freePremiumUnlockCostVoices: number
    levels: PassLevelReward[]
  }
  weeklyEvents: WeeklyEventDefinition[]
  achievements: AchievementDefinition[]
}

export interface QuestProgressState {
  questId: string
  value: number
  completedAt?: number
  claimedAt?: number
  periodKey: string
}

export interface AchievementProgressState {
  achievementId: string
  value: number
  completedAt?: number
  claimedAt?: number
}

export interface PassState {
  points: number
  level: number
  premiumUnlocked: boolean
  claimedFreeLevels: number[]
  claimedPremiumLevels: number[]
}

export interface LiveOpsState {
  seasonId: string
  lastServerActionAt: number
  daily: {
    streak: number
    lastClaimedDate?: string
    restoredForDate?: string
  }
  quests: QuestProgressState[]
  achievements: AchievementProgressState[]
  pass: PassState
  inventory: {
    skins: string[]
    titles: string[]
    profileFrames: string[]
    victoryEffects: string[]
    boostsDoubleWin: number
    eventTokens: number
    xp: number
  }
  stats: {
    matchesPlayed: number
    matchesWon: number
    currentWinStreak: number
    maxWinStreak: number
    winsWithRock: number
    bankCapturedVoicesMax: number
    betVoicesTotal: number
    throws: Record<string, number>
    bossWins: number
  }
}

export interface TrackActionPayload {
  type: "match_finished"
  won: boolean
  movesUsed: Array<"rock" | "scissors" | "paper" | "water" | "fire">
  skinIdUsed?: string
  betVoices: number
  bankVoices: number
  mode?: WeeklyEventMode
}
