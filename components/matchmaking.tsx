"use client"

import { appPath } from "@/lib/app-path"
import { useGame } from "@/lib/game-context"
import type { Player } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { useEffect, useRef, useState } from "react"
import { Coins, Search, X } from "lucide-react"
import { PlayerAvatar, VipBadgeOnFrame } from "@/components/player-avatar"

const NORMAL_SEARCH_MS = 2500
const FAST_SEARCH_MS = 800
const POLL_MS = 1000

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

export function Matchmaking() {
  const {
    setScreen,
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
  const searchMs = useFastSearch ? FAST_SEARCH_MS : NORMAL_SEARCH_MS
  /** Только явный выбор «Босс»; если undefined — не босс (иначе «живая» ломалась: undefined !== "live" → true) */
  const isBossWeek =
    (player.activeWeeklyMode ?? weeklyRules?.event.mode) === "boss_week" &&
    player.bossWeekMatchChoice === "boss"
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  /** Гость / не ВК — сразу бот */
  useEffect(() => {
    if (isBossWeek) return
    if (player.id.startsWith("vk_")) return
    pickRandomOpponent()
  }, [isBossWeek, player.id, pickRandomOpponent])

  /** Очередь PvP (только vk_* и не неделя босса) */
  useEffect(() => {
    if (isBossWeek) return
    if (!player.id.startsWith("vk_")) return

    let cancelled = false
    const weeklyMode = player.activeWeeklyMode ?? weeklyRules?.event.mode ?? "elements_tournament"

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
    weeklyRules?.event.mode,
    setOpponent,
  ])

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."))
    }, 500)
    const step = 100 / (searchMs / 300)
    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + step * (0.5 + Math.random())))
    }, 300)
    const timer = setTimeout(() => {
      if (useFastSearch) {
        setPlayer((p) => ({ ...p, fastMatchBoosts: Math.max(0, (p.fastMatchBoosts ?? 0) - 1) }))
      }
      if (!isBossWeek && player.id.startsWith("vk_")) {
        void leaveMatchQueue(player.id)
        ensureRandomBotOpponent()
      }
      setScreen("arena")
    }, searchMs)
    return () => {
      clearInterval(dotInterval)
      clearInterval(progressInterval)
      clearTimeout(timer)
    }
  }, [setScreen, useFastSearch, setPlayer, isBossWeek, player.id, ensureRandomBotOpponent])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
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
      {opponent && (
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
    </div>
  )
}
