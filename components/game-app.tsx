"use client"

import { appPath } from "@/lib/app-path"
import { GameProvider, useGame } from "@/lib/game-context"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { isVKEnvironment, showFriendsPicker, sendGameInviteToVkFriend } from "@/lib/vk-bridge"
import { LogIn } from "lucide-react"
import { MainMenu } from "@/components/main-menu"
import { BetSelect } from "@/components/bet-select"
import { Matchmaking } from "@/components/matchmaking"
import { GameArena } from "@/components/game-arena"
import { ResultScreen } from "@/components/result-screen"
import { BossRewardScreen } from "@/components/boss-reward-screen"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { LevelsScreen } from "@/components/levels-screen"
import { ReferralScreen } from "@/components/referral-screen"
import { FriendsInGameScreen } from "@/components/friends-in-game-screen"
import { ShopScreen } from "@/components/shop-screen"
import { BottomNav } from "@/components/bottom-nav"
import { WeeklyRanking } from "@/components/weekly-ranking"
import { BetsSidebar } from "@/components/bets-sidebar"
import { BetsScreen } from "@/components/bets-screen"
import { BetResponseDialog } from "@/components/bet-response-dialog"
import { ParticlesBg } from "@/components/particles-bg"
import { EntryScreen } from "@/components/entry-screen"
import { GameLoader } from "@/components/game-loader"
import { AdminScreen } from "@/components/admin-screen"
import { PlayInviteIncoming } from "@/components/play-invite-incoming"
import { FriendInviteWaiterGlobal } from "@/components/friend-invite-waiter-global"

/** В мини-приложении ВК не показываем экран «Войти / гость» — только автологин и «Повторить». */
function VkMiniAppAuthWall() {
  const { loginWithVK, loginErrorMessage } = useGame()
  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center px-4 py-8 bg-transparent">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <div className="w-36 h-36 flex items-center justify-center">
          <img src={appPath("/logo.webp")} alt="RPS Arena" className="w-full h-full object-contain" />
        </div>
        <p className="text-white/80 text-sm leading-relaxed">
          Вход выполняется автоматически через ВКонтакте. Если меню не открылось, нажмите кнопку ниже.
        </p>
        {loginErrorMessage && (
          <div className="w-full rounded-2xl bg-red-500/15 border border-red-500/60 px-4 py-3 text-xs text-red-100 font-medium">
            {loginErrorMessage}
          </div>
        )}
        <button
          type="button"
          onClick={() => void loginWithVK()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-primary/30"
        >
          <LogIn className="h-5 w-5" />
          Повторить вход
        </button>
      </div>
    </div>
  )
}

function GameScreen() {
  const { screen, vkUser } = useGame()
  const inVkMiniApp = typeof window !== "undefined" && isVKEnvironment()
  const needsAuthGate = screen === "entry" || (screen === "menu" && !vkUser)
  const showVkGate = needsAuthGate && inVkMiniApp
  const showBrowserEntry = needsAuthGate && !inVkMiniApp

  return (
    <>
      {showVkGate && <VkMiniAppAuthWall />}
      {showBrowserEntry && <EntryScreen />}
      {screen === "menu" && vkUser && <MainMenu />}
      {screen === "levels" && <LevelsScreen />}
      {screen === "bets" && <BetsScreen />}
      {screen === "bet-select" && <BetSelect />}
      {screen === "matchmaking" && <Matchmaking />}
      {screen === "arena" && <GameArena />}
      {screen === "result" && <ResultScreen />}
      {screen === "boss-reward" && <BossRewardScreen />}
      {screen === "leaderboard" && <LeaderboardScreen />}
      {screen === "profile" && <ProfileScreen />}
      {screen === "referral" && <ReferralScreen />}
      {screen === "friends-ingame" && <FriendsInGameScreen />}
      {screen === "shop" && <ShopScreen />}
      {screen === "admin" && <AdminScreen />}
    </>
  )
}

function GameLayout() {
  const { screen, vkUser, player, setPlayer, isLoading, loadingStage, loadingProgress } = useGame()
  const [hideLowBalanceHint, setHideLowBalanceHint] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true)
      return
    }
    const t = setTimeout(() => setShowLoader(false), 320)
    return () => clearTimeout(t)
  }, [isLoading])

  if (showLoader) {
    return (
      <div className="relative min-h-screen">
        <ParticlesBg />
        <GameLoader
          stage={isLoading ? loadingStage : "Запуск игры..."}
          progress={isLoading ? loadingProgress : 100}
        />
      </div>
    )
  }

  const hideNav = ["matchmaking", "result", "entry"].includes(screen)
  const showLeftSidebar = !hideNav && screen !== "bets" && vkUser != null
  const showRightSidebar = !hideNav && vkUser != null
  const showBottomNav = !hideNav && vkUser != null

  const isVkPlayer = player.id.startsWith("vk_")
  const showLowBalanceHint = vkUser != null && isVkPlayer && player.balance < 50 && !hideLowBalanceHint

  const handleLowBalanceInvite = async () => {
    try {
      const users = await showFriendsPicker()
      if (users && users.length) {
        const reward = users.length * 10
        setPlayer((p) => ({ ...p, balance: p.balance + reward }))
        setHideLowBalanceHint(true)
        if (isVKEnvironment()) {
          for (const u of users) {
            await sendGameInviteToVkFriend(u.id)
          }
        }
      }
    } catch {
      // игнорируем ошибки VK Bridge
    }
  }

  return (
    <div className="relative min-h-screen">
      <ParticlesBg />
      <BetResponseDialog />

      {showLowBalanceHint && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
          <div className="pointer-events-auto max-w-lg mx-auto rounded-2xl bg-slate-900/95 border border-amber-400/60 px-4 py-3 shadow-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-white/90 leading-snug">
                Добавь друга, получи за него 10 монет. Чем больше друзей зашли, тем больше монет получи.
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

        <main className="flex-1 flex justify-center min-w-0">
          <div
            className={`w-full max-w-lg mx-auto px-4 min-h-screen max-h-screen overflow-y-auto ${
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
      {vkUser != null && player.id.startsWith("vk_") && (
        <>
          <FriendInviteWaiterGlobal />
          <PlayInviteIncoming />
        </>
      )}
    </div>
  )
}

/** Корень игры: только на клиенте (см. app/page.tsx — dynamic ssr: false). */
export function GameApp() {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "")
  const makeUrl = (file: string) => `url("${basePath}${file}")`
  type CardCssVars = CSSProperties & Record<`--${string}`, string>
  const styleVars: CardCssVars = {
    "--card-back-image": makeUrl("/card-back.webp"),
    "--card-rock-image": makeUrl("/card-rock.webp"),
    "--card-paper-image": makeUrl("/card-paper.webp"),
    "--card-scissors-image": makeUrl("/card-scissors.webp"),
    "--card-water-image": makeUrl("/card-water.png"),
    "--card-ancient-back-image": makeUrl("/000.webp"),
    "--card-ancient-rock-image": makeUrl("/001.webp"),
    "--card-ancient-scissors-image": makeUrl("/002.webp"),
    "--card-ancient-paper-image": makeUrl("/003.webp"),
    "--card-ancient-water-image": makeUrl("/card-water-ancient.png"),
  }

  return (
    <GameProvider>
      <div style={styleVars}>
        <GameLayout />
      </div>
    </GameProvider>
  )
}
