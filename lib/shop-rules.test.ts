import { describe, expect, it } from "vitest"
import { canPurchaseItem, isItemOwned, type ShopEligibilityState, type ShopItemId } from "./shop-rules"

const baseState: ShopEligibilityState = {
  balance: 1_000,
  vip: false,
  victoryAnimation: undefined,
  cardSkin: undefined,
  avatarFrame: undefined,
  tournamentEntry: false,
  hasAncientDeck: false,
}

describe("shop rules", () => {
  it("marks vip as owned only when vip flag is set", () => {
    expect(isItemOwned("vip", { ...baseState, vip: false })).toBe(false)
    expect(isItemOwned("vip", { ...baseState, vip: true })).toBe(true)
  })

  it("marks frame ownership correctly by selected frame", () => {
    expect(isItemOwned("frame-neon", { ...baseState, avatarFrame: "neon" })).toBe(true)
    expect(isItemOwned("frame-neon", { ...baseState, avatarFrame: "gold" })).toBe(false)
    expect(isItemOwned("frame-gold", { ...baseState, avatarFrame: "gold" })).toBe(true)
    expect(isItemOwned("frame-gold", { ...baseState, avatarFrame: "neon" })).toBe(false)
  })

  it("does not allow already-owned cosmetic/tournament items", () => {
    const ownedCases: Array<[ShopItemId, typeof baseState]> = [
      ["victory-anim", { ...baseState, victoryAnimation: "fire" }],
      ["card-skin", { ...baseState, cardSkin: "gold" }],
      ["card-set-ancient", { ...baseState, hasAncientDeck: true }],
      ["tournament-entry", { ...baseState, tournamentEntry: true }],
    ]

    for (const [itemId, state] of ownedCases) {
      expect(
        canPurchaseItem({
          itemId,
          price: 50,
          state,
          lavaCardStock: 1,
        })
      ).toBe(false)
    }
  })

  it("allows fast-match without toggling frame ownership", () => {
    expect(
      canPurchaseItem({
        itemId: "fast-match",
        price: 1,
        state: { ...baseState, avatarFrame: "neon" },
        lavaCardStock: 1,
      })
    ).toBe(true)
  })

  it("respects balance check for any item", () => {
    expect(
      canPurchaseItem({
        itemId: "fast-match",
        price: 10,
        state: { ...baseState, balance: 9 },
        lavaCardStock: 1,
      })
    ).toBe(false)
  })

  it("allows water card with enough balance", () => {
    expect(
      canPurchaseItem({
        itemId: "water-card",
        price: 500,
        state: { ...baseState, balance: 500 },
        lavaCardStock: 1,
      })
    ).toBe(true)
  })

  it("blocks lava card when out of stock", () => {
    expect(
      canPurchaseItem({
        itemId: "lava-card",
        price: 120_000,
        state: { ...baseState, balance: 120_000 },
        lavaCardStock: 0,
      })
    ).toBe(false)
  })

  it("allows timer +10 only once per 24 hours", () => {
    const nowMs = 1_700_000_000_000
    expect(
      canPurchaseItem({
        itemId: "timer-plus-10",
        price: 5,
        state: { ...baseState, timerPlus10BoughtAt: nowMs - 12 * 60 * 60 * 1000 },
        lavaCardStock: 1,
        nowMs,
      })
    ).toBe(false)

    expect(
      canPurchaseItem({
        itemId: "timer-plus-10",
        price: 5,
        state: { ...baseState, timerPlus10BoughtAt: nowMs - 24 * 60 * 60 * 1000 },
        lavaCardStock: 1,
        nowMs,
      })
    ).toBe(true)
  })
})
