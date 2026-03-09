"use client"

import { useState, useEffect, useRef } from "react"
import { useGame } from "@/lib/game-context"
import { formatAmount } from "@/lib/format-amount"
import { purchaseVKVoices, isVKEnvironment, showFriendsPicker, showInviteBox, showWallPostBox } from "@/lib/vk-bridge"
import { ArrowLeft, Crown, Zap, Sparkles, Box, Palette, Coins, Wallet, Flame, Droplets, UserPlus, Share2, X } from "lucide-react"

const INVITED_SLOTS = 4
const INVITE_REWARD = 100
const WALL_POST_REWARD = 100

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  icon: React.ReactNode
  category: string
  color: string
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "vip",
    name: "VIP Статус",
    description: "Комиссия 5%, цветной ник, приоритет",
    price: 49,
    icon: <Crown className="h-5 w-5" />,
    category: "premium",
    color: "text-accent",
  },
  {
    id: "fast-match",
    name: "Быстрый поиск",
    description: "Приоритет в очереди на 10 матчей",
    price: 1,
    icon: <Zap className="h-5 w-5" />,
    category: "boost",
    color: "text-secondary",
  },
  {
    id: "chest-basic",
    name: "Базовый сундук",
    description: "Шанс получить бонусы или аватарку",
    price: 5,
    icon: <Box className="h-5 w-5" />,
    category: "chest",
    color: "text-primary",
  },
  {
    id: "chest-premium",
    name: "Премиум сундук",
    description: "Гарантированный бонус или редкость",
    price: 25,
    icon: <Box className="h-5 w-5" />,
    category: "chest",
    color: "text-accent",
  },
  {
    id: "victory-anim",
    name: "Анимация: Огонь",
    description: "Огненная анимация при победе",
    price: 15,
    icon: <Sparkles className="h-5 w-5" />,
    category: "cosmetic",
    color: "text-destructive",
  },
  {
    id: "card-skin",
    name: "Скин: Золото",
    description: "Золотое оформление карт",
    price: 20,
    icon: <Palette className="h-5 w-5" />,
    category: "cosmetic",
    color: "text-accent",
  },
  {
    id: "frame-neon",
    name: "Рамка: Неон",
    description: "Неоновая рамка аватара",
    price: 10,
    icon: <Sparkles className="h-5 w-5" />,
    category: "cosmetic",
    color: "text-primary",
  },
  {
    id: "frame-gold",
    name: "Рамка: Золото",
    description: "Золотая рамка аватара с анимацией",
    price: 25,
    icon: <Palette className="h-5 w-5" />,
    category: "cosmetic",
    color: "text-accent",
  },
  {
    id: "tournament-entry",
    name: "Турнир дня",
    description: "16 игроков, призовой фонд 500+ голосов",
    price: 25,
    icon: <Crown className="h-5 w-5" />,
    category: "tournament",
    color: "text-secondary",
  },
  {
    id: "lava-card",
    name: "Карта «Лава»",
    description: "Уничтожает любую карту соперника. 5 использований. Рекомендуем при турнире.",
    price: 120_000,
    icon: <Flame className="h-5 w-5" />,
    category: "special",
    color: "text-destructive",
  },
  {
    id: "water-card",
    name: "Карта «Вода»",
    description: "Побеждает камень. Проигрывает бумаге. Ничья с ножницами. 3 использования.",
    price: 20,
    icon: <Droplets className="h-5 w-5" />,
    category: "special",
    color: "text-primary",
  },
]

const VOICE_PACKS = [
  { amount: 10, price: 10, label: "10 голосов" },
  { amount: 50, price: 50, label: "50 голосов" },
  { amount: 100, price: 100, label: "100 голосов" },
  { amount: 500, price: 500, label: "500 голосов" },
]

type ChestType = "basic" | "premium"

/** Типы призов из сундуков */
type PrizeKind = "coins" | "bonus" | "voices_small" | "voices_medium" | "boost" | "double_bonus"

interface ChestPrize {
  kind: PrizeKind
  label: string
  amount?: number
  icon?: React.ReactNode
}

