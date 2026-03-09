"use client"

import { useGame, type Move } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { useState, useEffect, useRef, useCallback } from "react"
import { Coins, Timer, Zap, Heart, ChevronUp, ChevronDown } from "lucide-react"
import { PlayerAvatar, VipBadgeOnFrame } from "@/components/player-avatar"

const BASE_MOVES: { key: Move; label: string; icon: string; color: string }[] = [
  { key: "rock", label: "Камень", icon: "\uD83E\uDEA8", color: "border-secondary/50 shadow-secondary/10" },
  { key: "scissors", label: "Ножницы", icon: "\u2702\uFE0F", color: "border-destructive/50 shadow-destructive/10" },
  { key: "paper", label: "Бумага", icon: "\uD83D\uDCC4", color: "border-primary/50 shadow-primary/10" },
]

const WATER_MOVE: { key: Move; label: string; icon: string; color: string } = {
  key: "water",
  label: "Вода",
  icon: "\uD83C\uDF0A",
  color: "border-sky-500/50 shadow-sky-500/10",
}

function getOutcome(p: Move, o: Move): "win" | "loss" | "draw" {
  if (p === o) return "draw"
  // Вода: побеждает камень, проигрывает бумаге, ничья с ножницами
  if (p === "water") {
    if (o === "rock") return "win"
    if (o === "paper") return "loss"
    return "draw" // water vs scissors
  }
  if (o === "water") {
    if (p === "rock") return "loss"
    if (p === "paper") return "win"
    return "draw" // scissors vs water
  }
  if (
    (p === "rock" && o === "scissors") ||
    (p === "scissors" && o === "paper") ||
    (p === "paper" && o === "rock")
  ) return "win"
  return "loss"
}

function getRandomMove(): Move {
  const m: Move[] = ["rock", "scissors", "paper"]
  return m[Math.floor(Math.random() * 3)]
}

/** Ход, который бьёт переданный ход (для правила: против робота при ставке >100 игрок проигрывает) */
function getMoveThatBeats(move: Move): Move {
  if (move === "rock") return "paper"
  if (move === "scissors") return "rock"
  if (move === "water") return "paper" // бумага бьёт воду
  return "scissors"
}

/** Текст исхода раунда для подсказки на арене */
function getOutcomePhrase(playerMove: Move, opponentMove: Move, outcome: "win" | "loss" | "draw"): string {
  if (outcome === "draw") return "Одинаковый ход"
  const winner = outcome === "win" ? playerMove : opponentMove
  const loser = outcome === "win" ? opponentMove : playerMove
  if (winner === "rock" && loser === "scissors") return "Камень разбил ножницы"
  if (winner === "scissors" && loser === "paper") return "Ножницы порезали бумагу"
  if (winner === "paper" && loser === "rock") return "Бумага обернула камень"
  if (winner === "water" && loser === "rock") return "Вода размыла камень"
  if (winner === "paper" && loser === "water") return "Бумага впитала воду"
  if (winner === "water" || loser === "water") return outcome === "win" ? "Победа!" : "Поражение!"
  return outcome === "win" ? "Победа!" : "Поражение!"
}

type Phase = "choosing" | "locked" | "revealing" | "resolved"

