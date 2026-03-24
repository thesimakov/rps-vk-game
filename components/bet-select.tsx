"use client"

import { appPath } from "@/lib/app-path"
import { useGame, BOT_OPPONENTS } from "@/lib/game-context"
import type { Player } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { PlayerAvatar } from "@/components/player-avatar"
import { ArrowLeft, Coins, Flame, Search, Shield, Swords, Trophy, Users } from "lucide-react"
import { useEffect, useState } from "react"

const STATUS_POLL_MS = 4000

/** Ставка: 5,10 = быстрая игра (1 ход); 25,50 = 3 хода; 100,250 = 5 ходов */
const BET_OPTIONS: { value: number; rounds: 1 | 3 | 5 }[] = [
  { value: 5, rounds: 1 },
  { value: 10, rounds: 1 },
  { value: 25, rounds: 3 },
  { value: 50, rounds: 3 },
  { value: 100, rounds: 5 },
  { value: 250, rounds: 5 },
]

function getTierAccent(rounds: number) {
  if (rounds === 1) return "border-primary/30 hover:border-primary/60"
  if (rounds === 3) return "border-secondary/30 hover:border-secondary/60"
  return "border-destructive/30 hover:border-destructive/60"
}

function getTierBadge(rounds: number) {
  if (rounds === 1) return { label: "1 ход", cls: "bg-primary/15 text-primary" }
  if (rounds === 3) return { label: "3 хода", cls: "bg-secondary/15 text-secondary" }
  return { label: "5 ходов", cls: "bg-destructive/15 text-destructive" }
}

