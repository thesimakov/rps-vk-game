"use client"

import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import type { Player } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { useEffect, useMemo, useRef, useState } from "react"
import { Coins, Search, X } from "lucide-react"
import { PlayerAvatar, VipBadgeOnFrame } from "@/components/player-avatar"

const POLL_MS = 1000
const LIVE_COUNT_POLL_MS = 3000
/** Если в вашей корзине (ставка+режим) меньше 2 игроков — через столько времени подключаем бота */
const ALONE_BOT_MS_NORMAL = 120_000
const ALONE_BOT_MS_FAST = 45_000
/** Глобально столько vk в поиске — усиливаем FIFO и подпись «приоритет» */
export const PRIORITY_LIVE_MATCHMAKING = 5

type QueueOpponentDto = {
  id: string
  name: string
  avatar: string
  avatarUrl: string
  vip: boolean
  wins: number
  losses: number
  weekWins: number
  weekEarnings: number
  balance: number
}

function dtoToPlayer(o: QueueOpponentDto): Player {
  return {
    id: o.id,
    name: o.name,
    avatar: o.avatar,
    avatarUrl: o.avatarUrl,
    balance: o.balance,
    wins: o.wins,
    losses: o.losses,
    weekWins: o.weekWins,
    weekEarnings: o.weekEarnings,
    vip: o.vip,
  }
}