export function GameArena() {
  const { opponent, player, setPlayer, currentBet, setLastResult, setScreen, totalRounds } = useGame()
  const hasWaterCard = (player.waterCardUses ?? 0) > 0
  const MOVES = hasWaterCard ? [...BASE_MOVES, WATER_MOVE] : BASE_MOVES

  const [timeLeft, setTimeLeft] = useState(15)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [opponentMove, setOpponentMove] = useState<Move | null>(null)
  const [phase, setPhase] = useState<Phase>("choosing")
  /** Номер текущего раунда (1-based). Растёт только после победы или поражения. */
  const [roundCount, setRoundCount] = useState(1)
  /** Локальный счёт в матче (раунды): соперник : игрок */
  const [opponentScore, setOpponentScore] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [drawMessage, setDrawMessage] = useState(false)
  /** Подсказка что произошло в раунде (победа/поражение) — для 3 и 5 раундов */
  const [roundHintMessage, setRoundHintMessage] = useState<string | null>(null)
  /** Показать карту соперника с небольшой задержкой после выбора игрока */
  const [showOpponentCard, setShowOpponentCard] = useState(false)

  // Ref to prevent double-resolution
  const resolvedRef = useRef(false)
  // Refs for timeouts — очищаем при размонтировании, чтобы не вызывать setState после unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => {
    return clearTimers
  }, [clearTimers])

  const resolveRound = useCallback(
    (playerMove: Move) => {
      // Prevent double fire
      if (resolvedRef.current) return
      resolvedRef.current = true

      // Правило для робота: до 50 голосов — случайный исход, выше 100 — игрок проигрывает
      const isBot = opponent?.id?.startsWith("bot-") ?? false
      const oppMove =
        isBot && currentBet > 100 ? getMoveThatBeats(playerMove) : getRandomMove()

      setPhase("locked")
      setOpponentMove(oppMove)
      setShowOpponentCard(false)

      // Небольшая задержка перед открытием карты соперника
      const cardRevealTimer = setTimeout(() => setShowOpponentCard(true), 500)
      timersRef.current.push(cardRevealTimer)

      // After a beat, reveal
      const revealTimer = setTimeout(() => {
        setPhase("revealing")
        const outcome = getOutcome(playerMove, oppMove)

        // Счёт после этого раунда (до обновления стейта), нужен для итогового результата матча
        let playerScoreAfter = playerScore
        let opponentScoreAfter = opponentScore

        if (outcome === "draw") {
          setDrawMessage(true)
          const drawTimer = setTimeout(() => {
            setDrawMessage(false)
            setSelectedMove(null)
            setOpponentMove(null)
            setShowOpponentCard(false)
            setPhase("choosing")
            setTimeLeft(15)
            resolvedRef.current = false
          }, 2000)
          timersRef.current.push(drawTimer)
          return
        }

        // Подсказка что произошло (для мультираунда)
        setRoundHintMessage(getOutcomePhrase(playerMove, oppMove, outcome))

        // Обновляем локальный счёт матча по раундам
        if (outcome === "win") {
          playerScoreAfter += 1
          setPlayerScore((prev) => prev + 1)
        } else if (outcome === "loss") {
          opponentScoreAfter += 1
          setOpponentScore((prev) => prev + 1)
        }

        // Экономика раунда: банк = ставка × 2, комиссия 10% (VIP: 5%).
        const pot = currentBet * 2
        const commissionRate = player.vip ? 0.05 : 0.1
        const commission = Math.ceil(pot * commissionRate)
        const winnings = pot - commission
        const roundEarnings = outcome === "win" ? winnings - currentBet : -currentBet
        const roundBonus = outcome === "win" ? Math.max(1, Math.round(winnings * 0.1)) : 0

        // Для одиночного раунда применяем экономику сразу.
        if (totalRounds === 1) {
          setPlayer((p) => {
            const isVip = p.vip
            const potInner = currentBet * 2
            const commissionInner = Math.ceil(potInner * (isVip ? 0.05 : 0.1))
            const winningsInner = potInner - commissionInner
            const earningsInner = outcome === "win" ? winningsInner - currentBet : -currentBet
            const bonusInner =
              outcome === "win" ? Math.max(1, Math.round(winningsInner * 0.1)) : 0

            const next = {
              ...p,
              balance: p.balance + earningsInner,
              wins: outcome === "win" ? p.wins + 1 : p.wins,
              losses: outcome === "loss" ? p.losses + 1 : p.losses,
              weekWins: outcome === "win" ? p.weekWins + 1 : p.weekWins,
              ratingPoints: Math.min(1000, (p.ratingPoints ?? 0) + bonusInner),
            }
            if (playerMove === "water") {
              next.waterCardUses = Math.max(0, (p.waterCardUses ?? 0) - 1)
            }
            return next
          })

          setLastResult({
            playerMove,
            opponentMove: oppMove,
            outcome,
            earnings: roundEarnings,
            bet: currentBet,
            bonus: roundBonus,
          })
        } else {
          // В мульти-раундовых матчах (3 или 5 ходов) ставка относится ко всему матчу.
          // Здесь обновляем только использование карты «Вода», без изменения баланса и статистики.
          if (playerMove === "water") {
            setPlayer((p) => ({
              ...p,
              waterCardUses: Math.max(0, (p.waterCardUses ?? 0) - 1),
            }))
          }
        }

        setPhase("resolved")

        const doneTimer = setTimeout(() => {
          setRoundHintMessage(null)
          const nextRound = roundCount + 1
          if (nextRound > totalRounds) {
            // Матч завершён.
            if (totalRounds > 1) {
              // Для матчей на 3 и 5 раундов: считаем итог по очкам и применяем экономику один раз за матч.
              let finalOutcome: "win" | "loss" | "draw" = "draw"
              if (playerScoreAfter > opponentScoreAfter) finalOutcome = "win"
              else if (playerScoreAfter < opponentScoreAfter) finalOutcome = "loss"

              // Экономика матча: ставка относится ко всему матчу, а не к каждому раунду.
              const potMatch = currentBet * 2
              const commissionMatch = Math.ceil(potMatch * (player.vip ? 0.05 : 0.1))
              const winningsMatch = potMatch - commissionMatch

              let finalEarnings = 0
              if (finalOutcome === "win") finalEarnings = winningsMatch - currentBet
              else if (finalOutcome === "loss") finalEarnings = -currentBet
              else finalEarnings = 0

              const matchBonus =
                finalOutcome === "win" ? Math.max(1, Math.round(winningsMatch * 0.1)) : 0

              setPlayer((p) => {
                const next = {
                  ...p,
                  balance: p.balance + finalEarnings,
                  wins: finalOutcome === "win" ? p.wins + 1 : p.wins,
                  losses: finalOutcome === "loss" ? p.losses + 1 : p.losses,
                  weekWins: finalOutcome === "win" ? p.weekWins + 1 : p.weekWins,
                  ratingPoints: Math.min(1000, (p.ratingPoints ?? 0) + matchBonus),
                }
                return next
              })

              setLastResult({
                playerMove,
                opponentMove: oppMove,
                outcome: finalOutcome,
                earnings: finalEarnings,
                bet: currentBet,
                bonus: matchBonus,
              })
            }

            setScreen("result")
          } else {
            setRoundCount(nextRound)
            setSelectedMove(null)
            setOpponentMove(null)
            setShowOpponentCard(false)
            setPhase("choosing")
            setTimeLeft(15)
            resolvedRef.current = false
          }
        }, 1800)
        timersRef.current.push(doneTimer)
      }, 1200)
      timersRef.current.push(revealTimer)
    },
    [currentBet, opponent?.id, player.vip, setPlayer, setLastResult, setScreen, totalRounds, roundCount]
  )

  // Timer countdown
  useEffect(() => {
    if (phase !== "choosing") return

    if (timeLeft <= 0) {
      // Не выбрал карту вовремя — сразу экран результата с «Кто-то уснул»
      if (!selectedMove) {
        setPlayer((p) => ({
          ...p,
          balance: p.balance - currentBet,
          losses: p.losses + 1,
        }))
        setLastResult({
          playerMove: null,
          opponentMove: null,
          outcome: "loss",
          earnings: -currentBet,
          bet: currentBet,
          bonus: 0,
        })
        setScreen("result")
        return
      }
      return
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, phase, selectedMove, currentBet, setPlayer, setLastResult, setScreen, resolveRound])

  const handleSelectMove = (move: Move) => {
    if (phase !== "choosing") return
    setSelectedMove(move)
    resolveRound(move)
  }

  const opponentData = opponent ?? { name: "Соперник", avatar: "?", avatarUrl: "" }
  const timerDanger = timeLeft <= 5
  /** Сердечки = сколько ходов осталось (после победы/поражения один ход засчитывается) */
  const movesLeft = Math.max(0, totalRounds - roundCount + 1)
  const bankAmount = currentBet * 2

  return (
    <div className="flex flex-col min-h-screen relative px-4 py-4 arena-bg">
      {/* Верхняя панель: БАНК (монета + голоса) | РАУНД N | сердца (красные заполненные, серые пустые) */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-5">
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
            Раунд {roundCount}{totalRounds > 1 ? ` из ${totalRounds}` : ""}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 flex-shrink-0 ${i < movesLeft ? "fill-red-500 text-red-500" : "text-white/25"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Соперник: аватар, имя, карта с анимацией переворота */}
      <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto">
        {opponentData.vip ? (
          <div className="relative inline-flex flex-shrink-0">
            <div className="vip-frame-outer w-16 h-16">
              <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                <PlayerAvatar
                  name={opponentData.name}
                  avatar={opponentData.avatar}
                  avatarUrl={opponentData.avatarUrl}
                  size="md"
                  variant="destructive"
                  vip={false}
                />
              </div>
            </div>
            <VipBadgeOnFrame size="md" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border-2 border-red-500/30 bg-red-500/10 flex-shrink-0">
            <PlayerAvatar
              name={opponentData.name}
              avatar={opponentData.avatar}
              avatarUrl={opponentData.avatarUrl}
              size="md"
              variant="destructive"
            />
          </div>
        )}
        <span className="text-base font-bold text-white">{opponentData.name}</span>
        <div
          className={`card-flip-wrap w-28 h-36 ${phase !== "choosing" && opponentMove && showOpponentCard ? "flipped" : ""}`}
        >
          <div className="card-flip-inner w-full h-full">
            <div className="card-flip-front card-medieval card-medieval-back">
              <span className="card-symbol-icon text-5xl text-[#1f1a14]/60 animate-pulse">?</span>
            </div>
            <div className="card-flip-back card-medieval card-medieval-opponent">
              <span className="card-symbol-icon text-5xl">
                {opponentMove ? MOVES.find((m) => m.key === opponentMove)?.icon : "?"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Центр: таймер и подсказки (счёт раундов вынесен наверх) */}
      <div className="flex flex-col items-center justify-center gap-2 my-4 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/30 rounded-full blur-xl scale-110" />
            <div className="relative w-20 h-20 rounded-full bg-sky-600/40 border-2 border-sky-400/50 flex items-center justify-center">
              <svg className="absolute w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" className="stroke-white/20" />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - timeLeft / 15)}
                  className={`transition-all duration-1000 linear ${timerDanger ? "stroke-red-400" : "stroke-sky-400"}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Timer className={`h-4 w-4 mb-0.5 ${timerDanger ? "text-red-300" : "text-sky-300"}`} />
                <span className={`text-2xl font-black tabular-nums text-white`}>{timeLeft}</span>
              </div>
            </div>
          </div>
          {/* Табло счёта раундов: соперник : игрок, стрелки обозначают игроков */}
          <div className="mt-1 flex items-center gap-3">
            <ChevronUp className="h-4 w-4 text-red-300" aria-label="Соперник" />
            <span className="text-lg font-black text-white tabular-nums">
              {opponentScore} : {playerScore}
            </span>
            <ChevronDown className="h-4 w-4 text-emerald-300" aria-label="Вы" />
          </div>
          {drawMessage && (
            <p className="text-sm text-amber-400 font-bold animate-in fade-in">Ничья! Ещё раунд...</p>
          )}
          {roundHintMessage && !drawMessage && (
            <p
              className={`text-sm font-bold animate-in fade-in ${
                roundHintMessage.startsWith("Побед") ? "text-emerald-400" : roundHintMessage.startsWith("Поражен") ? "text-red-400" : "text-white/90"
              }`}
            >
              {roundHintMessage}
            </p>
          )}
        </div>
      </div>

      {/* Кнопки выбора: три карты лицевой стороной — игрок сразу видит Камень, Ножницы, Бумагу */}
      <div className="flex justify-center gap-4 w-full max-w-md mx-auto mb-6">
        {MOVES.map((move) => {
          const isSelected = selectedMove === move.key
          const isChoosing = phase === "choosing"
          return (
            <button
              key={move.key}
              type="button"
              onClick={() => handleSelectMove(move.key)}
              disabled={phase !== "choosing"}
              className={`flex flex-col items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#18223D] rounded-lg ${
                isChoosing ? "cursor-pointer active:scale-95 hover:scale-105" : "cursor-default"
              }`}
            >
              <div
                className={`card-medieval w-20 h-28 flex flex-col items-center justify-center gap-0 ${
                  isSelected ? "card-medieval-selected" : player.cardSkin === "gold" ? "card-medieval-selected" : move.key === "scissors" ? "card-medieval-scissors" : move.key === "water" ? "border-sky-500/40" : ""
                }`}
              >
                <span className="card-symbol-icon text-3xl">{move.icon}</span>
                <span className="text-[9px] font-bold text-[#1f1a14] mt-0.5 uppercase tracking-wide">{move.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Игрок: аватар, имя, голоса */}
      <div className="mt-auto flex flex-col items-center w-full max-w-md mx-auto pb-2">
        {player.avatarFrame === "gold" ? (
          <div className="relative inline-flex flex-shrink-0">
            <div className="gold-frame-outer w-16 h-16">
              <div className="gold-frame-inner w-full h-full">
                <PlayerAvatar
                  name={player.name}
                  avatar={player.avatar}
                  avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                  size="md"
                  variant="accent"
                  vip={false}
                />
              </div>
            </div>
            {player.vip && <VipBadgeOnFrame size="md" />}
          </div>
        ) : player.vip ? (
          <div className="relative inline-flex flex-shrink-0">
            <div className="vip-frame-outer w-16 h-16">
              <div className="vip-frame-inner w-full h-full">
                <PlayerAvatar
                  name={player.name}
                  avatar={player.avatar}
                  avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                  size="md"
                  variant="accent"
                  vip={false}
                />
              </div>
            </div>
            <VipBadgeOnFrame size="md" />
          </div>
        ) : (
          <div
            className={`rounded-full overflow-hidden border-2 flex-shrink-0 ${
              player.avatarFrame === "neon"
                ? "border-cyan-400/70 bg-cyan-500/10 shadow-md shadow-cyan-400/20"
                : "border-primary/40 bg-primary/10"
            }`}
          >
            <PlayerAvatar
              name={player.name}
              avatar={player.avatar}
              avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
              size="md"
              variant="primary"
            />
          </div>
        )}
        <span className="text-base font-bold text-white mt-2">{player.name}</span>
        <span className="text-base text-white/70">{formatAmount(player.balance)} голосов</span>
      </div>

      {/* Надпись снизу */}
      <p className="text-center text-xs text-white/40 font-medium tracking-widest uppercase pb-6 pt-1">
        Камень · Ножницы · Бумага
      </p>
    </div>
  )
}
