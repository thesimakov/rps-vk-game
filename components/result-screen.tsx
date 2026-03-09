"use client"

import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { Trophy, Skull, Minus, Coins, RotateCcw, ArrowRight, Zap, Heart, Hammer, Scissors, FileText, Moon, Sun, Droplets } from "lucide-react"
import { PlayerAvatar, VipBadgeOnFrame } from "@/components/player-avatar"
import { useState, useEffect } from "react"

const MOVE_LABELS: Record<string, { icon: string; label: string }> = {
  rock: { icon: "\uD83E\uDEA8", label: "Камень" },
  scissors: { icon: "\u2702\uFE0F", label: "Ножницы" },
  paper: { icon: "\uD83D\uDCC4", label: "Бумага" },
  water: { icon: "\uD83C\uDF0A", label: "Вода" },
}

/** Текст исхода: что произошло (бумага обернула камень, ножницы порезали бумагу и т.д.) */
function getOutcomePhrase(playerMove: string | null, opponentMove: string | null, outcome: string): string | null {
  if (outcome === "draw") return "Одинаковый ход"
  const winner = outcome === "win" ? playerMove : opponentMove
  const loser = outcome === "win" ? opponentMove : playerMove
  if (winner === "rock" && loser === "scissors") return "Камень разбил ножницы"
  if (winner === "scissors" && loser === "paper") return "Ножницы порезали бумагу"
  if (winner === "paper" && loser === "rock") return "Бумага обернула камень"
  if (winner === "water" && loser === "rock") return "Вода размыла камень"
  if (winner === "paper" && loser === "water") return "Бумага впитала воду"
  return null
}

/** Иконка исхода: кто кого победил — показываем победную комбинацию (молоток = камень бьёт ножницы, ножницы режут бумагу, бумага накрывает камень) */
function OutcomeIcon({ playerMove, opponentMove, outcome }: { playerMove: string | null; opponentMove: string | null; outcome: string }) {
  if (outcome === "draw") return <Minus className="h-8 w-8 text-white/50" />
  const winner = outcome === "win" ? playerMove : opponentMove
  const loser = outcome === "win" ? opponentMove : playerMove
  const cls = "h-8 w-8 text-white/70"
  if (winner === "rock" && loser === "scissors") return <Hammer className={cls} title="Камень бьёт ножницы" />
  if (winner === "scissors" && loser === "paper") return <Scissors className={cls} title="Ножницы режут бумагу" />
  if (winner === "paper" && loser === "rock") return <FileText className={cls} title="Бумага накрывает камень" />
  if (winner === "water" && loser === "rock") return <Droplets className={cls} title="Вода размыла камень" />
  if (winner === "paper" && loser === "water") return <FileText className={cls} title="Бумага впитала воду" />
  return <Minus className={cls} />
}

const FIRE_ANIMATION_DURATION_MS = 3000
const CONFETTI_DURATION_MS = 3200
const FIRE_PARTICLES_COUNT = 48
const CONFETTI_PIECES = 50

/** Детерминированные позиции огоньков (по индексу), чтобы не было гидратации */
function getFirePosition(i: number) {
  return {
    left: `${(i * 7 + 3) % 94 + 3}%`,
    top: `${(i * 11 + 5) % 88 + 6}%`,
    size: 18 + (i % 5) * 4,
    delay: (i % 10) * 0.08,
  }
}

/** Салют: разлёт из центра во все стороны (детерминировано по i) */
function getConfettiPosition(i: number) {
  const angle = (i / CONFETTI_PIECES) * 2 * Math.PI + (i % 3) * 0.4
  const distance = 140 + (i % 5) * 25
  const dx = Math.round(Math.cos(angle) * distance)
  const dy = Math.round(Math.sin(angle) * distance)
  return {
    dx,
    dy,
    delay: (i % 5) * 0.02,
    rot: (i % 4) * 180 + (i * 90),
    color: ["#fbbf24", "#f59e0b", "#84cc16", "#22c55e", "#eab308", "#38bdf8", "#a78bfa", "#f472b6"][i % 8],
  }
}

