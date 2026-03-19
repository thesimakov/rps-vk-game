import type { StoredPlayer } from "@/lib/player-store"
import { loadLiveOpsConfig } from "./config"
import type {
  AchievementDefinition,
  AchievementProgressState,
  LiveOpsConfig,
  LiveOpsReward,
  LiveOpsState,
  QuestDefinition,
  QuestProgressState,
  TrackActionPayload,
  WeeklyEventDefinition,
} from "./types"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function periodKey(reset: QuestDefinition["reset"], nowMs: number): string {
  const dt = new Date(nowMs)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const d = String(dt.getUTCDate()).padStart(2, "0")
  if (reset === "daily") return `${y}-${m}-${d}`
  if (reset === "monthly") return `${y}-${m}`
  const jan1 = Date.UTC(y, 0, 1)
  const day = Math.floor((Date.UTC(y, dt.getUTCMonth(), dt.getUTCDate()) - jan1) / ONE_DAY_MS) + 1
  const week = Math.ceil(day / 7)
  return `${y}-w${week}`
}

export function getDefaultLiveOpsState(seasonId: string, nowMs: number): LiveOpsState {
  return {
    seasonId,
    lastServerActionAt: nowMs,
    daily: {
      streak: 0,
      lastClaimedDate: undefined,
      restoredForDate: undefined,
    },
    quests: [],
    achievements: [],
    pass: {
      points: 0,
      level: 0,
      premiumUnlocked: false,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
    },
    inventory: {
      skins: [],
      titles: [],
      profileFrames: [],
      victoryEffects: [],
      boostsDoubleWin: 0,
      eventTokens: 0,
      xp: 0,
    },
    stats: {
      matchesPlayed: 0,
      matchesWon: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      winsWithRock: 0,
      bankCapturedVoicesMax: 0,
      betVoicesTotal: 0,
      throws: {},
      bossWins: 0,
    },
  }
}

export async function ensureLiveOpsState(player: StoredPlayer, nowMs = Date.now()) {
  const config = await loadLiveOpsConfig()
  const current = player.liveOpsState
  const state =
    !current || current.seasonId !== config.seasonId ? getDefaultLiveOpsState(config.seasonId, nowMs) : cloneState(current)
  state.lastServerActionAt = nowMs
  return { config, state }
}

function cloneState(state: LiveOpsState): LiveOpsState {
  return {
    ...state,
    daily: { ...state.daily },
    quests: [...state.quests],
    achievements: [...state.achievements],
    pass: {
      ...state.pass,
      claimedFreeLevels: [...state.pass.claimedFreeLevels],
      claimedPremiumLevels: [...state.pass.claimedPremiumLevels],
    },
    inventory: {
      ...state.inventory,
      skins: [...state.inventory.skins],
      titles: [...state.inventory.titles],
      profileFrames: [...state.inventory.profileFrames],
      victoryEffects: [...state.inventory.victoryEffects],
    },
    stats: {
      ...state.stats,
      throws: { ...state.stats.throws },
    },
  }
}

function addUnique(list: string[], value?: string) {
  if (!value) return
  if (!list.includes(value)) list.push(value)
}

function applyReward(player: StoredPlayer, state: LiveOpsState, reward: LiveOpsReward) {
  const amount = Math.max(0, Math.floor(reward.amount ?? 0))
  switch (reward.kind) {
    case "coins":
      player.balance = Math.max(0, (player.balance ?? 0) + amount)
      break
    case "voices":
      player.vkVoicesBalance = Math.max(0, (player.vkVoicesBalance ?? 0) + amount)
      break
    case "event_tokens":
      state.inventory.eventTokens += amount
      break
    case "xp":
      state.inventory.xp += amount
      break
    case "boost_double_win":
      state.inventory.boostsDoubleWin += amount
      break
    case "skin":
      addUnique(state.inventory.skins, reward.skinId)
      break
    case "title":
      addUnique(state.inventory.titles, reward.titleId)
      break
    case "frame":
      addUnique(state.inventory.profileFrames, reward.frameId)
      break
    case "effect":
      addUnique(state.inventory.victoryEffects, reward.effectId)
      break
  }
}