/** Случайный приз для базового сундука */
function rollBasicPrize(): ChestPrize {
  const r = Math.random()
  if (r < 0.28) return { kind: "coins", amount: Math.floor(Math.random() * 8) + 1, label: "Голоса" }
  if (r < 0.5) return { kind: "bonus", amount: 2, label: "Бонусы +2" }
  if (r < 0.72) return { kind: "voices_small", amount: 3 + Math.floor(Math.random() * 5), label: "Голоса" }
  if (r < 0.9) return { kind: "boost", amount: 1, label: "Быстрый поиск +1" }
  return { kind: "double_bonus", amount: 2, label: "Бонусы +2" }
}

/** Случайный приз для премиум сундука */
function rollPremiumPrize(): ChestPrize {
  const r = Math.random()
  if (r < 0.22) return { kind: "coins", amount: 10 + Math.floor(Math.random() * 21), label: "Голоса" }
  if (r < 0.4) return { kind: "bonus", amount: 2, label: "Бонусы +2" }
  if (r < 0.58) return { kind: "voices_medium", amount: 15 + Math.floor(Math.random() * 16), label: "Голоса" }
  if (r < 0.76) return { kind: "boost", amount: Math.random() > 0.5 ? 2 : 1, label: "Быстрый поиск" }
  if (r < 0.9) return { kind: "double_bonus", amount: 2, label: "Бонусы +2" }
  return { kind: "coins", amount: 20 + Math.floor(Math.random() * 25), label: "Голоса" }
}

/** Выдать N случайных призов для сундука */
function rollChestPrizes(type: ChestType, count: number): ChestPrize[] {
  const roll = type === "premium" ? rollPremiumPrize : rollBasicPrize
  return Array.from({ length: count }, () => roll())
}

/** Применить приз к игроку, вернуть обновлённого игрока */
function applyPrize(prize: ChestPrize, player: { balance: number; fastMatchBoosts?: number }): { balance: number; fastMatchBoosts: number } {
  let balance = player.balance
  let fastMatchBoosts = player.fastMatchBoosts ?? 0
  switch (prize.kind) {
    case "coins":
    case "voices_small":
    case "voices_medium":
      balance += prize.amount ?? 0
      break
    case "bonus":
    case "double_bonus":
      fastMatchBoosts += prize.amount ?? 2
      break
    case "boost":
      fastMatchBoosts += prize.amount ?? 1
      break
  }
  return { balance, fastMatchBoosts }
}

/** Нормализует массив приглашённых до 4 слотов (null = пусто) */
function normalizeInvitedSlots(
  invitedFriends: Array<{ id: number; first_name: string; last_name: string; photo_200: string } | null> | undefined
): Array<{ id: number; first_name: string; last_name: string; photo_200: string } | null> {
  const base = Array.from({ length: INVITED_SLOTS }, (_, i) => invitedFriends?.[i] ?? null)
  return base
}