export function ResultScreen() {
  const { lastResult, setScreen, opponent, player, totalRounds } = useGame()
  const isWin = lastResult?.outcome === "win"
  const isDraw = lastResult?.outcome === "draw"
  /** Поражение из-за таймаута (кто-то не выбрал карту) — показываем «Кто-то уснул» вместо черепа и карт */
  const isAsleep = lastResult?.outcome === "loss" && lastResult.playerMove == null && lastResult.opponentMove == null
  const showFireAnimation = isWin && player.victoryAnimation === "fire"
  const showConfetti = isWin && player.victoryAnimation !== "fire"

  const [fireVisible, setFireVisible] = useState(showFireAnimation)
  const [confettiVisible, setConfettiVisible] = useState(showConfetti)

  useEffect(() => {
    if (!showFireAnimation) return
    setFireVisible(true)
    const t = setTimeout(() => setFireVisible(false), FIRE_ANIMATION_DURATION_MS)
    return () => clearTimeout(t)
  }, [showFireAnimation])

  useEffect(() => {
    if (!showConfetti) return
    setConfettiVisible(true)
    const t = setTimeout(() => setConfettiVisible(false), CONFETTI_DURATION_MS)
    return () => clearTimeout(t)
  }, [showConfetti])

  if (!lastResult) return null

  const bankAmount = lastResult.bet * 2

  const playerMoveInfo = lastResult.playerMove ? MOVE_LABELS[lastResult.playerMove] : { icon: "?", label: "?" }
  const opponentMoveInfo = lastResult.opponentMove ? MOVE_LABELS[lastResult.opponentMove] : { icon: "?", label: "?" }
  const opponentData = opponent ?? { name: "Соперник", avatar: "?", avatarUrl: "" }

  return (
    <div className="flex flex-col min-h-screen relative arena-bg">
      {/* Победа с анимацией «Огонь»: полноэкранные огоньки */}
      {fireVisible && (
        <div
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 fire-glow" />
          {Array.from({ length: FIRE_PARTICLES_COUNT }, (_, i) => {
            const { left, top, size, delay } = getFirePosition(i)
            return (
              <span
                key={i}
                className="absolute fire-float opacity-0"
                style={{
                  left,
                  top,
                  fontSize: size,
                  animation: `fire-float ${FIRE_ANIMATION_DURATION_MS}ms ease-out ${delay}s forwards`,
                }}
              >
                🔥
              </span>
            )
          })}
        </div>
      )}

      {/* Победа без огня: конфетти-салют (взрыв из центра) */}
      {confettiVisible && (
        <div
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: CONFETTI_PIECES }, (_, i) => {
            const { dx, dy, delay, rot, color } = getConfettiPosition(i)
            return (
              <div
                key={i}
                className="result-confetti-piece rounded-sm"
                style={{
                  backgroundColor: color,
                  animationDelay: `${delay}s`,
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`,
                  ["--rot" as string]: `${rot}deg`,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Верхняя панель: БАНК | РАУНД — закреплена сверху */}
      <div className="sticky top-0 z-10 w-full px-4 py-3 bg-background/85 backdrop-blur-md border-b border-border/30 shrink-0">
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-base font-bold text-white/90 uppercase tracking-wider">Банк</span>
            <span className="text-base font-bold text-amber-400 tabular-nums leading-tight">
              {formatAmount(bankAmount)} <span className="text-white/70 font-medium text-base">голосов</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span className="text-base font-bold text-white uppercase tracking-widest">
            Раунд {totalRounds} из {totalRounds}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <Heart key={i} className="h-5 w-5 flex-shrink-0 text-white/25" />
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Контент по центру: исход, карты (или «Кто-то уснул»), награда, кнопки */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
      {isAsleep ? (
        /* Блок «Кто-то уснул» вместо поражения: луна, солнце, Z z z */
        <>
          <div className="flex items-center justify-center gap-6 mb-4 asleep-moon-sun">
            <Moon className="h-14 w-14 text-indigo-300 drop-shadow-lg" strokeWidth={1.5} />
            <Sun className="h-16 w-16 text-amber-300 drop-shadow-lg" strokeWidth={1.5} />
          </div>
          <h1 className="result-title-in text-base font-black uppercase tracking-wide text-amber-200/95 mb-2" style={{ animationDelay: "0.1s" }}>
            Кто-то уснул
          </h1>
          <div className="flex items-end gap-1 mb-4" style={{ minHeight: "2.5rem" }}>
            <span className="asleep-zzz asleep-zzz-delay-1 text-3xl sm:text-4xl font-black text-white/90">Z</span>
            <span className="asleep-zzz asleep-zzz-delay-2 text-2xl sm:text-3xl font-black text-white/80">z</span>
            <span className="asleep-zzz asleep-zzz-delay-3 text-2xl sm:text-3xl font-black text-white/80">z</span>
          </div>
          <p className="text-white/80 text-sm sm:text-base text-center max-w-xs mb-6 leading-relaxed">
            Один из игроков не успел выбрать карту. Его голоса переходят тому, кто выбрал.
          </p>
        </>
      ) : (
        <>
      {/* Исход: ПОБЕДА / ПОРАЖЕНИЕ / НИЧЬЯ с иконкой — анимация появления и пульс */}
      <div className="flex flex-col items-center mb-6">
        <div className="result-title-in flex items-center gap-2" style={{ animationDelay: "0.15s" }}>
          {isWin ? (
            <Trophy className={`result-icon-in h-8 w-8 text-sky-400 ${"result-icon-win-pulse"}`} style={{ animationDelay: "0.2s" }} />
          ) : isDraw ? (
            <Minus className="result-icon-in h-8 w-8 text-amber-400" style={{ animationDelay: "0.2s" }} />
          ) : (
            <Skull className={`result-icon-in h-8 w-8 text-red-400 ${"result-icon-lose-pulse"}`} style={{ animationDelay: "0.2s" }} />
          )}
          <h1
            className={`result-title-in text-base font-black uppercase tracking-wide ${
              isWin ? "text-sky-300" : isDraw ? "text-amber-400" : "text-red-400"
            }`}
            style={{ animationDelay: "0.25s" }}
          >
            {isWin ? "Победа" : isDraw ? "Ничья" : "Поражение"}
          </h1>
        </div>
      </div>

      {/* Две карты в стиле средневековья: игрок слева, соперник справа — выезд с боков */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-md mx-auto mb-4">
        <div className="result-card-left flex flex-col items-center gap-3" style={{ animationDelay: "0.35s" }}>
          <div
            className={`card-medieval w-32 h-40 sm:w-36 sm:h-44 flex flex-col items-center justify-center gap-0 ${
              player.cardSkin === "gold" ? "card-medieval-selected" : ""
            }`}
          >
            <span className="card-symbol-icon text-5xl sm:text-6xl">{playerMoveInfo.icon}</span>
            <span className="text-base font-bold text-[#1f1a14] mt-1 uppercase tracking-wide">{playerMoveInfo.label}</span>
          </div>
          {player.avatarFrame === "gold" ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="gold-frame-outer w-16 h-16">
                <div className="gold-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar name={player.name} avatar={player.avatar} avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl} size="md" variant="primary" vip={false} />
                </div>
              </div>
              {player.vip && <VipBadgeOnFrame size="md" />}
            </div>
          ) : player.vip ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="vip-frame-outer w-16 h-16">
                <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar name={player.name} avatar={player.avatar} avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl} size="md" variant="primary" vip={false} />
                </div>
              </div>
              <VipBadgeOnFrame size="md" />
            </div>
          ) : (
            <div
              className={`rounded-xl overflow-hidden border-2 bg-sky-500/10 ${
                player.avatarFrame === "neon" ? "border-cyan-400/80 shadow-lg shadow-cyan-400/30" : "border-sky-400/30"
              }`}
            >
              <PlayerAvatar name={player.name} avatar={player.avatar} avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl} size="md" variant="primary" />
            </div>
          )}
        </div>

        <div className="result-center-in flex flex-col items-center justify-center pb-20 sm:pb-24 gap-2" style={{ animationDelay: "0.5s" }}>
          <OutcomeIcon
            playerMove={lastResult.playerMove}
            opponentMove={lastResult.opponentMove}
            outcome={lastResult.outcome}
          />
          <p className="text-xs sm:text-sm text-white/80 text-center font-medium max-w-[160px] leading-tight">
            {getOutcomePhrase(lastResult.playerMove, lastResult.opponentMove, lastResult.outcome) ?? ""}
          </p>
        </div>

        <div className="result-card-right flex flex-col items-center gap-3" style={{ animationDelay: "0.4s" }}>
          <div className="card-medieval card-medieval-opponent w-32 h-40 sm:w-36 sm:h-44 flex flex-col items-center justify-center gap-0">
            <span className="card-symbol-icon text-5xl sm:text-6xl">{opponentMoveInfo.icon}</span>
            <span className="text-base font-bold text-[#1f1a14] mt-1 uppercase tracking-wide">{opponentMoveInfo.label}</span>
          </div>
          {opponentData.vip ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="vip-frame-outer w-16 h-16">
                <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar name={opponentData.name} avatar={opponentData.avatar} avatarUrl={opponentData.avatarUrl} size="md" variant="destructive" vip={false} />
                </div>
              </div>
              <VipBadgeOnFrame size="md" />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border-2 border-red-400/30 bg-red-500/10">
              <PlayerAvatar name={opponentData.name} avatar={opponentData.avatar} avatarUrl={opponentData.avatarUrl} size="md" variant="destructive" />
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Выигрыш: +73 голосов в овале — появление и лёгкое свечение при победе */}
      <div
        className={`result-earnings-in flex items-center justify-center gap-2 rounded-full border-2 border-amber-400/60 bg-amber-500/20 px-5 py-2.5 mb-8 w-fit mx-auto ${lastResult.earnings > 0 ? "result-earnings-win" : ""}`}
        style={{ animationDelay: "0.65s" }}
      >
        <Coins className="h-5 w-5 text-amber-400" />
        <span
          className={`text-base font-bold tabular-nums ${
            lastResult.earnings > 0 ? "text-amber-400" : lastResult.earnings < 0 ? "text-red-400" : "text-amber-400"
          }`}
        >
          {lastResult.earnings > 0 ? "+" : ""}{formatAmount(lastResult.earnings)} голосов
        </span>
      </div>

      {/* Кнопки: Реванш, Закончить игру — появление снизу каскадом */}
      <div className="w-full max-w-xs mx-auto flex flex-col gap-3">
        <button
          onClick={() => setScreen("matchmaking")}
          className="result-btn-in w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/30"
          style={{ animationDelay: "0.8s" }}
        >
          <RotateCcw className="h-5 w-5" />
          <span>Реванш</span>
        </button>
        <button
          onClick={() => setScreen("bet-select")}
          className="result-btn-in w-full flex items-center justify-center gap-2 bg-slate-600/80 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] border border-slate-500/50"
          style={{ animationDelay: "0.95s" }}
        >
          <ArrowRight className="h-5 w-5" />
          <span>Закончить игру</span>
        </button>
      </div>
      </div>
    </div>
  )
}
