export const SHOP_ITEM_IDS = [
  "vip",
  "timer-plus-10",
  "card-set-ancient",
  "fast-match",
  "chest-basic",
  "chest-premium",
  "victory-anim",
  "card-skin",
  "frame-neon",
  "frame-gold",
  "tournament-entry",
  "lava-card",
  "water-card",
] as const

export type ShopItemId = (typeof SHOP_ITEM_IDS)[number]

export interface ShopEligibilityState {
  balance: number
  vip?: boolean
  victoryAnimation?: string
  cardSkin?: string
  avatarFrame?: string
  hasNeonFrame?: boolean
  hasGoldFrame?: boolean
  tournamentEntry?: boolean
  hasAncientDeck?: boolean
  timerPlus10BoughtAt?: number
}

const TIMER_PLUS_10_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function isItemOwned(itemId: ShopItemId, state: ShopEligibilityState) {
  return (
    (itemId === "vip" && !!state.vip) ||
    (itemId === "victory-anim" && !!state.victoryAnimation) ||
    (itemId === "card-skin" && !!state.cardSkin) ||
    (itemId === "frame-neon" && (!!state.hasNeonFrame || state.avatarFrame === "neon")) ||
    (itemId === "frame-gold" && (!!state.hasGoldFrame || state.avatarFrame === "gold")) ||
    (itemId === "tournament-entry" && !!state.tournamentEntry) ||
    (itemId === "card-set-ancient" && !!state.hasAncientDeck)
  )
}

export function canPurchaseItem(args: {
  itemId: ShopItemId
  price: number
  state: ShopEligibilityState
  lavaCardStock: number
  nowMs?: number
}) {
  const { itemId, price, state, lavaCardStock, nowMs = Date.now() } = args
  if (state.balance < price) return false
  if (itemId === "lava-card") return lavaCardStock > 0
  if (itemId === "water-card") return true
  if (itemId === "timer-plus-10") {
    if (!state.timerPlus10BoughtAt) return true
    return nowMs - state.timerPlus10BoughtAt >= TIMER_PLUS_10_COOLDOWN_MS
  }
  return !isItemOwned(itemId, state)
}