async function leaveMatchQueue(userId: string) {
  try {
    await fetch(appPath("/api/match/queue"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
  } catch {
    /* ignore */
  }
}

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function Matchmaking() {
  const {
    setScreen,
    screen,
    opponent,
    setOpponent,
    currentBet,
    player,
    setPlayer,
    toDisplayAmount,
    currencyLabel,
    weeklyRules,
    totalRounds,
    pickRandomOpponent,
    ensureRandomBotOpponent,
  } = useGame()
  const [dots, setDots] = useState("")
  const [progress, setProgress] = useState(0)
  const useFastSearch = (player.fastMatchBoosts ?? 0) > 0
  const isBossWeek =
    (player.activeWeeklyMode ?? weeklyRules?.event.mode) === "boss_week" &&
    player.bossWeekMatchChoice === "boss"

  const weeklyMode = useMemo(
    () => player.activeWeeklyMode ?? weeklyRules?.event.mode ?? "elements_tournament",
    [player.activeWeeklyMode, weeklyRules?.event.mode],
  )

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** vk в той же корзине (ставка/раунды/режим) */
  const [bucketLive, setBucketLive] = useState<number | null>(null)
  /** vk во всех корзинах */
  const [globalLive, setGlobalLive] = useState<number | null>(null)
  const [secondsToBot, setSecondsToBot] = useState<number | null>(null)

  useEffect(() => {
    if (!isBossWeek) return
    setOpponent({
      id: "boss-npc",
      name: "Босс Эхо",
      avatar: "Б",
      avatarUrl: "",
      balance: 10000,
      wins: 999,
      losses: 10,
      weekWins: 999,
      weekEarnings: 9999,
      vip: true,
    })
  }, [isBossWeek, setOpponent])

  useEffect(() => {
    if (isBossWeek) return
    if (player.id.startsWith("vk_")) return
    pickRandomOpponent()
  }, [isBossWeek, player.id, pickRandomOpponent])

  /** Найден живой соперник (vk) — сразу в арену */
  useEffect(() => {
    if (screen !== "matchmaking") return
    if (isBossWeek) return
    if (!opponent?.id?.startsWith("vk_")) return
    void leaveMatchQueue(player.id)
    setScreen("arena")
  }, [screen, isBossWeek, opponent?.id, player.id, setScreen])

  /** Очередь PvP (только vk_* и не неделя босса) */
  useEffect(() => {
    if (isBossWeek) return
    if (!player.id.startsWith("vk_")) return

    let cancelled = false

    const clearPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    void (async () => {
      try {
        const res = await fetch(appPath("/api/match/queue"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: player.id,
            name: player.name,
            avatar: player.avatar,
            avatarUrl: player.avatarUrl,
            vip: player.vip,
            bet: currentBet,
            rounds: totalRounds,
            weeklyMode,
          }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          matched?: boolean
          opponent?: QueueOpponentDto
        }
        if (cancelled) return
        if (data.ok && data.matched && data.opponent) {
          setOpponent(dtoToPlayer(data.opponent))
          return
        }
        if (!data.ok) return

        pollRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch(
              appPath(`/api/match/poll?userId=${encodeURIComponent(player.id)}`),
            )
            const pollData = (await pollRes.json()) as {
              ok?: boolean
              matched?: boolean
              opponent?: QueueOpponentDto
            }
            if (cancelled) return
            if (pollData.ok && pollData.matched && pollData.opponent) {
              setOpponent(dtoToPlayer(pollData.opponent))
              clearPoll()
            }
          } catch {
            /* ignore */
          }
        }, POLL_MS)
      } catch {
        /* сеть / static export — остаёмся без PvP */
      }
    })()

    return () => {
      cancelled = true
      clearPoll()
      void leaveMatchQueue(player.id)
    }
  }, [
    isBossWeek,
    player.id,
    player.name,
    player.avatar,
    player.avatarUrl,
    player.vip,
    player.activeWeeklyMode,
    currentBet,
    totalRounds,
    weeklyMode,
    weeklyRules?.event.mode,
    setOpponent,
  ])

  /** Статистика очереди: своя корзина + глобально */
  useEffect(() => {
    if (isBossWeek) return
    if (!player.id.startsWith("vk_")) return
    let cancelled = false
    const load = async () => {
      try {
        const q = new URLSearchParams({
          bet: String(currentBet),
          rounds: String(totalRounds),
          weeklyMode,
        })
        const res = await fetch(appPath(`/api/match/live-count?${q.toString()}`), { cache: "no-store" })
        const data = (await res.json()) as {
          ok?: boolean
          count?: number
          globalLive?: number
        }
        if (cancelled) return
        if (data.ok && typeof data.count === "number") {
          setBucketLive(data.count)
          if (typeof data.globalLive === "number") setGlobalLive(data.globalLive)
        } else {
          setBucketLive(null)
          setGlobalLive(null)
        }
      } catch {
        if (!cancelled) {
          setBucketLive(null)
          setGlobalLive(null)
        }
      }
    }
    void load()
    const t = setInterval(load, LIVE_COUNT_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [isBossWeek, player.id, currentBet, totalRounds, weeklyMode])

  /** Таймер бота: только если в вашей корзине < 2 живых; иначе ждём человека (до отмены / ивента) */
  useEffect(() => {
    if (isBossWeek) return
    if (!player.id.startsWith("vk_")) return
    if (opponent?.id?.startsWith("vk_")) return

    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current)
      botTimeoutRef.current = null
    }
    setSecondsToBot(null)
    setProgress(0)

    /** Пока корзина неизвестна — считаем «мало игроков»; после ответа API уточняется */
    const alone = bucketLive === null || bucketLive < 2
    if (!alone) {
      return
    }

    const ms = useFastSearch ? ALONE_BOT_MS_FAST : ALONE_BOT_MS_NORMAL
    const deadline = Date.now() + ms
    setSecondsToBot(Math.ceil(ms / 1000))

    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsToBot(left)
      const elapsed = ms - left * 1000
      setProgress(Math.min(100, (elapsed / ms) * 100))
    }, 250)

    botTimeoutRef.current = setTimeout(() => {
      if (useFastSearch) {
        setPlayer((p) => ({ ...p, fastMatchBoosts: Math.max(0, (p.fastMatchBoosts ?? 0) - 1) }))
      }
      void leaveMatchQueue(player.id)
      ensureRandomBotOpponent()
      setScreen("arena")
    }, ms)

    return () => {
      clearInterval(tick)
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
        botTimeoutRef.current = null
      }
    }
  }, [
    isBossWeek,
    player.id,
    bucketLive,
    useFastSearch,
    opponent?.id,
    setPlayer,
    ensureRandomBotOpponent,
    setScreen,
  ])

  /** Босс / гость: короткий таймер на арену (vk ищут живого отдельно) */
  useEffect(() => {
    if (!isBossWeek && player.id.startsWith("vk_")) return

    const searchMs = useFastSearch ? 800 : 2500
    const timer = setTimeout(() => {
      if (useFastSearch) {
        setPlayer((p) => ({ ...p, fastMatchBoosts: Math.max(0, (p.fastMatchBoosts ?? 0) - 1) }))
      }
      setScreen("arena")
    }, searchMs)
    return () => clearTimeout(timer)
  }, [setScreen, useFastSearch, setPlayer, isBossWeek, player.id])

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."))
    }, 500)
    return () => clearInterval(dotInterval)
  }, [])

  const showBossGuestProgress = isBossWeek || !player.id.startsWith("vk_")
  useEffect(() => {
    if (!showBossGuestProgress) return
    const searchMs = useFastSearch ? 800 : 2500
    const step = 100 / (searchMs / 300)
    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + step * (0.5 + Math.random())))
    }, 300)
    return () => clearInterval(progressInterval)
  }, [showBossGuestProgress, useFastSearch])

  const alonePhase =
    !isBossWeek &&
    player.id.startsWith("vk_") &&
    (bucketLive === null || bucketLive < 2) &&
    !opponent?.id?.startsWith("vk_")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-36 pt-8">
      <div className="flex items-center gap-2.5 bg-card/60 backdrop-blur-sm border border-accent/20 rounded-full px-5 py-2.5 mb-10">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-base font-extrabold text-accent tabular-nums">
          {formatAmount(toDisplayAmount(currentBet))}
        </span>
        <span className="text-base font-medium text-muted-foreground">{currencyLabel}</span>
      </div>
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full border-2 border-muted/30 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-2 border-primary border-t-transparent animate-spin absolute inset-0" />
          <Search className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute -inset-4 bg-primary/6 rounded-full blur-2xl" />
      </div>
      <h2 className="text-base font-bold text-foreground mb-2">
        {isBossWeek ? `Ищем Босса${dots}` : `Ищем соперника${dots}`}
      </h2>
      {opponent && !opponent.id.startsWith("vk_") && (
        <div className="flex items-center gap-3 mb-6 px-4 py-2 rounded-2xl bg-card/40 border border-border/30">
          {opponent.vip ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="vip-frame-outer w-16 h-16">
                <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar
                    name={opponent.name}
                    avatar={opponent.avatar}
                    avatarUrl={opponent.avatarUrl}
                    size="md"
                    variant="destructive"
                    vip={false}
                  />
                </div>
              </div>
              <VipBadgeOnFrame size="md" />
            </div>
          ) : (
            <PlayerAvatar
              name={opponent.name}
              avatar={opponent.avatar}
              avatarUrl={opponent.avatarUrl}
              size="md"
              variant="destructive"
            />
          )}
          <p className="text-base font-semibold text-foreground">
            {isBossWeek ? `Найден: ${opponent.name} (сложный ИИ)` : `Найден: ${opponent.name}`}
          </p>
        </div>
      )}
      {!opponent && (
        <p className="text-sm text-muted-foreground font-medium mb-6">Подбираем игрока...</p>
      )}
      <div className="w-full max-w-xs h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <button
        onClick={() => {
          if (!isBossWeek && player.id.startsWith("vk_")) {
            void leaveMatchQueue(player.id)
          }
          setScreen("menu")
        }}
        className="mt-10 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive font-medium transition-colors"
      >
        <X className="h-4 w-4" />
        Отменить
      </button>

      {/* Статус поиска (живая очередь vk) */}
      {!isBossWeek && player.id.startsWith("vk_") && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/30">
          <div className="max-w-lg mx-auto space-y-2 text-center text-xs text-muted-foreground">
            {bucketLive === null && <p className="text-sky-200/80">Загрузка очереди…</p>}
            {bucketLive !== null && bucketLive >= 2 && (
              <p className="text-sky-200/95 font-semibold">
                В вашей категории ставки уже {bucketLive} игрок(ов) — ищем живого соперника без таймера на бота
              </p>
            )}
            {alonePhase && secondsToBot !== null && (
              <p className="text-foreground font-semibold">
                Поиск живого соперника: до бота осталось{" "}
                <span className="tabular-nums text-primary">{formatMmSs(secondsToBot)}</span>
                {useFastSearch && <span className="text-[10px] ml-1 opacity-80">(ускоренный поиск)</span>}
              </p>
            )}
            {globalLive !== null && globalLive >= PRIORITY_LIVE_MATCHMAKING && (
              <p className="text-amber-200/95 font-medium">
                В поиске {globalLive}+ игроков — приоритет соединения живых пар (FIFO)
              </p>
            )}
            <p className="text-[10px] leading-snug opacity-90">
              Ожидание в комнате: до конца события недели, пока не найдётся соперник или вы не отмените поиск.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
