"use client"

import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { useEffect, useMemo, useState } from "react"
import { Trophy, Swords, User, ShoppingBag, Crown, Coins, Plus, Gift, Check, ListOrdered } from "lucide-react"
import { VipBadgeOnFrame } from "@/components/player-avatar"
import { PlayerAvatar } from "@/components/player-avatar"

const LEVELS = ["Супер новичок", "Новичок", "Игрок", "Мастер", "Легенда"]
const LEVEL_STEPS = 10

const DAILY_REWARDS = [
  { day: 1, amount: 7, icon: "coin" as const },
  { day: 2, amount: 7, icon: "coin" as const },
  { day: 3, amount: 7, icon: "coin" as const },
  { day: 4, amount: 14, icon: "coin" as const },
  { day: 5, amount: 1, icon: "gift" as const },
  { day: 6, amount: 14, icon: "coin" as const },
  { day: 7, amount: 18, icon: "coin" as const },
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Оставшееся время до следующего подарка (мс). 0 если уже можно забирать. */
function msUntilNextGift(lastClaimedAt: number | undefined): number {
  if (!lastClaimedAt) return 0
  const elapsed = Date.now() - lastClaimedAt
  if (elapsed >= MS_PER_DAY) return 0
  return MS_PER_DAY - elapsed
}

/** Форматирует "через X ч Y мин" */
function formatTimeUntil(ms: number): string {
  if (ms <= 0) return ""
  const totalMinutes = Math.ceil(ms / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `через ${hours} ч ${minutes} мин`
  return `через ${minutes} мин`
}

export function MainMenu() {
  const { setScreen, player, setPlayer } = useGame()
  const [now, setNow] = useState(() => Date.now())

  const totalWins = player.wins + player.weekWins
  const levelIndex = Math.min(Math.floor(totalWins / LEVEL_STEPS), LEVELS.length - 1)
  const levelName = LEVELS[levelIndex]
  const progressInLevel = totalWins % LEVEL_STEPS
  const progressDisplay = `${Math.min(progressInLevel, LEVEL_STEPS)}/${LEVEL_STEPS}`

  const lastClaimedAt = player.lastDailyGiftClaimedAt
  const dailyIndex = typeof player.dailyRewardIndex === "number" ? player.dailyRewardIndex : 0
  const msUntil = useMemo(() => msUntilNextGift(lastClaimedAt), [lastClaimedAt, now])
  const canClaimGift = msUntil === 0
  const timeUntilText = formatTimeUntil(msUntil)

  useEffect(() => {
    if (!canClaimGift) {
      const t = setTimeout(() => setNow(Date.now()), 60 * 1000)
      return () => clearTimeout(t)
    }
  }, [canClaimGift, now])

  const handleClaimDaily = () => {
    if (!canClaimGift) return
    const reward = DAILY_REWARDS[dailyIndex]
    const amount = reward.icon === "coin" ? reward.amount : reward.amount * 10
    setPlayer((p) => ({
      ...p,
      balance: p.balance + amount,
      lastDailyGiftClaimedAt: Date.now(),
      dailyRewardIndex: ((p.dailyRewardIndex ?? 0) + 1) % DAILY_REWARDS.length,
    }))
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6">
      {/* Верх: иконка приветствия, уровень, прогресс-бар */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
          <span className="text-2xl" aria-hidden>🙌</span>
        </div>
        <p className="text-base text-white/90 font-medium">Твой уровень: {levelName}</p>
        <div className="w-full max-w-[200px] mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-primary transition-all duration-500"
              style={{ width: `${(progressInLevel / LEVEL_STEPS) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white tabular-nums">{progressDisplay}</span>
        </div>
      </div>

      {/* Валюта: аватар слева, поле и кнопка одной высоты */}
      <div className="w-full max-w-md mx-auto flex items-center gap-3 mb-5">
        {player.avatarFrame === "gold" ? (
          <div className="relative inline-flex flex-shrink-0">
            <div className="gold-frame-outer h-12 w-12">
              <div className="gold-frame-inner w-full h-full">
                <PlayerAvatar
                  name={player.name}
                  avatar={player.avatar}
                  avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                  size="sm"
                  variant="primary"
                  vip={false}
                />
              </div>
            </div>
            {player.vip && <VipBadgeOnFrame size="sm" />}
          </div>
        ) : player.vip ? (
          <div className="relative inline-flex flex-shrink-0">
            <div className="vip-frame-outer h-12 w-12">
              <div className="vip-frame-inner w-full h-full">
                <PlayerAvatar
                  name={player.name}
                  avatar={player.avatar}
                  avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                  size="sm"
                  variant="primary"
                  vip={false}
                />
              </div>
            </div>
            <VipBadgeOnFrame size="sm" />
          </div>
        ) : (
          <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-amber-400/40 bg-amber-400/10 flex items-center justify-center">
            <PlayerAvatar
              name={player.name}
              avatar={player.avatar}
              avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
              size="sm"
              variant="primary"
              vip={false}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 h-12 flex items-center gap-3 rounded-full bg-amber-400/25 border-2 border-amber-400/70 px-4">
          <div className="w-8 h-8 rounded-full bg-amber-400/40 flex items-center justify-center flex-shrink-0">
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-black text-amber-500 tabular-nums truncate">{formatAmount(player.balance)}</span>
            <span className="text-base font-medium text-white/90 flex-shrink-0">голосов</span>
          </div>
          {player.vip && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-600 text-[10px] font-bold uppercase flex-shrink-0">
              <Crown className="h-3 w-3" /> VIP
            </span>
          )}
        </div>
        <button
          onClick={() => setScreen("shop")}
          className="h-12 w-12 rounded-full bg-amber-400/30 border-2 border-amber-400/60 flex items-center justify-center text-amber-500 hover:bg-amber-400/40 transition-colors flex-shrink-0"
          title="Пополнить"
          aria-label="Пополнить голоса"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Ежедневные награды: подарок раз в 24 ч, состояние сохраняется после обновления страницы */}
      <div className="w-full max-w-md mx-auto mb-5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm text-white/95 font-medium leading-tight">
            Заходи в игру каждый день и получай голоса
          </p>
          {canClaimGift ? (
            <button
              onClick={handleClaimDaily}
              className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs uppercase tracking-wide hover:bg-amber-300 transition-colors flex-shrink-0"
            >
              Забрать
            </button>
          ) : (
            <span className="text-xs text-white/80 font-medium flex-shrink-0">
              {timeUntilText}
            </span>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAILY_REWARDS.map((r, i) => {
            const claimed = i < dailyIndex
            const isCurrent = i === dailyIndex
            const isAvailable = isCurrent && canClaimGift
            return (
              <div
                key={r.day}
                className={`flex flex-col items-center p-1.5 rounded-xl border text-center ${
                  claimed
                    ? "bg-emerald-500/20 border-emerald-400/40"
                    : isAvailable
                    ? "bg-amber-400/20 border-amber-400/50"
                    : "bg-white/5 border-white/15"
                }`}
              >
                {claimed ? (
                  <Check className="h-4 w-4 text-emerald-400 mb-0.5" />
                ) : r.icon === "gift" ? (
                  <Gift className="h-4 w-4 text-emerald-400 mb-0.5" />
                ) : (
                  <Coins className="h-4 w-4 text-amber-400 mb-0.5" />
                )}
                <span className="text-[10px] font-bold text-white/90">{r.day} день</span>
                {!claimed && <span className="text-[10px] text-white/70">{r.amount}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Кнопки: ИГРАТЬ, Таблица лидеров, Магазин и Профиль */}
      <div className="w-full max-w-md mx-auto flex flex-col gap-3">
        <button
          onClick={() => setScreen("bet-select")}
          className="w-full flex items-center justify-center gap-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/30"
        >
          <Swords className="h-6 w-6" />
          <span>ИГРАТЬ</span>
        </button>

        <button
          onClick={() => setScreen("leaderboard")}
          className="w-full flex items-center justify-center gap-2.5 bg-slate-600/80 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] border border-slate-500/50"
        >
          <Trophy className="h-5 w-5 text-amber-400" />
          <span>Таблица лидеров</span>
        </button>

        {/* Ставки игроков — только на мобильной версии (на десктопе есть сайдбар) */}
        <button
          onClick={() => setScreen("bets")}
          className="lg:hidden w-full flex items-center justify-center gap-2.5 bg-slate-600/80 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] border border-slate-500/50"
        >
          <ListOrdered className="h-5 w-5 text-primary" />
          <span>Ставки игроков</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setScreen("shop")}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-600/80 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] border border-slate-500/50"
          >
            <ShoppingBag className="h-5 w-5 text-orange-400" />
            <span>Магазин</span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-600/80 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] border border-slate-500/50"
          >
            <User className="h-5 w-5 text-amber-400" />
            <span>Профиль</span>
          </button>
        </div>
      </div>

      {/* VIP блок снизу */}
      {!player.vip && (
        <button
          onClick={() => setScreen("shop")}
          className="mt-6 w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-amber-400/25 border-2 border-amber-400/50 text-amber-400 font-semibold text-sm py-3.5 rounded-2xl transition-all hover:bg-amber-400/35"
        >
          <Crown className="h-5 w-5" />
          <span>Стань ВИП — сниженная комиссия!</span>
        </button>
      )}
    </div>
  )
}
