"use client"

import { useEffect, useRef } from "react"
import { useGame, type GameScreen } from "@/lib/game-context"
import { getBridgeReady, isVKEnvironment, tryHideVkBannerAd, tryShowVkBannerAd } from "@/lib/vk-bridge"

/** Экраны, где допустим баннер ВК (не мешает бою и полноэкранным сценам). */
const SCREENS_WITH_VK_BANNER: GameScreen[] = [
  "menu",
  "bet-select",
  "leaderboard",
  "shop",
  "profile",
  "levels",
  "bets",
  "referral",
  "friends-ingame",
]

/**
 * Показ/скрытие VKWebAppShowBannerAd при смене экрана (мини-приложение ВК).
 * По умолчанию стиль `side` — вертикальный баннер у края, как в zeroplus-vk (`lib/vk-bridge.ts`).
 */
export function VkBannerAdController() {
  const { screen, vkUser } = useGame()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!vkUser || !isVKEnvironment()) {
      void tryHideVkBannerAd()
      return
    }

    let cancelled = false

    void (async () => {
      for (let i = 0; i < 40 && !getBridgeReady(); i++) {
        await new Promise((r) => setTimeout(r, 100))
        if (cancelled || !mounted.current) return
      }
      if (!getBridgeReady()) return

      const wantBanner = SCREENS_WITH_VK_BANNER.includes(screen)
      if (wantBanner) {
        await tryShowVkBannerAd()
      } else {
        await tryHideVkBannerAd()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [screen, vkUser])

  useEffect(() => {
    return () => {
      void tryHideVkBannerAd()
    }
  }, [])

  return null
}