function getOrInitQuest(state: LiveOpsState, quest: QuestDefinition, nowMs: number): QuestProgressState {
  const key = periodKey(quest.reset, nowMs)
  const existing = state.quests.find((q) => q.questId === quest.id)
  if (!existing) {
    const init: QuestProgressState = { questId: quest.id, value: 0, periodKey: key }
    state.quests.push(init)
    return init
  }
  if (existing.periodKey !== key) {
    existing.value = 0
    existing.periodKey = key
    existing.completedAt = undefined
    existing.claimedAt = undefined
  }
  return existing
}

function getOrInitAchievement(state: LiveOpsState, def: AchievementDefinition): AchievementProgressState {
  const existing = state.achievements.find((a) => a.achievementId === def.id)
  if (existing) return existing
  const init: AchievementProgressState = { achievementId: def.id, value: 0 }
  state.achievements.push(init)
  return init
}

function updateQuestProgress(state: LiveOpsState, config: LiveOpsConfig, nowMs: number, payload: TrackActionPayload) {
  for (const quest of config.quests) {
    if (quest.eventOnly && payload.mode !== quest.eventOnly) continue
    const progress = getOrInitQuest(state, quest, nowMs)
    if (progress.claimedAt) continue
    let newValue = progress.value
    const c = quest.condition
    if (c.kind === "play_matches") newValue += 1
    if (c.kind === "win_matches" && payload.won) newValue += 1
    if (c.kind === "win_streak") newValue = Math.max(newValue, state.stats.currentWinStreak)
    if (c.kind === "bet_voices_total") newValue += Math.max(0, payload.betVoices)
    if (c.kind === "throw_move" && c.move) {
      newValue += payload.movesUsed.filter((m) => m === c.move).length
    }
    if (c.kind === "win_with_skin" && payload.won && c.skinId && payload.skinIdUsed === c.skinId) newValue += 1
    if (c.kind === "defeat_boss" && payload.mode === "boss_week" && payload.won) newValue += 1
    progress.value = Math.min(newValue, c.target)
    if (progress.value >= c.target && !progress.completedAt) {
      progress.completedAt = nowMs
    }
  }
}

function updateAchievementProgress(state: LiveOpsState, config: LiveOpsConfig, nowMs: number) {
  for (const a of config.achievements) {
    const s = getOrInitAchievement(state, a)
    if (s.claimedAt) continue
    const c = a.condition
    if (c.kind === "play_matches") s.value = state.stats.matchesPlayed
    if (c.kind === "throw_move" && c.move) s.value = state.stats.throws[c.move] ?? 0
    if (c.kind === "bet_voices_total") s.value = state.stats.bankCapturedVoicesMax
    if (s.value >= c.target && !s.completedAt) s.completedAt = nowMs
  }
}

export function getCurrentWeeklyEvent(config: LiveOpsConfig, nowMs = Date.now()): WeeklyEventDefinition {
  const monthStart = new Date(nowMs)
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)
  const day = Math.floor((nowMs - monthStart.getTime()) / ONE_DAY_MS) + 1
  const week = Math.max(1, Math.min(4, Math.ceil(day / 7))) as 1 | 2 | 3 | 4
  return config.weeklyEvents.find((e) => e.week === week) ?? config.weeklyEvents[0]
}

export function getWeeklyEventRuleSet(config: LiveOpsConfig, nowMs = Date.now()) {
  const event = getCurrentWeeklyEvent(config, nowMs)
  if (event.mode === "elements_tournament") {
    return {
      event,
      allowedMoves: ["fire", "water", "rock"] as const,
      hideOpponentBet: false,
      autoStakeDoubleEveryRounds: 0,
      hasBossNpc: false,
    }
  }
  if (event.mode === "time_is_money") {
    return {
      event,
      allowedMoves: ["rock", "scissors", "paper", "water"] as const,
      hideOpponentBet: false,
      autoStakeDoubleEveryRounds: 2,
      hasBossNpc: false,
    }
  }
  if (event.mode === "blind_luck") {
    return {
      event,
      allowedMoves: ["rock", "scissors", "paper", "water"] as const,
      hideOpponentBet: true,
      autoStakeDoubleEveryRounds: 0,
      hasBossNpc: false,
    }
  }
  return {
    event,
    allowedMoves: ["rock", "scissors", "paper", "water"] as const,
    hideOpponentBet: false,
    autoStakeDoubleEveryRounds: 0,
    hasBossNpc: true,
  }
}

