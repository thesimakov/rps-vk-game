"use client"

import { useState } from "react"
import { PlayCircle } from "lucide-react"
import { useGame } from "@/lib/game-context"
import {
  getVkRewardAdCoinAmount,
  isVKEnvironment,
  tryShowVkRewardedAd,
} from "@/lib/vk-bridge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Кнопка «реклама за награду» на главном меню: согласие → VKWebAppCheckNativeAds (reward) → ShowNativeAds (reward) → монеты.
 */
export function VkRewardAdMenuButton() {
  const { player, setPlayer } = useGame()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const coins = getVkRewardAdCoinAmount()

  if (!isVKEnvironment() || !player.id.startsWith("vk_")) {
    return null
  }

  const handleWatch = async () => {
    setErrorHint(null)
    setBusy(true)
    try {
      const ok = await tryShowVkRewardedAd()
      if (ok) {
        setPlayer((p) => ({ ...p, balance: p.balance + coins }))
        setOpen(false)
      } else {
        setErrorHint("Сейчас нет доступной рекламы. Попробуйте позже.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorHint(null)
          setOpen(true)
        }}
        className="w-full max-w-lg mb-4 flex items-center justify-center gap-2 rounded-2xl border border-violet-400/45 bg-violet-600/25 py-3 px-4 text-sm font-bold text-violet-100 shadow-md shadow-violet-900/20 transition-all hover:bg-violet-600/35 active:scale-[0.99]"
      >
        <PlayCircle className="h-5 w-5 shrink-0 text-violet-200" aria-hidden />
        <span>Бонус: реклама за {coins} монет</span>
      </button>

      <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Реклама за награду</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Посмотрите короткий ролик от ВКонтакте — на баланс начислим{" "}
              <span className="font-semibold text-foreground">{coins} монет</span>. Так вы поддерживаете игру,
              а мы получаем часть дохода от рекламной сети ВК.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorHint ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">{errorHint}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={busy}>
              Отмена
            </AlertDialogCancel>
            <button
              type="button"
              disabled={busy}
              className={cn(buttonVariants(), "bg-violet-600 text-white hover:bg-violet-500")}
              onClick={() => void handleWatch()}
            >
              {busy ? "Загрузка…" : "Смотреть рекламу"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
