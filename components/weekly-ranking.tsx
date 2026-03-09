"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { AvatarImageOrLetter, VipBadgeOnFrame } from "@/components/player-avatar"
import { Trophy, Crown, ArrowUp, ArrowDown } from "lucide-react"

export function WeeklyRanking() {
  const { leaderboard, playerRank, rankTrend, setScreen, leaderboardVersion, purchaseRankBoost, player } = useGame()
  const [justUpdated, setJustUpdated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, startY: 0, startScrollTop: 0 })

  useEffect(() => {
    if (leaderboardVersion === 0) return
    setJustUpdated(true)
    const t = setTimeout(() => setJustUpdated(false), 1200)
    return () => clearTimeout(t)
  }, [leaderboardVersion])

  const topList = leaderboard.filter((e) => !e.isPlayer).slice(0, 10)
  const playerEntry = leaderboard.find((e) => e.isPlayer)
  const rankLabel = playerRank >= 1000 ? `${Math.floor(playerRank / 1000)}K` : String(playerRank)
  const winsLabel = playerEntry ? playerEntry.wins : player.weekWins
  const earningsLabel = playerEntry ? playerEntry.earnings : player.weekEarnings
  const canBuyBoost = player.balance >= 250

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const getY = (e: MouseEvent | TouchEvent) => ("touches" in e ? e.touches[0].clientY : e.clientY)

    const onStart = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) e.preventDefault()
      dragRef.current = { active: true, startY: getY(e), startScrollTop: el.scrollTop }
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) return
      const dy = dragRef.current.startY - getY(e)
      el.scrollTop = dragRef.current.startScrollTop + dy
    }

    const onEnd = () => {
      dragRef.current.active = false
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onEnd)
      window.removeEventListener("touchmove", onMove, { passive: false } as EventListenerOptions)
      window.removeEventListener("touchend", onEnd)
    }

    const onStartBound = (e: MouseEvent | TouchEvent) => {
      onStart(e)
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onEnd)
      window.addEventListener("touchmove", onMove, { passive: false })
      window.addEventListener("touchend", onEnd)
    }

    el.addEventListener("mousedown", onStartBound as EventListener)
    el.addEventListener("touchstart", onStartBound as EventListener, { passive: false })
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onEnd)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
      el.removeEventListener("mousedown", onStartBound as EventListener)
      el.removeEventListener("touchstart", onStartBound as EventListener)
    }
  }, [])

  function getMedalStyle(rank: number) {
    if (rank === 1) return "bg-accent/20 text-accent border border-accent/30"
    if (rank === 2) return "bg-foreground/10 text-foreground/70 border border-foreground/20"
    if (rank === 3) return "bg-secondary/15 text-secondary border border-secondary/25"
    return "bg-muted/50 text-muted-foreground border border-border/40"
  }

  return (
    <div className="flex flex-col h-full py-4 px-3 gap-3">
      <button
        onClick={() => setScreen("leaderboard")}
        className="flex items-center gap-2 px-2 py-1 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <Trophy className="h-4 w-4 text-accent" />
        <span className="font-bold text-base text-foreground tracking-wide uppercase">
          Топ недели
        </span>
      </button>

      <div className="h-px bg-border/30" />

      {/* Список с перетаскиванием для прокрутки и плавной анимацией при смене данных */}
      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain touch-pan-y select-none cursor-grab active:cursor-grabbing ${
          justUpdated ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background rounded-xl" : ""
        }`}
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex flex-col gap-1.5 pr-1">
          {topList.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all duration-500 ease-out ${
                entry.isPlayer
                  ? "bg-primary/12 border border-primary/30"
                  : "hover:bg-muted/20"
              } ${justUpdated ? "animate-in fade-in slide-in-from-bottom-2" : ""}`}
              style={{ animationDelay: justUpdated ? `${index * 40}ms` : undefined }}
            >
              <div
                className={`w-7 h-7 rounded-lg ${getMedalStyle(entry.rank)} flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 transition-all duration-300`}
              >
                {entry.rank}
              </div>

              {entry.vip ? (
                <div className="relative inline-flex flex-shrink-0">
                  <div className="vip-frame-outer w-10 h-10">
                    <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden ${
                          entry.isPlayer
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "bg-muted/40 text-foreground/60 border border-border/30"
                        }`}
                      >
                        <AvatarImageOrLetter src={entry.avatarUrl} letter={entry.avatar} />
                      </div>
                    </div>
                  </div>
                  <VipBadgeOnFrame size="sm" />
                </div>
              ) : (
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden ${
                    entry.isPlayer
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/40 text-foreground/60 border border-border/30"
                  }`}
                >
                  <AvatarImageOrLetter src={entry.avatarUrl} letter={entry.avatar} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-base font-semibold truncate ${entry.isPlayer ? "text-primary" : "text-foreground"}`}>
                    {entry.isPlayer ? "Вы" : entry.name}
                  </span>
                  {entry.vip && <Crown className="h-3 w-3 text-accent flex-shrink-0" />}
                </div>
                <span className="text-[10px] text-muted-foreground transition-all duration-300">
                  {entry.wins} {"побед"}
                </span>
              </div>

              <span className="text-base font-bold text-accent tabular-nums flex-shrink-0 transition-all duration-300">
                {formatAmount(entry.earnings)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ваше место — всегда видно, динамичный статус (красный/зелёный + стрелка) */}
      <div
        className={`px-3 py-2.5 rounded-xl border transition-all duration-300 ${
          rankTrend === "up"
            ? "bg-emerald-500/20 border-emerald-500/40"
            : rankTrend === "down"
              ? "bg-red-500/20 border-red-500/40"
              : "bg-muted/30 border-border/30"
        } ${justUpdated ? "ring-1 ring-primary/30" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-7 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-foreground tabular-nums">{rankLabel}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-foreground">Ваше место</span>
              {rankTrend === "up" && (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" aria-hidden />
              )}
              {rankTrend === "down" && (
                <ArrowDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" aria-hidden />
              )}
            </div>
            <span className="text-[10px] text-primary">
              {winsLabel} {winsLabel === 1 ? "победа" : winsLabel >= 2 && winsLabel <= 4 ? "победы" : "побед"}
            </span>
          </div>
            <span className="text-base font-extrabold text-accent tabular-nums flex-shrink-0 transition-all duration-300">
            {formatAmount(earningsLabel)}
          </span>
        </div>
      </div>

      {/* Увеличить рейтинг: 250 голосов → +100 бонус */}
      <button
        onClick={() => canBuyBoost && purchaseRankBoost()}
        disabled={!canBuyBoost}
        className="w-full py-2.5 rounded-xl text-sm font-bold bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-center"
      >
        Увеличить рейтинг
      </button>
      <p className="text-[10px] text-muted-foreground text-center px-1">
        +100 бонус за 250 голосов
      </p>

      <button
        onClick={() => setScreen("leaderboard")}
        className="py-2 rounded-xl text-[11px] font-semibold text-primary hover:bg-primary/8 transition-colors text-center"
      >
        {"Весь рейтинг \u2192"}
      </button>
    </div>
  )
}

