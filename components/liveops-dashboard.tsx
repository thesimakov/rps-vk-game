"use client"

import { useEffect, useMemo, useState } from "react"
import { useGame } from "@/lib/game-context"
import {
  claimAchievementReward,
  claimPassLevel,
  claimQuestReward,
  getLiveOpsState,
  unlockPremiumPass,
} from "@/lib/liveops/client"
import { Check, Lock, Sparkles, Swords, Trophy } from "lucide-react"

interface RewardDto {
  kind: string
  amount?: number
  skinId?: string
  titleId?: string
}

interface QuestDto {
  id: string
  title: string
  reset: "daily" | "weekly" | "monthly"
  points: number
  condition: { target: number }
}

interface AchievementDto {
  id: string
  title: string
  condition: { target: number }
}

interface PassLevelDto {
  level: number
  freeRewards: RewardDto[]
  premiumRewards: RewardDto[]
}

interface LiveOpsStateDto {
  quests: Array<{ questId: string; value: number; claimedAt?: number }>
  achievements: Array<{ achievementId: string; value: number; claimedAt?: number }>
  pass: {
    level: number
    points: number
    premiumUnlocked: boolean
    claimedFreeLevels: number[]
    claimedPremiumLevels: number[]
  }
}

interface StateResponse {
  ok: boolean
  config?: {
    quests: QuestDto[]
    achievements: AchievementDto[]
    pass: { maxLevel: number; pointsPerLevel: number; levels: PassLevelDto[] }
  }
  weeklyEvent?: { title: string; description: string; mode: string }
  liveOpsState?: LiveOpsStateDto
}

function rewardText(r: RewardDto) {
  if (r.kind === "coins") return `Монеты +${r.amount ?? 0}`
  if (r.kind === "voices") return `Голоса +${r.amount ?? 0}`
  if (r.kind === "event_tokens") return `Жетоны +${r.amount ?? 0}`
  if (r.kind === "xp") return `Опыт +${r.amount ?? 0}`
  if (r.kind === "boost_double_win") return `Буст x2: +${r.amount ?? 0}`
  if (r.kind === "skin") return `Скин: ${r.skinId ?? "неизвестно"}`
  if (r.kind === "title") return `Титул: ${r.titleId ?? "неизвестно"}`
  return r.kind
}

function resetLabel(reset: "daily" | "weekly" | "monthly") {
  if (reset === "daily") return "Ежедневно"
  if (reset === "weekly") return "Еженедельно"
  return "Ежемесячно"
}