export function ShopScreen() {
  const { setScreen, player, setPlayer, lavaCardStock, purchaseLavaCard, purchaseWaterCard } = useGame()
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null)
  const [openingChest, setOpeningChest] = useState<{ type: ChestType; prizes: ChestPrize[] } | null>(null)
  const [chestPhase, setChestPhase] = useState<"fly" | "open" | "reward" | "collect">("fly")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [wallPostLoading, setWallPostLoading] = useState(false)
  const confettiRef = useRef<HTMLDivElement>(null)

  const invitedSlots = normalizeInvitedSlots(player.invitedFriends)
  const invitedCount = invitedSlots.filter(Boolean).length
  const canClaimInviteReward = invitedCount >= INVITED_SLOTS && !player.invitedRewardClaimed
  const canClaimWallPostReward = !player.wallPostRewardClaimed

  useEffect(() => {
    if (!openingChest) return
    setChestPhase("fly")
    const t1 = setTimeout(() => setChestPhase("open"), 800)
    const t2 = setTimeout(() => setChestPhase("reward"), 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [openingChest])

  const handleCollectChest = () => {
    if (!openingChest) return
    setPlayer((p) => {
      let balance = p.balance
      let fastMatchBoosts = p.fastMatchBoosts ?? 0
      for (const prize of openingChest.prizes) {
        const next = applyPrize(prize, { balance, fastMatchBoosts })
        balance = next.balance
        fastMatchBoosts = next.fastMatchBoosts
      }
      return { ...p, balance, fastMatchBoosts }
    })
    setOpeningChest(null)
    setChestPhase("fly")
  }

  const handleTopUp = async (amount: number) => {
    setTopUpLoading(amount)
    try {
      const success = await purchaseVKVoices(amount)
      // В продакшене баланс должен обновляться после подтверждения платежа на бэкенде (см. docs/VK_INTEGRATION.md)
      if (success) {
        setPlayer((p) => ({ ...p, balance: p.balance + amount }))
      }
    } finally {
      setTopUpLoading(null)
    }
  }

  const handlePickFriend = async (slotIndex: number) => {
    setInviteLoading(true)
    try {
      const users = await showFriendsPicker()
      if (users?.length) {
        const friend = users[0]
        setPlayer((p) => {
          const current = normalizeInvitedSlots(p.invitedFriends)
          const next = [...current]
          next[slotIndex] = { id: friend.id, first_name: friend.first_name, last_name: friend.last_name, photo_200: friend.photo_200 }
          return { ...p, invitedFriends: next }
        })
      }
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveInvited = (slotIndex: number) => {
    setPlayer((p) => {
      const current = normalizeInvitedSlots(p.invitedFriends)
      const next = [...current]
      next[slotIndex] = null
      return { ...p, invitedFriends: next }
    })
  }

  const handleInviteFriends = async () => {
    setInviteLoading(true)
    try {
      await showInviteBox()
    } finally {
      setInviteLoading(false)
    }
  }

  const handleClaimInviteReward = () => {
    if (!canClaimInviteReward) return
    setPlayer((p) => ({ ...p, balance: p.balance + INVITE_REWARD, invitedRewardClaimed: true }))
  }

  const buildWallPostMessage = () => {
    const name = player.name || "Игрок"
    const appLink = typeof window !== "undefined" ? window.location.href.split("?")[0] : ""
    return `Играй со мной в игру «Камень, ножницы, бумага»! ${name} приглашает тебя — переходи по ссылке и сыграем: ${appLink}`
  }

  const handleWallPostAndReward = async () => {
    if (!canClaimWallPostReward) return
    setWallPostLoading(true)
    try {
      const message = buildWallPostMessage()
      const postId = await showWallPostBox(message)
      if (postId != null) {
        setPlayer((p) => ({ ...p, balance: p.balance + WALL_POST_REWARD, wallPostRewardClaimed: true }))
      }
    } finally {
      setWallPostLoading(false)
    }
  }

  const handleBuy = (item: ShopItem) => {
    if (player.balance < item.price) return

    if (item.id === "lava-card") {
      purchaseLavaCard()
      return
    }
    if (item.id === "water-card") {
      purchaseWaterCard()
      return
    }

    if (item.id === "chest-basic" || item.id === "chest-premium") {
      const type: ChestType = item.id === "chest-basic" ? "basic" : "premium"
      const count = type === "premium" ? 3 : 2
      const prizes = rollChestPrizes(type, count)
      setPlayer((p) => ({ ...p, balance: p.balance - item.price }))
      setOpeningChest({ type, prizes })
      return
    }

    setPlayer((p) => {
      const updated = { ...p, balance: p.balance - item.price }
      switch (item.id) {
        case "vip":
          updated.vip = true
          break
        case "fast-match":
          updated.fastMatchBoosts = (p.fastMatchBoosts ?? 0) + 10
          break
        case "victory-anim":
          updated.victoryAnimation = "fire"
          break
        case "card-skin":
          updated.cardSkin = "gold"
          break
        case "frame-neon":
          updated.avatarFrame = "neon"
          break
        case "frame-gold":
          updated.avatarFrame = "gold"
          break
        case "tournament-entry":
          updated.tournamentEntry = true
          updated.balance += 50
          break
      }
      return updated
    })
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6">
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
          Магазин
        </h1>
        <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm border border-border/30 rounded-full px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-accent" />
          <span className="font-bold text-accent text-base tabular-nums">{formatAmount(player.balance)}</span>
        </div>
      </div>

      {/* Пополнение голосами ВК */}
      <div className="w-full max-w-md mb-6 bg-primary/10 border border-primary/25 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="font-bold text-base text-foreground">Пополнить баланс (ВК голоса)</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Оплата через ВКонтакте — списание голосов с вашего аккаунта.
        </p>
        {!isVKEnvironment() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Для пополнения откройте приложение в ВКонтакте.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {VOICE_PACKS.map((pack) => (
            <button
              key={pack.amount}
              onClick={() => handleTopUp(pack.amount)}
              disabled={topUpLoading !== null}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Coins className="h-4 w-4" />
              {topUpLoading === pack.amount ? "..." : pack.label}
            </button>
          ))}
        </div>
      </div>

      {/* 100 голосов за приглашение 4 друзей */}
      <div className="w-full max-w-md mb-6 bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5 text-primary" />
          <span className="font-bold text-base text-foreground">Получить {INVITE_REWARD} голосов за приглашение 4 друзей</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Выберите друзей, пригласите их в игру. Когда они примут приглашение — появятся в ячейках. За 4 принявших приглашение — награда.
        </p>
        {!isVKEnvironment() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Откройте приложение в ВКонтакте, чтобы выбирать друзей и приглашать.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {invitedSlots.map((friend, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/40 bg-muted/20 p-2 min-h-[72px] flex flex-col items-center justify-center"
            >
              {friend ? (
                <>
                  <img
                    src={friend.photo_200 || ""}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover mb-1"
                  />
                  <span className="text-xs font-medium text-foreground truncate w-full text-center">
                    {friend.first_name} {friend.last_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInvited(index)}
                    disabled={inviteLoading}
                    className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Удалить
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePickFriend(index)}
                  disabled={inviteLoading || !isVKEnvironment()}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-dashed border-border/50 py-2"
                >
                  <UserPlus className="h-6 w-6" />
                  <span className="text-xs">Выбрать друга</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleInviteFriends}
            disabled={inviteLoading || !isVKEnvironment()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/80 text-primary-foreground text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Пригласить
          </button>
          {canClaimInviteReward && (
            <button
              type="button"
              onClick={handleClaimInviteReward}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold transition-all active:scale-95"
            >
              <Coins className="h-4 w-4" />
              Получить {INVITE_REWARD} голосов
            </button>
          )}
        </div>
      </div>

      {/* 100 голосов — расскажи друзьям (пост на стену) */}
      <div className="w-full max-w-md mb-6 bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="h-5 w-5 text-secondary" />
          <span className="font-bold text-base text-foreground">Получить {WALL_POST_REWARD} голосов — расскажи друзьям</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Опубликуйте на своей стене приглашение поиграть в игру. После публикации вам начислят {WALL_POST_REWARD} голосов.
        </p>
        {!isVKEnvironment() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Откройте приложение в ВКонтакте, чтобы опубликовать пост на стене.
          </p>
        )}
        <button
          type="button"
          onClick={handleWallPostAndReward}
          disabled={!canClaimWallPostReward || wallPostLoading || !isVKEnvironment()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" />
          {wallPostLoading ? "Публикация…" : player.wallPostRewardClaimed ? "Награда получена" : `Опубликовать и получить ${WALL_POST_REWARD} голосов`}
        </button>
      </div>

      {/* Items */}
      <div className="w-full max-w-md flex flex-col gap-2.5">
        {SHOP_ITEMS.map((item) => {
          const canAfford = player.balance >= item.price
          const alreadyOwned =
            (item.id === "vip" && player.vip) ||
            (item.id === "victory-anim" && player.victoryAnimation) ||
            (item.id === "card-skin" && player.cardSkin) ||
            (item.id === "frame-neon" && player.avatarFrame === "neon") ||
            (item.id === "frame-gold" && player.avatarFrame === "gold") ||
            (item.id === "tournament-entry" && player.tournamentEntry)
          const lavaOutOfStock = item.id === "lava-card" && lavaCardStock <= 0
          const canBuy =
            item.id === "lava-card"
              ? canAfford && !lavaOutOfStock
              : item.id === "water-card"
                ? canAfford
                : canAfford && !alreadyOwned
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-3.5"
            >
              <div className={`w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{item.name}</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.description}</p>
                {item.id === "lava-card" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">В наличии: {lavaCardStock} из 3</p>
                )}
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={!canBuy}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-base font-bold transition-all flex-shrink-0 ${
                  canBuy
                    ? "bg-primary text-primary-foreground cursor-pointer active:scale-95 shadow-md shadow-primary/20"
                    : "bg-muted/30 text-muted-foreground border border-border/30 cursor-not-allowed"
                }`}
              >
                {item.id === "lava-card" && lavaOutOfStock ? "Нет в наличии" : alreadyOwned ? "Куплено" : (
                  <>
                    <Coins className="h-3 w-3" />
                    {formatAmount(item.price)}
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Модалка открытия сундука: вылетает, открывается, конфетти, награда, «Собрать» */}
      {openingChest && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && chestPhase === "reward" && handleCollectChest()}
        >
          {/* Конфетти */}
          <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden">
            {chestPhase !== "fly" &&
              Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm animate-chest-confetti"
                  style={{
                    left: `${50 + ((i % 10) - 5) * 6}%`,
                    top: "38%",
                    backgroundColor: ["#fbbf24", "#f59e0b", "#84cc16", "#22c55e", "#eab308"][i % 5],
                    animationDelay: `${i * 0.03}s`,
                    ["--cx" as string]: `${(i % 7 - 3) * 45}px`,
                  }}
                />
              ))}
          </div>

          <div className="relative flex flex-col items-center gap-6 px-6">
            {/* Сундук: вылетает и открывается */}
            <div
              className={`transition-all duration-500 ${
                chestPhase === "fly"
                  ? "scale-50 opacity-0 translate-y-8"
                  : chestPhase === "open"
                    ? "scale-110 animate-chest-bounce"
                    : "scale-100"
              }`}
            >
              <div
                className={`w-28 h-28 rounded-2xl flex items-center justify-center border-4 shadow-2xl ${
                  openingChest.type === "premium"
                    ? "bg-amber-500/30 border-amber-400 text-amber-200"
                    : "bg-primary/30 border-primary text-primary-foreground"
                }`}
              >
                <Box className={`w-14 h-14 ${chestPhase === "open" ? "rotate-12 scale-110" : ""} transition-transform duration-500`} />
              </div>
            </div>

            {/* Награды (2 или 3 приза) и кнопка Собрать */}
            <div
              className={`flex flex-col items-center gap-4 transition-all duration-300 ${
                chestPhase === "reward" || chestPhase === "collect" ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            >
              <div className="flex flex-wrap justify-center gap-3">
                {openingChest.prizes.map((prize, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 border border-border/50"
                  >
                    {prize.kind === "coins" || prize.kind === "voices_small" || prize.kind === "voices_medium" ? (
                      <>
                        <Coins className="w-6 h-6 text-accent shrink-0" />
                        <span className="font-bold text-base text-accent">+{formatAmount(prize.amount ?? 0)} голосов</span>
                      </>
                    ) : prize.kind === "bonus" || prize.kind === "double_bonus" ? (
                      <>
                        <Zap className="w-6 h-6 text-secondary shrink-0" />
                        <span className="font-bold text-secondary">Бонусы +{prize.amount ?? 2}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-6 h-6 text-primary shrink-0" />
                        <span className="font-bold text-foreground">Быстрый поиск +{prize.amount ?? 1}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCollectChest}
                className="px-8 py-4 rounded-2xl bg-accent text-accent-foreground font-bold text-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Собрать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
