"use client"

import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { ArrowLeft, Coins, Flame } from "lucide-react"

/** Ставка и режим: 5,10 = быстрая игра (1 ход); 25,50 = 3 хода; 100,250 = 5 ходов */
const BET_OPTIONS: { value: number; rounds: 1 | 3 | 5; modeLabel: string }[] = [
  { value: 5, rounds: 1, modeLabel: "Быстрая игра" },
  { value: 10, rounds: 1, modeLabel: "Быстрая игра" },
  { value: 25, rounds: 3, modeLabel: "3 хода" },
  { value: 50, rounds: 3, modeLabel: "3 хода" },
  { value: 100, rounds: 5, modeLabel: "5 ходов" },
  { value: 250, rounds: 5, modeLabel: "5 ходов" },
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
  const { setScreen, setCurrentBet, setTotalRounds, player } = useGame()

  const handleSelectBet = (value: number, rounds: 1 | 3 | 5) => {
    if (player.balance < value) return
    setCurrentBet(value)
    setTotalRounds(rounds)
    setScreen("matchmaking")
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-8">
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

      {/* Balance */}
      <div className="flex items-center gap-2.5 bg-card/60 backdrop-blur-sm border border-accent/20 rounded-full px-5 py-2.5 mb-6">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-base font-extrabold text-accent tabular-nums">{formatAmount(player.balance)}</span>
        <span className="text-base font-medium text-muted-foreground">голосов</span>
      </div>

      <p className="text-muted-foreground text-sm mb-6 text-center font-medium">
        Выберите ставку и режим: 5–10 голосов — быстрая игра, 25–50 — 3 хода, 100–250 — 5 ходов
      </p>

      {/* Сетка: ставка + режим (объединённое поле) */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {BET_OPTIONS.map(({ value, rounds, modeLabel }) => {
          const canAfford = player.balance >= value
          const badge = getTierBadge(rounds)
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
                <span className="text-base font-extrabold tabular-nums">{formatAmount(value)}</span>
              </div>
              <span className="text-base font-medium text-muted-foreground">голосов</span>
              <span className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.cls}`}>
                {badge.label}
              </span>
              {rounds === 5 && canAfford && (
                <Flame className="absolute top-2.5 left-2.5 h-4 w-4 text-destructive/50" />
              )}
            </button>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-6 w-full max-w-md bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
        <p className="text-sm text-muted-foreground text-center font-medium">
          Ставка × 2 = банк. Комиссия 10% (VIP: 5%).
        </p>
      </div>
    </div>
  )
}
