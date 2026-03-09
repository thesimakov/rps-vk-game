"use client"

import { useGame } from "@/lib/game-context"
import { LogIn, Trophy, Coins } from "lucide-react"

export function EntryScreen() {
  const { setScreen, loginWithVK } = useGame()

  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center px-4 py-8 arena-bg">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-base font-black text-white uppercase tracking-wide">
            Камень · Ножницы · Бумага
          </h1>
          <p className="text-white/70 text-sm">
            Играйте, делайте ставки и выводите выигрыш
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            type="button"
            onClick={() => loginWithVK()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-primary/30"
          >
            <LogIn className="h-6 w-6" />
            Войти
          </button>
          <p className="text-center text-xs text-white/50">
            Вход через профиль ВКонтакте. После входа можно играть, оплачивать и выводить деньги.
          </p>

          <button
            onClick={() => setScreen("leaderboard")}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-card/80 border border-border/50 hover:bg-card text-foreground font-semibold transition-all active:scale-[0.98]"
          >
            <Trophy className="h-5 w-5 text-amber-400" />
            Лидеры
          </button>

          <button
            onClick={() => setScreen("bets")}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-card/80 border border-border/50 hover:bg-card text-foreground font-semibold transition-all active:scale-[0.98]"
          >
            <Coins className="h-5 w-5 text-accent" />
            Ставки
          </button>
        </div>
      </div>
    </div>
  )
}
