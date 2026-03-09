"use client"

import { GameProvider, useGame } from "@/lib/game-context"
import { useState } from "react"
import type { CSSProperties } from "react"
import { showFriendsPicker } from "@/lib/vk-bridge"
import { MainMenu } from "@/components/main-menu"
import { BetSelect } from "@/components/bet-select"
import { Matchmaking } from "@/components/matchmaking"
import { GameArena } from "@/components/game-arena"
import { ResultScreen } from "@/components/result-screen"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { ShopScreen } from "@/components/shop-screen"
import { BottomNav } from "@/components/bottom-nav"
import { WeeklyRanking } from "@/components/weekly-ranking"
import { BetsSidebar } from "@/components/bets-sidebar"
import { BetsScreen } from "@/components/bets-screen"
import { BetResponseDialog } from "@/components/bet-response-dialog"
import { ParticlesBg } from "@/components/particles-bg"
import { WithdrawScreen } from "@/components/withdraw-screen"
import { EntryScreen } from "@/components/entry-screen"
import { BackgroundMusic } from "@/components/background-music"

function GameScreen() {
  const { screen, vkUser } = useGame()
  const isEntry = screen === "entry" || (screen === "menu" && !vkUser)

  return (
    <>
      {isEntry && <EntryScreen />}
      {screen === "menu" && vkUser && <MainMenu />}
      {screen === "bets" && <BetsScreen />}
      {screen === "bet-select" && <BetSelect />}
      {screen === "matchmaking" && <Matchmaking />}
      {screen === "arena" && <GameArena />}
      {screen === "result" && <ResultScreen />}
      {screen === "leaderboard" && <LeaderboardScreen />}
      {screen === "profile" && <ProfileScreen />}
      {screen === "withdraw" && <WithdrawScreen />}
      {screen === "shop" && <ShopScreen />}
    </>
  )
}

function GameLayout() {
  const { screen, vkUser, player, setPlayer } = useGame()
  const hideNav = ["matchmaking", "result", "withdraw", "entry"].includes(screen)
  const showLeftSidebar = !hideNav && screen !== "bets" && screen !== "withdraw" && vkUser != null
  const showRightSidebar = !hideNav && vkUser != null
  const showBottomNav = !hideNav && vkUser != null
  const [hideLowBalanceHint, setHideLowBalanceHint] = useState(false)

  const showLowBalanceHint = vkUser != null && player.balance < 50 && !hideLowBalanceHint

  const handleLowBalanceInvite = async () => {
    try {
      const users = await showFriendsPicker()
      if (users && users.length) {
        const reward = users.length * 10
        setPlayer((p) => ({ ...p, balance: p.balance + reward }))
        setHideLowBalanceHint(true)
      }
    } catch {
      // игнорируем ошибки VK Bridge
    }
  }

  return (
    <div className="relative min-h-screen">
      <ParticlesBg />
      <BetResponseDialog />
      <BackgroundMusic />

      {showLowBalanceHint && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
          <div className="pointer-events-auto max-w-md mx-auto rounded-2xl bg-slate-900/95 border border-amber-400/60 px-4 py-3 shadow-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-white/90 leading-snug">
                Добавь друга, получи за него 10 голосов. Чем больше друзей зашли, тем больше голосов получи.
              </p>
              <button
                type="button"
                onClick={handleLowBalanceInvite}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-amber-300 transition-colors"
              >
                Добавить друзей
              </button>
            </div>
            <button
              type="button"
              className="ml-2 text-xs text-amber-300 hover:text-amber-100"
              onClick={() => setHideLowBalanceHint(true)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen">
        {showLeftSidebar && (
          <aside className="hidden lg:flex w-64 flex-shrink-0">
            <div className="w-full sticky top-0 h-screen overflow-y-auto border-r border-border/40 bg-card/30 backdrop-blur-md">
              <BetsSidebar />
            </div>
          </aside>
        )}

        <main className="flex-1 flex justify-center">
          <div
            className={`w-full max-w-md min-h-screen max-h-screen overflow-y-auto px-3 ${
              showBottomNav ? "pb-20" : ""
            }`}
          >
            <GameScreen />
          </div>
        </main>

        {showRightSidebar && (
          <aside className="hidden lg:flex w-72 flex-shrink-0">
            <div className="w-full sticky top-0 h-screen overflow-y-auto border-l border-border/40 bg-card/30 backdrop-blur-md">
              <WeeklyRanking />
            </div>
          </aside>
        )}

        {showBottomNav && <BottomNav />}
      </div>
    </div>
  )
}

export default function Page() {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
  const makeUrl = (file: string) => `url("${basePath}${file}")`
  const styleVars: CSSProperties = {
    "--card-back-image": makeUrl("/card-back.png"),
    "--card-rock-image": makeUrl("/card-rock.png"),
    "--card-paper-image": makeUrl("/card-paper.png"),
    "--card-scissors-image": makeUrl("/card-scissors.png"),
  }

  return (
    <GameProvider>
      <div style={styleVars}>
        <GameLayout />
      </div>
    </GameProvider>
  )
}
