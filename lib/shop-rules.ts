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
  tournamentEntry?: boolean
  hasAncientDeck?: boolean
}

export function isItemOwned(itemId: ShopItemId, state: ShopEligibilityState) {
  return (
    (itemId === "vip" && !!state.vip) ||
    (itemId === "victory-anim" && !!state.victoryAnimation) ||
    (itemId === "card-skin" && !!state.cardSkin) ||
    (itemId === "frame-neon" && state.avatarFrame === "neon") ||
    (itemId === "frame-gold" && state.avatarFrame === "gold") ||
    (itemId === "tournament-entry" && !!state.tournamentEntry) ||
    (itemId === "card-set-ancient" && !!state.hasAncientDeck)
  )
}

export function canPurchaseItem(args: {
  itemId: ShopItemId
  price: number
  state: ShopEligibilityState
  lavaCardStock: number
}) {
  const { itemId, price, state, lavaCardStock } = args
  if (state.balance < price) return false
  if (itemId === "lava-card") return lavaCardStock > 0
  if (itemId === "water-card") return true
  return !isItemOwned(itemId, state)
}
