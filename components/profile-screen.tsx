"use client"

import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { ArrowLeft, Coins, Crown, Trophy, Skull, Percent, Calendar, Medal, ArrowDownToLine, Pencil, Check, UserMinus, LogOut } from "lucide-react"
import { useState } from "react"
import { PlayerAvatar, VipBadgeOnFrame } from "@/components/player-avatar"

const MIN_BALANCE_FOR_WITHDRAW = 200
const HIDE_AVATAR_PRICE = 100

export function ProfileScreen() {
  const { setScreen, player, setPlayer, playerRank, logoutWithVK } = useGame()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(player.name)

  const totalGames = player.wins + player.losses
  const winRate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0
  const canWithdraw = player.balance >= MIN_BALANCE_FOR_WITHDRAW

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) {
      setPlayer((p) => ({
        ...p,
        name: trimmed,
        avatar: trimmed.charAt(0).toUpperCase() || p.avatar,
      }))
    } else {
      setNameInput(player.name)
    }
    setIsEditingName(false)
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 pb-24">
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6">
        <button
          onClick={() => setScreen("menu")}
          className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground uppercase tracking-wider">
          Профиль
        </h1>
        <div className="w-9" />
      </div>

      {/* Avatar + Name (аватар из ВК, можно отключить за 100 голосов) */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="relative">
          {player.avatarFrame === "gold" ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="gold-frame-outer w-[5.5rem] h-[5.5rem]">
                <div className="gold-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar
                    name={player.name}
                    avatar={player.avatar}
                    avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                    size="lg"
                    variant="accent"
                    vip={false}
                  />
                </div>
              </div>
              {player.vip && <VipBadgeOnFrame size="lg" />}
            </div>
          ) : player.vip ? (
            <div className="relative inline-flex flex-shrink-0">
              <div className="vip-frame-outer w-[5.5rem] h-[5.5rem]">
                <div className="vip-frame-inner w-full h-full flex items-center justify-center">
                  <PlayerAvatar
                    name={player.name}
                    avatar={player.avatar}
                    avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
                    size="lg"
                    variant="accent"
                    vip={false}
                  />
                </div>
              </div>
              <VipBadgeOnFrame size="lg" />
            </div>
          ) : (
            <PlayerAvatar
              name={player.name}
              avatar={player.avatar}
              avatarUrl={player.hideVkAvatar ? undefined : player.avatarUrl}
              size="lg"
              variant="primary"
              vip={false}
            />
          )}
        </div>
        <div className="text-center flex flex-col items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="bg-card/80 border border-border rounded-xl px-3 py-2 text-lg font-bold text-foreground max-w-[200px]"
                maxLength={30}
                autoFocus
              />
              <button
                onClick={saveName}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                aria-label="Сохранить"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-foreground">{player.name}</h2>
              <button
                onClick={() => {
                  setNameInput(player.name)
                  setIsEditingName(true)
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                aria-label="Изменить имя"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground font-medium">
            {player.vip ? "VIP Игрок" : "Игрок"}
          </p>
        </div>
        {/* Скрыть аватар ВК за 100 голосов */}
        {player.avatarUrl && (
          <div className="mt-2 w-full max-w-md">
            {player.hideVkAvatar ? (
              <p className="text-center text-sm text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                <UserMinus className="h-4 w-4" />
                Аватар ВК скрыт
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (player.balance >= HIDE_AVATAR_PRICE) {
                    setPlayer((p) => ({ ...p, balance: p.balance - HIDE_AVATAR_PRICE, hideVkAvatar: true }))
                  }
                }}
                disabled={player.balance < HIDE_AVATAR_PRICE}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <UserMinus className="h-4 w-4" />
                Скрыть аватар ВК ({HIDE_AVATAR_PRICE} голосов)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Balance + Rank */}
      <div className="w-full max-w-md flex gap-3 mb-4">
        <div className="flex-1 bg-card/50 backdrop-blur-sm border border-accent/20 rounded-2xl p-4 flex items-center gap-3">
          <Coins className="h-5 w-5 text-accent" />
          <div>
            <span className="text-base font-extrabold text-accent tabular-nums">{formatAmount(player.balance)}</span>
            <p className="text-base text-muted-foreground font-medium uppercase">голосов</p>
          </div>
        </div>
        <div className="w-28 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center">
          <Medal className="h-4 w-4 text-primary mb-1" />
          <span className="text-xl font-extrabold text-primary">#{playerRank}</span>
          <p className="text-[10px] text-muted-foreground font-medium uppercase">рейтинг</p>
        </div>
      </div>

      {/* Stats */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Trophy className="h-4 w-4 text-primary mb-1" />
          <span className="text-base font-extrabold text-foreground tabular-nums">{player.wins}</span>
          <span className="text-xs text-muted-foreground font-medium">Побед</span>
        </div>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Skull className="h-4 w-4 text-destructive mb-1" />
          <span className="text-base font-extrabold text-foreground tabular-nums">{player.losses}</span>
          <span className="text-xs text-muted-foreground font-medium">Поражений</span>
        </div>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Percent className="h-4 w-4 text-accent mb-1" />
          <span className="text-base font-extrabold text-foreground tabular-nums">{winRate}%</span>
          <span className="text-xs text-muted-foreground font-medium">Винрейт</span>
        </div>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Calendar className="h-4 w-4 text-secondary mb-1" />
          <span className="text-base font-extrabold text-foreground tabular-nums">{player.weekWins}</span>
          <span className="text-xs text-muted-foreground font-medium">За неделю</span>
        </div>
      </div>

      {/* Weekly earnings */}
      <div className="w-full max-w-md bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Заработано за неделю</span>
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-accent" />
            <span className="text-base font-extrabold text-primary tabular-nums">{formatAmount(player.weekEarnings)}</span>
          </div>
        </div>
      </div>

      {/* Вывод — только при балансе от 200 голосов, не более 10 000 в день (на экране вывода) */}
      {canWithdraw && (
        <button
          onClick={() => setScreen("withdraw")}
          className="w-full max-w-md flex items-center justify-center gap-2 bg-card/60 border border-border/40 text-foreground font-semibold py-3.5 rounded-2xl transition-all hover:bg-card/80 active:scale-[0.99] mb-4"
        >
          <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
          <span>Вывести голоса</span>
        </button>
      )}
      {!canWithdraw && (
        <p className="text-sm text-muted-foreground mb-4">
          Вывод доступен при балансе от {MIN_BALANCE_FOR_WITHDRAW} голосов
        </p>
      )}

      {/* VIP promo */}
      {!player.vip && (
        <button
          onClick={() => setScreen("shop")}
          className="w-full max-w-md flex items-center justify-center gap-2 bg-accent/8 border border-accent/25 text-accent font-semibold text-sm py-3.5 rounded-2xl transition-all hover:bg-accent/15 mb-6"
        >
          <Crown className="h-4 w-4" />
          <span>{"Купить VIP \u2014 49 голосов/мес"}</span>
        </button>
      )}

      {/* Выйти — в самом низу */}
      <div className="flex-1 min-h-4" />
      <button
        onClick={logoutWithVK}
        className="w-full max-w-md flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground font-medium text-sm transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </button>
    </div>
  )
}
