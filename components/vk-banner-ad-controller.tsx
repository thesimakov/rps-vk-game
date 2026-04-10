"use client"

import { useEffect, useRef } from "react"
import { useGame } from "@/lib/game-context"
import { getBridgeReady, isVKEnvironment, tryHideVkBannerAd, tryShowVkBannerAd } from "@/lib/vk-bridge"

/**
 * Постоянный показ баннера ВК на всех экранах после входа (мини-приложение ВК).
 * При смене экрана снова запрашиваем показ — на случай если клиент ВК скрыл баннер.
 * Скрытие только при выходе / размонтировании приложения.
 * Параметры баннера: `lib/vk-bridge.ts` (`tryShowVkBannerAd`).
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

      await tryShowVkBannerAd()
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
