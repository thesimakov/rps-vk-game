"use client"

import { GameProvider, useGame } from "@/lib/game-context"
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
  const { screen, vkUser } = useGame()
  const hideNav = ["matchmaking", "result", "withdraw", "entry"].includes(screen)
  const showLeftSidebar = !hideNav && screen !== "bets" && screen !== "withdraw" && vkUser != null
  const showRightSidebar = !hideNav && vkUser != null
  const showBottomNav = !hideNav && vkUser != null

  return (
    <div className="relative min-h-screen">
      <ParticlesBg />
      <BetResponseDialog />
      <BackgroundMusic />

      <div className="relative z-10 flex min-h-screen">
        {showLeftSidebar && (
          <aside className="hidden lg:flex w-64 flex-shrink-0">
            <div className="w-full sticky top-0 h-screen overflow-y-auto border-r border-border/40 bg-card/30 backdrop-blur-md">
              <BetsSidebar />
            </div>
          </aside>
        )}

        <main className={`flex-1 ${showBottomNav ? "pb-20" : ""}`}>
          <GameScreen />
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
  return (
    <GameProvider>
      <GameLayout />
    </GameProvider>
  )
}
