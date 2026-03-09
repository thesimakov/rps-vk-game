"use client"

import { useGame, type GameScreen } from "@/lib/game-context"
import { Home, Swords, Trophy, User, ShoppingBag } from "lucide-react"

interface NavItem {
  screen: GameScreen
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { screen: "menu", label: "Главная", icon: <Home className="h-5 w-5" /> },
  { screen: "leaderboard", label: "Топ", icon: <Trophy className="h-5 w-5" /> },
  { screen: "bet-select", label: "Играть", icon: <Swords className="h-6 w-6" /> },
  { screen: "shop", label: "Магазин", icon: <ShoppingBag className="h-5 w-5" /> },
  { screen: "profile", label: "Профиль", icon: <User className="h-5 w-5" /> },
]

export function BottomNav() {
  const { screen, setScreen } = useGame()

  if (["arena", "matchmaking", "result"].includes(screen)) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/30"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-1.5 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = screen === item.screen
          const isPlay = item.screen === "bet-select"

          if (isPlay) {
            return (
              <button
                key={item.screen}
                onClick={() => setScreen(item.screen)}
                className="flex flex-col items-center gap-0.5 -mt-5"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-primary mt-0.5">
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