export function computeWeeklyAdjustedStake(baseStakeVoices: number, roundsPlayed: number, nowMs: number, config: LiveOpsConfig) {
  const rules = getWeeklyEventRuleSet(config, nowMs)
  if (rules.autoStakeDoubleEveryRounds <= 0) return Math.max(0, Math.floor(baseStakeVoices))
  const multipliers = Math.floor(Math.max(0, roundsPlayed) / rules.autoStakeDoubleEveryRounds)
  return Math.max(0, Math.floor(baseStakeVoices * 2 ** multipliers))
}

export function applyPassProgress(state: LiveOpsState, config: LiveOpsConfig, points: number) {
  if (points <= 0) return
  const pass = state.pass
  pass.points += Math.floor(points)
  pass.level = Math.min(config.pass.maxLevel, Math.floor(pass.points / config.pass.pointsPerLevel))
}

export async function trackAction(player: StoredPlayer, payload: TrackActionPayload, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  state.stats.matchesPlayed += 1
  if (payload.won) {
    state.stats.matchesWon += 1
    state.stats.currentWinStreak += 1
    state.stats.maxWinStreak = Math.max(state.stats.maxWinStreak, state.stats.currentWinStreak)
  } else {
    state.stats.currentWinStreak = 0
  }

  for (const m of payload.movesUsed) {
    state.stats.throws[m] = (state.stats.throws[m] ?? 0) + 1
  }
  if (payload.won && payload.movesUsed.includes("rock")) {
    state.stats.winsWithRock += 1
  }
  state.stats.betVoicesTotal += Math.max(0, payload.betVoices)
  state.stats.bankCapturedVoicesMax = Math.max(state.stats.bankCapturedVoicesMax, payload.bankVoices)
  if (payload.mode === "boss_week" && payload.won) {
    state.stats.bossWins += 1
    // Guaranteed rare reward chest from boss week.
    const rarePool = ["rare_chest_titan_rock", "rare_chest_void_scissors", "rare_chest_celestial_paper"]
    const idx = state.stats.bossWins % rarePool.length
    addUnique(state.inventory.skins, rarePool[idx])
  }

  const event = getCurrentWeeklyEvent(config, nowMs)
  const winPoints = payload.won ? 30 : 10
  const bonus = payload.won ? Math.floor(winPoints * event.rewardsMultiplier) : winPoints
  applyPassProgress(state, config, bonus)
  if (payload.won) {
    state.inventory.eventTokens += event.tokenRewardPerWin
  }

  updateQuestProgress(state, config, nowMs, payload)
  updateAchievementProgress(state, config, nowMs)
  player.liveOpsState = state

  return { state, weeklyEvent: event, passGained: bonus }
}

export async function claimDailyReward(player: StoredPlayer, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  const today = toIsoDate(nowMs)
  if (state.daily.lastClaimedDate === today) {
    throw new Error("daily_already_claimed")
  }
  if (state.daily.lastClaimedDate) {
    const prevDateMs = Date.parse(`${state.daily.lastClaimedDate}T00:00:00.000Z`)
    const dayDiff = Math.floor((Date.parse(`${today}T00:00:00.000Z`) - prevDateMs) / ONE_DAY_MS)
    if (dayDiff > 1 && state.daily.restoredForDate !== today) {
      state.daily.streak = 0
    }
  }
  state.daily.streak += 1
  state.daily.lastClaimedDate = today
  state.daily.restoredForDate = undefined
  const rewardDay = config.dailyRewards[(state.daily.streak - 1) % config.dailyRewards.length]
  for (const reward of rewardDay.rewards) {
    applyReward(player, state, reward)
  }
  applyPassProgress(state, config, 20)
  player.liveOpsState = state
  return { state, claimedDay: rewardDay.day, rewards: rewardDay.rewards }
}

