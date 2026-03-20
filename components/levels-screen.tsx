"use client"

import { useGame } from "@/lib/game-context"
import { LEVELS, LEVEL_STEP_XP, MAX_LEVEL, getDailyBonusPercent, getLevelFromXp, getLevelMeta, getRankBoostExtra, getShopDiscountPercent } from "@/lib/level-system"
import { ArrowLeft, CheckCircle2, CircleDot, Lock } from "lucide-react"

export function LevelsScreen() {
  const { player, setScreen } = useGame()
  const levelXp = player.levelXp ?? 0
  const currentLevel = getLevelFromXp(levelXp)
  const levelMeta = getLevelMeta(levelXp)
  const xpInLevel = levelXp >= MAX_LEVEL * LEVEL_STEP_XP ? LEVEL_STEP_XP : levelXp % LEVEL_STEP_XP

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6">
      <div className="w-full max-w-lg flex items-center mb-5">
        <button
          onClick={() => setScreen("menu")}
          className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground uppercase tracking-wider">
          Уровни
        </h1>
        <div className="w-9" />
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/14 via-card/55 to-indigo-500/10 p-5">
        <p className="text-sm text-white/80">Текущий уровень</p>
        <p className="mt-1 text-xl font-extrabold text-white">
          {levelMeta.name} ({currentLevel}/{MAX_LEVEL})
        </p>
        <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-cyan-400"
            style={{ width: `${Math.min(100, (xpInLevel / LEVEL_STEP_XP) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/70">
          XP: {Math.min(xpInLevel, LEVEL_STEP_XP)}/{LEVEL_STEP_XP}
        </p>
        <p className="mt-2 text-sm text-cyan-100">{levelMeta.perk}</p>
      </div>

      <div className="w-full max-w-lg mt-4 rounded-2xl border border-border/35 bg-card/35 p-4">
        <p className="text-xs text-muted-foreground">
          Активные бонусы сейчас: ежедневка +{getDailyBonusPercent(levelXp)}%, скидка магазина {getShopDiscountPercent(levelXp)}%,
          буст рейтинга +{getRankBoostExtra(levelXp)}.
        </p>
      </div>

      <div className="w-full max-w-lg mt-4 space-y-2.5">
        {LEVELS.map((level) => {
          const reached = level.level < currentLevel
          const current = level.level === currentLevel
          return (
            <div
              key={level.level}
              className={`rounded-2xl border p-3.5 ${
                current
                  ? "border-amber-300/45 bg-amber-500/12"
                  : reached
                    ? "border-emerald-300/35 bg-emerald-500/10"
                    : "border-border/35 bg-card/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {reached ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : current ? (
                    <CircleDot className="h-4 w-4 text-amber-300" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {level.level}. {level.name}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {reached ? "Открыт" : current ? "Текущий" : "Закрыт"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{level.perk}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
