"use client"

import dynamic from "next/dynamic"

const GameApp = dynamic(() => import("@/components/game-app").then((m) => m.GameApp), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#1a1440]" aria-busy aria-label="Загрузка" />,
})

export function GameAppLoader() {
  return <GameApp />
}