export async function restoreDailyStreak(player: StoredPlayer, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  const today = toIsoDate(nowMs)
  if (!state.daily.lastClaimedDate) throw new Error("daily_no_history")
  const prevDateMs = Date.parse(`${state.daily.lastClaimedDate}T00:00:00.000Z`)
  const dayDiff = Math.floor((Date.parse(`${today}T00:00:00.000Z`) - prevDateMs) / ONE_DAY_MS)
  if (dayDiff <= 1) throw new Error("daily_restore_not_needed")
  if (state.daily.restoredForDate === today) throw new Error("daily_restore_already_used")
  const cost = config.streakRestoreCostVoices
  if ((player.vkVoicesBalance ?? 0) < cost) throw new Error("insufficient_voices")
  player.vkVoicesBalance = (player.vkVoicesBalance ?? 0) - cost
  state.daily.restoredForDate = today
  player.liveOpsState = state
  return { state, costVoices: cost }
}

export async function claimQuest(player: StoredPlayer, questId: string, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  const quest = config.quests.find((q) => q.id === questId)
  if (!quest) throw new Error("quest_not_found")
  const progress = getOrInitQuest(state, quest, nowMs)
  if (progress.claimedAt) throw new Error("quest_already_claimed")
  if ((progress.value ?? 0) < quest.condition.target) throw new Error("quest_not_completed")
  progress.claimedAt = nowMs
  for (const reward of quest.rewards) applyReward(player, state, reward)
  applyPassProgress(state, config, quest.points)
  player.liveOpsState = state
  return { state, quest }
}

export async function claimAchievement(player: StoredPlayer, achievementId: string, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  const def = config.achievements.find((a) => a.id === achievementId)
  if (!def) throw new Error("achievement_not_found")
  updateAchievementProgress(state, config, nowMs)
  const progress = getOrInitAchievement(state, def)
  if (progress.claimedAt) throw new Error("achievement_already_claimed")
  if ((progress.value ?? 0) < def.condition.target) throw new Error("achievement_not_completed")
  progress.claimedAt = nowMs
  for (const reward of def.rewards) applyReward(player, state, reward)
  player.liveOpsState = state
  return { state, achievement: def }
}

export async function unlockPremiumPass(player: StoredPlayer, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  if (state.pass.premiumUnlocked) throw new Error("pass_premium_already")
  const cost = config.pass.freePremiumUnlockCostVoices
  if ((player.vkVoicesBalance ?? 0) < cost) throw new Error("insufficient_voices")
  player.vkVoicesBalance = (player.vkVoicesBalance ?? 0) - cost
  state.pass.premiumUnlocked = true
  player.liveOpsState = state
  return { state, costVoices: cost }
}

export async function claimPassReward(player: StoredPlayer, level: number, premium: boolean, nowMs = Date.now()) {
  const { config, state } = await ensureLiveOpsState(player, nowMs)
  const safeLevel = Math.floor(level)
  if (safeLevel <= 0 || safeLevel > config.pass.maxLevel) throw new Error("pass_level_invalid")
  if (state.pass.level < safeLevel) throw new Error("pass_level_locked")
  const def = config.pass.levels.find((l) => l.level === safeLevel)
  if (!def) throw new Error("pass_level_not_found")
  if (premium && !state.pass.premiumUnlocked) throw new Error("pass_premium_locked")

  const claimed = premium ? state.pass.claimedPremiumLevels : state.pass.claimedFreeLevels
  if (claimed.includes(safeLevel)) throw new Error("pass_reward_already_claimed")
  claimed.push(safeLevel)
  const rewards = premium ? def.premiumRewards : def.freeRewards
  for (const reward of rewards) applyReward(player, state, reward)
  player.liveOpsState = state
  return { state, rewards }
}
