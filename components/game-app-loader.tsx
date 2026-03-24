"use client"

import { useEffect, useState, type ComponentType } from "react"

/**
 * Без next/dynamic: на телефонах при ошибке загрузки чанка показываем текст и кнопку «Обновить»,
 * а не бесконечный пустой экран.
 */
export function GameAppLoader() {
  const [GameAppComponent, setGameAppComponent] = useState<ComponentType | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void import("@/components/game-app")
      .then((m) => {
        if (!cancelled) setGameAppComponent(() => m.GameApp)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(
            "Не удалось загрузить игру. Проверьте интернет или откройте приложение внутри ВКонтакте, затем обновите страницу.",
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#1a1440] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white/90 text-sm max-w-sm leading-relaxed">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm transition-colors"
        >
          Обновить
        </button>
      </div>
    )
  }

  if (!GameAppComponent) {
    return (
      <div
        className="min-h-screen bg-[#1a1440] flex flex-col items-center justify-center gap-3 px-4"
        aria-busy
        aria-label="Загрузка"
      >
        <div className="h-8 w-8 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" />
        <p className="text-white/75 text-sm">Загрузка игры…</p>
      </div>
    )
  }

  return <GameAppComponent />
}