export function BetSelect() {
  const {
    setScreen,
    setCurrentBet,
    setTotalRounds,
    player,
    setPlayer,
    setOpponent,
    setPvpMatchId,
    toDisplayAmount,
    currencyLabel,
    offlineMode,
    setOfflineMode,
  } = useGame()

  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [queueCount, setQueueCount] = useState<number | null>(null)
  const [bucketCounts, setBucketCounts] = useState<Record<string, number>>({})
  const [selectedBot, setSelectedBot] = useState<Player | null>(null)

  useEffect(() => {
    if (offlineMode) return
    let cancelled = false
    const load = async () => {
      try {
        const onlineUrl =
          player.id.startsWith("vk_")
            ? appPath(`/api/presence/online-count?userId=${encodeURIComponent(player.id)}`)
            : appPath("/api/presence/online-count")
        const [onlineRes, queueRes] = await Promise.all([
          fetch(onlineUrl, { cache: "no-store" }),
          fetch(appPath("/api/match/live-count"), { cache: "no-store" }),
        ])
        const onlineData = (await onlineRes.json()) as { ok?: boolean; count?: number }
        const queueData = (await queueRes.json()) as {
          ok?: boolean
          count?: number
          buckets?: Record<string, number>
        }
        if (cancelled) return
        setOnlineCount(
          onlineData.ok && typeof onlineData.count === "number" ? onlineData.count : null,
        )
        setQueueCount(queueData.ok && typeof queueData.count === "number" ? queueData.count : null)
        if (queueData.ok && queueData.buckets) {
          setBucketCounts(queueData.buckets)
        }
      } catch {
        if (!cancelled) {
          setOnlineCount(null)
          setQueueCount(null)
        }
      }
    }
    void load()
    const t = setInterval(load, STATUS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [player.id, offlineMode])

  const handleSelectBet = (value: number, rounds: 1 | 3 | 5) => {
    if (player.balance < value) return
    setCurrentBet(value)
    setTotalRounds(rounds)
    setPlayer((p) => ({
      ...p,
      activeWeeklyMode: undefined,
      bossWeekMatchChoice: undefined,
    }))
    setPvpMatchId(null)

    if (offlineMode) {
      if (selectedBot) {
        setOpponent(selectedBot)
      } else {
        const idx = Math.floor(Math.random() * BOT_OPPONENTS.length)
        setOpponent(BOT_OPPONENTS[idx])
      }
      setScreen("arena")
    } else {
      setOpponent(null)
      setScreen("matchmaking")
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center mb-6">
        <button
          onClick={() => setScreen("menu")}
          className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground uppercase tracking-wider">
          Выбор ставки
        </h1>
        <div className="w-9" />
      </div>

      {/* Онлайн / Оффлайн toggle */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-2 mb-6 bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-1.5">
        <button
          onClick={() => { setOfflineMode(false); setSelectedBot(null) }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            !offlineMode
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <Swords className="h-4 w-4" />
          Онлайн
        </button>
        <button
          onClick={() => setOfflineMode(true)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            offlineMode
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/60"
          }`}
        >
          <Shield className="h-4 w-4" />
          Оффлайн
        </button>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-2.5 bg-card/60 backdrop-blur-sm border border-accent/20 rounded-full px-5 py-2.5 mb-5">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-base font-extrabold text-accent tabular-nums">
          {formatAmount(toDisplayAmount(player.balance))} {currencyLabel}
        </span>
      </div>

      <p className="text-muted-foreground text-sm mb-5 text-center font-medium">
        Выберите ставку: 5–10 монет — быстрая игра, 25–50 монет — 3 хода, 100–250 монет — 5 ходов
      </p>

      {/* Онлайн: статистика очереди */}
      {!offlineMode && (
        <>
          <div className="w-full max-w-lg grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2.5 bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3">
              <Users className="h-4 w-4 shrink-0 text-sky-400/90" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Онлайн</p>
                <p className="text-lg font-extrabold tabular-nums text-foreground leading-tight">
                  {onlineCount === null ? "…" : onlineCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  В очереди
                </p>
                <p className="text-lg font-extrabold tabular-nums text-foreground leading-tight">
                  {queueCount === null ? "…" : queueCount}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/90 text-center mb-4 -mt-2 max-w-md font-medium">
            В очереди — игроки ВКонтакте в поиске соперника (комната ожидания)
          </p>
        </>
      )}

      {/* Оффлайн: список ботов */}
      {offlineMode && (
        <div className="w-full max-w-lg mb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
            Выберите соперника ({BOT_OPPONENTS.length} ботов)
          </p>
          <div className="max-h-40 overflow-y-auto rounded-2xl bg-card/40 border border-border/30 p-2 space-y-1">
            {BOT_OPPONENTS.map((bot) => {
              const isSelected = selectedBot?.id === bot.id
              return (
                <button
                  key={bot.id}
                  onClick={() => setSelectedBot(isSelected ? null : bot)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 border border-emerald-500/50"
                      : "hover:bg-card/80 border border-transparent"
                  }`}
                >
                  <div className="relative h-8 w-8 flex-shrink-0">
                    <PlayerAvatar
                      name={bot.name}
                      avatar={bot.avatar}
                      avatarUrl={bot.avatarUrl}
                      size="sm"
                      variant="muted"
                      vip={bot.vip}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? "text-emerald-300" : "text-foreground"}`}>
                      {bot.name}
                      {bot.vip && <span className="ml-1.5 text-[10px] text-amber-400 font-bold">VIP</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
                    <Trophy className="h-3 w-3 text-amber-400/70" />
                    {bot.wins} побед, {bot.losses} поражений
                  </div>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/80 text-center">
            {selectedBot ? `Соперник: ${selectedBot.name}` : "Или соперник подберётся случайно"}
          </p>
        </div>
      )}

      {/* Сетка: ставка + число раундов */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-3">
        {BET_OPTIONS.map(({ value, rounds }) => {
          const canAfford = player.balance >= value
          const badge = getTierBadge(rounds)
          const bucketKey = `${value}_${rounds}`
          const inQueue = bucketCounts[bucketKey] ?? 0
          return (
            <button
              key={value}
              onClick={() => handleSelectBet(value, rounds)}
              disabled={!canAfford}
              className={`relative flex flex-col items-center justify-center gap-1 py-5 px-4 rounded-2xl border transition-all active:scale-[0.97] ${
                canAfford
                  ? `bg-card/60 backdrop-blur-sm ${getTierAccent(rounds)} text-foreground cursor-pointer hover:bg-card/80`
                  : "bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed opacity-40"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Coins className={`h-5 w-5 ${canAfford ? "text-accent" : "text-muted-foreground"}`} />
                <span className="text-base font-extrabold tabular-nums">
                  {formatAmount(toDisplayAmount(value))} {currencyLabel}
                </span>
              </div>
              <span className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.cls}`}>
                {badge.label}
              </span>
              {!offlineMode && inQueue > 0 && (
                <span className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-sky-400">
                  <Users className="h-3 w-3" />
                  {inQueue} в очереди
                </span>
              )}
              {rounds === 5 && canAfford && (
                <Flame className="absolute top-2.5 left-2.5 h-4 w-4 text-destructive/50" />
              )}
            </button>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-6 w-full max-w-lg bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
        <p className="text-sm text-muted-foreground text-center font-medium">
          Ставка × 2 = банк. Без комиссии.
        </p>
      </div>
    </div>
  )
}