export function LiveOpsDashboard() {
  const { player, setPlayer, setScreen } = useGame()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StateResponse | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const reload = async () => {
    if (!player.id.startsWith("vk_")) return
    setLoading(true)
    setError(null)
    try {
      const res = (await getLiveOpsState(player.id)) as StateResponse
      if (!res.ok) throw new Error("load_failed")
      setData(res)
      if (res.liveOpsState) {
        setPlayer((p) => ({ ...p, liveOpsState: res.liveOpsState as unknown as typeof p.liveOpsState }))
      }
    } catch {
      setError("Не удалось загрузить прогресс событий")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [player.id])

  const questProgressMap = useMemo(() => {
    const m = new Map<string, { value: number; claimedAt?: number }>()
    for (const q of data?.liveOpsState?.quests ?? []) m.set(q.questId, q)
    return m
  }, [data?.liveOpsState?.quests])

  const achProgressMap = useMemo(() => {
    const m = new Map<string, { value: number; claimedAt?: number }>()
    for (const a of data?.liveOpsState?.achievements ?? []) m.set(a.achievementId, a)
    return m
  }, [data?.liveOpsState?.achievements])

  if (!player.id.startsWith("vk_")) return null

  const pass = data?.liveOpsState?.pass
  const maxLevel = data?.config?.pass.maxLevel ?? 30

  const onClaimQuest = async (questId: string) => {
    setBusyKey(`q:${questId}`)
    try {
      await claimQuestReward(player.id, questId)
      await reload()
    } catch {
      setError("Не удалось забрать награду квеста")
    } finally {
      setBusyKey(null)
    }
  }

  const onClaimAchievement = async (id: string) => {
    setBusyKey(`a:${id}`)
    try {
      const res = (await claimAchievementReward(player.id, id, true)) as {
        achievement?: { rewards?: RewardDto[] }
        activeTitleId?: string
      }
      if (res.activeTitleId) {
        setPlayer((p) => ({ ...p, activeTitleId: res.activeTitleId }))
      } else {
        const title = res.achievement?.rewards?.find((r) => r.kind === "title" && r.titleId)?.titleId
        if (title) setPlayer((p) => ({ ...p, activeTitleId: title }))
      }
      await reload()
    } catch {
      setError("Не удалось забрать ачивку")
    } finally {
      setBusyKey(null)
    }
  }

  const onUnlockPremium = async () => {
    setBusyKey("pass:unlock")
    try {
      await unlockPremiumPass(player.id)
      await reload()
    } catch {
      setError("Не удалось открыть премиум-пропуск")
    } finally {
      setBusyKey(null)
    }
  }

  const onClaimPass = async (level: number, premium: boolean) => {
    setBusyKey(`p:${level}:${premium ? 1 : 0}`)
    try {
      await claimPassLevel(player.id, level, premium)
      await reload()
    } catch {
      setError("Не удалось забрать награду пропуска")
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="w-full max-w-lg space-y-3 mb-4">
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-foreground">Событие недели</p>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-[11px] px-2 py-1 rounded-md border border-border/50 text-muted-foreground"
          >
            Обновить
          </button>
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground mt-2">Загрузка...</p>
        ) : (
          <>
            <p className="text-sm text-foreground mt-2">{data?.weeklyEvent?.title ?? "Нет события"}</p>
            <p className="text-xs text-muted-foreground mt-1">{data?.weeklyEvent?.description ?? ""}</p>
            {data?.weeklyEvent?.mode === "boss_week" && (
              <button
                type="button"
                onClick={() => {
                  setPlayer((p) => ({ ...p, activeWeeklyMode: "boss_week" }))
                  setScreen("bet-select")
                }}
                className="mt-3 px-3 py-2 rounded-xl bg-red-500/20 border border-red-400/50 text-red-200 text-xs font-semibold"
              >
                Войти в бой с Боссом
              </button>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Боевой пропуск</p>
          <span className="text-xs text-muted-foreground">
            Уровень {pass?.level ?? 0}/{maxLevel}
          </span>
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
            style={{ width: `${Math.min(100, ((pass?.level ?? 0) / maxLevel) * 100)}%` }}
          />
        </div>
        {!pass?.premiumUnlocked && (
          <button
            type="button"
            disabled={busyKey === "pass:unlock"}
            onClick={() => void onUnlockPremium()}
            className="mt-3 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-semibold disabled:opacity-50"
          >
            Открыть премиум за 15 голосов
          </button>
        )}
        <div className="mt-3 space-y-2 max-h-48 overflow-auto">
          {(data?.config?.pass.levels ?? []).slice(0, 10).map((lvl) => {
            const freeClaimed = pass?.claimedFreeLevels.includes(lvl.level) ?? false
            const premClaimed = pass?.claimedPremiumLevels.includes(lvl.level) ?? false
            const unlocked = (pass?.level ?? 0) >= lvl.level
            return (
              <div key={lvl.level} className="rounded-xl border border-border/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-semibold">Уровень {lvl.level}</span>
                  {!unlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{rewardText(lvl.freeRewards[0])}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={!unlocked || freeClaimed || busyKey === `p:${lvl.level}:0`}
                    onClick={() => void onClaimPass(lvl.level, false)}
                    className="text-[11px] px-2 py-1 rounded-md border border-emerald-400/40 text-emerald-300 disabled:opacity-50"
                  >
                    {freeClaimed ? "Получено" : "Забрать (бесплатно)"}
                  </button>
                  <button
                    type="button"
                    disabled={!unlocked || !pass?.premiumUnlocked || premClaimed || busyKey === `p:${lvl.level}:1`}
                    onClick={() => void onClaimPass(lvl.level, true)}
                    className="text-[11px] px-2 py-1 rounded-md border border-amber-400/40 text-amber-300 disabled:opacity-50"
                  >
                    {premClaimed ? "Получено" : "Забрать (премиум)"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <p className="text-sm font-semibold text-foreground">Квесты</p>
        <div className="mt-2 space-y-2 max-h-52 overflow-auto">
          {(data?.config?.quests ?? []).map((q) => {
            const progress = questProgressMap.get(q.id)
            const value = progress?.value ?? 0
            const done = value >= q.condition.target
            const claimed = !!progress?.claimedAt
            return (
              <div key={q.id} className="rounded-xl border border-border/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{q.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{resetLabel(q.reset)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {value}/{q.condition.target} | +{q.points} очков пропуска
                </p>
                <button
                  type="button"
                  disabled={!done || claimed || busyKey === `q:${q.id}`}
                  onClick={() => void onClaimQuest(q.id)}
                  className="mt-2 text-[11px] px-2 py-1 rounded-md border border-sky-400/40 text-sky-300 disabled:opacity-50"
                >
                  {claimed ? "Получено" : done ? "Забрать" : "Не выполнено"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-300" />
          <p className="text-sm font-semibold text-foreground">Достижения</p>
        </div>
        <div className="mt-2 space-y-2 max-h-44 overflow-auto">
          {(data?.config?.achievements ?? []).map((a) => {
            const progress = achProgressMap.get(a.id)
            const value = progress?.value ?? 0
            const done = value >= a.condition.target
            const claimed = !!progress?.claimedAt
            return (
              <div key={a.id} className="rounded-xl border border-border/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{a.title}</span>
                  {claimed && <Check className="h-3.5 w-3.5 text-emerald-300" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {value}/{a.condition.target}
                </p>
                <button
                  type="button"
                  disabled={!done || claimed || busyKey === `a:${a.id}`}
                  onClick={() => void onClaimAchievement(a.id)}
                  className="mt-2 text-[11px] px-2 py-1 rounded-md border border-amber-400/40 text-amber-300 disabled:opacity-50"
                >
                  {claimed ? "Получено" : "Забрать титул"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {player.activeTitleId && (
        <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-300" />
          <span className="text-xs text-purple-100">Активный титул: {player.activeTitleId}</span>
        </div>
      )}

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}
