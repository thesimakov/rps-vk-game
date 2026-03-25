"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { isVKEnvironment, requestVkMiniAppNotifications } from "@/lib/vk-bridge"

const MENU_DISMISS_KEY = "rps_vk_notif_menu_dismissed"

/** Вызвать, когда разрешение на уведомления ВК получено (главный баннер больше не показывается). */
export function markVkNotificationsMenuPromptDismissed() {
  try {
    if (typeof window !== "undefined") localStorage.setItem(MENU_DISMISS_KEY, "1")
  } catch {
    /* ignore */
  }
}

type VkNotificationsPromptProps = {
  variant: "menu" | "profile"
  /** Показывать только для игрока ВК (например player.id.startsWith("vk_")). */
  show: boolean
}

export function VkNotificationsPrompt({ variant, show }: VkNotificationsPromptProps) {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (variant !== "menu") return
    try {
      if (typeof window !== "undefined" && localStorage.getItem(MENU_DISMISS_KEY) === "1") {
        setDismissed(true)
      }
    } catch {
      /* ignore */
    }
  }, [variant])

  if (!show || typeof window === "undefined" || !isVKEnvironment()) return null
  if (variant === "menu" && dismissed) return null

  const onEnable = async () => {
    setHint(null)
    setLoading(true)
    try {
      const ok = await requestVkMiniAppNotifications()
      if (ok) {
        markVkNotificationsMenuPromptDismissed()
        if (variant === "menu") {
          setDismissed(true)
          return
        }
        setHint("Уведомления разрешены.")
      } else {
        setHint("Не удалось открыть окно ВК. Включите уведомления вручную в настройках мини-приложения.")
      }
    } finally {
      setLoading(false)
    }
  }

  const onDismissMenu = () => {
    markVkNotificationsMenuPromptDismissed()
    setDismissed(true)
  }

  if (variant === "menu") {
    return (
      <div className="w-full max-w-lg mb-4 rounded-2xl border border-sky-400/35 bg-slate-900/75 backdrop-blur-sm px-3 py-3 shadow-lg">
        <div className="flex items-start gap-2">
          <Bell className="h-5 w-5 text-sky-300 shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-100 leading-snug">Приглашения и уведомления ВК</p>
            <p className="text-[11px] text-sky-200/85 mt-1 leading-relaxed">
              Разрешите уведомления от игр и приложений (и приглашения от друзей), чтобы не пропускать вызовы в
              игру.
            </p>
            {hint ? <p className="text-[11px] text-cyan-200/90 mt-2">{hint}</p> : null}
          </div>
          <button
            type="button"
            onClick={onDismissMenu}
            className="p-1 rounded-lg text-sky-300/80 hover:bg-white/10 hover:text-sky-100 shrink-0"
            aria-label="Скрыть подсказку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onEnable()}
          className="mt-3 w-full py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold disabled:opacity-60"
        >
          {loading ? "Открываем…" : "Включить уведомления"}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mb-4 rounded-3xl border border-sky-300/30 bg-gradient-to-br from-sky-500/14 via-card/55 to-cyan-500/10 backdrop-blur-sm p-5 shadow-[0_0_0_1px_rgba(56,189,248,0.14)]">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Уведомления ВК</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Включите уведомления от этого приложения — так вы не пропустите приглашения от друзей (как в блоке
            настроек ВК про игры и приложения).
          </p>
          {hint ? <p className="text-xs text-primary mt-2">{hint}</p> : null}
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void onEnable()}
        className="mt-4 w-full py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-500 disabled:opacity-60"
      >
        {loading ? "Открываем…" : "Запросить разрешение"}
      </button>
    </div>
  )
}
